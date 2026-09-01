/**
 * Secure user-management server functions. These run ONLY on the server:
 *
 *  - `requireSupabaseAuth` middleware verifies the caller's bearer token
 *    (attached by the global `attachSupabaseAuth` client middleware in
 *    src/start.ts) and hands the handler an RLS-scoped `context.supabase`
 *    plus `context.userId`.
 *  - Every handler then re-checks, server-side, that the caller's own
 *    `user_roles.role` is `admin` — button-hiding on the client is never the
 *    gate, and the `role` the client sends is never trusted.
 *  - `supabaseAdmin` (service-role, RLS-bypassing) is imported *dynamically*
 *    inside each handler, from `client.server.ts`, so the service-role key
 *    never reaches the client bundle.
 *
 * The Supabase Auth Admin API is the source of truth for the user list;
 * `user_roles` carries the role. Passwords are never logged or echoed back.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminRole = "admin" | "editor";

export interface AdminUser {
  id: string;
  displayName: string;
  email: string;
  role: AdminRole | null;
  createdAt: string;
}

type AuthedContext = { supabase: SupabaseClient<Database>; userId: string };

/** Server-side gate: the caller must currently hold the `admin` role. */
async function assertCallerIsAdmin(context: AuthedContext): Promise<void> {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .maybeSingle();
  if (error) throw new Error("role_check_failed");
  if (!data || data.role !== "admin") throw new Error("forbidden");
}

// ---------------------------------------------------------------------------

const searchInput = z.object({ search: z.string().optional() }).optional();

export const getUsersServerFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => searchInput.parse(d) ?? {})
  .handler(async ({ data, context }): Promise<AdminUser[]> => {
    await assertCallerIsAdmin(context as AuthedContext);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Walk EVERY page of Supabase Auth users, not just the first.
    const authUsers: { id: string; email: string; createdAt: string; displayName: string }[] = [];
    const perPage = 1000;
    for (let page = 1; ; page += 1) {
      const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (error) throw new Error("list_failed");
      for (const u of list.users) {
        authUsers.push({
          id: u.id,
          email: u.email ?? "",
          createdAt: u.created_at ?? "",
          displayName:
            (typeof u.user_metadata?.display_name === "string" && u.user_metadata.display_name) ||
            (u.email ?? ""),
        });
      }
      if (list.users.length < perPage) break;
    }

    const { data: roles, error: rolesErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");
    if (rolesErr) throw new Error("roles_failed");
    const roleByUser = new Map<string, AdminRole>(
      (roles ?? []).map((r) => [r.user_id, r.role as AdminRole]),
    );

    let users: AdminUser[] = authUsers.map((u) => ({
      id: u.id,
      displayName: u.displayName,
      email: u.email,
      role: roleByUser.get(u.id) ?? null,
      createdAt: u.createdAt,
    }));

    const q = (data.search ?? "").trim().toLowerCase();
    if (q) {
      users = users.filter(
        (u) => u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
      );
    }
    users.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return users;
  });

// ---------------------------------------------------------------------------

const createInput = z.object({
  displayName: z.string().trim().min(1),
  email: z.string().trim().email(),
  temporaryPassword: z.string().min(6),
  role: z.enum(["admin", "editor"]),
});

export const createUserServerFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createInput.parse(d))
  .handler(async ({ data, context }): Promise<AdminUser> => {
    await assertCallerIsAdmin(context as AuthedContext);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.temporaryPassword,
      email_confirm: true,
      user_metadata: { display_name: data.displayName },
    });
    if (createErr || !created?.user) {
      const msg = createErr?.message ?? "";
      throw new Error(
        /already|exist|registered|duplicate/i.test(msg) ? "duplicate_email" : "create_failed",
      );
    }

    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: created.user.id, role: data.role }, { onConflict: "user_id" });
    if (roleErr) {
      // Compensating action: the Auth user exists but has no role — roll it back.
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      throw new Error("role_assign_failed");
    }

    return {
      id: created.user.id,
      displayName: data.displayName,
      email: created.user.email ?? data.email,
      role: data.role,
      createdAt: created.user.created_at ?? new Date().toISOString(),
    };
  });

// ---------------------------------------------------------------------------

const roleInput = z.object({
  userId: z.string().min(1),
  role: z.enum(["admin", "editor"]),
});

export const updateUserRoleServerFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => roleInput.parse(d))
  .handler(async ({ data, context }): Promise<{ userId: string; role: AdminRole }> => {
    const ctx = context as AuthedContext;
    await assertCallerIsAdmin(ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.userId === ctx.userId && data.role !== "admin") {
      throw new Error("cannot_demote_self");
    }

    if (data.role !== "admin") {
      const { data: admins, error } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      if (error) throw new Error("check_failed");
      const adminIds = new Set((admins ?? []).map((a) => a.user_id));
      if (adminIds.has(data.userId) && adminIds.size <= 1) {
        throw new Error("last_admin");
      }
    }

    const { data: row, error: upsertErr } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: data.userId, role: data.role }, { onConflict: "user_id" })
      .select("user_id, role")
      .single();
    if (upsertErr || !row) throw new Error("update_failed");
    return { userId: row.user_id, role: row.role as AdminRole };
  });

// ---------------------------------------------------------------------------

const deleteInput = z.object({ userId: z.string().min(1) });

export const deleteUserServerFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => deleteInput.parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const ctx = context as AuthedContext;
    await assertCallerIsAdmin(ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.userId === ctx.userId) throw new Error("cannot_delete_self");

    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.userId)
      .maybeSingle();
    if (roleRow?.role === "admin") {
      const { data: admins, error } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      if (error) throw new Error("check_failed");
      if ((admins ?? []).length <= 1) throw new Error("last_admin");
    }

    // Deleting the Auth user cascades the user_roles row away via its FK;
    // any projects they created keep existing, with created_by set to NULL.
    const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (deleteErr) throw new Error("delete_failed");
    return { ok: true };
  });

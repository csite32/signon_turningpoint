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

// ---------------------------------------------------------------------------

const editInput = z.object({
  userId: z.string().min(1),
  displayName: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  role: z.enum(["admin", "editor"]).optional(),
  newPassword: z.string().min(6).optional(),
});

export const updateUserServerFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => editInput.parse(d))
  .handler(async ({ data, context }): Promise<AdminUser> => {
    const ctx = context as AuthedContext;
    await assertCallerIsAdmin(ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // The target must exist before anything is touched.
    const { data: existing, error: getErr } = await supabaseAdmin.auth.admin.getUserById(
      data.userId,
    );
    if (getErr || !existing?.user) throw new Error("not_found");

    const { data: roleRowBefore } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.userId)
      .maybeSingle();
    const hadRoleRow = !!roleRowBefore;
    const previousRole: AdminRole | null = roleRowBefore ? (roleRowBefore.role as AdminRole) : null;

    // --- step 1: role (reversible — we know the previous value / absence).
    // Only runs when a role was explicitly supplied AND differs from the current one. ---
    let roleWasWritten = false;
    if (data.role !== undefined && data.role !== previousRole) {
      const nextRole = data.role; // narrowed to AdminRole
      if (nextRole !== "admin") {
        if (data.userId === ctx.userId) throw new Error("cannot_demote_self");
        const { data: admins, error } = await supabaseAdmin
          .from("user_roles")
          .select("user_id")
          .eq("role", "admin");
        if (error) throw new Error("check_failed");
        const adminIds = new Set((admins ?? []).map((a) => a.user_id));
        if (adminIds.has(data.userId) && adminIds.size <= 1) throw new Error("last_admin");
      }
      const { error: roleErr } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: nextRole }, { onConflict: "user_id" });
      if (roleErr) throw new Error("update_failed");
      roleWasWritten = true;
    }

    // --- step 2: Auth (email / password / display_name) — one call, changed fields only ---
    const authPatch: {
      email?: string;
      password?: string;
      user_metadata?: Record<string, unknown>;
    } = {};
    if (data.email !== undefined) authPatch.email = data.email;
    if (data.newPassword) authPatch.password = data.newPassword;
    if (data.displayName !== undefined)
      authPatch.user_metadata = { display_name: data.displayName };

    if (Object.keys(authPatch).length > 0) {
      const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(
        data.userId,
        authPatch,
      );
      if (authErr) {
        // GoTrue rejected the change. Classify by its OWN code/status (never by
        // echoing the payload) so the client can phrase a precise reason. The
        // role change from step 1 is reversible; undo it before reporting, and
        // never swallow a failed undo.
        const ae = authErr as { message?: string; status?: number; code?: string };
        const aeCode = ae.code ?? "";
        // `validation_failed` spans email / password / metadata — only treat it
        // as a password problem when the password was the only field in play.
        const passwordOnly =
          Boolean(authPatch.password) && !authPatch.email && !authPatch.user_metadata;
        const originalCode =
          aeCode === "email_exists" || /already|registered|duplicate/i.test(ae.message ?? "")
            ? "duplicate_email"
            : aeCode === "same_password"
              ? "same_password"
              : aeCode === "weak_password"
                ? "weak_password"
                : aeCode === "user_not_found"
                  ? "not_found"
                  : aeCode === "validation_failed" && passwordOnly
                    ? "weak_password"
                    : "update_failed";
        // Server-only, and deliberately minimal: never the payload, the
        // password, the email/metadata values, the service-role, or the raw
        // GoTrue message — just the shape of what failed.
        console.error("[updateUser] auth error", {
          status: ae.status,
          code: aeCode,
          fields: {
            email: Boolean(authPatch.email),
            password: Boolean(authPatch.password),
            metadata: Boolean(authPatch.user_metadata),
          },
        });
        if (roleWasWritten) {
          const undo = hadRoleRow
            ? await supabaseAdmin
                .from("user_roles")
                .upsert(
                  { user_id: data.userId, role: previousRole as AdminRole },
                  { onConflict: "user_id" },
                )
            : await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
          if (undo.error) throw new Error("rollback_failed");
        }
        throw new Error(originalCode);
      }
    }

    // --- return the fresh state ---
    const { data: after, error: afterErr } = await supabaseAdmin.auth.admin.getUserById(
      data.userId,
    );
    if (afterErr || !after?.user) throw new Error("update_failed");
    const { data: roleRowAfter } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.userId)
      .maybeSingle();
    return {
      id: after.user.id,
      displayName:
        (typeof after.user.user_metadata?.display_name === "string" &&
          after.user.user_metadata.display_name) ||
        (after.user.email ?? ""),
      email: after.user.email ?? "",
      role: (roleRowAfter?.role as AdminRole) ?? null,
      createdAt: after.user.created_at ?? "",
    };
  });

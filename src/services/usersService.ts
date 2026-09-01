/**
 * Public usersService API. The body is now the real Supabase-Auth-backed
 * implementation: each call is a TanStack Start server function
 * (src/services/users/users.server.ts) that runs the Supabase Admin API
 * server-side with the service-role key, after re-verifying the caller is an
 * admin. The client only ever gets an RPC stub — no service-role key, no
 * Admin API, reaches the browser.
 *
 * Same Result<T> contract as before; the mock
 * (src/services/mock/usersService.mock.ts) stays on disk, unused.
 */
import {
  getUsersServerFn,
  createUserServerFn,
  updateUserRoleServerFn,
  deleteUserServerFn,
  type AdminUser,
  type AdminRole,
} from "./users/users.server";
import { ok, err, type Result } from "@/services/util/result";

export type { AdminUser, AdminRole };

export interface CreateUserInput {
  displayName: string;
  email: string;
  temporaryPassword: string;
  role: AdminRole;
}

/** Server-thrown Error messages are stable short codes; fall back to a generic one. */
function codeOf(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e);
  const m = raw.match(/[a-z_]{3,}/i);
  return m ? m[0] : "request_failed";
}

export async function getUsers(filter?: { search?: string }): Promise<Result<AdminUser[]>> {
  try {
    const data = await getUsersServerFn({ data: { search: filter?.search } });
    return ok(data);
  } catch (e) {
    return err(codeOf(e));
  }
}

export async function createUser(input: CreateUserInput): Promise<Result<AdminUser>> {
  try {
    const data = await createUserServerFn({ data: input });
    return ok(data);
  } catch (e) {
    return err(codeOf(e));
  }
}

export async function updateUserRole(
  userId: string,
  role: AdminRole,
): Promise<Result<{ userId: string; role: AdminRole }>> {
  try {
    const data = await updateUserRoleServerFn({ data: { userId, role } });
    return ok(data);
  } catch (e) {
    return err(codeOf(e));
  }
}

export async function deleteUser(userId: string): Promise<Result<true>> {
  try {
    await deleteUserServerFn({ data: { userId } });
    return ok(true);
  } catch (e) {
    return err(codeOf(e));
  }
}

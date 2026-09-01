import type { MockUser, MockUserInput } from "@/types/user";
import { MOCK_USERS, CURRENT_MOCK_USER_ID } from "@/data/mock/users";
import { ok, err, mockDelay, type Result } from "@/services/util/result";
import { loadPersisted, savePersisted } from "./persist";

const STORAGE_KEY = "users";

/**
 * Mock-only. Real user creation/deletion/role changes will call a Supabase
 * Edge Function using the Admin API (service_role stays server-side inside
 * that function — never in client code) — the Edge Function boundary is
 * exactly what this service's function signatures below are shaped to call
 * into once it exists; nothing here talks to Supabase Auth directly, on
 * purpose, even once wired up for real.
 */
let store: MockUser[] = loadPersisted(STORAGE_KEY, () => structuredClone(MOCK_USERS));

function persist(): void {
  savePersisted(STORAGE_KEY, store);
}

function nextId(): string {
  return `user-${Math.random().toString(36).slice(2, 10)}`;
}

export async function getUsers(filter?: { search?: string }): Promise<Result<MockUser[]>> {
  await mockDelay();
  let list = [...store];
  if (filter?.search && filter.search.trim()) {
    const q = filter.search.trim().toLowerCase();
    list = list.filter(
      (u) => u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }
  list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return ok(list);
}

export function getCurrentMockUserId(): string {
  return CURRENT_MOCK_USER_ID;
}

export async function createUser(input: MockUserInput): Promise<Result<MockUser>> {
  await mockDelay();
  const emailTaken = store.some((u) => u.email.toLowerCase() === input.email.trim().toLowerCase());
  if (emailTaken) return err("duplicate_email");
  const user: MockUser = {
    id: nextId(),
    displayName: input.displayName.trim(),
    email: input.email.trim(),
    role: input.role,
    createdAt: new Date().toISOString(),
  };
  store = [...store, user];
  persist();
  return ok(user);
}

export async function updateUserRole(
  userId: string,
  role: MockUser["role"],
): Promise<Result<MockUser>> {
  await mockDelay();
  const idx = store.findIndex((u) => u.id === userId);
  if (idx === -1) return err("not_found");
  const updated: MockUser = { ...store[idx], role };
  store = store.map((u) => (u.id === userId ? updated : u));
  persist();
  return ok(updated);
}

export async function deleteUser(
  userId: string,
  options: { actingUserId: string },
): Promise<Result<true>> {
  await mockDelay();
  if (userId === options.actingUserId) return err("cannot_delete_self");
  const exists = store.some((u) => u.id === userId);
  if (!exists) return err("not_found");
  store = store.filter((u) => u.id !== userId);
  persist();
  return ok(true);
}

/**
 * Mock-only user/role types for the dashboard's Users module. These do NOT
 * correspond to real `auth.users`/`user_roles` rows — see
 * src/services/usersService.ts for why real user management is deferred to a
 * future Supabase Edge Function.
 */

export type MockRole = "admin" | "editor";

export interface MockUser {
  id: string;
  displayName: string;
  email: string;
  role: MockRole;
  createdAt: string;
}

export type MockUserInput = {
  displayName: string;
  email: string;
  temporaryPassword: string;
  role: MockRole;
};

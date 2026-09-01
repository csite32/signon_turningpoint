/**
 * Public usersService API — see projectsService.ts for the swap-point
 * convention. IMPORTANT for the future Supabase-backed implementation:
 * createUser/updateUserRole/deleteUser must call a Supabase Edge Function
 * that uses the Admin API server-side — never call supabase.auth.admin.*
 * directly from this file, and never embed a service_role key in client code.
 */
export {
  getUsers,
  getCurrentMockUserId,
  createUser,
  updateUserRole,
  deleteUser,
} from "./mock/usersService.mock";

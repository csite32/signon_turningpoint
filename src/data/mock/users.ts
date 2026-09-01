import type { MockUser } from "@/types/user";

/**
 * Mock users list for the dashboard's Users module. Fake emails only — never
 * the real Supabase admin account. The FIRST entry is treated as "the
 * current signed-in mock identity" purely so the self-delete-prevention UI
 * has something concrete to demonstrate (see usersService.mock.ts) — it has
 * no connection to the real Supabase session that actually gates /admin.
 */
export const MOCK_USERS: MockUser[] = [
  {
    id: "user-1",
    displayName: "מנהלת ראשית",
    email: "admin@nekudatmifne.test",
    role: "admin",
    createdAt: "2026-06-01T09:00:00.000Z",
  },
  {
    id: "user-2",
    displayName: "עורכת תוכן",
    email: "editor@nekudatmifne.test",
    role: "editor",
    createdAt: "2026-07-15T09:00:00.000Z",
  },
];

/** Id of the mock user treated as "you" for the self-delete-prevention demo. */
export const CURRENT_MOCK_USER_ID = "user-1";

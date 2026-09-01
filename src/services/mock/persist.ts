/**
 * Dev-only, sessionStorage-backed persistence for the mock data stores.
 *
 * Why this exists: services/mock/*.mock.ts each keep their store as a plain
 * module-level variable. That's fine as long as the SAME JS module instance
 * stays alive — but a full page load (typing a URL, opening a new tab,
 * hitting refresh) re-evaluates the whole client bundle from scratch, which
 * re-runs `let store = structuredClone(MOCK_PROJECTS)` and silently discards
 * any edit made before that reload. This file closes exactly that gap, and
 * only that gap:
 *
 *   - Active ONLY when import.meta.env.DEV is true. In a production build
 *     (or once a real Supabase-backed services/*.ts replaces the mock
 *     layer), this module does nothing.
 *   - Lives entirely inside services/mock/* — no component, hook, or route
 *     ever imports this file or knows it exists. The public services/*.ts
 *     surface (getProjects, updateProject, ...) is completely unchanged.
 *   - sessionStorage, not localStorage: cleared the moment the tab closes.
 *     This is scoped test-session persistence, never a permanent local
 *     database — swapping in a real Supabase implementation later means
 *     deleting this file, not migrating data out of it.
 */

const PREFIX = "tp-mock-store:";

export function loadPersisted<T>(key: string, seed: () => T): T {
  if (!import.meta.env.DEV || typeof window === "undefined") return seed();
  try {
    const raw = window.sessionStorage.getItem(PREFIX + key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // Corrupt/unavailable storage — fall through to the seed, never throw.
  }
  return seed();
}

export function savePersisted<T>(key: string, value: T): void {
  if (!import.meta.env.DEV || typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage full/unavailable (e.g. private browsing) — the in-memory
    // store still works for the rest of this same page load either way.
  }
}

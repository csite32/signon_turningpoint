/**
 * Dev-only role switch for previewing the dashboard's admin/editor
 * permission gating (the real Supabase `user_roles` table only has an
 * "admin" role today — see PROJECT context — so there is no real session to
 * test the "editor" experience against yet). Mirrors the existing
 * src/lib/editor/edit-mode.ts convention exactly: a plain sessionStorage
 * flag + a custom event, nothing sensitive stored, gone the moment the tab
 * closes. Entirely absent from a production build via import.meta.env.DEV —
 * callers must check isDevRoleSwitchAvailable() before rendering any UI for
 * this.
 */
import type { MockRole } from "@/types/user";

const KEY = "tp-dashboard-dev-role";
const EVENT = "tp-dashboard-dev-role-changed";
const DEFAULT_ROLE: MockRole = "admin";

export function isDevRoleSwitchAvailable(): boolean {
  return import.meta.env.DEV === true;
}

export function getDevRole(): MockRole {
  if (typeof window === "undefined") return DEFAULT_ROLE;
  const stored = window.sessionStorage.getItem(KEY);
  return stored === "editor" ? "editor" : DEFAULT_ROLE;
}

export function setDevRole(role: MockRole): void {
  if (!isDevRoleSwitchAvailable() || typeof window === "undefined") return;
  window.sessionStorage.setItem(KEY, role);
  window.dispatchEvent(new Event(EVENT));
}

export function onDevRoleChange(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

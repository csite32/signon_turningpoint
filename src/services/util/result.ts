/**
 * Uniform return shape for every service function in src/services/*, mock or
 * real. This is the contract a future Supabase-backed implementation has to
 * preserve so swapping services/mock/*.mock.ts for a real implementation
 * never requires touching any UI code.
 */
export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function err<T = never>(error: string): Result<T> {
  return { ok: false, error };
}

/** Simulates realistic async latency for the mock layer (kept short — this is a demo, not a stress test). */
export function mockDelay(ms = 120): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

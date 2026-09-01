import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "editor";

/**
 * Real role, derived from the signed-in Supabase session + the caller's own
 * `user_roles` row (RLS lets a user read their own row). Replaces the dev-only
 * useDevRole() in the dashboard screens.
 *
 * `useRoleAccess()` mirrors the useAdminAccess() state shape so the dashboard
 * layout can gate on it directly; `useRole()` is the thin `admin | editor | null`
 * accessor for the nav / users-route checks.
 */
export type RoleAccess =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "forbidden"; email: string } // signed in, but no user_roles row
  | { status: "authorized"; role: AppRole; email: string; userId: string };

export function useRoleAccess(): RoleAccess {
  const [state, setState] = useState<RoleAccess>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function check(session: Session | null) {
      if (!session) {
        if (!cancelled) setState({ status: "unauthenticated" });
        return;
      }
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (cancelled) return;
      const email = session.user.email ?? "";
      if (error || !data) {
        setState({ status: "forbidden", email });
        return;
      }
      setState({
        status: "authorized",
        role: data.role === "admin" ? "admin" : "editor",
        email,
        userId: session.user.id,
      });
    }

    supabase.auth.getSession().then(({ data }) => check(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => check(session));
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

/** `admin | editor | null` — null while loading, unauthenticated, or role-less. */
export function useRole(): AppRole | null {
  const state = useRoleAccess();
  return state.status === "authorized" ? state.role : null;
}

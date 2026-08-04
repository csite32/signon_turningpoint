import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AdminAccessState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "forbidden"; email: string }
  | { status: "authorized"; email: string };

export function useAdminAccess(): AdminAccessState {
  const [state, setState] = useState<AdminAccessState>({ status: "loading" });

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
        .eq("role", "admin")
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setState({ status: "forbidden", email: session.user.email ?? "" });
      } else {
        setState({ status: "authorized", email: session.user.email ?? "" });
      }
    }

    supabase.auth.getSession().then(({ data }) => check(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      check(session);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

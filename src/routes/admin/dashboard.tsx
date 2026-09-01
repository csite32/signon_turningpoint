import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAdminAccess } from "@/hooks/use-admin-access";
import { DashboardShell } from "@/components/admin/DashboardShell";
import adminThemeCssUrl from "../../styles/admin-theme.css?url";

/**
 * Layout route for /admin/dashboard/*. Reuses the EXACT SAME real Supabase
 * Auth gate already protecting /admin (useAdminAccess) — no second login, no
 * mock session guarding entry here. Everything under this layout (Projects,
 * Users) is Mock-Data-backed, but reaching it at all still requires a real
 * authenticated Supabase admin session, unchanged from today.
 *
 * admin-theme.css is declared here via head()/links — the SAME mechanism
 * __root.tsx uses for the app's own base stylesheet (a `?url` import + a
 * real <link rel="stylesheet"> that TanStack Router's head-merging keeps in
 * sync with which routes are actually active) — not a plain side-effect
 * `import "...css"` inside a component. This route is the one stable
 * ancestor for every dashboard page (Projects, the editor, Users), so its
 * <link> stays present across ALL client-side navigation within that
 * subtree, including browser Back/Forward, instead of being tied to
 * whichever leaf route's JS chunk happened to load it last.
 */
export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [{ title: "לוח בקרה — נקודת מפנה" }, { name: "robots", content: "noindex" }],
    links: [{ rel: "stylesheet", href: adminThemeCssUrl }],
  }),
  component: DashboardLayout,
});

function DashboardLayout() {
  const state = useAdminAccess();
  const navigate = useNavigate();

  useEffect(() => {
    if (state.status === "unauthenticated") {
      navigate({ to: "/admin/login", replace: true });
    }
  }, [state.status, navigate]);

  if (state.status === "loading" || state.status === "unauthenticated") {
    return (
      <div
        dir="rtl"
        className="tp-admin flex min-h-screen items-center justify-center text-foreground"
      >
        <p className="text-sm text-muted-foreground">טוען...</p>
      </div>
    );
  }

  if (state.status === "forbidden") {
    return (
      <div
        dir="rtl"
        className="tp-admin flex min-h-screen items-center justify-center p-4 text-foreground"
      >
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <h1 className="mb-3 text-lg font-semibold">אין הרשאה</h1>
          <p className="text-sm text-muted-foreground">
            המשתמש {state.email} אינו בעל הרשאת ניהול.
          </p>
        </div>
      </div>
    );
  }

  return (
    <DashboardShell email={state.email}>
      <Outlet />
    </DashboardShell>
  );
}

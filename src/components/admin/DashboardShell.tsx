import { type ReactNode, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { FolderKanban, Home, LayoutDashboard, LogOut, Menu, Users } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useRole } from "@/hooks/use-role";
import { supabase } from "@/integrations/supabase/client";

// admin-theme.css is intentionally NOT imported here — see admin/dashboard.tsx,
// which declares it via head()/links so it stays tied to the one stable
// layout route instead of this (or any other) leaf component.

function BrandMark() {
  return (
    <div className="flex items-center gap-2 px-1">
      <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/25 text-sm font-bold">
        נמ
      </span>
      <div className="leading-tight">
        <p className="text-sm font-semibold">לוח בקרה</p>
        <p className="text-xs text-white/60">נקודת מפנה</p>
      </div>
    </div>
  );
}

/**
 * Full-document navigation back to the public site — deliberately a plain <a>,
 * not a TanStack <Link>. A real document boundary keeps the public site's global
 * stylesheets (turningpoint.css et al.) out of the dashboard document, so
 * Back/Forward restores each document with only its own CSS. Never touches the
 * admin session (the Supabase session lives in storage, not this document).
 */
function BackToSiteLink({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <a
      href="/"
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-lg border border-white/15 px-3 py-2.5 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white"
    >
      <Home className="h-4 w-4 shrink-0" />
      חזרה לאתר
    </a>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const role = useRole();

  const linkClass = (active: boolean) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      active
        ? "bg-sidebar-primary text-sidebar-primary-foreground"
        : "text-white/80 hover:bg-sidebar-accent hover:text-white"
    }`;

  return (
    <nav className="flex flex-col gap-1">
      <Link
        to="/admin/dashboard/projects"
        onClick={onNavigate}
        className={linkClass(pathname.startsWith("/admin/dashboard/projects"))}
      >
        <FolderKanban className="h-4 w-4 shrink-0" />
        פרויקטים
      </Link>
      {role === "admin" && (
        <Link
          to="/admin/dashboard/users"
          onClick={onNavigate}
          className={linkClass(pathname.startsWith("/admin/dashboard/users"))}
        >
          <Users className="h-4 w-4 shrink-0" />
          משתמשים
        </Link>
      )}
    </nav>
  );
}

/**
 * Shell for /admin/dashboard/* — brand-themed (see admin-theme.css, loaded
 * by the dashboard.tsx layout route), with a fixed sidebar on desktop and a
 * Sheet-based drawer below lg, so the dashboard actually reflows instead of
 * squeezing the desktop layout into a narrow column.
 */
export function DashboardShell({ email, children }: { email: string; children: ReactNode }) {
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login", replace: true });
  }

  return (
    <div dir="rtl" className="tp-admin flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col gap-6 bg-sidebar p-5 text-sidebar-foreground lg:flex">
        <BrandMark />
        <BackToSiteLink />
        <p className="truncate rounded-md bg-white/5 px-3 py-2 text-xs text-white/70">{email}</p>
        <NavLinks />
        <div className="mt-auto flex flex-col gap-3">
          <Button
            variant="outline"
            className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            התנתקות
          </Button>
        </div>
      </aside>

      {/* Mobile / tablet drawer */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="right"
          className="tp-admin flex w-72 flex-col gap-6 border-none bg-sidebar p-5 text-sidebar-foreground [&>button]:text-white"
        >
          <SheetHeader className="p-0 text-right">
            <SheetTitle className="text-white">
              <BrandMark />
            </SheetTitle>
          </SheetHeader>
          <BackToSiteLink onNavigate={() => setMobileNavOpen(false)} />
          <p className="truncate rounded-md bg-white/5 px-3 py-2 text-xs text-white/70">{email}</p>
          <NavLinks onNavigate={() => setMobileNavOpen(false)} />
          <div className="mt-auto flex flex-col gap-3">
            <Button
              variant="outline"
              className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              התנתקות
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileNavOpen(true)}
            aria-label="פתיחת תפריט"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 text-primary">
            <LayoutDashboard className="h-4 w-4" />
            <span className="text-sm font-semibold">לוח בקרה</span>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-10">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>

      <Toaster position="top-center" />
    </div>
  );
}

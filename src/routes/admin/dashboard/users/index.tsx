import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { useRole } from "@/hooks/use-role";
import { UserTable } from "@/components/admin/UserTable";

export const Route = createFileRoute("/admin/dashboard/users/")({
  component: UsersRoute,
});

/**
 * Admin-only. The real role comes from Supabase (`user_roles`), not a dev
 * switch. An `editor` who reaches this URL directly is bounced straight back
 * to the projects screen — and the user-management server functions reject
 * non-admins on the server regardless.
 */
function UsersRoute() {
  const role = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (role !== null && role !== "admin") {
      toast.error("מודול המשתמשים זמין למנהלים בלבד");
      navigate({ to: "/admin/dashboard/projects", replace: true });
    }
  }, [role, navigate]);

  if (role !== "admin") return null;
  return <UserTable />;
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { useDevRole } from "@/hooks/use-dev-role";
import { UserTable } from "@/components/admin/UserTable";

export const Route = createFileRoute("/admin/dashboard/users/")({
  component: UsersRoute,
});

function UsersRoute() {
  const { role } = useDevRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (role !== "admin") {
      toast.error("מודול המשתמשים זמין למנהלים בלבד");
      navigate({ to: "/admin/dashboard/projects", replace: true });
    }
  }, [role, navigate]);

  if (role !== "admin") return null;
  return <UserTable />;
}

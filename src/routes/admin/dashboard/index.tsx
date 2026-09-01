import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/admin/dashboard/")({
  component: DashboardIndex,
});

function DashboardIndex() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/admin/dashboard/projects", replace: true });
  }, [navigate]);
  return null;
}

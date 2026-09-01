import { createFileRoute } from "@tanstack/react-router";
import { ProjectTable } from "@/components/admin/ProjectTable";

export const Route = createFileRoute("/admin/dashboard/projects/")({
  component: ProjectTable,
});

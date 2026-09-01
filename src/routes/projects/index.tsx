import { createFileRoute } from "@tanstack/react-router";
import ProjectArchivePage from "../../components/projects/ProjectArchivePage";

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [
      { title: "פרויקטים — נקודת מפנה" },
      { name: "description", content: "ארכיון הפרויקטים של נקודת מפנה — מקרי בוחן נבחרים." },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <ProjectArchivePage />;
}

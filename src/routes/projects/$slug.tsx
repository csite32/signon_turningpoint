import { createFileRoute } from "@tanstack/react-router";
import ProjectDetailPage from "../../components/project/ProjectDetailPage";

export const Route = createFileRoute("/projects/$slug")({
  head: () => ({
    meta: [
      { title: "פרויקט — נקודת מפנה" },
      { name: "description", content: "פרויקט מקרה-בוחן של נקודת מפנה." },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { slug } = Route.useParams();
  return <ProjectDetailPage slug={slug} />;
}

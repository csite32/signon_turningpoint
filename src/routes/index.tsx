import { createFileRoute } from "@tanstack/react-router";
import TurningPointHome from "../components/TurningPointHome";
import * as projectsService from "@/services/projectsService";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "נקודת מפנה" },
      { name: "description", content: "משרד מיתוג ופרסום המלווה בעלי עסקים בשלב הצמיחה הבא." },
    ],
  }),
  // SSR the homepage feature strip: up to 5 published projects, so the cards
  // are in the DOM before turningpoint.js measures the grid.
  loader: async () => {
    const res = await projectsService.getPublishedProjectsPage({ offset: 0, limit: 5 });
    return { projects: res.ok ? res.data.projects : [] };
  },
  component: HomeRoute,
});

function HomeRoute() {
  const { projects } = Route.useLoaderData();
  return <TurningPointHome projects={projects} />;
}

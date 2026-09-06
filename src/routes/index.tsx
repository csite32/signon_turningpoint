import { createFileRoute } from "@tanstack/react-router";
import TurningPointHome from "../components/TurningPointHome";
import * as projectsService from "@/services/projectsService";
import * as recommendationsService from "@/services/recommendationsService";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "נקודת מפנה" },
      { name: "description", content: "משרד מיתוג ופרסום המלווה בעלי עסקים בשלב הצמיחה הבא." },
    ],
  }),
  // SSR the homepage feature strip: up to 5 published projects, so the cards
  // are in the DOM before turningpoint.js measures the grid. The recommendations
  // slider is data-driven too — same shared model as the About page.
  loader: async () => {
    const [projectsRes, recsRes] = await Promise.all([
      projectsService.getPublishedProjectsPage({ offset: 0, limit: 5 }),
      recommendationsService.getRecommendations(),
    ]);
    return {
      projects: projectsRes.ok ? projectsRes.data.projects : [],
      recommendations: recsRes.ok ? recsRes.data : [],
    };
  },
  component: HomeRoute,
});

function HomeRoute() {
  const { projects, recommendations } = Route.useLoaderData();
  return <TurningPointHome projects={projects} recommendations={recommendations} />;
}

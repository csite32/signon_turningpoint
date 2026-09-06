import { createFileRoute } from "@tanstack/react-router";
import TurningPointAbout from "../components/TurningPointAbout";
import * as recommendationsService from "@/services/recommendationsService";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "נקודת מפנה — אודות והשיטה" },
      {
        name: "description",
        content:
          "אודות נקודת מפנה — משרד מיתוג ואסטרטגיה, השיטה שלנו לליווי בעלי עסקים בשלב הצמיחה הבא.",
      },
    ],
  }),
  // Same shared recommendations model as the homepage slider.
  loader: async () => {
    const res = await recommendationsService.getRecommendations();
    return { recommendations: res.ok ? res.data : [] };
  },
  component: AboutRoute,
});

function AboutRoute() {
  const { recommendations } = Route.useLoaderData();
  return <TurningPointAbout recommendations={recommendations} />;
}

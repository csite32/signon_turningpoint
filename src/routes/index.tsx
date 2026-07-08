import { createFileRoute } from "@tanstack/react-router";
import TurningPointHome from "../components/TurningPointHome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "נקודת מפנה" },
      { name: "description", content: "משרד מיתוג ופרסום המלווה בעלי עסקים בשלב הצמיחה הבא." },
    ],
  }),
  component: TurningPointHome,
});

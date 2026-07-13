import { createFileRoute } from "@tanstack/react-router";
import TurningPointAbout from "../components/TurningPointAbout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "נקודת מפנה — אודות והשיטה" },
      { name: "description", content: "אודות נקודת מפנה — משרד מיתוג ואסטרטגיה, השיטה שלנו לליווי בעלי עסקים בשלב הצמיחה הבא." },
    ],
  }),
  component: TurningPointAbout,
});

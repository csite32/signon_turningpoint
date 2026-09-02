import { createFileRoute } from "@tanstack/react-router";
import ContactPage from "../components/ContactPage";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "צור קשר — נקודת מפנה" },
      {
        name: "description",
        content: "צור קשר עם נקודת מפנה — משרד מיתוג ואסטרטגיה. אם העסק שלך בפרשת דרכים, בוא נדבר.",
      },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <ContactPage />;
}

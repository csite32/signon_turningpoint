import { createFileRoute } from "@tanstack/react-router";
import { RecommendationsManager } from "@/components/admin/RecommendationsManager";

export const Route = createFileRoute("/admin/dashboard/recommendations/")({
  component: RecommendationsManager,
});

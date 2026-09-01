import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import type { Project } from "@/types/project";
import type { ProjectImage } from "@/types/project-image";
import { useAdminAccess } from "@/hooks/use-admin-access";
import { receivePreviewData } from "@/services/mock/preview-bridge";
import * as projectImagesService from "@/services/projectImagesService";
import ProjectDetailPage from "@/components/project/ProjectDetailPage";

const searchSchema = z.object({ req: z.string().optional() });

/**
 * A deliberate SIBLING of admin/dashboard.tsx, not a child of it — this
 * route must never render DashboardShell (no sidebar, no admin nav, no
 * dev-role switch), only ProjectDetailPage itself, full width, exactly as
 * the public site renders it. It still requires a real authenticated admin
 * session (same useAdminAccess() gate as every other /admin/* page), it
 * just doesn't share the dashboard's layout/chrome. Data arrives via the
 * BroadcastChannel handshake in services/mock/preview-bridge.ts — this tab
 * never fetches or persists anything on its own.
 */
export const Route = createFileRoute("/admin/preview")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [{ title: "תצוגה מקדימה — נקודת מפנה" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminPreviewRoute,
});

type LoadState =
  | { status: "loading" }
  | { status: "waiting" }
  | { status: "timeout" }
  | { status: "ready"; project: Project; images: ProjectImage[] };

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-background p-6 text-center text-sm text-muted-foreground"
    >
      {children}
    </div>
  );
}

function AdminPreviewRoute() {
  const state = useAdminAccess();
  const navigate = useNavigate();
  const { req } = Route.useSearch();
  const [load, setLoad] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    if (state.status === "unauthenticated") {
      navigate({ to: "/admin/login", replace: true });
    }
  }, [state.status, navigate]);

  useEffect(() => {
    if (state.status !== "authorized" || !req) return;
    setLoad({ status: "waiting" });
    const cleanup = receivePreviewData(
      req,
      (project, images) => setLoad({ status: "ready", project, images }),
      () => setLoad({ status: "timeout" }),
    );
    return cleanup;
  }, [state.status, req]);

  // Prev/next nav inside Preview must stay in the preview context (never
  // /projects/:slug — that would silently drop back to a public route). The
  // adjacent project handed back here always comes from getAdjacentProjects,
  // i.e. it is a real, already-published, already-saved project — the same
  // gallery fetch ProjectTable's own "preview" button already does, no new
  // tab/handshake needed since we're already inside the one preview tab.
  async function handleAdjacentNavigate(project: Project) {
    window.scrollTo({ top: 0 });
    const [main, brand, secondary] = await Promise.all([
      projectImagesService.getProjectImages(project.id, "main_gallery"),
      projectImagesService.getProjectImages(project.id, "brand_colors"),
      projectImagesService.getProjectImages(project.id, "secondary_gallery"),
    ]);
    const images = [
      ...(main.ok ? main.data : []),
      ...(brand.ok ? brand.data : []),
      ...(secondary.ok ? secondary.data : []),
    ];
    setLoad({ status: "ready", project, images });
  }

  if (state.status === "loading" || state.status === "unauthenticated") {
    return <CenteredMessage>טוען...</CenteredMessage>;
  }
  if (state.status === "forbidden") {
    return <CenteredMessage>המשתמש {state.email} אינו בעל הרשאת ניהול.</CenteredMessage>;
  }
  if (!req) {
    return (
      <CenteredMessage>
        קישור תצוגה מקדימה לא תקין. פתחו תצוגה מקדימה מתוך לוח הבקרה.
      </CenteredMessage>
    );
  }
  if (load.status === "loading" || load.status === "waiting") {
    return <CenteredMessage>ממתין לנתוני התצוגה המקדימה מלוח הבקרה...</CenteredMessage>;
  }
  if (load.status === "timeout") {
    return (
      <CenteredMessage>
        לא התקבלו נתוני תצוגה מקדימה. סגרו טאב זה ולחצו שוב על "תצוגה מקדימה" בלוח הבקרה.
      </CenteredMessage>
    );
  }
  return (
    <ProjectDetailPage
      previewProject={load.project}
      previewImages={load.images}
      onAdjacentNavigate={handleAdjacentNavigate}
    />
  );
}

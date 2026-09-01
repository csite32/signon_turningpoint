import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, FolderKanban } from "lucide-react";
import type { Project } from "@/types/project";
import * as projectsService from "@/services/projectsService";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/dashboard/projects/$id")({
  component: ProjectEditorRoute,
});

type LoadState =
  | { status: "loading" }
  | { status: "notfound" }
  | { status: "ready"; project: Project };

/**
 * id === "new": creates a blank draft project immediately (so GalleryUploader
 * always has a real project id to attach uploads to — no separate "unsaved
 * gallery" state to reconcile), then swaps the URL to the real id. Any other
 * id: loads the existing project.
 */
function ProjectEditorRoute() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (id === "new") {
        const res = await projectsService.createProject({
          title: "פרויקט חדש",
          slug: "",
          hero_image_path: null,
          hero_image_url: null,
          hero_image_alt: null,
          tagline: null,
          challenge_text: null,
          solution_text: null,
          subtitle: null,
          extra_paragraph: null,
          result_text: null,
          testimonial_text: null,
          status: "draft",
        });
        if (cancelled) return;
        if (!res.ok) {
          setState({ status: "notfound" });
          return;
        }
        setState({ status: "ready", project: res.data });
        navigate({
          to: "/admin/dashboard/projects/$id",
          params: { id: res.data.id },
          replace: true,
        });
        return;
      }
      const res = await projectsService.getProjectById(id);
      if (cancelled) return;
      setState(res.ok ? { status: "ready", project: res.data } : { status: "notfound" });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isNewProject = id === "new";

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          to="/admin/dashboard/projects"
          className="text-muted-foreground transition-colors hover:text-foreground"
          aria-label="חזרה לרשימת הפרויקטים"
        >
          <ArrowRight className="h-5 w-5" />
        </Link>
        <FolderKanban className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold tracking-tight">
          {isNewProject ? "פרויקט חדש" : "עריכת פרויקט"}
        </h1>
      </div>

      {state.status === "loading" && (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}
      {state.status === "notfound" && (
        <p className="text-sm text-muted-foreground">הפרויקט לא נמצא.</p>
      )}
      {state.status === "ready" && (
        <ProjectForm
          project={state.project}
          onSaved={(p) => setState({ status: "ready", project: p })}
        />
      )}
    </div>
  );
}

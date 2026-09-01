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

/** A blank, in-memory project for create mode. id === "" marks "not persisted yet". */
function blankProject(): Project {
  return {
    id: "",
    slug: "",
    title: "",
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
    sort_order: 0,
    published_at: null,
    created_by: null,
    created_at: "",
    updated_at: "",
  };
}

/**
 * id === "new": render ProjectForm in create mode against a blank in-memory
 * project — NOTHING is written to Supabase just by opening (or leaving) the
 * form. The first "save draft" / "publish" performs a single createProject();
 * only on success does the URL swap to the real id and the form become an
 * ordinary editor. Any other id: load the existing project.
 */
function ProjectEditorRoute() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const isNew = id === "new";
  const [state, setState] = useState<LoadState>(
    isNew ? { status: "ready", project: blankProject() } : { status: "loading" },
  );

  useEffect(() => {
    if (isNew) {
      setState({ status: "ready", project: blankProject() });
      return;
    }
    // Already holding this project (e.g. we just created it and navigated to its
    // real id) — keep it, no redundant refetch.
    if (state.status === "ready" && state.project.id === id) return;

    let cancelled = false;
    (async () => {
      const res = await projectsService.getProjectById(id);
      if (cancelled) return;
      setState(res.ok ? { status: "ready", project: res.data } : { status: "notfound" });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /** First successful save of a new project: adopt its real id + swap the URL. */
  function handleSaved(p: Project) {
    setState({ status: "ready", project: p });
    if (isNew && p.id) {
      navigate({
        to: "/admin/dashboard/projects/$id",
        params: { id: p.id },
        replace: true,
      });
    }
  }

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
          {isNew ? "פרויקט חדש" : "עריכת פרויקט"}
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
        <ProjectForm project={state.project} isNew={isNew} onSaved={handleSaved} />
      )}
    </div>
  );
}

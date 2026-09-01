/**
 * Real Supabase-backed implementation of the projectsService surface. Same
 * function names / signatures / Result<T> contract as the mock it replaces —
 * every caller in components/routes keeps importing "@/services/projectsService"
 * and never notices the swap.
 *
 * Access is the project's standard pattern: the shared client-side `supabase`
 * singleton (carries the signed-in user's session) + RLS. Anonymous visitors
 * read published rows only; a signed-in admin/editor (is_staff()) reads every
 * row and may write. There is no service-role usage here.
 */
import type { Project, ProjectInput, ProjectStatus } from "@/types/project";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { ok, err, type Result } from "@/services/util/result";
import { slugify, uniqueSlug } from "@/services/util/slugify";
import { deleteImageIfUnreferenced } from "@/services/storageService";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];

const COLS = "*";

function toStatus(value: string): ProjectStatus {
  return value === "published" ? "published" : "draft";
}

function rowToProject(r: ProjectRow): Project {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    hero_image_path: r.hero_image_path,
    hero_image_url: r.hero_image_url,
    hero_image_alt: r.hero_image_alt,
    tagline: r.tagline,
    challenge_text: r.challenge_text,
    solution_text: r.solution_text,
    subtitle: r.subtitle,
    extra_paragraph: r.extra_paragraph,
    result_text: r.result_text,
    testimonial_text: r.testimonial_text,
    status: toStatus(r.status),
    sort_order: r.sort_order,
    published_at: r.published_at,
    created_by: r.created_by,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

/** Postgres / PostgREST error -> stable short code the UI layer phrases in Hebrew. */
function mapError(error: { code?: string } | null): string {
  if (!error) return "db_error";
  if (error.code === "PGRST116") return "not_found";
  if (error.code === "23505") return "duplicate_slug";
  if (error.code === "42501") return "forbidden";
  return "db_error";
}

/** Neutralise characters that would break a PostgREST `.or()` filter string. */
function likeTerm(raw: string): string {
  return raw.replace(/[%,()*\\"']/g, " ").trim();
}

export async function getProjects(filter?: {
  status?: ProjectStatus;
  search?: string;
}): Promise<Result<Project[]>> {
  let query = supabase.from("projects").select(COLS);

  if (filter?.status) query = query.eq("status", filter.status);

  if (filter?.search && filter.search.trim()) {
    const term = likeTerm(filter.search);
    if (term) query = query.or(`title.ilike.%${term}%,slug.ilike.%${term}%`);
  }

  query = query.order("sort_order", { ascending: true }).order("created_at", { ascending: true });

  const { data, error } = await query;
  if (error) return err(mapError(error));
  return ok((data ?? []).map(rowToProject));
}

/** Public archive / homepage feed: published only, in drag order (sort_order, then created_at). */
export async function getPublishedProjects(): Promise<Result<Project[]>> {
  const { data, error } = await supabase
    .from("projects")
    .select(COLS)
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return err(mapError(error));
  return ok((data ?? []).map(rowToProject));
}

export async function getProjectById(id: string): Promise<Result<Project>> {
  const { data, error } = await supabase.from("projects").select(COLS).eq("id", id).maybeSingle();
  if (error) return err(mapError(error));
  if (!data) return err("not_found");
  return ok(rowToProject(data));
}

export async function getProjectBySlug(
  slug: string,
  options?: { preview?: boolean },
): Promise<Result<Project>> {
  const { data, error } = await supabase
    .from("projects")
    .select(COLS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) return err(mapError(error));
  if (!data) return err("not_found");

  const project = rowToProject(data);
  // RLS already hides drafts from anyone who isn't staff; this keeps the public
  // route hiding them from staff too unless the URL carries ?preview=1
  // (the dashboard's own preview passes previewProject directly and never hits here).
  if (project.status === "draft" && !options?.preview) return err("not_found");
  return ok(project);
}

export async function createProject(input: ProjectInput): Promise<Result<Project>> {
  const { data: slugRows, error: slugErr } = await supabase.from("projects").select("slug");
  if (slugErr) return err(mapError(slugErr));
  const taken = new Set((slugRows ?? []).map((r) => r.slug));
  const base = (input.slug && slugify(input.slug)) || slugify(input.title) || "project";
  const slug = uniqueSlug(base, taken);

  const { data: maxRow, error: maxErr } = await supabase
    .from("projects")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (maxErr) return err(mapError(maxErr));
  const sortOrder = (maxRow?.sort_order ?? -1) + 1;

  const status: ProjectStatus = input.status ?? "draft";
  const row: ProjectInsert = {
    slug,
    title: input.title,
    hero_image_path: input.hero_image_path,
    hero_image_url: input.hero_image_url,
    hero_image_alt: input.hero_image_alt,
    tagline: input.tagline,
    challenge_text: input.challenge_text,
    solution_text: input.solution_text,
    subtitle: input.subtitle,
    extra_paragraph: input.extra_paragraph,
    result_text: input.result_text,
    testimonial_text: input.testimonial_text,
    status,
    sort_order: sortOrder,
    published_at: status === "published" ? new Date().toISOString() : null,
    // created_by omitted on purpose — the column defaults to auth.uid() server-side.
  };

  const { data, error } = await supabase.from("projects").insert(row).select(COLS).single();
  if (error) return err(mapError(error));
  return ok(rowToProject(data));
}

export async function updateProject(
  id: string,
  patch: Partial<ProjectInput>,
): Promise<Result<Project>> {
  const { data: current, error: curErr } = await supabase
    .from("projects")
    .select(COLS)
    .eq("id", id)
    .maybeSingle();
  if (curErr) return err(mapError(curErr));
  if (!current) return err("not_found");

  const update: ProjectUpdate = {};
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.hero_image_url !== undefined) update.hero_image_url = patch.hero_image_url;
  if (patch.hero_image_path !== undefined) update.hero_image_path = patch.hero_image_path;
  if (patch.hero_image_alt !== undefined) update.hero_image_alt = patch.hero_image_alt;
  if (patch.tagline !== undefined) update.tagline = patch.tagline;
  if (patch.challenge_text !== undefined) update.challenge_text = patch.challenge_text;
  if (patch.solution_text !== undefined) update.solution_text = patch.solution_text;
  if (patch.subtitle !== undefined) update.subtitle = patch.subtitle;
  if (patch.extra_paragraph !== undefined) update.extra_paragraph = patch.extra_paragraph;
  if (patch.result_text !== undefined) update.result_text = patch.result_text;
  if (patch.testimonial_text !== undefined) update.testimonial_text = patch.testimonial_text;
  if (patch.status !== undefined) update.status = patch.status;

  if (patch.slug !== undefined && patch.slug !== current.slug) {
    const { data: slugRows, error: slugErr } = await supabase
      .from("projects")
      .select("slug")
      .neq("id", id);
    if (slugErr) return err(mapError(slugErr));
    const taken = new Set((slugRows ?? []).map((r) => r.slug));
    update.slug = uniqueSlug(slugify(patch.slug), taken);
  }

  const { data, error } = await supabase
    .from("projects")
    .update(update)
    .eq("id", id)
    .select(COLS)
    .single();
  if (error) return err(mapError(error));

  // A changed hero image leaves the previous file orphaned — drop it unless it
  // is a public: seed path or something else still points at it.
  if (current.hero_image_path && current.hero_image_path !== data.hero_image_path) {
    await deleteImageIfUnreferenced(current.hero_image_path, { ignoreProjectId: id });
  }

  return ok(rowToProject(data));
}

export async function deleteProject(id: string): Promise<Result<true>> {
  // 1. Collect every storage path this project references, BEFORE deleting anything.
  const { data: project, error: pErr } = await supabase
    .from("projects")
    .select("id, hero_image_path")
    .eq("id", id)
    .maybeSingle();
  if (pErr) return err(mapError(pErr));
  if (!project) return err("not_found");

  const { data: imgs, error: iErr } = await supabase
    .from("project_images")
    .select("storage_path")
    .eq("project_id", id);
  if (iErr) return err(mapError(iErr));

  const paths = Array.from(
    new Set(
      [project.hero_image_path, ...(imgs ?? []).map((r) => r.storage_path)].filter(
        (p): p is string => !!p && !p.startsWith("public:"),
      ),
    ),
  );

  // 2. Delete the project — project_images rows cascade away via the FK.
  const { error: delErr } = await supabase.from("projects").delete().eq("id", id);
  if (delErr) return err(mapError(delErr));

  // 3. Now the rows are gone, remove any file nothing else still references.
  await Promise.all(paths.map((p) => deleteImageIfUnreferenced(p)));
  return ok(true);
}

export async function publishProject(id: string): Promise<Result<Project>> {
  const { data, error } = await supabase
    .from("projects")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", id)
    .select(COLS)
    .single();
  if (error) return err(mapError(error));
  return ok(rowToProject(data));
}

export async function unpublishProject(id: string): Promise<Result<Project>> {
  const { data, error } = await supabase
    .from("projects")
    .update({ status: "draft" })
    .eq("id", id)
    .select(COLS)
    .single();
  if (error) return err(mapError(error));
  return ok(rowToProject(data));
}

export async function getAdjacentProjects(
  slug: string,
): Promise<Result<{ prev: Project | null; next: Project | null }>> {
  const { data, error } = await supabase
    .from("projects")
    .select(COLS)
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return err(mapError(error));

  const published = (data ?? []).map(rowToProject);
  const idx = published.findIndex((p) => p.slug === slug);
  if (idx === -1) return ok({ prev: null, next: null });
  return ok({
    prev: idx > 0 ? published[idx - 1] : null,
    next: idx < published.length - 1 ? published[idx + 1] : null,
  });
}

/**
 * Persist a new project order (drag or the keyboard move buttons in
 * ProjectTable). `orderedIds` is the full project list in its new order; each
 * row's sort_order becomes its index, so the archive, the homepage strip and
 * the dashboard table all read back the same sequence.
 */
export async function reorderProjects(orderedIds: string[]): Promise<Result<Project[]>> {
  const results = await Promise.all(
    orderedIds.map((id, i) => supabase.from("projects").update({ sort_order: i }).eq("id", id)),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return err(mapError(failed.error));
  return getProjects();
}

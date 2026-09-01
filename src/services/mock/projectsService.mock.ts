import type { Project, ProjectInput } from "@/types/project";
import { MOCK_PROJECTS } from "@/data/mock/projects";
import { ok, err, mockDelay, type Result } from "@/services/util/result";
import { slugify, uniqueSlug } from "@/services/util/slugify";
import { loadPersisted, savePersisted } from "./persist";
import { deleteProjectImagesForProject } from "./projectImagesService.mock";

const STORAGE_KEY = "projects";

/**
 * In-memory mock store — a deep clone of the seed data, mutated in place by
 * create/update/delete/publish below, and mirrored to sessionStorage (dev
 * only, see persist.ts) after every mutation so a full page reload within
 * the same tab/test-session doesn't discard an edit. A real Supabase-backed
 * projectsService.ts would replace only this file's internals, never the
 * exported function signatures.
 */
let store: Project[] = loadPersisted(STORAGE_KEY, () => structuredClone(MOCK_PROJECTS));

function persist(): void {
  savePersisted(STORAGE_KEY, store);
}

function nowIso(): string {
  return new Date().toISOString();
}

function nextId(): string {
  return `proj-${Math.random().toString(36).slice(2, 10)}`;
}

export async function getProjects(filter?: {
  status?: Project["status"];
  search?: string;
}): Promise<Result<Project[]>> {
  await mockDelay();
  let list = [...store];
  if (filter?.status) {
    list = list.filter((p) => p.status === filter.status);
  }
  if (filter?.search && filter.search.trim()) {
    const q = filter.search.trim().toLowerCase();
    list = list.filter(
      (p) => p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q),
    );
  }
  list.sort((a, b) => a.created_at.localeCompare(b.created_at));
  return ok(list);
}

/**
 * Public archive feed: every project with status "published", oldest first
 * (same ordering getProjects already applies). Thin wrapper over the exact
 * same `store` the dashboard/create/edit/detail flows mutate, so the archive
 * stays in sync automatically — a publish/unpublish/rename/delete/hero-image
 * change is reflected here on the next call with no extra wiring. A real
 * Supabase-backed projectsService.ts keeps this name/signature and swaps only
 * the body (e.g. `.eq("status", "published")`).
 */
export async function getPublishedProjects(): Promise<Result<Project[]>> {
  return getProjects({ status: "published" });
}

export async function getProjectById(id: string): Promise<Result<Project>> {
  await mockDelay();
  const found = store.find((p) => p.id === id);
  return found ? ok(found) : err("not_found");
}

export async function getProjectBySlug(
  slug: string,
  options?: { preview?: boolean },
): Promise<Result<Project>> {
  await mockDelay();
  const found = store.find((p) => p.slug === slug);
  if (!found) return err("not_found");
  if (found.status === "draft" && !options?.preview) return err("not_found");
  return ok(found);
}

export async function createProject(input: ProjectInput): Promise<Result<Project>> {
  await mockDelay();
  const taken = new Set(store.map((p) => p.slug));
  const baseSlug = (input.slug && slugify(input.slug)) || slugify(input.title) || "project";
  const slug = uniqueSlug(baseSlug, taken);
  const project: Project = {
    ...input,
    id: nextId(),
    slug,
    status: input.status ?? "draft",
    published_at: input.status === "published" ? nowIso() : null,
    created_by: null,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  store = [...store, project];
  persist();
  return ok(project);
}

export async function updateProject(
  id: string,
  patch: Partial<ProjectInput>,
): Promise<Result<Project>> {
  await mockDelay();
  const idx = store.findIndex((p) => p.id === id);
  if (idx === -1) return err("not_found");
  const current = store[idx];

  let slug = current.slug;
  if (patch.slug && patch.slug !== current.slug) {
    const taken = new Set(store.filter((p) => p.id !== id).map((p) => p.slug));
    slug = uniqueSlug(slugify(patch.slug), taken);
  }

  const updated: Project = { ...current, ...patch, slug, updated_at: nowIso() };
  store = store.map((p) => (p.id === id ? updated : p));
  persist();
  return ok(updated);
}

export async function deleteProject(id: string): Promise<Result<true>> {
  await mockDelay();
  const exists = store.some((p) => p.id === id);
  if (!exists) return err("not_found");
  store = store.filter((p) => p.id !== id);
  persist();
  deleteProjectImagesForProject(id);
  return ok(true);
}

export async function publishProject(id: string): Promise<Result<Project>> {
  await mockDelay();
  const idx = store.findIndex((p) => p.id === id);
  if (idx === -1) return err("not_found");
  const updated: Project = {
    ...store[idx],
    status: "published",
    published_at: nowIso(),
    updated_at: nowIso(),
  };
  store = store.map((p) => (p.id === id ? updated : p));
  persist();
  return ok(updated);
}

export async function unpublishProject(id: string): Promise<Result<Project>> {
  await mockDelay();
  const idx = store.findIndex((p) => p.id === id);
  if (idx === -1) return err("not_found");
  const updated: Project = { ...store[idx], status: "draft", updated_at: nowIso() };
  store = store.map((p) => (p.id === id ? updated : p));
  persist();
  return ok(updated);
}

export async function getAdjacentProjects(
  slug: string,
): Promise<Result<{ prev: Project | null; next: Project | null }>> {
  await mockDelay();
  const published = store
    .filter((p) => p.status === "published")
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const idx = published.findIndex((p) => p.slug === slug);
  if (idx === -1) return ok({ prev: null, next: null });
  return ok({
    prev: idx > 0 ? published[idx - 1] : null,
    next: idx < published.length - 1 ? published[idx + 1] : null,
  });
}

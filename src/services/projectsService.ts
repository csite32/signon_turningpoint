/**
 * Public projectsService API. The body now lives in the Supabase-backed
 * implementation (src/services/projects/projectsService.supabase.ts) — same
 * names, same signatures, same Result<T> contract as the mock it replaced, so
 * no component or route imports change. The mock
 * (src/services/mock/projectsService.mock.ts) is kept on disk but is no longer
 * wired to anything.
 */
export {
  getProjects,
  getPublishedProjects,
  getProjectById,
  getProjectBySlug,
  createProject,
  updateProject,
  deleteProject,
  publishProject,
  unpublishProject,
  getAdjacentProjects,
  reorderProjects,
} from "./projects/projectsService.supabase";

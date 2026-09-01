/**
 * Public projectsService API. Every function is re-exported from the mock
 * implementation today; a future Supabase-backed projectsService.ts would
 * keep these exact names/signatures and swap only the body of each function
 * (see src/services/mock/projectsService.mock.ts for the current, in-memory
 * implementation) — no caller anywhere in components/routes ever imports the
 * mock module directly.
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
} from "./mock/projectsService.mock";

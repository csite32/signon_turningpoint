/**
 * Public recommendationsService API. The body lives in the Supabase-backed
 * implementation (src/services/recommendations/recommendationsService.supabase.ts)
 * — same names, same signatures, same Result<T> contract as the mock it
 * replaced, so no component or route imports change. The mock
 * (src/services/mock/recommendationsService.mock.ts) is kept on disk but is no
 * longer wired to anything.
 */
export {
  getRecommendations,
  getRecommendationById,
  createRecommendation,
  updateRecommendation,
  deleteRecommendation,
  reorderRecommendations,
} from "./recommendations/recommendationsService.supabase";

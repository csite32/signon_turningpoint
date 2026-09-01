/** Public storageService API — see projectsService.ts for the swap-point convention. */
export {
  uploadImage,
  deleteImage,
  deleteImageIfUnreferenced,
  validateImageFile,
  listMediaLibrary,
} from "./storage/storageService.supabase";
export type { MediaItem } from "./storage/storageService.supabase";

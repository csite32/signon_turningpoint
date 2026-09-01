/** Public storageService API — see projectsService.ts for the swap-point convention. */
export {
  uploadImage,
  deleteImage,
  deleteImageIfUnreferenced,
  validateImageFile,
} from "./storage/storageService.supabase";

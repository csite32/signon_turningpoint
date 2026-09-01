import { ok, type Result } from "@/services/util/result";

/**
 * Mock storage: wraps the uploaded File in an object URL — session-lived,
 * lost on reload, never persisted anywhere. This mirrors the SHAPE of the
 * real implementation this will become (see src/lib/editor/media-provider.ts's
 * uploadEditorMedia(), already live in this repo for the editor system):
 * content-hash-derived path + `supabase.storage.from('project-media').upload()`
 * + `getPublicUrl()`/signed URL — same {url, path} return, same call site,
 * just a different body. Swapping storageService.mock.ts for a real
 * storageService.ts later requires no change anywhere that imports
 * storageService.
 */
export async function uploadImage(
  file: File,
  options?: { folder?: string },
): Promise<Result<{ url: string; path: string }>> {
  const url = URL.createObjectURL(file);
  const folder = options?.folder ?? "mock";
  const path = `${folder}/${Date.now()}-${file.name}`;
  return ok({ url, path });
}

export async function deleteImage(_path: string): Promise<Result<true>> {
  // Nothing to release: object URLs created above are revoked by the browser
  // on reload; there is no real file to remove yet.
  return ok(true);
}

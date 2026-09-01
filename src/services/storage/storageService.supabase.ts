/**
 * Real Storage-backed implementation of the storageService surface.
 *
 * Every upload lands in the public `project-media` bucket (created in WC#1,
 * 10 MB file-size limit, no server-side MIME filter — so the "images only"
 * rule is enforced HERE, centrally: validateImageFile() runs before every
 * upload and the friendly per-field checks in ProjectForm / GalleryUploader
 * call the same helper). File names are content-hash derived (SHA-256, first
 * 32 hex) inside a sanitized folder, so nothing user-controlled ever reaches
 * the object key.
 *
 * deleteImage() and deleteImageIfUnreferenced() never touch a `public:`-
 * prefixed path (those point at files shipped in public/, e.g. the "maalot"
 * seed — there is nothing in Storage to remove), and deleteImageIfUnreferenced
 * additionally refuses to remove a file that any project_images row or any
 * project hero still points at.
 */
import { supabase } from "@/integrations/supabase/client";
import { ok, err, type Result } from "@/services/util/result";

const BUCKET = "project-media";
const MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_EXT = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".svg",
  ".avif",
  ".bmp",
  ".tif",
  ".tiff",
]);

function extFromName(name: string): string {
  const i = name.lastIndexOf(".");
  return i > -1 ? name.slice(i).toLowerCase() : "";
}

function extFromType(type: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/pjpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
    "image/avif": ".avif",
    "image/bmp": ".bmp",
    "image/tiff": ".tiff",
  };
  return map[type.toLowerCase()] ?? "";
}

async function contentHash(file: File): Promise<string> {
  try {
    const buf = await file.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 32);
  } catch {
    return crypto.randomUUID().replace(/-/g, "");
  }
}

/** Strip a full public URL back down to the bucket-relative object key, if one was passed in. */
function toObjectKey(pathOrUrl: string): string {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = pathOrUrl.indexOf(marker);
  return i > -1 ? pathOrUrl.slice(i + marker.length) : pathOrUrl;
}

/**
 * Central gate: the only two reasons an upload is rejected before it starts.
 * Re-exported through the service seam so ProjectForm / GalleryUploader can
 * show a specific message the instant the user picks a file.
 */
export function validateImageFile(file: File): Result<true> {
  if (!file.type.startsWith("image/")) return err("not_an_image");
  if (file.size > MAX_BYTES) return err("file_too_large");
  return ok(true);
}

export async function uploadImage(
  file: File,
  options?: { folder?: string },
): Promise<Result<{ url: string; path: string }>> {
  const check = validateImageFile(file);
  if (!check.ok) return err(check.error);

  const safeFolder =
    (options?.folder ?? "misc").replace(/[^a-z0-9_-]/gi, "").toLowerCase() || "misc";

  let ext = extFromName(file.name);
  if (!ALLOWED_EXT.has(ext)) ext = extFromType(file.type) || ".img";

  const path = `${safeFolder}/${await contentHash(file)}${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  });
  if (error) return err("upload_failed");

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return ok({ url: data.publicUrl, path });
}

/** Unconditional remove (still a no-op for `public:` seed paths). */
export async function deleteImage(path: string): Promise<Result<true>> {
  if (!path || path.startsWith("public:")) return ok(true);
  const key = toObjectKey(path);
  const { error } = await supabase.storage.from(BUCKET).remove([key]);
  if (error) return err("delete_failed");
  return ok(true);
}

/**
 * Remove a file only once nothing points at it any more. `ignoreImageId` /
 * `ignoreProjectId` let a caller exclude the very row it is in the middle of
 * deleting / repointing, so a still-in-progress swap doesn't see itself as a
 * live reference.
 */
export async function deleteImageIfUnreferenced(
  path: string | null | undefined,
  opts?: { ignoreImageId?: string; ignoreProjectId?: string },
): Promise<Result<true>> {
  if (!path || path.startsWith("public:")) return ok(true);

  let imgQuery = supabase.from("project_images").select("id").eq("storage_path", path).limit(1);
  if (opts?.ignoreImageId) imgQuery = imgQuery.neq("id", opts.ignoreImageId);
  const { data: imgRefs, error: imgErr } = await imgQuery;
  if (imgErr) return err("db_error");
  if (imgRefs && imgRefs.length > 0) return ok(true);

  let projQuery = supabase.from("projects").select("id").eq("hero_image_path", path).limit(1);
  if (opts?.ignoreProjectId) projQuery = projQuery.neq("id", opts.ignoreProjectId);
  const { data: projRefs, error: projErr } = await projQuery;
  if (projErr) return err("db_error");
  if (projRefs && projRefs.length > 0) return ok(true);

  return deleteImage(path);
}

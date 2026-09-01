/**
 * Real Supabase-backed implementation of the projectImagesService surface.
 * Same names / signatures / Result<T> contract as the mock it replaces.
 *
 * Rows live in public.project_images (RLS: public reads images of published
 * projects, is_staff() does everything). The underlying files live in the
 * `project-media` bucket and are only ever removed through
 * deleteImageIfUnreferenced(), so a file that a hero or another gallery row
 * still points at — or any `public:` seed path — is left alone.
 */
import type { GalleryType, ProjectImage } from "@/types/project-image";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { ok, err, type Result } from "@/services/util/result";
import { deleteImageIfUnreferenced } from "@/services/storageService";

type Row = Database["public"]["Tables"]["project_images"]["Row"];
type Insert = Database["public"]["Tables"]["project_images"]["Insert"];
type Update = Database["public"]["Tables"]["project_images"]["Update"];

function rowToImage(r: Row): ProjectImage {
  return {
    id: r.id,
    project_id: r.project_id,
    gallery_type: r.gallery_type as GalleryType,
    storage_path: r.storage_path,
    image_url: r.image_url,
    alt_text: r.alt_text,
    sort_order: r.sort_order,
    created_at: r.created_at,
  };
}

function mapError(error: { code?: string } | null): string {
  if (!error) return "db_error";
  if (error.code === "PGRST116") return "not_found";
  if (error.code === "42501") return "forbidden";
  return "db_error";
}

export async function getProjectImages(
  projectId: string,
  galleryType: GalleryType,
): Promise<Result<ProjectImage[]>> {
  const { data, error } = await supabase
    .from("project_images")
    .select("*")
    .eq("project_id", projectId)
    .eq("gallery_type", galleryType)
    .order("sort_order", { ascending: true });
  if (error) return err(mapError(error));
  return ok((data ?? []).map(rowToImage));
}

export async function getAllProjectImages(projectId: string): Promise<Result<ProjectImage[]>> {
  const { data, error } = await supabase
    .from("project_images")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });
  if (error) return err(mapError(error));
  return ok((data ?? []).map(rowToImage));
}

export async function uploadProjectImage(
  projectId: string,
  input: {
    imageUrl: string;
    storagePath: string;
    galleryType: GalleryType;
    altText?: string;
  },
): Promise<Result<ProjectImage>> {
  const { count, error: cErr } = await supabase
    .from("project_images")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("gallery_type", input.galleryType);
  if (cErr) return err(mapError(cErr));

  const row: Insert = {
    project_id: projectId,
    gallery_type: input.galleryType,
    storage_path: input.storagePath,
    image_url: input.imageUrl,
    alt_text: input.altText ?? "",
    sort_order: count ?? 0,
  };

  const { data, error } = await supabase.from("project_images").insert(row).select("*").single();
  if (error) {
    // The file was uploaded before this row failed — clean the orphan up.
    await deleteImageIfUnreferenced(input.storagePath);
    return err(mapError(error));
  }
  return ok(rowToImage(data));
}

/** Replace the file behind an existing slot — keeps id, alt_text, sort_order, gallery_type. */
export async function replaceProjectImage(
  imageId: string,
  input: { imageUrl: string; storagePath: string },
): Promise<Result<ProjectImage>> {
  const { data: current, error: curErr } = await supabase
    .from("project_images")
    .select("*")
    .eq("id", imageId)
    .maybeSingle();
  if (curErr) return err(mapError(curErr));
  if (!current) {
    await deleteImageIfUnreferenced(input.storagePath);
    return err("not_found");
  }

  const { data, error } = await supabase
    .from("project_images")
    .update({ image_url: input.imageUrl, storage_path: input.storagePath })
    .eq("id", imageId)
    .select("*")
    .single();
  if (error) {
    await deleteImageIfUnreferenced(input.storagePath);
    return err(mapError(error));
  }

  if (current.storage_path !== input.storagePath) {
    await deleteImageIfUnreferenced(current.storage_path, { ignoreImageId: imageId });
  }
  return ok(rowToImage(data));
}

export async function updateProjectImage(
  imageId: string,
  patch: { alt_text?: string },
): Promise<Result<ProjectImage>> {
  const update: Update = {};
  if (patch.alt_text !== undefined) update.alt_text = patch.alt_text;

  const { data, error } = await supabase
    .from("project_images")
    .update(update)
    .eq("id", imageId)
    .select("*")
    .single();
  if (error) return err(mapError(error));
  return ok(rowToImage(data));
}

export async function deleteProjectImage(imageId: string): Promise<Result<true>> {
  const { data: target, error: tErr } = await supabase
    .from("project_images")
    .select("*")
    .eq("id", imageId)
    .maybeSingle();
  if (tErr) return err(mapError(tErr));
  if (!target) return err("not_found");

  const { error: delErr } = await supabase.from("project_images").delete().eq("id", imageId);
  if (delErr) return err(mapError(delErr));

  // Renormalise sort_order so the remaining images in this gallery stay 0..n-1.
  const { data: rest, error: rErr } = await supabase
    .from("project_images")
    .select("id")
    .eq("project_id", target.project_id)
    .eq("gallery_type", target.gallery_type)
    .order("sort_order", { ascending: true });
  if (!rErr && rest) {
    await Promise.all(
      rest.map((row, i) =>
        supabase.from("project_images").update({ sort_order: i }).eq("id", row.id),
      ),
    );
  }

  // File is orphaned now unless a hero / another gallery row still points at it (or it's a public: seed path).
  await deleteImageIfUnreferenced(target.storage_path);
  return ok(true);
}

export async function reorderProjectImages(
  projectId: string,
  galleryType: GalleryType,
  orderedImageIds: string[],
): Promise<Result<ProjectImage[]>> {
  const results = await Promise.all(
    orderedImageIds.map((id, i) =>
      supabase
        .from("project_images")
        .update({ sort_order: i })
        .eq("id", id)
        .eq("project_id", projectId)
        .eq("gallery_type", galleryType),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return err(mapError(failed.error));

  const { data, error } = await supabase
    .from("project_images")
    .select("*")
    .eq("project_id", projectId)
    .eq("gallery_type", galleryType)
    .order("sort_order", { ascending: true });
  if (error) return err(mapError(error));
  return ok((data ?? []).map(rowToImage));
}

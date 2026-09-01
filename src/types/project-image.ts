/**
 * ProjectImage types — mirror the planned Supabase `project_images` table
 * (see schema/schema.sql). `storage_path` is kept alongside `image_url` so a
 * real Storage-backed implementation can delete the underlying file, not just
 * the row.
 */

export type GalleryType = "main_gallery" | "brand_colors" | "secondary_gallery";

export interface ProjectImage {
  id: string;
  project_id: string;
  gallery_type: GalleryType;
  storage_path: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
}

export type ProjectImageInput = Pick<ProjectImage, "gallery_type" | "alt_text">;

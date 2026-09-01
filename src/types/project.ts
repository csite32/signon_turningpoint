/**
 * Project types — mirror the planned Supabase `projects` table (see schema/schema.sql).
 * Field names match 1:1 so swapping the mock service implementation for a real
 * Supabase-backed one later requires no shape changes here.
 */

export type ProjectStatus = "draft" | "published";

export interface Project {
  id: string;
  slug: string;
  title: string;
  hero_image_path: string | null;
  hero_image_url: string | null;
  hero_image_alt: string | null;
  tagline: string | null;
  challenge_text: string | null;
  solution_text: string | null;
  subtitle: string | null;
  extra_paragraph: string | null;
  result_text: string | null;
  testimonial_text: string | null;
  status: ProjectStatus;
  published_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Fields the create/edit form actually collects; id/timestamps are server-assigned. */
export type ProjectInput = Omit<
  Project,
  "id" | "created_at" | "updated_at" | "published_at" | "created_by"
>;

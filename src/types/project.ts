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
  /**
   * Display order for the public archive (/projects), the homepage feature
   * strip and the dashboard table. Service-managed only — never a form field:
   * createProject assigns max+1, reorderProjects rewrites it on drag / the
   * keyboard move buttons. Optional here purely so the retained in-memory mock
   * seed in src/data/mock/projects.ts still type-checks; every Project that
   * flows through the live Supabase mapper carries it (DB column is
   * `sort_order integer not null default 0`).
   */
  sort_order?: number;
  published_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Fields the create/edit form actually collects; id/timestamps/order are server-assigned. */
export type ProjectInput = Omit<
  Project,
  "id" | "created_at" | "updated_at" | "published_at" | "created_by" | "sort_order"
>;

/**
 * Recommendation types — the shared model behind the "המלצות" slider that
 * appears at the bottom of BOTH the homepage and the About page.
 *
 * Field names are chosen to map 1:1 onto a future Supabase `recommendations`
 * table, so the only thing a real backend needs later is a new
 * `src/services/recommendations/recommendationsService.supabase.ts` with the
 * same exports as the mock — no shape changes here, no UI changes. Planned
 * table (NOT created yet — the local mock in
 * src/services/mock/recommendationsService.mock.ts is the current source):
 *
 *   create table recommendations (
 *     id          uuid primary key default gen_random_uuid(),
 *     media_type  text not null check (media_type in ('image','youtube')),
 *     image       text,            -- public URL, when media_type = 'image'
 *     image_path  text,            -- storage object key, for cleanup / sync
 *     image_alt   text,            -- required (non-empty) when media_type = 'image'
 *     youtube_url text,            -- raw URL the editor pasted, when 'youtube'
 *     text        text not null default '',
 *     sort_order  integer not null default 0,
 *     created_at  timestamptz not null default now(),
 *     updated_at  timestamptz not null default now()
 *   );
 */

export type RecommendationMediaType = "image" | "youtube";

export interface Recommendation {
  id: string;
  media_type: RecommendationMediaType;
  /** Public image URL (media-library pick or fresh upload). null when media_type is "youtube". */
  image: string | null;
  /**
   * Storage object key for `image`, when it is known (upload / library item
   * that carried a path). Kept only for future cleanup + Supabase sync — the
   * site render never needs it. null for external URLs and for YouTube items.
   */
  image_path: string | null;
  /** REQUIRED (non-empty) when media_type is "image"; null for YouTube items. */
  image_alt: string | null;
  /** The raw URL the editor pasted — youtube.com / youtu.be / embed all accepted. null for images. */
  youtube_url: string | null;
  /** Caption shown under the media. RTL, may contain line breaks. */
  text: string;
  /** Display order in the slider on both pages. Service-managed, never a form field. */
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Fields the add/edit form actually collects. id + timestamps + sort_order are
 * service-assigned (createRecommendation sets sort_order = max + 1,
 * reorderRecommendations rewrites it on drag / the keyboard move buttons).
 */
export type RecommendationInput = Omit<
  Recommendation,
  "id" | "created_at" | "updated_at" | "sort_order"
>;

/**
 * Real Supabase-backed implementation of the recommendationsService surface.
 *
 * Same function names / signatures / Result<T> contract as the local mock it
 * replaces — the seam in src/services/recommendationsService.ts imports from
 * here, so no component or route changes.
 *
 * Access is the project's standard pattern: the shared client-side `supabase`
 * singleton (carries the signed-in user's session) + RLS on `public.recommendations`:
 * anonymous visitors read every row (recommendations_public_read = USING (true)),
 * a signed-in admin/editor (is_staff()) may insert / update / delete / reorder.
 * There is no service-role usage here.
 *
 * Storage cleanup: deleteRecommendation removes only the row. The image file (if
 * any) is left in the `project-media` bucket on purpose — a recommendation image
 * can be one picked from the shared media library and still referenced by a
 * project, so blind deletion here could orphan a live reference.
 */
import type { Recommendation, RecommendationInput } from "@/types/recommendation";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { ok, err, type Result } from "@/services/util/result";

type RecommendationRow = Database["public"]["Tables"]["recommendations"]["Row"];
type RecommendationInsert = Database["public"]["Tables"]["recommendations"]["Insert"];
type RecommendationUpdate = Database["public"]["Tables"]["recommendations"]["Update"];

const COLS = "*";

function toMediaType(value: string): Recommendation["media_type"] {
  return value === "youtube" ? "youtube" : "image";
}

/** Row -> Recommendation, normalising the unused media side to null. */
function rowToRecommendation(r: RecommendationRow): Recommendation {
  const media_type = toMediaType(r.media_type);
  const isImage = media_type === "image";
  return {
    id: r.id,
    media_type,
    image: isImage ? r.image : null,
    image_path: isImage ? r.image_path : null,
    image_alt: isImage ? r.image_alt : null,
    youtube_url: isImage ? null : r.youtube_url,
    text: r.text ?? "",
    sort_order: r.sort_order,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

/** Postgres / PostgREST error -> stable short code the UI layer phrases in Hebrew. */
function mapError(error: { code?: string } | null): string {
  if (!error) return "db_error";
  if (error.code === "PGRST116") return "not_found";
  if (error.code === "42501") return "forbidden";
  if (error.code === "23514") return "invalid_media_type"; // media_type CHECK
  return "db_error";
}

export async function getRecommendations(): Promise<Result<Recommendation[]>> {
  const { data, error } = await supabase
    .from("recommendations")
    .select(COLS)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
  if (error) return err(mapError(error));
  return ok((data ?? []).map(rowToRecommendation));
}

export async function getRecommendationById(id: string): Promise<Result<Recommendation>> {
  const { data, error } = await supabase
    .from("recommendations")
    .select(COLS)
    .eq("id", id)
    .maybeSingle();
  if (error) return err(mapError(error));
  if (!data) return err("not_found");
  return ok(rowToRecommendation(data));
}

/**
 * Force the payload into a consistent state for its media_type: the image
 * fields are kept only for `image` items, `youtube_url` only for `youtube`
 * items. `prev` supplies the current value for any key the patch omits.
 */
function normalizedFields(
  mediaType: Recommendation["media_type"],
  patch: Partial<RecommendationInput>,
  prev?: RecommendationRow,
): {
  media_type: string;
  image: string | null;
  image_path: string | null;
  image_alt: string | null;
  youtube_url: string | null;
  text: string;
} {
  const isImage = mediaType === "image";
  const image = patch.image !== undefined ? patch.image : (prev?.image ?? null);
  const imagePath = patch.image_path !== undefined ? patch.image_path : (prev?.image_path ?? null);
  const imageAlt = patch.image_alt !== undefined ? patch.image_alt : (prev?.image_alt ?? null);
  const youtubeUrl =
    patch.youtube_url !== undefined ? patch.youtube_url : (prev?.youtube_url ?? null);
  return {
    media_type: mediaType,
    image: isImage ? (image ?? null) : null,
    image_path: isImage ? (imagePath ?? null) : null,
    image_alt: isImage ? (imageAlt ?? null) : null,
    youtube_url: isImage ? null : (youtubeUrl ?? null),
    text: patch.text !== undefined ? patch.text : (prev?.text ?? ""),
  };
}

export async function createRecommendation(
  input: RecommendationInput,
): Promise<Result<Recommendation>> {
  const { data: maxRow, error: maxErr } = await supabase
    .from("recommendations")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (maxErr) return err(mapError(maxErr));
  const sortOrder = (maxRow?.sort_order ?? -1) + 1;

  const row: RecommendationInsert = {
    ...normalizedFields(input.media_type, input),
    sort_order: sortOrder,
  };

  const { data, error } = await supabase.from("recommendations").insert(row).select(COLS).single();
  if (error) return err(mapError(error));
  return ok(rowToRecommendation(data));
}

export async function updateRecommendation(
  id: string,
  patch: Partial<RecommendationInput>,
): Promise<Result<Recommendation>> {
  const { data: current, error: curErr } = await supabase
    .from("recommendations")
    .select(COLS)
    .eq("id", id)
    .maybeSingle();
  if (curErr) return err(mapError(curErr));
  if (!current) return err("not_found");

  const mediaType = patch.media_type ?? toMediaType(current.media_type);
  const update: RecommendationUpdate = normalizedFields(mediaType, patch, current);

  const { data, error } = await supabase
    .from("recommendations")
    .update(update)
    .eq("id", id)
    .select(COLS)
    .single();
  if (error) return err(mapError(error));
  return ok(rowToRecommendation(data));
}

export async function deleteRecommendation(id: string): Promise<Result<true>> {
  const { error } = await supabase.from("recommendations").delete().eq("id", id);
  if (error) return err(mapError(error));
  return ok(true);
}

/**
 * Persist a new order. `orderedIds` is the full list in its new sequence; each
 * row's sort_order becomes its index so the dashboard table and BOTH public
 * sliders (home + about) read back the same order.
 */
export async function reorderRecommendations(
  orderedIds: string[],
): Promise<Result<Recommendation[]>> {
  const results = await Promise.all(
    orderedIds.map((id, i) =>
      supabase.from("recommendations").update({ sort_order: i }).eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return err(mapError(failed.error));
  return getRecommendations();
}

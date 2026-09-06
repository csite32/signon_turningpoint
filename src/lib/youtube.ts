/**
 * Safe YouTube URL handling for the recommendations feature.
 *
 * The dashboard form NEVER accepts raw HTML or an <iframe> tag — the editor
 * pastes a plain link and we build the embed ourselves. These helpers take any
 * of the common shapes:
 *
 *   https://www.youtube.com/watch?v=VIDEOID
 *   https://youtu.be/VIDEOID
 *   https://www.youtube.com/embed/VIDEOID
 *   https://www.youtube.com/shorts/VIDEOID
 *   https://m.youtube.com/watch?v=VIDEOID
 *   youtube.com/watch?v=VIDEOID   (no protocol)
 *
 * ...and reduce them to a canonical, no-cookie embed URL. Anything that does not
 * resolve to an 11-char video id returns null, and the caller shows the plain
 * placeholder instead of embedding anything.
 */

/** YouTube video ids are exactly 11 chars of [A-Za-z0-9_-]. */
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export function parseYouTubeId(input: string | null | undefined): string | null {
  if (!input) return null;
  const raw = input.trim();
  if (!raw) return null;

  // Bare id pasted directly.
  if (VIDEO_ID.test(raw)) return raw;

  let url: URL;
  try {
    url = new URL(raw.includes("://") ? raw : `https://${raw}`);
  } catch {
    return null;
  }

  const host = url.hostname
    .replace(/^www\./, "")
    .replace(/^m\./, "")
    .toLowerCase();

  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id && VIDEO_ID.test(id) ? id : null;
  }

  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const v = url.searchParams.get("v");
    if (v && VIDEO_ID.test(v)) return v;

    // /embed/ID , /shorts/ID , /v/ID , /live/ID
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length >= 2 && ["embed", "shorts", "v", "live"].includes(parts[0])) {
      return VIDEO_ID.test(parts[1]) ? parts[1] : null;
    }
  }

  return null;
}

/**
 * Canonical embed URL for the site, or null when the input is not a usable
 * YouTube link. `youtube-nocookie.com` keeps the section privacy-friendly
 * (matches the "decline non-essential" posture the rest of the site takes).
 */
export function toYouTubeEmbedUrl(input: string | null | undefined): string | null {
  const id = parseYouTubeId(input);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

/** A thumbnail for the dashboard list / form preview without loading the player. */
export function youTubeThumbnailUrl(input: string | null | undefined): string | null {
  const id = parseYouTubeId(input);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

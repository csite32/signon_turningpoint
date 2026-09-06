import { useState } from "react";
import type { Recommendation } from "@/types/recommendation";
import { toYouTubeEmbedUrl } from "@/lib/youtube";

/**
 * The "המלצות" section at the bottom of the homepage AND the About page.
 *
 * The markup, class names, decorative title, arrows and the surrounding
 * turningpoint.css are the ORIGINAL faithful-port ones — untouched. The only
 * change vs. the old hard-coded block is that the single `.rec-item` is now
 * data-driven: one slide per recommendation (ordered by sort_order), switched
 * with the existing `.rec-nav-btn` arrows.
 *
 * Data comes from the route loader (`recommendationsService.getRecommendations()`
 * against Supabase `public.recommendations`), exactly like the homepage projects
 * strip. The loader re-runs on every navigation and on the full-document reload
 * the dashboard's "חזרה לאתר" link performs, so returning from the dashboard or a
 * plain refresh always shows the latest saved list — no client re-fetch needed.
 *
 * - image slide  -> <img> inside the existing rounded 16:9 `.rec-video-wrap`
 * - youtube slide -> safe <iframe> embed built from the pasted URL, same frame
 * - no usable media / empty list -> the original play-icon placeholder
 */
export function RecommendationsSection({
  recommendations = [],
}: {
  recommendations?: Recommendation[];
}) {
  const items = Array.isArray(recommendations) ? recommendations : [];
  const [index, setIndex] = useState(0);

  const count = items.length;
  const safeIndex = count > 0 ? ((index % count) + count) % count : 0;
  const current = count > 0 ? items[safeIndex] : null;

  const go = (delta: number) => {
    if (count <= 1) return;
    setIndex((n) => (((n + delta) % count) + count) % count);
  };

  const navButtons = (withEditorIds: boolean) => (
    <>
      <button type="button" className="rec-nav-btn" aria-label="המלצה קודמת" onClick={() => go(-1)}>
        <img
          src="/Group 57.svg"
          className="rec-nav-arrow"
          alt=""
          {...(withEditorIds ? { "data-editor-id": "global__rec-nav-prev" } : {})}
        />
      </button>
      <button type="button" className="rec-nav-btn" aria-label="המלצה הבאה" onClick={() => go(1)}>
        <img
          src="/Group 58.svg"
          className="rec-nav-arrow"
          alt=""
          {...(withEditorIds ? { "data-editor-id": "global__rec-nav-next" } : {})}
        />
      </button>
    </>
  );

  return (
    <section className="rec-section" id="recommendations">
      <div className="rec-inner">
        <div className="rec-header-col">
          <div className="rec-title-block">
            <div className="rec-title-row1">
              <div data-editor-move-wrap="global__rec-title-text" style={{ display: "block" }}>
                <span className="rec-title-text" data-editor-id="global__rec-title-text">
                  מה קורה
                </span>
              </div>
              <img
                src="/Group 161.svg"
                className="rec-icon"
                data-editor-id="global__rec-icon"
                alt=""
                aria-hidden="true"
              />
            </div>
            <div data-editor-move-wrap="global__rec-title-bold" style={{ display: "block" }}>
              <strong className="rec-title-bold" data-editor-id="global__rec-title-bold">
                כשסוגרים
              </strong>
            </div>
            <div data-editor-move-wrap="global__rec-title-line3" style={{ display: "block" }}>
              <span className="rec-title-line3" data-editor-id="global__rec-title-line3">
                את הפער
              </span>
            </div>
          </div>

          <div className="rec-nav">{navButtons(true)}</div>
        </div>

        <div className="rec-content-col">
          <div className="rec-item">
            <div className="rec-video-wrap">
              <RecommendationMedia rec={current} />
            </div>

            {current && current.text.trim() ? (
              <div className="rec-caption-wrap">
                <div data-editor-move-wrap="global__rec-caption" style={{ width: "100%" }}>
                  <p className="rec-caption" data-editor-id="global__rec-caption">
                    {renderMultiline(current.text)}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="rec-nav rec-nav--mobile">{navButtons(false)}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** image / youtube / placeholder — all into the same `.rec-video-wrap` frame. */
function RecommendationMedia({ rec }: { rec: Recommendation | null }) {
  if (rec && rec.media_type === "image" && rec.image) {
    return <img src={rec.image} alt={rec.image_alt ?? ""} loading="lazy" />;
  }

  if (rec && rec.media_type === "youtube") {
    const embed = toYouTubeEmbedUrl(rec.youtube_url);
    if (embed) {
      return (
        <iframe
          src={embed}
          title={rec.text.trim() ? `המלצה: ${rec.text.trim()}` : "סרטון המלצה"}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }
  }

  return (
    <div className="rec-video-placeholder">
      <svg
        className="rec-play-icon"
        viewBox="0 0 60 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="30" cy="30" r="29" stroke="#E5F0FF" strokeOpacity="0.6" strokeWidth="2" />
        <path d="M24 20L44 30L24 40V20Z" fill="#E5F0FF" fillOpacity="0.8" />
      </svg>
    </div>
  );
}

/** Render user line breaks in the caption without changing `.rec-caption` CSS. */
function renderMultiline(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => (
    <span key={i}>
      {line}
      {i < lines.length - 1 ? <br /> : null}
    </span>
  ));
}

// @ts-nocheck
/* Dynamic port of prototype/project-maalot.html — markup/CSS/animations are
   preserved 1:1 (same convention as TurningPointHome.tsx/TurningPointAbout.tsx:
   "// @ts-nocheck ... Do not redesign or refactor"). The ONLY thing this
   component changes vs. the original static page is WHERE content comes from:
   every text/image that used to be hardcoded HTML is now read from
   projectsService/projectImagesService via a slug (or, in the dashboard's
   preview route, from an in-memory draft — see previewProject/previewImages).

   Header/mobile-menu/footer-section/bottom-bar below are copied inline from
   TurningPointAbout.tsx, same "global__..." data-editor-id values — this is
   the existing project convention (every page duplicates the shared chrome
   rather than importing one shared component), and it's what makes any
   already-saved global override in Supabase's editor_overrides table apply
   here automatically, with no extra code. */
import { useEffect, useLayoutEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import "../../styles/turningpoint.css";
import "../../styles/project-detail.css";
import type { Project } from "@/types/project";
import type { ProjectImage } from "@/types/project-image";
import * as projectsService from "@/services/projectsService";
import * as projectImagesService from "@/services/projectImagesService";
import { rescanEditorRuntime } from "@/lib/editor/editor-runtime";
import { attachProjectDetailEffects } from "@/lib/project-detail-effects";
import { initHeaderScroll } from "@/lib/header-scroll";

type PageState =
  | { status: "loading" }
  | { status: "notfound" }
  | {
      status: "ready";
      project: Project;
      images: ProjectImage[];
      adjacent: { prev: Project | null; next: Project | null };
    };

/**
 * Renders exactly like the original <Link to="/projects/$slug">: same
 * className/style/data-editor-id, same visible title text — so the public
 * route's markup and behavior are byte-identical to before this component
 * existed. The only branch is which mode is rendering: public mode (no
 * onAdjacentNavigate) keeps the real router Link; preview mode swaps in a
 * plain button that hands the adjacent project back to the caller instead
 * of navigating to the public route (which would silently leave the
 * preview context — see ProjectDetailPageProps.onAdjacentNavigate).
 */
function AdjacentNavLink({
  project,
  className,
  style,
  dataEditorId,
  onAdjacentNavigate,
}: {
  project: Project;
  className: string;
  style: React.CSSProperties;
  dataEditorId: string;
  onAdjacentNavigate?: (project: Project) => void;
}) {
  if (onAdjacentNavigate) {
    return (
      <button
        type="button"
        className={className}
        style={style}
        data-editor-id={dataEditorId}
        onClick={() => onAdjacentNavigate(project)}
      >
        {project.title}
      </button>
    );
  }
  return (
    <Link
      to="/projects/$slug"
      params={{ slug: project.slug }}
      className={className}
      style={style}
      data-editor-id={dataEditorId}
    >
      {project.title}
    </Link>
  );
}

export interface ProjectDetailPageProps {
  /** Public route mode: fetch by slug (draft projects need `?preview=1` in the URL + preview:true). */
  slug?: string;
  /** Dashboard preview mode: render this data directly, bypassing the fetch entirely (works for
      unsaved drafts and brand-new projects that don't exist in the mock store yet). */
  previewProject?: Project;
  previewImages?: ProjectImage[];
  /** Preview-mode only: called instead of routing to /projects/:slug when the viewer
      clicks the prev/next nav at the bottom of the page — keeps the click inside the
      preview context (admin/preview.tsx swaps in the adjacent project's real, saved
      data in place) instead of bouncing out to the public route. Ignored in public
      route mode, where prev/next always behaves like a normal site link. */
  onAdjacentNavigate?: (project: Project) => void;
}

export default function ProjectDetailPage({
  slug,
  previewProject,
  previewImages,
  onAdjacentNavigate,
}: ProjectDetailPageProps) {
  const [state, setState] = useState<PageState>({ status: "loading" });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useLayoutEffect(() => {
    document.documentElement.classList.add("anim-ready");
    document.documentElement.setAttribute("dir", "rtl");
    document.documentElement.setAttribute("lang", "he");
    document.body.classList.add("pm-body");
    return () => {
      document.body.classList.remove("pm-body");
    };
  }, []);

  useEffect(() => initHeaderScroll(), []);

  useEffect(() => {
    let cancelled = false;

    if (previewProject) {
      setState({
        status: "ready",
        project: previewProject,
        images: previewImages ?? [],
        adjacent: { prev: null, next: null },
      });
      // Preview mode must not skip getAdjacentProjects() just because there's
      // no real fetch-by-slug happening — the prev/next nav should reflect
      // the real, currently-published neighbors, same as the public route.
      // Fetched separately (not blocking the initial "ready" state above) so
      // an unsaved draft or brand-new project still renders immediately;
      // this only ever fills in `adjacent`, never project/images.
      (async () => {
        const adjacentRes = await projectsService.getAdjacentProjects(previewProject.slug);
        if (cancelled || !adjacentRes.ok) return;
        setState((prev) =>
          prev.status === "ready" ? { ...prev, adjacent: adjacentRes.data } : prev,
        );
      })();
      return () => {
        cancelled = true;
      };
    }

    if (!slug) return;
    setState({ status: "loading" });

    (async () => {
      const isPreview =
        typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("preview") === "1";
      const projectRes = await projectsService.getProjectBySlug(slug, { preview: isPreview });
      if (cancelled) return;
      if (!projectRes.ok) {
        setState({ status: "notfound" });
        return;
      }
      const project = projectRes.data;
      const [mainRes, brandRes, secondaryRes, adjacentRes] = await Promise.all([
        projectImagesService.getProjectImages(project.id, "main_gallery"),
        projectImagesService.getProjectImages(project.id, "brand_colors"),
        projectImagesService.getProjectImages(project.id, "secondary_gallery"),
        projectsService.getAdjacentProjects(project.slug),
      ]);
      if (cancelled) return;
      const images = [
        ...(mainRes.ok ? mainRes.data : []),
        ...(brandRes.ok ? brandRes.data : []),
        ...(secondaryRes.ok ? secondaryRes.data : []),
      ];
      setState({
        status: "ready",
        project,
        images,
        adjacent: adjacentRes.ok ? adjacentRes.data : { prev: null, next: null },
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, previewProject, previewImages]);

  const readyProjectId = state.status === "ready" ? state.project.id : null;
  const readyImagesCount = state.status === "ready" ? state.images.length : 0;

  // Re-scan the visual editor's overrides AFTER our own async content lands in
  // the DOM — __root.tsx's route-change rescan can't know when that happens,
  // since it fires on pathname change alone. Safe to call repeatedly.
  useEffect(() => {
    if (state.status === "ready") rescanEditorRuntime();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyProjectId, readyImagesCount]);

  // Attach the ported scroll effects only once real content (and therefore
  // #pmHeroZone/#pmLastImgBox/etc) exists, and fully clean them up (listeners,
  // observers, rAF) whenever we leave this project or unmount — see
  // src/lib/project-detail-effects.ts for why this can't just be `key={slug}`.
  useEffect(() => {
    if (state.status !== "ready") return;
    const cleanup = attachProjectDetailEffects();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyProjectId]);

  const scopeKey = state.status === "ready" ? state.project.slug || state.project.id : "loading";
  const eid = (suffix: string) => `page-project-${scopeKey}__${suffix}`;

  const mainImages =
    state.status === "ready"
      ? state.images
          .filter((i) => i.gallery_type === "main_gallery")
          .sort((a, b) => a.sort_order - b.sort_order)
      : [];
  const brandImages =
    state.status === "ready"
      ? state.images
          .filter((i) => i.gallery_type === "brand_colors")
          .sort((a, b) => a.sort_order - b.sort_order)
      : [];
  const secondaryImages =
    state.status === "ready"
      ? state.images
          .filter((i) => i.gallery_type === "secondary_gallery")
          .sort((a, b) => a.sort_order - b.sort_order)
      : [];

  return (
    <>
      <header>
        <div className="logo-wrap">
          <img src="/logo2.png" alt="נקודת מפנה" className="logo-img" />
        </div>
        <nav className="navpill">
          <Link to="/" data-editor-id="global__nav-home">
            בית
          </Link>
          <Link to="/about" data-editor-id="global__nav-about">
            אודות והשיטה
          </Link>
          <Link to="/projects" data-editor-id="global__nav-projects">
            פרויקטים
          </Link>
          <a href="#" data-editor-id="global__nav-testimonials">
            לקוחות ממליצים
          </a>
          <Link to="/contact" className="navpill-contact" data-editor-id="global__nav-contact">
            צור קשר
          </Link>
        </nav>
        <div className="topbtn-wrap">
          <div data-editor-move-wrap="global__top-cta" style={{ display: "block" }}>
            <a href="#" className="topbtn" data-editor-id="global__top-cta">
              <span className="topbtn-txt">
                <span className="tb-bold">קוד פתוח:</span>
                <br />
                המדריך להורדה
              </span>
              <span className="topbtn-icon">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="23.9561"
                    cy="23.9561"
                    r="23.3534"
                    fill="#DD4041"
                    stroke="#E5F0FF"
                    strokeWidth="1.20534"
                  ></circle>
                  <line
                    x1="11.1149"
                    y1="23.8643"
                    x2="36.7637"
                    y2="23.8643"
                    stroke="#E5F0FF"
                    strokeWidth="1.20985"
                  ></line>
                  <path
                    d="M19.0981 16C18.6142 18.5407 16.3155 23.864 10.9921 23.864"
                    stroke="#E5F0FF"
                    strokeWidth="1.45182"
                  ></path>
                  <path
                    d="M19.0981 31.8491C18.6142 29.3084 16.3155 23.9851 10.9921 23.9851"
                    stroke="#E5F0FF"
                    strokeWidth="1.45182"
                  ></path>
                </svg>
              </span>
            </a>
          </div>
        </div>
        <button
          className="hamburger"
          aria-label="תפריט"
          onClick={() => setMobileMenuOpen((v) => !v)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </header>
      <div className={mobileMenuOpen ? "mobile-menu open" : "mobile-menu"}>
        <button className="mobile-close" aria-label="סגור" onClick={() => setMobileMenuOpen(false)}>
          ✕
        </button>
        <Link to="/" onClick={() => setMobileMenuOpen(false)}>
          בית
        </Link>
        <Link to="/about" onClick={() => setMobileMenuOpen(false)}>
          אודות והשיטה
        </Link>
        <Link to="/projects" onClick={() => setMobileMenuOpen(false)}>
          פרויקטים
        </Link>
        <a href="#" onClick={() => setMobileMenuOpen(false)}>
          לקוחות ממליצים
        </a>
        <Link to="/contact" className="navpill-contact" onClick={() => setMobileMenuOpen(false)}>
          צור קשר
        </Link>
      </div>

      {state.status === "ready" ? (
        <main className="pm-main">
          {/* HERO — State A full-bleed, shrinks to State B on scroll */}
          <div className="pm-hero-zone" id="pmHeroZone">
            <div className="pm-hero-sticky">
              <div className="pm-hero-box" id="pmHeroBox">
                <img
                  src={state.project.hero_image_url ?? ""}
                  alt={state.project.hero_image_alt ?? ""}
                  data-editor-id={eid("hero-image")}
                />
                <div className="pm-hero-overlay" id="pmHeroOverlay"></div>
                <div className="pm-hero-text" id="pmHeroText">
                  <p className="pm-hero-title" data-editor-id={eid("hero-title")}>
                    {state.project.title}
                  </p>
                  <p className="pm-hero-desc" data-editor-id={eid("hero-desc")}>
                    {state.project.tagline}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* האתגר */}
          <section className="pm-band pm-textband" style={{ height: "calc(426*var(--s))" }}>
            <h2
              className="pm-t is-bold"
              style={{ "--fs": 45, "--iy": 14, "--rx": 1037 } as React.CSSProperties}
              data-editor-id={eid("challenge-heading")}
            >
              האתגר
            </h2>
            <p
              className="pm-t pm-para pm-para--challenge"
              style={
                {
                  "--fs": 30,
                  "--lh": 1.1111,
                  "--iy": 56.5,
                  "--rx": 1037,
                  whiteSpace: "normal",
                } as React.CSSProperties
              }
              data-editor-id={eid("challenge-text")}
            >
              {state.project.challenge_text}
            </p>
            <div className="pm-lockup pm-lockup--challenge">
              <p
                className="pm-t pm-wm"
                style={{ "--fs": 96.108, "--iy": 41, "--rx": 1589 } as React.CSSProperties}
                data-editor-id={eid("challenge-wordmark-1")}
              >
                פרשת
              </p>
              <div
                className="pm-box"
                style={{ "--x": 1253, "--y": 72.5, "--w": 57, "--h": 23 } as React.CSSProperties}
                aria-hidden="true"
                data-editor-id={eid("challenge-wordmark-icon")}
              >
                <img
                  src="/Group 168.svg"
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center",
                    display: "block",
                  }}
                />
              </div>
              <div
                className="pm-box pm-fill-blue"
                style={
                  {
                    "--x": 1225,
                    "--y": 105.5,
                    "--w": 392,
                    "--h": 92,
                    "--r": 60.632,
                  } as React.CSSProperties
                }
              ></div>
              <div
                className="pm-box pm-fill-red pm-pulse-dot"
                style={
                  {
                    "--x": 1256,
                    "--y": 130.5,
                    "--w": 48.411,
                    "--h": 48.411,
                    "--r": 24.3,
                  } as React.CSSProperties
                }
              ></div>
              <p
                className="pm-t is-white pm-wm"
                style={{ "--fs": 96.108, "--iy": 126, "--rx": 1588 } as React.CSSProperties}
                data-editor-id={eid("challenge-wordmark-2")}
              >
                דרכים
              </p>
            </div>
          </section>

          {/* Main gallery slot 0 — wide parallax image */}
          {mainImages[0] && (
            <div
              className="pm-parallax-box"
              role="img"
              aria-label={mainImages[0].alt_text ?? ""}
              data-editor-id={eid("main-gallery-image-0")}
              style={{ backgroundImage: `url(${mainImages[0].image_url})` }}
            ></div>
          )}

          {/* הפתרון */}
          <section className="pm-band pm-textband" style={{ height: "calc(513*var(--s))" }}>
            <h2
              className="pm-t is-bold"
              style={{ "--fs": 45, "--iy": 14, "--rx": 1037 } as React.CSSProperties}
              data-editor-id={eid("solution-heading")}
            >
              הפתרון
            </h2>
            <p
              className="pm-t pm-para pm-para--solution"
              style={
                {
                  "--fs": 30,
                  "--lh": 1.1111,
                  "--iy": 65.5,
                  "--rx": 1037,
                  whiteSpace: "normal",
                } as React.CSSProperties
              }
              data-editor-id={eid("solution-text")}
            >
              {state.project.solution_text}
            </p>
            <div className="pm-lockup pm-lockup--solution">
              <p
                className="pm-t pm-wm"
                style={{ "--fs": 110, "--iy": 97, "--rx": 1595 } as React.CSSProperties}
                data-editor-id={eid("solution-wordmark-1")}
              >
                נקודת
              </p>
              <div
                className="pm-box pm-outline-red"
                style={
                  { "--x": 1225, "--y": 77, "--w": 83.43, "--h": 83.43 } as React.CSSProperties
                }
                aria-hidden="true"
                data-editor-id={eid("solution-icon")}
              >
                <span className="pm-glyph" style={{ inset: "23%" }}>
                  <svg viewBox="0 0 32 31" fill="none">
                    <path d="M20.9549 2H2.00001V20.9756" stroke="#E14E50" strokeWidth="4"></path>
                    <path
                      d="M1.75078 1.77246L30.3279 29.3771"
                      stroke="#E14E50"
                      strokeWidth="4"
                    ></path>
                  </svg>
                </span>
              </div>
              <div
                className="pm-box pm-outline"
                style={{ "--x": 1225, "--y": 174, "--w": 369, "--h": 119 } as React.CSSProperties}
              ></div>
              <p
                className="pm-t is-bold is-center pm-wm"
                style={{ "--fs": 110, "--iy": 206, "--cx": 1413 } as React.CSSProperties}
                data-editor-id={eid("solution-wordmark-2")}
              >
                המפנה
              </p>
            </div>
          </section>

          {/* Main gallery slots 1+2 — image pair */}
          {(mainImages[1] || mainImages[2]) && (
            <section className="pm-band" style={{ height: "calc(566*var(--s))" }}>
              {mainImages[1] && (
                <div
                  className="pm-box pm-card"
                  style={
                    {
                      "--x": 57,
                      "--y": 0,
                      "--w": 877,
                      "--h": 518,
                      "--r": 23.271,
                    } as React.CSSProperties
                  }
                  data-editor-id={eid("main-gallery-image-1")}
                >
                  <img src={mainImages[1].image_url} alt={mainImages[1].alt_text ?? ""} />
                </div>
              )}
              {mainImages[2] && (
                <div
                  className="pm-box pm-card"
                  style={
                    {
                      "--x": 978,
                      "--y": 0,
                      "--w": 884,
                      "--h": 518,
                      "--r": 23.271,
                    } as React.CSSProperties
                  }
                  data-editor-id={eid("main-gallery-image-2")}
                >
                  <img
                    src={mainImages[2].image_url}
                    alt={mainImages[2].alt_text ?? ""}
                    style={{ objectPosition: "center 60%" }}
                  />
                </div>
              )}
            </section>
          )}

          {/* Main gallery slot 3 — second wide image */}
          {mainImages[3] && (
            <section className="pm-band" style={{ height: "calc(635*var(--s))" }}>
              <div
                className="pm-box pm-card"
                style={
                  {
                    "--x": 57,
                    "--y": 0,
                    "--w": 1805,
                    "--h": 590,
                    "--r": 23.271,
                  } as React.CSSProperties
                }
                data-editor-id={eid("main-gallery-image-3")}
              >
                <img src={mainImages[3].image_url} alt={mainImages[3].alt_text ?? ""} />
              </div>
            </section>
          )}

          {/* Brand colour gallery — real uploaded images, shown as-is (no CSS-only fallback color). */}
          {brandImages.length > 0 && (
            <section className="pm-band" style={{ height: "calc(474*var(--s))" }}>
              {[0, 1, 2].map((i) => {
                const img = brandImages[i];
                if (!img) return null;
                const x = [58, 663, 1268][i];
                return (
                  <div
                    key={img.id}
                    className="pm-box pm-card"
                    style={
                      {
                        "--x": x,
                        "--y": 0,
                        "--w": i === 0 ? 586 : 594,
                        "--h": 271,
                        "--r": 23.271,
                      } as React.CSSProperties
                    }
                    data-editor-id={eid(`brand-color-${i}`)}
                  >
                    <img src={img.image_url} alt={img.alt_text ?? ""} />
                  </div>
                );
              })}
            </section>
          )}

          {/* כותרת מתאימה — normal flow, not .pm-t absolute positioning: that
              system assumes fixed-length, manually line-broken text and
              overlaps as soon as either field is longer than the original
              design's placeholder. This section alone uses its own flex
              layout (pm-subtitle-*, in project-detail.css) sized by content;
              no other section on the page is touched. */}
          <section className="pm-subtitle-band">
            <div className="pm-subtitle-row">
              <h2 className="pm-subtitle-heading" data-editor-id={eid("subtitle-heading")}>
                {state.project.subtitle}
              </h2>
              <p className="pm-subtitle-text" data-editor-id={eid("subtitle-text")}>
                <span className="pm-subtitle-text-box">{state.project.extra_paragraph}</span>
              </p>
            </div>
          </section>

          {/* Secondary gallery slot 0 — wide image */}
          {secondaryImages[0] && (
            <section className="pm-band" style={{ height: "calc(636*var(--s))" }}>
              <div
                className="pm-box pm-card"
                style={
                  {
                    "--x": 57,
                    "--y": 0,
                    "--w": 1805,
                    "--h": 590,
                    "--r": 23.271,
                  } as React.CSSProperties
                }
                data-editor-id={eid("secondary-gallery-image-0")}
              >
                <img src={secondaryImages[0].image_url} alt={secondaryImages[0].alt_text ?? ""} />
              </div>
            </section>
          )}

          {/* Secondary gallery slot 1 — tall image */}
          {secondaryImages[1] && (
            <section className="pm-band" style={{ height: "calc(864*var(--s))" }}>
              <div
                className="pm-box pm-card"
                style={
                  {
                    "--x": 57,
                    "--y": 0,
                    "--w": 1805,
                    "--h": 819,
                    "--r": 23.271,
                  } as React.CSSProperties
                }
                data-editor-id={eid("secondary-gallery-image-1")}
              >
                <img
                  src={secondaryImages[1].image_url}
                  alt={secondaryImages[1].alt_text ?? ""}
                  style={{
                    position: "absolute",
                    width: "104.1551%",
                    height: "auto",
                    left: "-0.1108%",
                    top: "-27.3504%",
                  }}
                />
              </div>
            </section>
          )}

          {/* Secondary gallery slots 2+3 — last pair, slot 3 gets the scroll-expand effect */}
          {(secondaryImages[2] || secondaryImages[3]) && (
            <section className="pm-band" style={{ height: "calc(798*var(--s))" }}>
              {secondaryImages[2] && (
                <div
                  className="pm-box pm-card"
                  style={
                    {
                      "--x": 57,
                      "--y": 0,
                      "--w": 884,
                      "--h": 518,
                      "--r": 23.271,
                    } as React.CSSProperties
                  }
                  data-editor-id={eid("secondary-gallery-image-2")}
                >
                  <img src={secondaryImages[2].image_url} alt={secondaryImages[2].alt_text ?? ""} />
                </div>
              )}
              {secondaryImages[3] && (
                <div
                  className="pm-box pm-card"
                  id="pmLastImgBox"
                  style={
                    {
                      "--x": 978,
                      "--y": 0,
                      "--w": 884,
                      "--h": 518,
                      "--r": 23.271,
                    } as React.CSSProperties
                  }
                  data-editor-id={eid("secondary-gallery-image-3")}
                >
                  <img src={secondaryImages[3].image_url} alt={secondaryImages[3].alt_text ?? ""} />
                </div>
              )}
            </section>
          )}

          {/* Scroll-progress spacer + fullscreen clone for secondary-gallery slot 3 above.
              No data-editor-id here on purpose — this clone is never the element the visual
              editor should target, only the original above is. */}
          <div className="pm-expand-track" id="pmExpandTrack" aria-hidden="true"></div>
          <div className="pm-expand-clone" id="pmExpandClone" aria-hidden="true">
            <img id="pmExpandCloneImg" src={secondaryImages[3]?.image_url ?? ""} alt="" />
          </div>

          {/* התוצאה בשטח */}
          <section
            className="pm-band pm-textband"
            id="pmResultsSection"
            style={{ height: "calc(430*var(--s))" }}
          >
            <div className="pm-lockup pm-lockup--result">
              <div
                className="pm-box pm-outline"
                style={
                  {
                    "--x": 1097,
                    "--y": 0,
                    "--w": 439,
                    "--h": 119,
                    "--r": 225,
                  } as React.CSSProperties
                }
              ></div>
              <p
                className="pm-t is-center pm-wm"
                style={{ "--fs": 110, "--iy": 37, "--cx": 1320.5 } as React.CSSProperties}
                data-editor-id={eid("result-heading-1")}
              >
                התוצאה
              </p>
              <div
                className="pm-box pm-outline"
                style={
                  {
                    "--x": 1097,
                    "--y": 118,
                    "--w": 439,
                    "--h": 119,
                    "--r": 225,
                  } as React.CSSProperties
                }
              ></div>
              <div
                className="pm-box pm-outline"
                style={
                  {
                    "--x": 1097,
                    "--y": 120,
                    "--w": 116,
                    "--h": 113.4,
                    "--r": 58,
                  } as React.CSSProperties
                }
                aria-hidden="true"
                data-editor-id={eid("result-icon")}
              >
                <span className="pm-glyph pm-spin" style={{ inset: "26%" }}>
                  <img
                    src="/result-star.svg"
                    alt=""
                    style={{ width: "100%", height: "100%", display: "block" }}
                  />
                </span>
              </div>
              <p
                className="pm-t is-center pm-wm"
                style={{ "--fs": 110, "--iy": 152.5, "--cx": 1374 } as React.CSSProperties}
                data-editor-id={eid("result-heading-2")}
              >
                בשטח
              </p>
            </div>
            <p
              className="pm-t pm-para pm-para--result"
              style={
                {
                  "--fs": 30,
                  "--lh": 1.1111,
                  "--iy": 25.5,
                  "--rx": 960,
                  whiteSpace: "normal",
                } as React.CSSProperties
              }
              data-editor-id={eid("result-text")}
            >
              {state.project.result_text}
            </p>
          </section>

          {/* Testimonial — card grows for long quotes, bottom decoration never stretches */}
          <section style={{ padding: "calc(50*var(--s)) 0 calc(100*var(--s))" }}>
            <div className="pm-quote-card">
              <p className="pm-quote-text" data-editor-id={eid("testimonial-text")}>
                {state.project.testimonial_text}
              </p>
              <div className="pm-quote-decor" aria-hidden="true">
                <img
                  src="/project-maalot/quote-card-shape.svg"
                  alt=""
                  className="pm-quote-decor-shape"
                />
                <div className="pm-quote-circle" data-editor-id={eid("testimonial-circle")}></div>
                <span className="pm-quote-mark" data-editor-id={eid("testimonial-quote-mark")}>
                  ״
                </span>
              </div>
            </div>
          </section>

          {/* Prev / next project nav */}
          {(state.adjacent.prev || state.adjacent.next) && (
            <section className="pm-band" id="pmProjectNav" style={{ height: "calc(285*var(--s))" }}>
              {state.adjacent.prev && (
                <div
                  className="pm-box pm-ring"
                  style={
                    {
                      "--x": 226,
                      "--y": 26,
                      "--w": 98,
                      "--h": 98,
                      "--r": 49,
                    } as React.CSSProperties
                  }
                  aria-hidden="true"
                  data-editor-id={eid("nav-prev-ring")}
                >
                  <span className="pm-glyph" style={{ inset: "27%" }}>
                    <svg viewBox="0 0 44 30" fill="none">
                      <path d="M43 15H3" stroke="#133551" strokeWidth="3" />
                      <path d="M14 4L3 15L14 26" stroke="#133551" strokeWidth="3" />
                    </svg>
                  </span>
                </div>
              )}
              {state.adjacent.prev && (
                <AdjacentNavLink
                  project={state.adjacent.prev}
                  className="pm-t pm-navlink is-left"
                  style={
                    { "--fs": 50, "--lh": 1.1222, "--iy": 34, "--lx": 360 } as React.CSSProperties
                  }
                  dataEditorId={eid("nav-prev-link")}
                  onAdjacentNavigate={onAdjacentNavigate}
                />
              )}
              {state.adjacent.next && (
                <AdjacentNavLink
                  project={state.adjacent.next}
                  className="pm-t pm-navlink"
                  style={
                    { "--fs": 50, "--lh": 1.1222, "--iy": 47, "--rx": 1564 } as React.CSSProperties
                  }
                  dataEditorId={eid("nav-next-link")}
                  onAdjacentNavigate={onAdjacentNavigate}
                />
              )}
              {state.adjacent.next && (
                <div
                  className="pm-box pm-ring"
                  style={
                    {
                      "--x": 1589,
                      "--y": 26,
                      "--w": 98,
                      "--h": 98,
                      "--r": 49,
                    } as React.CSSProperties
                  }
                  aria-hidden="true"
                  data-editor-id={eid("nav-next-ring")}
                >
                  <span className="pm-glyph" style={{ inset: "27%" }}>
                    <svg viewBox="0 0 44 30" fill="none">
                      <path d="M1 15H41" stroke="#133551" strokeWidth="3" />
                      <path d="M30 4L41 15L30 26" stroke="#133551" strokeWidth="3" />
                    </svg>
                  </span>
                </div>
              )}
            </section>
          )}
        </main>
      ) : (
        <>
          <div className="pm-notfound" hidden={state.status === "loading"}>
            <div className="pm-notfound-inner">
              <p className="pm-notfound-title">הפרויקט לא נמצא</p>
              <p className="pm-notfound-text">ייתכן שהקישור שגוי או שהפרויקט הוסר.</p>
              <Link to="/" className="pm-notfound-link">
                חזרה לדף הבית
              </Link>
            </div>
          </div>
          {state.status === "loading" && (
            <div className="pm-notfound">
              <div className="pm-notfound-inner">
                <p className="pm-notfound-text">טוען...</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* === Footer section + Bottom Bar — verbatim, copied from TurningPointAbout.tsx (shared global chrome) === */}
      <section className="footer-section">
        <div className="footer-top-badge">
          <svg
            className="footer-badge-icon"
            viewBox="0 0 241 263"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle
              cx="100.5"
              cy="102.751"
              r="77.5"
              fill="#E5F0FF"
              stroke="#E14E50"
              strokeWidth="4"
            ></circle>
            <path
              className="footer-badge-star"
              d="M65.4396 139.546L75.3339 146.181L98.4879 111.461L123.147 144.856L132.468 137.735L106.555 105.299L146.321 91.9533L142.342 80.7993L103.397 95.2206L103.028 53.49L91.0749 53.8214L93.1621 95.9428L52.8927 82.9894L49.609 94.2979L89.7737 105.628L65.4396 139.546Z"
              fill="#E14E50"
            ></path>
          </svg>
        </div>

        <div className="footer-inner">
          <div className="footer-content-col">
            <div className="footer-title-block">
              <div className="footer-heading-group">
                <div className="footer-heading-row">
                  <div
                    data-editor-move-wrap="global__footer-heading-text"
                    style={{ display: "block" }}
                  >
                    <span
                      className="footer-heading-text"
                      data-editor-id="global__footer-heading-text"
                    >
                      השלב הבא שלך
                    </span>
                  </div>
                  <img
                    src="/Group 82.svg"
                    className="footer-heading-icon"
                    data-editor-id="global__footer-heading-icon"
                    alt=""
                    aria-hidden="true"
                  />
                </div>
                <div className="footer-red-block">
                  <div data-editor-move-wrap="global__footer-red-text" style={{ display: "block" }}>
                    <span className="footer-red-text" data-editor-id="global__footer-red-text">
                      מתחיל כאן.
                    </span>
                  </div>
                </div>
              </div>

              <div data-editor-move-wrap="global__footer-desc" style={{ display: "block" }}>
                <p className="footer-desc" data-editor-id="global__footer-desc">
                  אם העסק שלך בפרשת דרכים והגעת למסקנה
                  <br />
                  שהגיע הזמן לנקודת מפנה אמיתית – בוא נדבר.
                </p>
              </div>
            </div>
          </div>

          <div className="footer-form-col">
            <form className="footer-form" name="contact" action="#">
              <div className="footer-form-row">
                <div className="footer-field">
                  <input
                    type="text"
                    name="name"
                    placeholder="שם"
                    className="footer-input"
                    autoComplete="name"
                    required
                  />
                </div>
                <div className="footer-field">
                  <input
                    type="tel"
                    name="phone"
                    placeholder="טלפון"
                    className="footer-input"
                    autoComplete="tel"
                    required
                  />
                </div>
              </div>
              <div className="footer-field footer-field--full">
                <input
                  type="text"
                  name="situation"
                  placeholder="מהי פרשת הדרכים הנוכחית של העסק שלך?"
                  className="footer-input"
                  required
                />
              </div>
              <div
                data-editor-move-wrap="global__footer-submit-btn"
                style={{ alignSelf: "flex-end", width: "fit-content" }}
              >
                <button
                  type="submit"
                  className="about-cta footer-submit-btn"
                  data-editor-id="global__footer-submit-btn"
                >
                  <span className="acirc">
                    <svg viewBox="0 0 32 31" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20.9549 2H2.00001V20.9756" stroke="#E5F0FF" strokeWidth="4"></path>
                      <path
                        d="M1.75078 1.77246L30.3279 29.3771"
                        stroke="#E5F0FF"
                        strokeWidth="4"
                      ></path>
                    </svg>
                  </span>
                  <span className="cta-text">שליחה</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <div className="bottom-bar">
        <div className="bottom-bar-inner">
          <div data-editor-move-wrap="global__bottom-bar-copyright" style={{ display: "block" }}>
            <p className="bottom-bar-text" data-editor-id="global__bottom-bar-copyright">
              © כל הזכויות שמורות 2026
            </p>
          </div>
          <div data-editor-move-wrap="global__bottom-bar-credits" style={{ display: "block" }}>
            <p className="bottom-bar-text" data-editor-id="global__bottom-bar-credits">
              עיצוב: רות בנדיקט | פיתוח: חיה פוגל Csite
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

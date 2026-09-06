/* Project archive — the public /projects index. Content comes ONLY from the
   shared projectsService (getPublishedProjects → the same in-memory store the
   dashboard, create/edit form and /projects/:slug page use); this component
   holds no project data of its own. Draft projects never appear here.

   Header / mobile-menu / footer-section / bottom-bar below are copied inline
   with the same `global__…` data-editor-id values — the existing project
   convention (every page duplicates the shared chrome rather than importing
   one shared component, so any saved global override in the visual editor
   applies here automatically). The only change vs. the copies in
   TurningPointHome/About + ProjectDetailPage is the "פרויקטים" nav item,
   which now links to this page. Do not redesign the chrome. */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import "../../styles/turningpoint.css";
import "../../styles/projects-archive.css";
import type { Project } from "@/types/project";
import * as projectsService from "@/services/projectsService";
import { initHeaderScroll } from "@/lib/header-scroll";

const PAGE_SIZE = 10;
type Phase = "loading" | "idle" | "loadingMore" | "error";

export default function ProjectArchivePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [phase, setPhase] = useState<Phase>("loading");
  const [hasMore, setHasMore] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const loadingRef = useRef(false);

  useLayoutEffect(() => {
    document.documentElement.setAttribute("dir", "rtl");
    document.documentElement.setAttribute("lang", "he");
  }, []);

  useEffect(() => initHeaderScroll(), []);

  /** Fetch ONE page (10 rows) from `offset` and append it, de-duplicated by id. */
  const loadPage = useCallback(async (offset: number) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setPhase(offset === 0 ? "loading" : "loadingMore");
    const res = await projectsService.getPublishedProjectsPage({ offset, limit: PAGE_SIZE });
    loadingRef.current = false;
    if (!res.ok) {
      setPhase("error");
      return;
    }
    setProjects((prev) => {
      if (offset === 0) return res.data.projects;
      const seen = new Set(prev.map((p) => p.id));
      return [...prev, ...res.data.projects.filter((p) => !seen.has(p.id))];
    });
    setHasMore(res.data.hasMore);
    setPhase("idle");
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await loadPage(0);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadPage]);

  const initialLoading = phase === "loading";
  const initialError = phase === "error" && projects.length === 0;
  const loadMoreError = phase === "error" && projects.length > 0;

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

      <main className="pa-archive">
        <div className="pa-titlebar">
          <div className="pa-pillrow">
            <div className="pa-pill pa-pill-icons">
              <span className="pa-icon-ring">
                <img className="pa-icon-star" src="/archive-star.svg" alt="" aria-hidden="true" />
              </span>
              <img className="pa-icon-dot" src="/Ellipse 21.svg" alt="" aria-hidden="true" />
              <img className="pa-icon-arrow" src="/Vector546.svg" alt="" aria-hidden="true" />
            </div>
            <div className="pa-pill pa-pill-label">
              <span>project</span>
            </div>
          </div>
        </div>

        <div className="pa-grid">
          {projects.map((project) => (
            <Link
              key={project.id}
              to="/projects/$slug"
              params={{ slug: project.slug }}
              className="pa-card"
              aria-label={project.title}
            >
              <img
                className="pa-card-img"
                src={project.hero_image_url ?? ""}
                alt={project.hero_image_alt ?? ""}
              />
              <div className="pa-card-overlay" aria-hidden="true"></div>
              <div className="pa-card-caption">
                <img className="pa-card-arrow" src="/Group 75.svg" alt="" aria-hidden="true" />
                <span className="pa-card-title">{project.title}</span>
              </div>
            </Link>
          ))}

          {!initialLoading && !initialError && projects.length === 0 && (
            <p className="pa-empty">אין עדיין פרויקטים להצגה.</p>
          )}
          {initialError && (
            <p className="pa-empty">
              אירעה שגיאה בטעינת הפרויקטים.{" "}
              <button type="button" className="pa-loadmore-retry" onClick={() => loadPage(0)}>
                נסו שוב
              </button>
            </p>
          )}
        </div>

        <div className="pa-loadmore" aria-live="polite">
          <p className="pa-loadmore-status">
            {phase === "loadingMore" ? "טוען פרויקטים נוספים..." : ""}
          </p>
          {loadMoreError && <p className="pa-loadmore-err">אירעה שגיאה בטעינת פרויקטים נוספים.</p>}
          {hasMore && (
            <button
              type="button"
              className="pa-loadmore-btn"
              disabled={phase === "loadingMore"}
              onClick={() => loadPage(projects.length)}
            >
              {phase === "loadingMore"
                ? "טוען..."
                : loadMoreError
                  ? "נסו שוב"
                  : "טעינת פרויקטים נוספים"}
            </button>
          )}
        </div>
      </main>

      {/* === Footer section + Bottom Bar — verbatim shared global chrome === */}
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

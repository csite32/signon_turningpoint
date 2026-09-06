// @ts-nocheck
/* Faithful port of the Claude-built homepage (prototype/index_59.html).
   Markup, CSS and JS are preserved 1:1. Do not redesign or refactor.
   The only dynamic part is the projects strip: it renders up to 5 published
   projects passed from the route loader (SSR), keeping the exact 1-2-2 markup,
   classes, data-editor ids and animations. */
import { useEffect, useLayoutEffect, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { initHeaderScroll } from "../lib/header-scroll";
import { scrollToRecommendations, scrollToTop } from "../lib/site-nav";
import { RecommendationsSection } from "./recommendations/RecommendationsSection";
import "../styles/turningpoint.css";

export default function TurningPointHome({ projects, recommendations }) {
  const navigate = useNavigate();
  const list = (Array.isArray(projects) ? projects : []).slice(0, 5);
  const withIndex = list.map((project, index) => ({ project, index }));
  // 1-2-2 layout: row 1 gets the first card, rows 2 and 3 up to two each.
  // Empty rows are dropped so fewer than 5 projects never leave blank slots.
  const projRows = [
    withIndex.slice(0, 1),
    withIndex.slice(1, 3),
    withIndex.slice(3, 5),
  ].filter((r) => r.length > 0);
  const goToProject = (slug) => navigate({ to: "/projects/$slug", params: { slug } });

  const inited = useRef(false);
  useLayoutEffect(() => {
    document.documentElement.classList.add("anim-ready");
  }, []);
  useEffect(() => {
    if (inited.current) return;
    inited.current = true;
    document.documentElement.setAttribute("dir", "rtl");
    document.documentElement.setAttribute("lang", "he");
    const s = document.createElement("script");
    s.src = "/turningpoint.js";
    s.async = false;
    document.body.appendChild(s);
  }, []);
  useEffect(() => initHeaderScroll(), []);
  // Deep-link: arriving at /#recommendations from another page (SPA nav or a
  // full reload) must scroll to the recommendations strip once it exists.
  useEffect(() => {
    if (window.location.hash !== "#recommendations") return;
    let tries = 0;
    const timer = window.setInterval(() => {
      const el = document.getElementById("recommendations");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        window.clearInterval(timer);
      } else if (++tries > 40) {
        window.clearInterval(timer);
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      <header>
        <div className="logo-wrap"><a href="/" onClick={scrollToTop} aria-label="נקודת מפנה — לראש עמוד הבית"><img src="/logo2.png" alt="נקודת מפנה" className="logo-img" /></a></div>
        <nav className="navpill">
          <a href="#" data-editor-id="global__nav-home">בית</a>
          <Link to="/about" data-editor-id="global__nav-about">אודות והשיטה</Link>
          <Link to="/projects" data-editor-id="global__nav-projects">פרויקטים</Link>
          <a href="#recommendations" data-editor-id="global__nav-testimonials" onClick={scrollToRecommendations}>לקוחות ממליצים</a>
          <Link to="/contact" className="navpill-contact" data-editor-id="global__nav-contact">צור קשר</Link>
        </nav>
        <div className="topbtn-wrap">
          <div data-editor-move-wrap="global__top-cta" style={{ display: "block" }}>
          <a href="#" className="topbtn" data-editor-id="global__top-cta">
            <span className="topbtn-txt"><span className="tb-bold">קוד פתוח:</span><br />המדריך להורדה</span>
            <span className="topbtn-icon"><svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="23.9561" cy="23.9561" r="23.3534" fill="#DD4041" stroke="#E5F0FF" strokeWidth="1.20534"></circle>
      <line x1="11.1149" y1="23.8643" x2="36.7637" y2="23.8643" stroke="#E5F0FF" strokeWidth="1.20985"></line>
      <path d="M19.0981 16C18.6142 18.5407 16.3155 23.864 10.9921 23.864" stroke="#E5F0FF" strokeWidth="1.45182"></path>
      <path d="M19.0981 31.8491C18.6142 29.3084 16.3155 23.9851 10.9921 23.9851" stroke="#E5F0FF" strokeWidth="1.45182"></path>
      </svg></span>
          </a>
          </div>
        </div>
        <button className="hamburger" aria-label="תפריט">
          <span></span><span></span><span></span>
        </button>
      </header>
      <div className="mobile-menu">
        <button className="mobile-close" aria-label="סגור">✕</button>
        <a href="#">בית</a>
        <a href="#">אודות והשיטה</a>
        <Link to="/projects">פרויקטים</Link>
        <a href="#recommendations" onClick={scrollToRecommendations}>לקוחות ממליצים</a>
        <Link to="/contact" className="navpill-contact">צור קשר</Link>
      </div>



      <main className="stage" id="heroStage">

        <div className="hero-field" id="heroField"></div>

        <div className="overlay hero-overlay">
          <div data-editor-move-wrap="page-index__hero-overlay-text" style={{ display: "block" }}>
          <p data-editor-id="page-index__hero-overlay-text">מפרשת דרכים לזינוק עסקי</p>
          </div>

          <div data-editor-move-wrap="page-index__hero-cta" style={{ display: "block" }}>
          <a href="#projects" className="about-cta anim-cta" data-editor-id="page-index__hero-cta">
            <span className="acirc"><svg viewBox="0 0 32 31" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20.9549 2H2.00001V20.9756" stroke="#E5F0FF" strokeWidth="4"></path><path d="M1.75078 1.77246L30.3279 29.3771" stroke="#E5F0FF" strokeWidth="4"></path></svg></span>
            <span className="cta-text">להצצה<br />בפרויקטים</span>
          </a>
          </div>
        </div>
      </main>


      <section className="about">

        <div data-editor-move-wrap="page-index__about-line1" style={{ display: "block" }}><div className="about-line1" data-editor-id="page-index__about-line1">כשהעסק שלך מגיע</div></div>

        <div data-editor-move-wrap="page-index__parshat-pill" style={{ display: "block" }}>
        <div className="parshat-pill" data-editor-id="page-index__parshat-pill">
          <div data-editor-move-wrap="page-index__parshat-text" style={{ display: "block" }}><span className="parshat-text" data-editor-id="page-index__parshat-text">לפרשת דרכים</span></div>
          <span className="parshat-dot"></span>
        </div>
        </div>

        <div data-editor-move-wrap="page-index__arrow-row" style={{ display: "block" }}>
        <div className="arrow-row" data-editor-id="page-index__arrow-row">
          <svg className="longarrow" width="239" height="237" viewBox="0 0 239 237" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M25.5717 96.1699L2.52564 118.273L24.6527 141.344" stroke="#E5F0FF" strokeWidth="3.57254"></path>
      <path d="M1.95697 118.285L238.733 118.285" stroke="#E5F0FF" strokeWidth="3.57254"></path>
      </svg>
          <div data-editor-move-wrap="page-index__arrow-text" style={{ display: "flex" }}><span className="arrow-text" style={{marginLeft: '16px'}} data-editor-id="page-index__arrow-text">הוא זקוק</span></div>
        </div>
        </div>

        <div className="pills-block">
          <div data-editor-move-wrap="page-index__outline-pill" style={{ display: "block", alignSelf: "center" }}><div className="outline-pill anim-pill" data-editor-id="page-index__outline-pill">לנקודת מפנה</div></div>
          <div className="red-row">
            <div className="arrow-circle anim-circle"><svg width="64" height="40" viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="0.301758" y1="19.6859" x2="63.416" y2="19.6859" stroke="#E5F0FF" strokeWidth="2.97709"></line>
      <path d="M19.9465 0.334229C18.7557 6.58611 13.0992 19.6853 4.61226e-05 19.6853" stroke="#E5F0FF" strokeWidth="3.5725"></path>
      <path d="M19.9465 39.3342C18.7557 33.0823 13.0992 19.9832 4.78143e-05 19.9832" stroke="#E5F0FF" strokeWidth="3.5725"></path>
      </svg></div>
            <div data-editor-move-wrap="page-index__red-block" style={{ flex: "1 1 auto", minWidth: 0 }}><div className="red-block anim-block" data-editor-id="page-index__red-block">אסטרטגית</div></div>
          </div>
        </div>

        <div data-editor-move-wrap="page-index__about-desc" style={{ display: "block" }}>
        <div className="about-desc" data-editor-id="page-index__about-desc">
          משרד מיתוג ופרסום המלווה בעלי עסקים בשלב הצמיחה הבא<br />
          מהאסטרטגיה והמיצוב דרך מיתוג ועיצוב, עד לקמפיין שייצא לאוויר.<br />
          <span className="bold">הכל תחת ראייה אחת, מתואמת ומדויקת.</span>
        </div>
        </div>

        <div data-editor-move-wrap="page-index__about-cta" style={{ display: "block" }}>
        <a href="#" className="about-cta anim-cta" data-editor-id="page-index__about-cta">
          <span className="acirc"><svg viewBox="0 0 32 31" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20.9549 2H2.00001V20.9756" stroke="#E5F0FF" strokeWidth="4"></path><path d="M1.75078 1.77246L30.3279 29.3771" stroke="#E5F0FF" strokeWidth="4"></path></svg></span>
          <span className="cta-text">לשיחת אבחון<br />אסטרטגית</span>
        </a>
        </div>

      </section>

      <section className="next-section">
        <div data-editor-move-wrap="page-index__next-box">
        <div className="next-box" data-editor-id="page-index__next-box">
          <div data-editor-move-wrap="page-index__next-text" style={{ display: "block" }}>
          <p className="next-text" data-editor-id="page-index__next-text">
            העסק שלך מצליח ומקצועי,<br />
            אבל יש פער בין מי שאתה באמת לבין הדרך שבה השוק תופס אותך.<br />
            זה קורה כשאתה מוצא את עצמך בפרשת דרכים:<br />
            <strong>הצמיחה דורשת לעלות ליגה, אבל המיתוג הישן משאיר אותך מאחור.</strong>
          </p>
          </div>
        </div>
        </div>
        <div className="next-circle">
          <svg viewBox="0 0 43 68" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="20.8519" y1="66.8552" x2="20.8519" y2="0.000198433" stroke="rgba(19,53,81,1)" strokeWidth="3.15354" />
            <path d="M0.354004 46.0461C6.97644 47.3076 20.852 53.2993 20.852 67.1749" stroke="rgba(19,53,81,1)" strokeWidth="3.78425" />
            <path d="M41.6653 46.0461C35.0429 47.3076 21.1673 53.2993 21.1673 67.1749" stroke="rgba(19,53,81,1)" strokeWidth="3.78425" />
          </svg>
        </div>
      </section>



      <section className="hero2-section">
        <div className="hero2-header">
          <div className="hero2-row hero2-row1">
            <div data-editor-move-wrap="page-index__hero2-pill-outline" style={{ display: "block" }}><div className="hero2-pill-outline" data-editor-id="page-index__hero2-pill-outline">אם זה מרגיש מוכר</div></div>
            <div className="hero2-star-circle">
              <svg viewBox="0 0 54 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M27.8359 27.0312L51.5342 13.3496L53.3018 16.4111L30.1846 29.7559L53.2959 43.0996L51.5283 46.1611L27.8359 32.4814V59.5H24.3008V33.1543L1.77344 46.1611L0.00585938 43.0996L23.1152 29.7559L0 16.4111L1.76758 13.3496L24.3008 26.3584V0H27.8359V27.0312Z" fill="#DD4041" />
              </svg>
            </div>
          </div>
          <div className="hero2-row hero2-row2">
            <div data-editor-move-wrap="page-index__hero2-pill-solid" style={{ display: "block" }}><div className="hero2-pill-solid anim-hero2-word" data-editor-id="page-index__hero2-pill-solid">הגעת</div></div>
            <div data-editor-move-wrap="page-index__hero2-rect" style={{ display: "block" }}><div className="hero2-rect" data-editor-id="page-index__hero2-rect">לנקודת מפנה.</div></div>
          </div>
        </div>
        <div data-editor-move-wrap="page-index__hero2-text" style={{ display: "block" }}>
        <p className="hero2-text" data-editor-id="page-index__hero2-text">
          בנקודת מפנה, אנחנו מחברים את כל הקצוות בראייה אסטרטגית אחת.<br />
          אנחנו מוודאים שהסיפור העסקי שלך עובר בצורה חדה, עוצמתית ואחידה<br />
          <strong>כך שהמקצוענות שלך תהיה הדבר הראשון שהלקוח פוגש.</strong>
        </p>
        </div>
      </section>









      <section className="decorative-section">
        <div className="decorative-strip"></div>
      </section>





      <section className="projects-section" id="projects">

        <div className="proj-scroll-zone">
          <div className="proj-sticky">

            <div data-editor-move-wrap="page-index__projects-heading" style={{ display: "block" }}>
            <p className="projects-heading" data-editor-id="page-index__projects-heading">
              פרויקטים שעברו את<br />
              <strong>נקודת המפנה</strong> שלהם
            </p>
            </div>
            <div className="projects-row">
              <div data-editor-move-wrap="page-index__projects-pill" style={{ display: "block" }}><div className="projects-pill" data-editor-id="page-index__projects-pill">projects</div></div>
              <div className="projects-star-circle">
                <svg viewBox="0 0 54 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M27.8359 27.0312L51.5342 13.3496L53.3018 16.4111L30.1846 29.7559L53.2959 43.0996L51.5283 46.1611L27.8359 32.4814V59.5H24.3008V33.1543L1.77344 46.1611L0.00585938 43.0996L23.1152 29.7559L0 16.4111L1.76758 13.3496L24.3008 26.3584V0H27.8359V27.0312Z" fill="rgba(225,78,80,1)" />
                </svg>
              </div>
            </div>

            <div className="proj-grid">

              {projRows.map((row, rowIdx) => (
              <div className={`proj-row proj-row--${rowIdx + 1}`} key={rowIdx}>
                {row.map(({ project, index }) => (
                <div
                  key={project.id}
                  data-editor-move-wrap={`page-index__proj-card-${index + 1}`}
                  style={
                    // row 1's card keeps its 680px cap; a row that ends up with a
                    // single card (fewer than 5 projects) gets the same cap so it
                    // doesn't stretch to full width.
                    index === 0 || row.length === 1
                      ? { flex: 1, minWidth: 0, maxWidth: 680 }
                      : { flex: 1, minWidth: 0 }
                  }
                >
                <div
                  className="proj-card"
                  data-proj-id={index + 1}
                  data-proj-href={`/projects/${project.slug}`}
                  data-editor-id={`page-index__proj-card-${index + 1}`}
                  role="link"
                  tabIndex={0}
                  aria-label={project.title}
                  onClick={() => goToProject(project.slug)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      goToProject(project.slug);
                    }
                  }}
                >
                  <img src={project.hero_image_url || ""} alt={project.hero_image_alt || ""} loading="lazy" />
                  <div className="proj-card-border"></div>
                  <div className="proj-notch-cover"></div>
                  <div className="proj-corner">
                    <img src="/Group 68.svg" alt="" aria-hidden="true" />
                  </div>
                </div>
                </div>
                ))}
              </div>
              ))}

            </div>
          </div>
        </div>

        <div className="proj-cta-wrap">
          <div data-editor-move-wrap="page-index__proj-cta-btn" style={{ display: "block" }}>
          <button className="proj-cta-btn" data-editor-id="page-index__proj-cta-btn" onClick={() => navigate({ to: "/projects" })}>
            לכל הפרויקטים שפרצו דרך
            <img src="/Group 96.svg" alt="" aria-hidden="true" className="proj-cta-icon" />
          </button>
          </div>
        </div>

      </section>





      <section className="logos-section" data-editor-id="global__logos-section-bg">

        <div data-editor-move-wrap="global__logos-heading" style={{ display: "block" }}>
        <p className="logos-heading" data-editor-id="global__logos-heading">
          עסקים ומוסדות שבחרו בנקודת מפנה <strong>כדי להוביל</strong>
        </p>
        </div>

        <div className="logos-marquee">
          <div className="logos-track">

            <img src="/logo/1.png" alt="אפרסמון" className="logos-item" loading="lazy" />
            <img src="/logo/2.png" alt="אלתר ספרים" className="logos-item" loading="lazy" />
            <img src="/logo/3.png" alt="חיים שיש בהם" className="logos-item" loading="lazy" />
            <img src="/logo/4.png" alt="קסת" className="logos-item" loading="lazy" />
            <img src="/logo/5.png" alt="פרספקטיב" className="logos-item" loading="lazy" />
            <img src="/logo/6.png" alt="שלמה סירוטה" className="logos-item" loading="lazy" />
            <img src="/logo/7.png" alt="מסלול עסקי" className="logos-item" loading="lazy" />

            <img src="/logo/1.png" alt="" aria-hidden="true" className="logos-item" loading="lazy" />
            <img src="/logo/2.png" alt="" aria-hidden="true" className="logos-item" loading="lazy" />
            <img src="/logo/3.png" alt="" aria-hidden="true" className="logos-item" loading="lazy" />
            <img src="/logo/4.png" alt="" aria-hidden="true" className="logos-item" loading="lazy" />
            <img src="/logo/5.png" alt="" aria-hidden="true" className="logos-item" loading="lazy" />
            <img src="/logo/6.png" alt="" aria-hidden="true" className="logos-item" loading="lazy" />
            <img src="/logo/7.png" alt="" aria-hidden="true" className="logos-item" loading="lazy" />

            <img src="/logo/1.png" alt="" aria-hidden="true" className="logos-item" loading="lazy" />
            <img src="/logo/2.png" alt="" aria-hidden="true" className="logos-item" loading="lazy" />
            <img src="/logo/3.png" alt="" aria-hidden="true" className="logos-item" loading="lazy" />
            <img src="/logo/4.png" alt="" aria-hidden="true" className="logos-item" loading="lazy" />
            <img src="/logo/5.png" alt="" aria-hidden="true" className="logos-item" loading="lazy" />
            <img src="/logo/6.png" alt="" aria-hidden="true" className="logos-item" loading="lazy" />
            <img src="/logo/7.png" alt="" aria-hidden="true" className="logos-item" loading="lazy" />
          </div>
        </div>


      </section>



      <RecommendationsSection recommendations={recommendations} />





      <section className="footer-section">


        <div className="footer-top-badge">
          <svg className="footer-badge-icon" viewBox="0 0 241 263" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="100.5" cy="102.751" r="77.5" fill="#E5F0FF" stroke="#E14E50" strokeWidth="4" />
            <path className="footer-badge-star" d="M65.4396 139.546L75.3339 146.181L98.4879 111.461L123.147 144.856L132.468 137.735L106.555 105.299L146.321 91.9533L142.342 80.7993L103.397 95.2206L103.028 53.49L91.0749 53.8214L93.1621 95.9428L52.8927 82.9894L49.609 94.2979L89.7737 105.628L65.4396 139.546Z" fill="#E14E50" />
          </svg>
        </div>

        <div className="footer-inner">


          <div className="footer-content-col">

            <div className="footer-title-block">
              <div className="footer-heading-group">
                <div className="footer-heading-row">
                  <div data-editor-move-wrap="global__footer-heading-text" style={{ display: "block" }}><span className="footer-heading-text" data-editor-id="global__footer-heading-text">השלב הבא שלך</span></div>
                  <img src="/Group 82.svg" className="footer-heading-icon" data-editor-id="global__footer-heading-icon" alt="" aria-hidden="true" />
                </div>
                <div className="footer-red-block">
                  <div data-editor-move-wrap="global__footer-red-text" style={{ display: "block" }}><span className="footer-red-text" data-editor-id="global__footer-red-text">מתחיל כאן.</span></div>
                </div>
              </div>

              <div data-editor-move-wrap="global__footer-desc" style={{ display: "block" }}>
              <p className="footer-desc" data-editor-id="global__footer-desc">
                אם העסק שלך בפרשת דרכים והגעת למסקנה<br />
                שהגיע הזמן לנקודת מפנה אמיתית – בוא נדבר.
              </p>
              </div>
            </div>

          </div>


          <div className="footer-form-col">
            <form className="footer-form" name="contact" action="#">

              <div className="footer-form-row">
                <div className="footer-field">
                  <input type="text" name="name" placeholder="שם" className="footer-input" autoComplete="name" />
                </div>
                <div className="footer-field">
                  <input type="tel" name="phone" placeholder="טלפון" className="footer-input" autoComplete="tel" />
                </div>
              </div>

              <div className="footer-field footer-field--full">
                <input type="text" name="situation" placeholder="מהי פרשת הדרכים הנוכחית של העסק שלך?" className="footer-input" />
              </div>


              <div data-editor-move-wrap="global__footer-submit-btn" style={{ alignSelf: "flex-end", width: "fit-content" }}>
              <button type="submit" className="about-cta footer-submit-btn" data-editor-id="global__footer-submit-btn">
                <span className="acirc">
                  <svg viewBox="0 0 32 31" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.9549 2H2.00001V20.9756" stroke="#E5F0FF" strokeWidth="4"></path>
                    <path d="M1.75078 1.77246L30.3279 29.3771" stroke="#E5F0FF" strokeWidth="4"></path>
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
          <div data-editor-move-wrap="global__bottom-bar-copyright" style={{ display: "block" }}><p className="bottom-bar-text" data-editor-id="global__bottom-bar-copyright">© כל הזכויות שמורות 2026</p></div>
          <div data-editor-move-wrap="global__bottom-bar-credits" style={{ display: "block" }}><p className="bottom-bar-text" data-editor-id="global__bottom-bar-credits">עיצוב: רות בנדיקט | פיתוח: חיה פוגל Csite</p></div>
        </div>
      </div>
    </>
  );
}

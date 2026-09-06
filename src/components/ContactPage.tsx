/* Contact page — the public /contact route.

   The contact block below is the SAME "let's talk" area that lives in the
   footer of every other page (heading + red pill + icon + paragraph + form +
   submit button), lifted out onto its own page. It reuses the existing
   `footer-*` classes verbatim; only the colours change for the dark site
   background (see styles/contact.css). The footer's light-blue panel, the
   spinning star badge and the copyright bottom-bar are intentionally dropped
   so the area reads as page content on the main blue texture, not as a
   second footer.

   Header / mobile-menu are copied inline with the same `global__…`
   data-editor-id values, matching the project convention (every page
   duplicates the shared chrome). The only change vs. the other copies is the
   "צור קשר" nav item, which now links here and renders active. Do not
   redesign the chrome. */
import { useEffect, useLayoutEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { initHeaderScroll } from "../lib/header-scroll";
import "../styles/turningpoint.css";
import "../styles/contact.css";

export default function ContactPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useLayoutEffect(() => {
    document.documentElement.setAttribute("dir", "rtl");
    document.documentElement.setAttribute("lang", "he");
  }, []);

  useEffect(() => initHeaderScroll(), []);

  return (
    <>
      <header>
        <div className="logo-wrap">
          <Link to="/" aria-label="נקודת מפנה — לעמוד הבית">
            <img src="/logo2.png" alt="נקודת מפנה" className="logo-img" />
          </Link>
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
          <Link to="/" hash="recommendations" data-editor-id="global__nav-testimonials">
            לקוחות ממליצים
          </Link>
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
        <Link to="/" hash="recommendations" onClick={() => setMobileMenuOpen(false)}>
          לקוחות ממליצים
        </Link>
        <Link to="/contact" className="navpill-contact" onClick={() => setMobileMenuOpen(false)}>
          צור קשר
        </Link>
      </div>

      <main className="contact-section">
        <div className="footer-inner contact-inner">
          <div className="footer-content-col">
            <div className="footer-title-block">
              <div className="footer-heading-group">
                <div className="footer-heading-row">
                  <span className="footer-heading-text">השלב הבא שלך</span>
                  <img
                    src="/Group 82.svg"
                    className="footer-heading-icon"
                    alt=""
                    aria-hidden="true"
                  />
                </div>
                <div className="footer-red-block">
                  <span className="footer-red-text">מתחיל כאן.</span>
                </div>
              </div>

              <p className="footer-desc">
                אם העסק שלך בפרשת דרכים והגעת למסקנה
                <br />
                שהגיע הזמן לנקודת מפנה אמיתית – בוא נדבר.
              </p>
            </div>
          </div>

          <div className="footer-form-col">
            <form
              className="footer-form"
              name="contact"
              action="#"
              onSubmit={(e) => e.preventDefault()}
            >
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

              <button type="submit" className="about-cta footer-submit-btn">
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
            </form>
          </div>
        </div>
      </main>
    </>
  );
}

// @ts-nocheck
/* Faithful port of the Claude-built about page (prototype/about.html).
   Markup, CSS and JS are preserved 1:1. Do not redesign or refactor. */
import { useEffect, useLayoutEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { initHeaderScroll } from "../lib/header-scroll";
import { RecommendationsSection } from "./recommendations/RecommendationsSection";
import "../styles/turningpoint.css";
import "../styles/about.css";

export default function TurningPointAbout({ recommendations }) {
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
    s.src = "/about.js";
    s.async = false;
    document.body.appendChild(s);
  }, []);
  useEffect(() => initHeaderScroll(), []);

  return (
    <>
      <header>
        <div className="logo-wrap"><img src="/logo2.png" alt="נקודת מפנה" className="logo-img" /></div>
        <nav className="navpill">
          <Link to="/" data-editor-id="global__nav-home">בית</Link>
          <Link to="/about" data-editor-id="global__nav-about">אודות והשיטה</Link>
          <Link to="/projects" data-editor-id="global__nav-projects">פרויקטים</Link>
          <a href="#" data-editor-id="global__nav-testimonials">לקוחות ממליצים</a>
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
        <Link to="/">בית</Link>
        <Link to="/about">אודות והשיטה</Link>
        <Link to="/projects">פרויקטים</Link>
        <a href="#">לקוחות ממליצים</a>
        <Link to="/contact" className="navpill-contact">צור קשר</Link>
      </div>

      <section className="about-hero">
        <div className="about-hero-inner">
          <div className="about-hero-title-block">
            <div className="about-hero-row1">
              <div data-editor-move-wrap="page-about__hero-frame" style={{ display: "block" }}><div className="about-hero-frame" data-editor-id="page-about__hero-frame">נעים</div></div>
              <span className="about-hero-circle">
                <svg viewBox="0 0 54 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M27.8359 27.0312L51.5342 13.3496L53.3018 16.4111L30.1846 29.7559L53.2959 43.0996L51.5283 46.1611L27.8359 32.4814V59.5H24.3008V33.1543L1.77344 46.1611L0.00585938 43.0996L23.1152 29.7559L0 16.4111L1.76758 13.3496L24.3008 26.3584V0H27.8359V27.0312Z" fill="#DD4041"></path>
                </svg>
              </span>
            </div>
            <div data-editor-move-wrap="page-about__hero-pill" style={{ display: "block" }}><div className="about-hero-pill" data-editor-id="page-about__hero-pill">להכיר</div></div>
          </div>
          <div className="about-hero-intro">
            <div data-editor-move-wrap="page-about__hero-intro" style={{ display: "block" }}>
              <p data-editor-id="page-about__hero-intro">חני וורובל.<br />
              במשך עשור ליוויתי מאות בעלי עסקים ומוסדות<br />
              ברגעי פריצה. פעלתי מאחורי הקלעים בזיקוק<br />
              נרטיבים ובניית תשתיות אסטרטגיות, צברתי<br />
              ניסיון נדיר בתרגום ערך מופשט למסר עוצמתי<br />
              שמניע אנשים לפעולה.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-years">
        <div className="about-years-badge anim-years-group">
          <div data-editor-move-wrap="page-about__years-text" style={{ display: "block" }}><div className="about-years-text anim-years-text" data-editor-id="page-about__years-text"><span>לאורך</span>&nbsp;<strong>השנים</strong></div></div>
          <div className="about-years-icon anim-years-icon">
            <svg className="about-years-arrow" viewBox="0 0 196 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M38.3397 62.1205C29.9297 43.5005 19.1298 39.6105 -0.000215021 31.9705C19.3698 23.6905 30.3598 21.0905 38.7298 1.06046L40.8297 0.0304561C41.4197 -0.259544 41.6198 1.60046 41.4298 2.24046C37.2798 15.5405 27.3498 23.2905 14.6198 30.1605L193.22 30.2605C194.07 30.2605 195.26 30.2805 195.26 30.6605L195.26 33.6505L14.8098 33.7605C27.0298 40.6705 36.6098 48.0805 41.2498 61.0905C41.4698 61.7105 41.4498 62.9005 41.1098 63.3905C40.6898 64.0005 38.6997 62.9705 38.3297 62.1505L38.3397 62.1205Z" fill="#E5F0FF"></path>
            </svg>
            <span className="about-years-circle">
              <svg viewBox="0 0 58 49" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M2.39006 25.765C1.29006 25.755 0.0900601 25.825 0.0800618 25.435L7.53115e-05 22.475L25.4701 22.125L13.9901 3.48496C13.6301 2.89496 13.4301 1.58496 13.4301 1.05496C13.4301 0.524957 15.9401 0.104955 16.2701 0.614955L28.8901 20.115L41.8801 0.194958C42.4201 -0.635042 45.0301 1.40496 44.7601 2.19496L32.3201 22.085L54.9401 22.415C55.7901 22.425 57.1601 23.105 57.6401 23.555C58.1201 24.005 56.5301 25.755 55.6701 25.765L32.3801 26.115L44.4601 45.895C44.9601 46.715 42.8001 48.565 42.1001 48.505L28.7701 27.915L16.5901 47.255C16.2501 47.805 14.5001 48.005 14.1201 47.645C13.6201 47.165 13.4501 45.435 13.9201 44.695L25.5601 26.065L2.41008 25.785L2.39006 25.765Z" fill="#E5F0FF"></path>
              </svg>
            </span>
          </div>
        </div>
        <div className="about-years-copy">
          <div data-editor-move-wrap="page-about__years-copy-1" style={{ display: "block" }}><p className="about-years-strong" data-editor-id="page-about__years-copy-1">זיהיתי דפוס שחוזר על עצמו אצל בעלי עסקים מעולים:</p></div>
          <div data-editor-move-wrap="page-about__years-copy-2" style={{ display: "block" }}><p data-editor-id="page-about__years-copy-2">הם מגיעים לפרשת דרכים שבה הצמיחה דורשת לעלות ליגה, אבל מוצאים את עצמם מתרוצצים בין יועץ עסקי, מעצבת וקופירייטר.</p></div>
          <div data-editor-move-wrap="page-about__years-copy-3" style={{ display: "block" }}><p data-editor-id="page-about__years-copy-3">בסוף, הם נשארים עם &quot;חתיכות&quot; של שירות שלא מדברות באותה שפה, ועם מיתוג שפשוט קטן על המקצוענות שלהם.</p></div>
        </div>
      </section>

      <section className="about-story">
        <div className="about-story-inner">
          <div data-editor-move-wrap="page-about__story-box" style={{ flex: "1 1 500px", maxWidth: 820 }}>
          <div className="about-story-box" data-editor-id="page-about__story-box">
            <p>כשראיתי שבעלי עסקים בצמיחה זקוקים להרבה יותר מאשר ספק שיווקי בודד, <strong>הבנתי שהגיע הזמן להתרחב.</strong></p>
            <p>מתוך המומחיות שלי במשרד הפרסום &apos;סגנון 7&apos;, הקמתי את &quot;נקודת מפנה&quot; – משרד מיתוג ואסטרטגיה המהווה את השלב הבא והרחב יותר של הניסיון שצברתי.</p>
          </div>
          </div>
          <div className="about-arrows-deco anim-arrows-group">
            <div className="about-arrows-col">
              <div className="about-arrow-circle anim-arrow-circle">
                <svg viewBox="0 0 61 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M27.5817 68.7096C27.5676 69.3318 28.1969 71.4885 28.6283 71.3117L30.9334 70.3784L32.6658 6.85898L57.0893 33.2199C57.7469 33.9341 59.3167 34.2876 59.8187 34.3654C60.3561 34.4503 60.342 32.0885 59.7268 31.4168L31.1668 1.5357e-05L1.44703 29.748C0.916701 30.2784 0.202514 31.9825 0.0115945 32.3997C-0.179325 32.8169 1.98445 33.425 2.69863 32.7249L28.7272 7.19133L27.5888 68.7166L27.5817 68.7096Z" fill="#E5F0FF"></path>
                </svg>
              </div>
              <div className="about-arrow-pill about-arrow-pill--red anim-arrow-red">
                <svg viewBox="0 0 64 152" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M33.7878 149.784L33.2584 151.702C33.1186 152.202 30.4419 152.297 30.4419 150.165L30.2921 11.7792C23.5805 20.3638 14.8614 29.6223 1.87765 32.4522C1.31835 32.5711 0.249688 31.3503 0 30.7162C19.8951 23.8041 23.8003 16.0358 32.03 0C40.819 16.5907 43.2959 23.3364 64 30.5973C63.4707 31.6832 62.5518 32.571 61.6729 32.3412C48.9089 28.9882 40.2497 21.1248 33.9076 11.2956L33.7878 149.784Z" fill="#E5F0FF"></path>
                </svg>
              </div>
            </div>
            <div className="about-arrows-col">
              <div className="about-arrow-pill about-arrow-pill--white anim-arrow-white">
                <svg viewBox="0 0 61 172" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M32.6243 2.61245C32.6385 1.99019 32.0091 -0.166465 31.5778 0.0103123L29.2727 0.943634L27.5402 164.463L3.11675 138.102C2.45914 137.388 0.889381 137.034 0.387332 136.957C-0.150071 136.872 -0.135948 139.233 0.479238 139.905L29.0393 171.322L58.759 141.574C59.2893 141.044 60.0035 139.34 60.1944 138.922C60.3854 138.505 58.2216 137.897 57.5074 138.597L31.4788 164.131L32.6172 2.60538L32.6243 2.61245Z" fill="#133551"></path>
                </svg>
              </div>
              <div className="about-arrow-square anim-arrow-square">
                <svg viewBox="0 0 61 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M27.5817 68.7096C27.5676 69.3318 28.1969 71.4885 28.6283 71.3117L30.9334 70.3784L32.6658 6.85898L57.0893 33.2199C57.7469 33.9341 59.3167 34.2876 59.8187 34.3654C60.3561 34.4503 60.342 32.0885 59.7268 31.4168L31.1668 1.5357e-05L1.44703 29.748C0.916701 30.2784 0.202514 31.9825 0.0115945 32.3997C-0.179325 32.8169 1.98445 33.425 2.69863 32.7249L28.7272 7.19133L27.5888 68.7166L27.5817 68.7096Z" fill="#E5F0FF"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-highlight">
        <div className="next-circle about-highlight-circle">
          <svg viewBox="0 0 43 68" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="20.8519" y1="66.8552" x2="20.8519" y2="0.000198433" stroke="rgba(19,53,81,1)" strokeWidth="3.15354"></line>
            <path d="M0.354004 46.0461C6.97644 47.3076 20.852 53.2993 20.852 67.1749" stroke="rgba(19,53,81,1)" strokeWidth="3.78425"></path>
            <path d="M41.6653 46.0461C35.0429 47.3076 21.1673 53.2993 21.1673 67.1749" stroke="rgba(19,53,81,1)" strokeWidth="3.78425"></path>
          </svg>
        </div>
        <div data-editor-move-wrap="page-about__highlight-box">
        <div className="about-highlight-box next-box" data-editor-id="page-about__highlight-box">
          <div data-editor-move-wrap="page-about__highlight-text" style={{ display: "block" }}>
          <p className="next-text" data-editor-id="page-about__highlight-text">
            אני כאן כדי להעניק מעטפת אסטרטגית מלאה ומסונכרנת.<br />
            מערכת אחת שסוגרת את הפער בין מי שאתם באמת<br />
            לבין איך שהשוק תופס אתכם,
          </p>
          </div>
          <div data-editor-move-wrap="page-about__highlight-tag" style={{ display: "block" }}><div className="about-highlight-tag" data-editor-id="page-about__highlight-tag">והופכת את המקצוענות שלכם לאוטוריטה מובילה בתחומה</div></div>
        </div>
        </div>
      </section>

      <section className="about-method">
        <div className="about-method-row1">
          <div data-editor-move-wrap="page-about__method-pill" style={{ display: "block" }}><div className="about-method-pill" data-editor-id="page-about__method-pill">נקודת המפנה</div></div>
          <span className="about-method-circle">
            <svg viewBox="0 0 54 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M27.8359 27.0312L51.5342 13.3496L53.3018 16.4111L30.1846 29.7559L53.2959 43.0996L51.5283 46.1611L27.8359 32.4814V59.5H24.3008V33.1543L1.77344 46.1611L0.00585938 43.0996L23.1152 29.7559L0 16.4111L1.76758 13.3496L24.3008 26.3584V0H27.8359V27.0312Z" fill="#DD4041"></path>
            </svg>
          </span>
        </div>
        <div className="about-method-row2">
          <div data-editor-move-wrap="page-about__method-shel" style={{ display: "block" }}><div className="about-method-shel anim-shel" data-editor-id="page-about__method-shel">של</div></div>
          <div data-editor-move-wrap="page-about__method-frame" style={{ display: "block" }}><div className="about-method-frame" data-editor-id="page-about__method-frame">העסק שלך</div></div>
        </div>
        <div data-editor-move-wrap="page-about__method-heading2" style={{ display: "block" }}><p className="about-method-heading2" data-editor-id="page-about__method-heading2">המעטפת המלאה לבניית מותג מוביל.</p></div>
        <div data-editor-move-wrap="page-about__method-desc" style={{ display: "block" }}><p className="about-method-desc" data-editor-id="page-about__method-desc">כדי להפוך לשם גדול, העסק שלך זקוק למנגנון שעובד בסנכרון מלא. ב&quot;נקודת מפנה&quot; אנחנו מחזיקים את כל שרשרת הערך בכתובת אחת:</p></div>
      </section>

      <section className="about-services-sticky-section" data-about-services="">
        <div className="about-services-scroll-track" data-services-track="">
          <div className="about-services-sticky-viewport">

            <nav className="about-services-nav" aria-label="ניווט בין שירותי המשרד">
              <button type="button" className="about-services-dot is-active" data-service-index="0" aria-label="אסטרטגיה ומיצוב" aria-current="true">
                <span className="about-services-dot-icon-wrap">
                  <svg className="about-services-dot-icon about-services-dot-icon--closed" viewBox="0 0 54 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M27.8359 27.0312L51.5342 13.3496L53.3018 16.4111L30.1846 29.7559L53.2959 43.0996L51.5283 46.1611L27.8359 32.4814V59.5H24.3008V33.1543L1.77344 46.1611L0.00585938 43.0996L23.1152 29.7559L0 16.4111L1.76758 13.3496L24.3008 26.3584V0H27.8359V27.0312Z"></path></svg>
                  <svg className="about-services-dot-icon about-services-dot-icon--open" viewBox="0 0 61 52" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M4.44162 27.5012C3.29162 27.4912 1.54168 26.8812 1.50168 26.2112C1.44168 25.1212 2.82168 24.0012 3.87168 23.9912L26.8617 23.7812L14.8517 3.7012C15.0617 2.9712 16.8617 1.4512 17.5117 1.5012L30.3416 21.9012L42.4516 2.32121C42.8316 1.70121 44.5016 1.47121 44.8216 1.91121C45.2316 2.46121 45.4917 4.2612 45.1317 4.8612L33.5816 23.7412L56.3917 24.0312C57.1117 24.0312 58.5217 24.6112 58.9017 25.1612C59.2817 25.7112 57.8917 27.4112 56.8617 27.4312L33.7916 27.7212L45.7916 47.7012C46.0516 48.4712 43.7116 50.1612 43.0516 49.7212L30.3517 29.4412L18.0516 48.9212C17.7016 49.3212 17.1417 50.0612 16.8617 49.8312L14.6217 47.9912L26.7817 27.7012L4.44162 27.4912L4.44162 27.5012Z"></path></svg>
                </span>
                <span className="about-services-dot-title" data-editor-id="page-about__services-tab-1">אסטרטגיה ומיצוב</span>
              </button>
              <button type="button" className="about-services-dot" data-service-index="1" aria-label="זהות חזותית ומיתוג" aria-current="false">
                <span className="about-services-dot-icon-wrap">
                  <svg className="about-services-dot-icon about-services-dot-icon--closed" viewBox="0 0 54 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M27.8359 27.0312L51.5342 13.3496L53.3018 16.4111L30.1846 29.7559L53.2959 43.0996L51.5283 46.1611L27.8359 32.4814V59.5H24.3008V33.1543L1.77344 46.1611L0.00585938 43.0996L23.1152 29.7559L0 16.4111L1.76758 13.3496L24.3008 26.3584V0H27.8359V27.0312Z"></path></svg>
                  <svg className="about-services-dot-icon about-services-dot-icon--open" viewBox="0 0 61 52" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M4.44162 27.5012C3.29162 27.4912 1.54168 26.8812 1.50168 26.2112C1.44168 25.1212 2.82168 24.0012 3.87168 23.9912L26.8617 23.7812L14.8517 3.7012C15.0617 2.9712 16.8617 1.4512 17.5117 1.5012L30.3416 21.9012L42.4516 2.32121C42.8316 1.70121 44.5016 1.47121 44.8216 1.91121C45.2316 2.46121 45.4917 4.2612 45.1317 4.8612L33.5816 23.7412L56.3917 24.0312C57.1117 24.0312 58.5217 24.6112 58.9017 25.1612C59.2817 25.7112 57.8917 27.4112 56.8617 27.4312L33.7916 27.7212L45.7916 47.7012C46.0516 48.4712 43.7116 50.1612 43.0516 49.7212L30.3517 29.4412L18.0516 48.9212C17.7016 49.3212 17.1417 50.0612 16.8617 49.8312L14.6217 47.9912L26.7817 27.7012L4.44162 27.4912L4.44162 27.5012Z"></path></svg>
                </span>
                <span className="about-services-dot-title" data-editor-id="page-about__services-tab-2">זהות חזותית ומיתוג</span>
              </button>
              <button type="button" className="about-services-dot" data-service-index="2" aria-label="קריאייטיב וקופי" aria-current="false">
                <span className="about-services-dot-icon-wrap">
                  <svg className="about-services-dot-icon about-services-dot-icon--closed" viewBox="0 0 54 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M27.8359 27.0312L51.5342 13.3496L53.3018 16.4111L30.1846 29.7559L53.2959 43.0996L51.5283 46.1611L27.8359 32.4814V59.5H24.3008V33.1543L1.77344 46.1611L0.00585938 43.0996L23.1152 29.7559L0 16.4111L1.76758 13.3496L24.3008 26.3584V0H27.8359V27.0312Z"></path></svg>
                  <svg className="about-services-dot-icon about-services-dot-icon--open" viewBox="0 0 61 52" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M4.44162 27.5012C3.29162 27.4912 1.54168 26.8812 1.50168 26.2112C1.44168 25.1212 2.82168 24.0012 3.87168 23.9912L26.8617 23.7812L14.8517 3.7012C15.0617 2.9712 16.8617 1.4512 17.5117 1.5012L30.3416 21.9012L42.4516 2.32121C42.8316 1.70121 44.5016 1.47121 44.8216 1.91121C45.2316 2.46121 45.4917 4.2612 45.1317 4.8612L33.5816 23.7412L56.3917 24.0312C57.1117 24.0312 58.5217 24.6112 58.9017 25.1612C59.2817 25.7112 57.8917 27.4112 56.8617 27.4312L33.7916 27.7212L45.7916 47.7012C46.0516 48.4712 43.7116 50.1612 43.0516 49.7212L30.3517 29.4412L18.0516 48.9212C17.7016 49.3212 17.1417 50.0612 16.8617 49.8312L14.6217 47.9912L26.7817 27.7012L4.44162 27.4912L4.44162 27.5012Z"></path></svg>
                </span>
                <span className="about-services-dot-title" data-editor-id="page-about__services-tab-3">קריאייטיב וקופי</span>
              </button>
              <button type="button" className="about-services-dot" data-service-index="3" aria-label="ניהול והוצאה לאוויר" aria-current="false">
                <span className="about-services-dot-icon-wrap">
                  <svg className="about-services-dot-icon about-services-dot-icon--closed" viewBox="0 0 54 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M27.8359 27.0312L51.5342 13.3496L53.3018 16.4111L30.1846 29.7559L53.2959 43.0996L51.5283 46.1611L27.8359 32.4814V59.5H24.3008V33.1543L1.77344 46.1611L0.00585938 43.0996L23.1152 29.7559L0 16.4111L1.76758 13.3496L24.3008 26.3584V0H27.8359V27.0312Z"></path></svg>
                  <svg className="about-services-dot-icon about-services-dot-icon--open" viewBox="0 0 61 52" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M4.44162 27.5012C3.29162 27.4912 1.54168 26.8812 1.50168 26.2112C1.44168 25.1212 2.82168 24.0012 3.87168 23.9912L26.8617 23.7812L14.8517 3.7012C15.0617 2.9712 16.8617 1.4512 17.5117 1.5012L30.3416 21.9012L42.4516 2.32121C42.8316 1.70121 44.5016 1.47121 44.8216 1.91121C45.2316 2.46121 45.4917 4.2612 45.1317 4.8612L33.5816 23.7412L56.3917 24.0312C57.1117 24.0312 58.5217 24.6112 58.9017 25.1612C59.2817 25.7112 57.8917 27.4112 56.8617 27.4312L33.7916 27.7212L45.7916 47.7012C46.0516 48.4712 43.7116 50.1612 43.0516 49.7212L30.3517 29.4412L18.0516 48.9212C17.7016 49.3212 17.1417 50.0612 16.8617 49.8312L14.6217 47.9912L26.7817 27.7012L4.44162 27.4912L4.44162 27.5012Z"></path></svg>
                </span>
                <span className="about-services-dot-title" data-editor-id="page-about__services-tab-4">ניהול והוצאה לאוויר</span>
              </button>
            </nav>

            <div className="about-services-cards">

              <article className="about-services-card is-active" data-service-index="0">
                <div className="about-services-mobile-tab">
                  <span className="about-services-mobile-tab-icon-wrap"><svg className="about-services-mobile-tab-icon" viewBox="0 0 61 52" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M4.44162 27.5012C3.29162 27.4912 1.54168 26.8812 1.50168 26.2112C1.44168 25.1212 2.82168 24.0012 3.87168 23.9912L26.8617 23.7812L14.8517 3.7012C15.0617 2.9712 16.8617 1.4512 17.5117 1.5012L30.3416 21.9012L42.4516 2.32121C42.8316 1.70121 44.5016 1.47121 44.8216 1.91121C45.2316 2.46121 45.4917 4.2612 45.1317 4.8612L33.5816 23.7412L56.3917 24.0312C57.1117 24.0312 58.5217 24.6112 58.9017 25.1612C59.2817 25.7112 57.8917 27.4112 56.8617 27.4312L33.7916 27.7212L45.7916 47.7012C46.0516 48.4712 43.7116 50.1612 43.0516 49.7212L30.3517 29.4412L18.0516 48.9212C17.7016 49.3212 17.1417 50.0612 16.8617 49.8312L14.6217 47.9912L26.7817 27.7012L4.44162 27.4912L4.44162 27.5012Z"></path></svg></span>
                  <span className="about-services-mobile-tab-title">אסטרטגיה ומיצוב</span>
                </div>
                <div className="about-services-card-body">
                  <div className="about-services-image-col">
                    <div className="about-services-image-frame">
                      <img className="about-services-image" src="/about/Rectangle 106.png" alt="אסטרטגיה ומיצוב" data-editor-id="page-about__services-image-1" />
                    </div>
                  </div>
                  <div className="about-services-text-col">
                    <div data-editor-move-wrap="page-about__services-desc-1" style={{ display: "block" }}><p className="about-services-desc" data-editor-id="page-about__services-desc-1">בניית התשתית להובלה הכל מתחיל באבחון עסקי מדויק, מחקר שוק וזיקוק הבטחת המותג. זה השלב שבו אנחנו מחליטים איך השוק יראה אתכם כדי שתפסיקו להסביר ותתחילו להוביל.</p></div>
                  </div>
                </div>
              </article>

              <article className="about-services-card" data-service-index="1">
                <div className="about-services-mobile-tab">
                  <span className="about-services-mobile-tab-icon-wrap"><svg className="about-services-mobile-tab-icon" viewBox="0 0 61 52" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M4.44162 27.5012C3.29162 27.4912 1.54168 26.8812 1.50168 26.2112C1.44168 25.1212 2.82168 24.0012 3.87168 23.9912L26.8617 23.7812L14.8517 3.7012C15.0617 2.9712 16.8617 1.4512 17.5117 1.5012L30.3416 21.9012L42.4516 2.32121C42.8316 1.70121 44.5016 1.47121 44.8216 1.91121C45.2316 2.46121 45.4917 4.2612 45.1317 4.8612L33.5816 23.7412L56.3917 24.0312C57.1117 24.0312 58.5217 24.6112 58.9017 25.1612C59.2817 25.7112 57.8917 27.4112 56.8617 27.4312L33.7916 27.7212L45.7916 47.7012C46.0516 48.4712 43.7116 50.1612 43.0516 49.7212L30.3517 29.4412L18.0516 48.9212C17.7016 49.3212 17.1417 50.0612 16.8617 49.8312L14.6217 47.9912L26.7817 27.7012L4.44162 27.4912L4.44162 27.5012Z"></path></svg></span>
                  <span className="about-services-mobile-tab-title">זהות חזותית ומיתוג</span>
                </div>
                <div className="about-services-card-body">
                  <div className="about-services-image-col">
                    <div className="about-services-image-frame">
                      <img className="about-services-image" src="/about/Rectangle 106.png" alt="זהות חזותית ומיתוג" data-editor-id="page-about__services-image-2" />
                    </div>
                  </div>
                  <div className="about-services-text-col">
                    <div data-editor-move-wrap="page-about__services-desc-2" style={{ display: "block" }}><p className="about-services-desc" data-editor-id="page-about__services-desc-2">יצירת נראות של מותג מוביל אנחנו מתרגמים את הכוח האסטרטגי לשפה ויזואלית עוצמתית – מעיצוב לוגו ועד לשפה גרפית מלאה שגורמת לעסק להיראות בדיוק כמה שהוא שווה באמת.</p></div>
                  </div>
                </div>
              </article>

              <article className="about-services-card" data-service-index="2">
                <div className="about-services-mobile-tab">
                  <span className="about-services-mobile-tab-icon-wrap"><svg className="about-services-mobile-tab-icon" viewBox="0 0 61 52" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M4.44162 27.5012C3.29162 27.4912 1.54168 26.8812 1.50168 26.2112C1.44168 25.1212 2.82168 24.0012 3.87168 23.9912L26.8617 23.7812L14.8517 3.7012C15.0617 2.9712 16.8617 1.4512 17.5117 1.5012L30.3416 21.9012L42.4516 2.32121C42.8316 1.70121 44.5016 1.47121 44.8216 1.91121C45.2316 2.46121 45.4917 4.2612 45.1317 4.8612L33.5816 23.7412L56.3917 24.0312C57.1117 24.0312 58.5217 24.6112 58.9017 25.1612C59.2817 25.7112 57.8917 27.4112 56.8617 27.4312L33.7916 27.7212L45.7916 47.7012C46.0516 48.4712 43.7116 50.1612 43.0516 49.7212L30.3517 29.4412L18.0516 48.9212C17.7016 49.3212 17.1417 50.0612 16.8617 49.8312L14.6217 47.9912L26.7817 27.7012L4.44162 27.4912L4.44162 27.5012Z"></path></svg></span>
                  <span className="about-services-mobile-tab-title">קריאייטיב וקופי</span>
                </div>
                <div className="about-services-card-body">
                  <div className="about-services-image-col">
                    <div className="about-services-image-frame">
                      <img className="about-services-image" src="/about/Rectangle 106.png" alt="קריאייטיב וקופי" data-editor-id="page-about__services-image-3" />
                    </div>
                  </div>
                  <div className="about-services-text-col">
                    <div data-editor-move-wrap="page-about__services-desc-3" style={{ display: "block" }}><p className="about-services-desc" data-editor-id="page-about__services-desc-3">הפיכת המקצוענות למסרים שמוכרים זיקוק הסיפור העסקי שלך למילים חדות שסוגרות עסקאות. אנחנו כותבים את האתר, הסלוגנים והקמפיינים בקול אחד, שחוסך ממך את הצורך בשיעורי הסבר מתישים מול הלקוח.</p></div>
                  </div>
                </div>
              </article>

              <article className="about-services-card" data-service-index="3">
                <div className="about-services-mobile-tab">
                  <span className="about-services-mobile-tab-icon-wrap"><svg className="about-services-mobile-tab-icon" viewBox="0 0 61 52" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M4.44162 27.5012C3.29162 27.4912 1.54168 26.8812 1.50168 26.2112C1.44168 25.1212 2.82168 24.0012 3.87168 23.9912L26.8617 23.7812L14.8517 3.7012C15.0617 2.9712 16.8617 1.4512 17.5117 1.5012L30.3416 21.9012L42.4516 2.32121C42.8316 1.70121 44.5016 1.47121 44.8216 1.91121C45.2316 2.46121 45.4917 4.2612 45.1317 4.8612L33.5816 23.7412L56.3917 24.0312C57.1117 24.0312 58.5217 24.6112 58.9017 25.1612C59.2817 25.7112 57.8917 27.4112 56.8617 27.4312L33.7916 27.7212L45.7916 47.7012C46.0516 48.4712 43.7116 50.1612 43.0516 49.7212L30.3517 29.4412L18.0516 48.9212C17.7016 49.3212 17.1417 50.0612 16.8617 49.8312L14.6217 47.9912L26.7817 27.7012L4.44162 27.4912L4.44162 27.5012Z"></path></svg></span>
                  <span className="about-services-mobile-tab-title">ניהול והוצאה לאוויר</span>
                </div>
                <div className="about-services-card-body">
                  <div className="about-services-image-col">
                    <div className="about-services-image-frame">
                      <img className="about-services-image" src="/about/Rectangle 106.png" alt="ניהול והוצאה לאוויר" data-editor-id="page-about__services-image-4" />
                    </div>
                  </div>
                  <div className="about-services-text-col">
                    <div data-editor-move-wrap="page-about__services-desc-4" style={{ display: "block" }}><p className="about-services-desc" data-editor-id="page-about__services-desc-4">מובילים את המהלך עד לתוצאה בשטח אנחנו לא רק מתכננים – אנחנו מבצעים. ניהול פרויקט מלא ותיאום מול כל הספקים כדי לוודא שהחזון האסטרטגי הופך למציאות מול העיניים של השוק.</p></div>
                  </div>
                </div>
              </article>

            </div>
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
            <circle cx="100.5" cy="102.751" r="77.5" fill="#E5F0FF" stroke="#E14E50" strokeWidth="4"></circle>
            <path className="footer-badge-star" d="M65.4396 139.546L75.3339 146.181L98.4879 111.461L123.147 144.856L132.468 137.735L106.555 105.299L146.321 91.9533L142.342 80.7993L103.397 95.2206L103.028 53.49L91.0749 53.8214L93.1621 95.9428L52.8927 82.9894L49.609 94.2979L89.7737 105.628L65.4396 139.546Z" fill="#E14E50"></path>
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
                  <input type="text" name="name" placeholder="שם" className="footer-input" autoComplete="name" required />
                </div>
                <div className="footer-field">
                  <input type="tel" name="phone" placeholder="טלפון" className="footer-input" autoComplete="tel" required />
                </div>
              </div>

              <div className="footer-field footer-field--full">
                <input type="text" name="situation" placeholder="מהי פרשת הדרכים הנוכחית של העסק שלך?" className="footer-input" required />
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

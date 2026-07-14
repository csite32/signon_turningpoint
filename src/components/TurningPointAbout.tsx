// @ts-nocheck
/* Faithful port of the Claude-built about page (prototype/about.html).
   Markup, CSS and JS are preserved 1:1. Do not redesign or refactor. */
import { useEffect, useLayoutEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import "../styles/turningpoint.css";
import "../styles/about.css";

export default function TurningPointAbout() {
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

  return (
    <>
      <header>
        <div className="logo-wrap"><svg viewBox="0 0 148 57" xmlns="http://www.w3.org/2000/svg"><path d="M8.39204 16.2745H10.1725C11.6354 16.2745 12.2225 16.8231 12.2225 18.2379V19.7393C12.2225 20.0665 11.9915 20.2975 11.6643 20.2975C11.3371 20.2975 11.1157 20.0761 11.1157 19.7393V18.2379C11.1157 17.5449 10.8462 17.2177 10.1821 17.2177H9.59507V19.2003C9.59507 19.9799 9.14273 20.2975 8.55565 20.2975C8.33429 20.2975 8.16105 20.2782 7.97819 20.2205C7.77608 20.1531 7.64134 19.951 7.68947 19.7104C7.73759 19.4794 7.93007 19.3447 8.17068 19.3543C8.20918 19.3543 8.23805 19.3543 8.26692 19.3543C8.44016 19.3543 8.5364 19.2581 8.5364 18.9212V17.1985H8.40166C8.12256 17.1985 7.93007 17.006 7.93007 16.7269C7.93007 16.4478 8.12256 16.2649 8.40166 16.2649L8.39204 16.2745Z" fill="white"></path><path d="M17.5742 20.259H14.5137C14.2442 20.259 14.0518 20.0665 14.0518 19.7874C14.0518 19.5083 14.2442 19.3254 14.5137 19.3254H16.3616V18.2668C16.3616 17.6027 16.1113 17.1407 15.4473 17.1407C15.197 17.1407 14.9757 17.1888 14.764 17.2755C14.4945 17.3717 14.225 17.2755 14.1288 17.0541C14.0229 16.8039 14.148 16.544 14.4367 16.4285C14.8024 16.2745 15.197 16.2072 15.582 16.2072C16.862 16.2072 17.4587 16.9097 17.4587 18.1898V19.3351H17.5646C17.8437 19.3351 18.0266 19.5179 18.0266 19.797C18.0266 20.0761 17.8437 20.2686 17.5646 20.2686L17.5742 20.259Z" fill="white"></path><path d="M19.7393 18.1032V16.804C19.7393 16.4767 19.9606 16.2457 20.2878 16.2457C20.6151 16.2457 20.846 16.4671 20.846 16.804V18.1032C20.846 18.4304 20.6247 18.6711 20.2975 18.6711C19.9702 18.6711 19.7393 18.4497 19.7393 18.1032Z" fill="white"></path><path d="M27.0445 18.1514C27.0445 19.5373 26.265 20.3265 24.9657 20.3265C23.6664 20.3265 22.8291 19.5373 22.8291 18.1514V16.8136C22.8291 16.4768 23.0505 16.2458 23.3873 16.2458C23.7242 16.2458 23.9359 16.4672 23.9359 16.8136V18.1514C23.9359 18.931 24.3112 19.4026 24.9657 19.4026C25.6201 19.4026 25.957 18.9406 25.957 18.1514C25.957 17.5547 25.7645 17.1601 25.3218 17.1601C25.2255 17.1601 25.1293 17.189 25.033 17.2082C24.7924 17.2564 24.5711 17.1505 24.5037 16.9388C24.4267 16.6982 24.5326 16.4575 24.7732 16.3517C25.0234 16.2554 25.2255 16.2169 25.4661 16.2169C26.3804 16.2169 27.0445 16.804 27.0445 18.1514Z" fill="white"></path><path d="M32.8664 18.2283V19.7393C32.8664 20.0665 32.6451 20.2975 32.3082 20.2975C31.9714 20.2975 31.7596 20.0761 31.7596 19.7393V18.2668C31.7596 17.5353 31.4324 17.2081 30.7491 17.2081H30.0658V19.7296C30.0658 20.0569 29.8444 20.2878 29.5172 20.2878C29.19 20.2878 28.959 20.0665 28.959 19.7296V16.8231C28.959 16.467 29.1611 16.2649 29.4979 16.2649H30.8453C32.1927 16.2649 32.8664 16.852 32.8664 18.209V18.2283Z" fill="white"></path><path d="M2.81055 29.0364V26.0818C2.81055 25.7257 3.02228 25.5236 3.388 25.5236H4.75464C6.10204 25.5236 6.74686 26.0337 6.74686 27.3137V29.0364C6.74686 29.3348 6.57362 29.508 6.27527 29.508H3.28213C2.98378 29.508 2.81055 29.3348 2.81055 29.0364ZM5.65932 28.5745V27.4292C5.65932 26.7362 5.39947 26.4475 4.74502 26.4475H3.89809V28.5745H5.65932Z" fill="white"></path><path d="M8.73926 27.3425V26.0432C8.73926 25.716 8.96062 25.485 9.28784 25.485C9.61507 25.485 9.84605 25.7064 9.84605 26.0432V27.3425C9.84605 27.6697 9.62469 27.9103 9.29747 27.9103C8.97024 27.9103 8.73926 27.689 8.73926 27.3425Z" fill="white"></path><path d="M13.7912 29.508C13.5217 29.4406 13.3677 29.2193 13.4158 28.9594C13.4543 28.7381 13.6564 28.5841 13.897 28.5937C13.974 28.6033 14.0318 28.6033 14.0895 28.6033C14.4167 28.6033 14.5707 28.4205 14.5707 27.7564V26.4571H12.2224C11.9337 26.4571 11.7412 26.2646 11.7412 25.9855C11.7412 25.7064 11.9337 25.5236 12.2224 25.5236H15.1001C15.4465 25.5236 15.6486 25.7353 15.6486 26.101V27.8526C15.6486 29.2289 14.9942 29.5561 14.2243 29.5561C14.0895 29.5561 13.9452 29.5465 13.7815 29.4984L13.7912 29.508ZM11.8278 27.7757C11.8278 27.4388 12.0492 27.2078 12.3764 27.2078C12.7036 27.2078 12.925 27.4292 12.925 27.7757V29.9989C12.925 30.3261 12.7036 30.5667 12.3764 30.5667C12.0492 30.5667 11.8278 30.3357 11.8278 29.9989V27.7757Z" fill="white"></path><path d="M21.712 27.4966C21.712 28.8054 20.942 29.5754 19.6812 29.5754C18.4205 29.5754 17.6602 28.8054 17.6602 27.4966V26.1395C17.6602 25.7546 17.8911 25.5236 18.2857 25.5236H19.7101C21.0094 25.5236 21.7216 26.2262 21.7216 27.4966H21.712ZM19.6812 28.6418C20.2587 28.6418 20.5956 28.1991 20.5956 27.4966C20.5956 26.8421 20.2876 26.4571 19.6812 26.4571H18.7669V27.4966C18.7669 28.2087 19.0942 28.6418 19.6812 28.6418Z" fill="white"></path><path d="M27.1403 26.0624V26.842C27.1403 28.4781 26.4954 29.556 23.9065 29.8062C23.5793 29.8351 23.3387 29.6715 23.3194 29.3828C23.3002 29.1133 23.4927 28.9016 23.8006 28.8631C23.9643 28.8438 24.1182 28.8246 24.2626 28.8053L23.56 26.2357C23.4638 25.8603 23.6082 25.562 23.9258 25.4946C24.253 25.4176 24.5417 25.6197 24.638 25.9951L25.2635 28.5551C25.8699 28.2856 26.0335 27.8044 26.0335 26.8324V26.0528C26.0335 25.7159 26.2548 25.485 26.5917 25.485C26.9285 25.485 27.1403 25.7159 27.1403 26.0528V26.0624Z" fill="white"></path><path d="M29.498 25.5236H30.8742C32.2409 25.5236 32.8761 26.1492 32.8761 27.5928V28.9787C32.8761 29.3059 32.6547 29.5369 32.3275 29.5369C32.0003 29.5369 31.7789 29.3155 31.7789 28.9787V27.6505C31.7789 26.8036 31.4709 26.4571 30.7395 26.4571H29.5076C29.2189 26.4571 29.0264 26.2646 29.0264 25.9855C29.0264 25.7064 29.2189 25.5236 29.5076 25.5236H29.498ZM29.6712 27.2367C29.9984 27.2367 30.2198 27.4677 30.2198 27.8045V28.9787C30.2198 29.3059 29.9984 29.5369 29.6712 29.5369C29.344 29.5369 29.1226 29.3155 29.1226 28.9787V27.8045C29.1226 27.4677 29.344 27.2367 29.6712 27.2367Z" fill="white"></path><path d="M3.11825 34.8493L1.81898 38.3717C1.70349 38.6893 1.41476 38.8818 1.10679 38.7856C0.789187 38.6893 0.644823 38.391 0.779563 38.006L1.85748 35.061H0.481212C0.192485 35.061 0 34.8589 0 34.5798C0 34.3007 0.202109 34.0986 0.481212 34.0986H2.65629C3.07976 34.0986 3.27224 34.4066 3.11825 34.8493Z" fill="white"></path><path d="M10.2494 35.2825V39.238C10.2494 39.5653 10.028 39.7962 9.70078 39.7962C9.37356 39.7962 9.14258 39.5749 9.14258 39.238V35.2825C9.14258 34.9552 9.36393 34.7243 9.70078 34.7243C10.0376 34.7243 10.2494 34.9456 10.2494 35.2825Z" fill="white"></path><path d="M13.4161 35.2825V38.2179C13.4161 38.5451 13.1948 38.7761 12.8675 38.7761C12.5403 38.7761 12.3093 38.5547 12.3093 38.2179V35.2825C12.3093 34.9552 12.5307 34.7243 12.8675 34.7243C13.2044 34.7243 13.4161 34.9456 13.4161 35.2825Z" fill="white"></path><path d="M15.2539 38.2756C15.2539 38.0062 15.456 37.8137 15.7447 37.8137H16.1971V36.1391C16.1971 35.8311 16.1201 35.706 15.9372 35.706C15.8795 35.706 15.7736 35.7156 15.7062 35.7156C15.5138 35.7156 15.3405 35.5905 15.3405 35.2921C15.3405 34.9938 15.5908 34.7339 16.2067 34.7339C16.9381 34.7339 17.2942 35.1574 17.2942 35.8888V38.2756C17.2942 38.574 17.1306 38.7472 16.8227 38.7472H15.7447C15.456 38.7472 15.2539 38.5451 15.2539 38.2756Z" fill="white"></path><path d="M20.4901 38.3526L20.4323 37.9099H20.4035C20.2399 38.5355 19.903 38.7761 19.5373 38.7761H19.5277C19.2197 38.7761 19.0176 38.5836 19.0176 38.2564C19.0176 37.9291 19.2389 37.7174 19.5758 37.7174H19.6239C20.0185 37.7174 20.3072 37.4864 20.3072 36.8897V36.0909C20.3072 35.8022 20.211 35.6963 20.0089 35.6963C19.9511 35.6963 19.8934 35.7059 19.8068 35.7059C19.6143 35.7059 19.4025 35.5904 19.4025 35.2825C19.4025 34.8782 19.8164 34.7243 20.2687 34.7243C21.0964 34.7243 21.3948 35.0996 21.3948 35.9177V38.2371C21.3948 38.5547 21.26 38.7761 20.9617 38.7761C20.7018 38.7761 20.5286 38.6317 20.4805 38.3526H20.4901Z" fill="white"></path><path d="M27.4483 36.7358C27.4483 38.0447 26.6783 38.8146 25.4176 38.8146C24.1568 38.8146 23.3965 38.0447 23.3965 36.7358V35.3788C23.3965 34.9938 23.6275 34.7628 24.0221 34.7628H25.4464C26.7457 34.7628 27.4579 35.4654 27.4579 36.7358H27.4483ZM25.4176 37.8811C25.995 37.8811 26.3319 37.4383 26.3319 36.7358C26.3319 36.0813 26.0239 35.6964 25.4176 35.6964H24.5033V36.7358C24.5033 37.448 24.8305 37.8811 25.4176 37.8811Z" fill="white"></path><path d="M32.6936 38.7471H29.6331C29.3636 38.7471 29.1711 38.5546 29.1711 38.2755C29.1711 37.9964 29.3636 37.8136 29.6331 37.8136H31.481V36.7549C31.481 36.0908 31.2307 35.6289 30.5667 35.6289C30.3164 35.6289 30.0951 35.677 29.8833 35.7636C29.6139 35.8599 29.3444 35.7636 29.2481 35.5423C29.1423 35.292 29.2674 35.0322 29.5561 34.9167C29.9218 34.7627 30.3164 34.6953 30.7014 34.6953C31.9814 34.6953 32.5781 35.3979 32.5781 36.6779V37.8232H32.684C32.9631 37.8232 33.146 38.0061 33.146 38.2852C33.146 38.5643 32.9631 38.7568 32.684 38.7568L32.6936 38.7471Z" fill="white"></path><path d="M99.293 4.35008H102.604V23.9835H106.867V0.0865479H99.293V4.35008Z" fill="white"></path><path d="M96.5504 11.2796C95.0779 11.2796 93.8845 12.473 93.8845 13.9455C93.8845 15.418 95.0779 16.6114 96.5504 16.6114C98.0229 16.6114 99.2164 15.418 99.2164 13.9455C99.2164 12.473 98.0229 11.2796 96.5504 11.2796Z" fill="white"></path><path d="M50.0556 19.7297H45.0798V23.9836H54.3191V4.35013H67.4273V24.0124H71.6812V0.0865936H50.0556V19.7297Z" fill="white"></path><path d="M147.78 0.00962446H140.09V4.26354H143.574L143.69 14.7636C143.718 17.4487 141.438 19.7489 138.714 19.7874L138.781 24.0413C143.892 23.9644 148.001 19.7874 147.953 14.7155L147.79 0L147.78 0.00962446Z" fill="white"></path><path d="M134.2 2.22316V0.096199H112.738V4.35011H129.956C129.956 4.42711 129.956 4.5041 129.956 4.5811C130.043 12.627 130.091 17.4872 121.958 20.4322L123.412 24.4359C134.383 20.4611 134.306 12.7328 134.22 4.5426C134.22 3.78228 134.2 3.01234 134.2 2.22316Z" fill="white"></path><path d="M45.0608 33.9447H64.752V53.6359H69.0155V29.6811H45.0608V33.9447Z" fill="white"></path><path d="M44.8202 51.1431C43.3477 51.1431 42.1543 52.3366 42.1543 53.8091C42.1543 55.2816 43.3477 56.475 44.8202 56.475C46.2927 56.475 47.4861 55.2816 47.4861 53.8091C47.4861 52.3366 46.2927 51.1431 44.8202 51.1431Z" fill="white"></path><path d="M87.8887 43.3379L96.358 43.2898L96.3388 39.0358L92.1522 39.0551V33.8195H105.559V38.1312C105.559 44.3292 100.612 49.3819 94.5198 49.3819H88.0042V53.6358H94.5198C102.951 53.6358 109.813 46.6775 109.813 38.1312V29.5656H87.8887V43.3475V43.3379Z" fill="white"></path><path d="M112.661 46.4658V53.6455H116.915V46.4658C116.915 39.5171 121.862 33.8677 127.954 33.8677H132.083V49.3723H124.884V53.6262H136.347V29.6041H127.954C119.523 29.6041 112.661 37.1688 112.661 46.4658Z" fill="white"></path><path d="M74.4434 29.6427V33.8966H77.9274L78.0429 44.3967C78.0717 47.0818 75.7908 49.382 73.0671 49.4205L73.1345 53.6744C78.245 53.5974 82.3545 49.4205 82.3064 44.3485L82.1524 29.6331H74.4627L74.4434 29.6427Z" fill="white"></path><path d="M45.0608 45.975H52.7121V53.6359H56.9756V41.721H45.0608V45.975Z" fill="white"></path><path d="M116.992 9.31618H112.738V29.5078H116.992V9.31618Z" fill="white"></path><path d="M86.3587 8.50776C84.9055 13.2525 85.5599 18.7864 88.0526 24.0028H92.884C90.1026 19.2195 89.1401 13.9551 90.4298 9.74928C90.8918 8.22865 91.6328 6.95825 92.5952 5.98621C93.702 4.87942 95.2515 4.34046 96.8203 4.34046V0.0865479H75.2139V4.34046H88.4087C87.5329 5.54349 86.8303 6.92938 86.3491 8.49813L86.3587 8.50776Z" fill="white"></path></svg></div>
        <nav className="navpill">
          <Link to="/">בית</Link>
          <Link to="/about">אודות והשיטה</Link>
          <a href="#">פרויקטים</a>
          <a href="#">לקוחות ממליצים</a>
          <a href="#" className="navpill-contact">צור קשר</a>
        </nav>
        <div className="topbtn-wrap">
          <a href="#" className="topbtn">
            <span className="topbtn-txt"><span className="tb-bold">קוד פתוח:</span><br />המדריך להורדה</span>
            <span className="topbtn-icon"><svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="23.9561" cy="23.9561" r="23.3534" fill="#DD4041" stroke="white" strokeWidth="1.20534"></circle>
      <line x1="11.1149" y1="23.8643" x2="36.7637" y2="23.8643" stroke="white" strokeWidth="1.20985"></line>
      <path d="M19.0981 16C18.6142 18.5407 16.3155 23.864 10.9921 23.864" stroke="white" strokeWidth="1.45182"></path>
      <path d="M19.0981 31.8491C18.6142 29.3084 16.3155 23.9851 10.9921 23.9851" stroke="white" strokeWidth="1.45182"></path>
      </svg></span>
          </a>
        </div>
        <button className="hamburger" aria-label="תפריט">
          <span></span><span></span><span></span>
        </button>
      </header>
      <div className="mobile-menu">
        <button className="mobile-close" aria-label="סגור">✕</button>
        <Link to="/">בית</Link>
        <Link to="/about">אודות והשיטה</Link>
        <a href="#">פרויקטים</a>
        <a href="#">לקוחות ממליצים</a>
        <a href="#" className="navpill-contact">צור קשר</a>
      </div>

      <section className="about-hero">
        <div className="about-hero-inner">
          <div className="about-hero-title-block">
            <div className="about-hero-row1">
              <div className="about-hero-frame">נעים</div>
              <span className="about-hero-circle">
                <svg viewBox="0 0 54 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M27.8359 27.0312L51.5342 13.3496L53.3018 16.4111L30.1846 29.7559L53.2959 43.0996L51.5283 46.1611L27.8359 32.4814V59.5H24.3008V33.1543L1.77344 46.1611L0.00585938 43.0996L23.1152 29.7559L0 16.4111L1.76758 13.3496L24.3008 26.3584V0H27.8359V27.0312Z" fill="#DD4041"></path>
                </svg>
              </span>
            </div>
            <div className="about-hero-pill">להכיר</div>
          </div>
          <div className="about-hero-intro">
            <p>חני וורובל.<br />
            במשך עשור ליוויתי מאות בעלי עסקים ומוסדות<br />
            ברגעי פריצה. פעלתי מאחורי הקלעים בזיקוק<br />
            נרטיבים ובניית תשתיות אסטרטגיות, צברתי<br />
            ניסיון נדיר בתרגום ערך מופשט למסר עוצמתי<br />
            שמניע אנשים לפעולה.</p>
          </div>
        </div>
      </section>

      <section className="about-years">
        <div className="about-years-badge anim-years-group">
          <div className="about-years-text anim-years-text"><span>לאורך</span>&nbsp;<strong>השנים</strong></div>
          <div className="about-years-icon anim-years-icon">
            <svg className="about-years-arrow" viewBox="0 0 196 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M38.3397 62.1205C29.9297 43.5005 19.1298 39.6105 -0.000215021 31.9705C19.3698 23.6905 30.3598 21.0905 38.7298 1.06046L40.8297 0.0304561C41.4197 -0.259544 41.6198 1.60046 41.4298 2.24046C37.2798 15.5405 27.3498 23.2905 14.6198 30.1605L193.22 30.2605C194.07 30.2605 195.26 30.2805 195.26 30.6605L195.26 33.6505L14.8098 33.7605C27.0298 40.6705 36.6098 48.0805 41.2498 61.0905C41.4698 61.7105 41.4498 62.9005 41.1098 63.3905C40.6898 64.0005 38.6997 62.9705 38.3297 62.1505L38.3397 62.1205Z" fill="white"></path>
            </svg>
            <span className="about-years-circle">
              <svg viewBox="0 0 58 49" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M2.39006 25.765C1.29006 25.755 0.0900601 25.825 0.0800618 25.435L7.53115e-05 22.475L25.4701 22.125L13.9901 3.48496C13.6301 2.89496 13.4301 1.58496 13.4301 1.05496C13.4301 0.524957 15.9401 0.104955 16.2701 0.614955L28.8901 20.115L41.8801 0.194958C42.4201 -0.635042 45.0301 1.40496 44.7601 2.19496L32.3201 22.085L54.9401 22.415C55.7901 22.425 57.1601 23.105 57.6401 23.555C58.1201 24.005 56.5301 25.755 55.6701 25.765L32.3801 26.115L44.4601 45.895C44.9601 46.715 42.8001 48.565 42.1001 48.505L28.7701 27.915L16.5901 47.255C16.2501 47.805 14.5001 48.005 14.1201 47.645C13.6201 47.165 13.4501 45.435 13.9201 44.695L25.5601 26.065L2.41008 25.785L2.39006 25.765Z" fill="white"></path>
              </svg>
            </span>
          </div>
        </div>
        <div className="about-years-copy">
          <p className="about-years-strong">זיהיתי דפוס שחוזר על עצמו אצל בעלי עסקים מעולים:</p>
          <p>הם מגיעים לפרשת דרכים שבה הצמיחה דורשת לעלות ליגה, אבל מוצאים את עצמם מתרוצצים בין יועץ עסקי, מעצבת וקופירייטר.</p>
          <p>בסוף, הם נשארים עם &quot;חתיכות&quot; של שירות שלא מדברות באותה שפה, ועם מיתוג שפשוט קטן על המקצוענות שלהם.</p>
        </div>
      </section>

      <section className="about-story">
        <div className="about-story-inner">
          <div className="about-story-box">
            <p>כשראיתי שבעלי עסקים בצמיחה זקוקים להרבה יותר מאשר ספק שיווקי בודד, <strong>הבנתי שהגיע הזמן להתרחב.</strong></p>
            <p>מתוך המומחיות שלי במשרד הפרסום &apos;סגנון 7&apos;, הקמתי את &quot;נקודת מפנה&quot; – משרד מיתוג ואסטרטגיה המהווה את השלב הבא והרחב יותר של הניסיון שצברתי.</p>
          </div>
          <div className="about-arrows-deco anim-arrows-group">
            <div className="about-arrows-col">
              <div className="about-arrow-circle anim-arrow-circle">
                <svg viewBox="0 0 61 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M27.5817 68.7096C27.5676 69.3318 28.1969 71.4885 28.6283 71.3117L30.9334 70.3784L32.6658 6.85898L57.0893 33.2199C57.7469 33.9341 59.3167 34.2876 59.8187 34.3654C60.3561 34.4503 60.342 32.0885 59.7268 31.4168L31.1668 1.5357e-05L1.44703 29.748C0.916701 30.2784 0.202514 31.9825 0.0115945 32.3997C-0.179325 32.8169 1.98445 33.425 2.69863 32.7249L28.7272 7.19133L27.5888 68.7166L27.5817 68.7096Z" fill="white"></path>
                </svg>
              </div>
              <div className="about-arrow-pill about-arrow-pill--red anim-arrow-red">
                <svg viewBox="0 0 64 152" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M33.7878 149.784L33.2584 151.702C33.1186 152.202 30.4419 152.297 30.4419 150.165L30.2921 11.7792C23.5805 20.3638 14.8614 29.6223 1.87765 32.4522C1.31835 32.5711 0.249688 31.3503 0 30.7162C19.8951 23.8041 23.8003 16.0358 32.03 0C40.819 16.5907 43.2959 23.3364 64 30.5973C63.4707 31.6832 62.5518 32.571 61.6729 32.3412C48.9089 28.9882 40.2497 21.1248 33.9076 11.2956L33.7878 149.784Z" fill="white"></path>
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
                  <path d="M27.5817 68.7096C27.5676 69.3318 28.1969 71.4885 28.6283 71.3117L30.9334 70.3784L32.6658 6.85898L57.0893 33.2199C57.7469 33.9341 59.3167 34.2876 59.8187 34.3654C60.3561 34.4503 60.342 32.0885 59.7268 31.4168L31.1668 1.5357e-05L1.44703 29.748C0.916701 30.2784 0.202514 31.9825 0.0115945 32.3997C-0.179325 32.8169 1.98445 33.425 2.69863 32.7249L28.7272 7.19133L27.5888 68.7166L27.5817 68.7096Z" fill="white"></path>
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
        <div className="about-highlight-box next-box">
          <p className="next-text">
            אני כאן כדי להעניק מעטפת אסטרטגית מלאה ומסונכרנת.<br />
            מערכת אחת שסוגרת את הפער בין מי שאתם באמת<br />
            לבין איך שהשוק תופס אתכם,
          </p>
          <div className="about-highlight-tag">והופכת את המקצוענות שלכם לאוטוריטה מובילה בתחומה</div>
        </div>
      </section>

      <section className="about-method">
        <div className="about-method-row1">
          <div className="about-method-pill">נקודת המפנה</div>
          <span className="about-method-circle">
            <svg viewBox="0 0 54 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M27.8359 27.0312L51.5342 13.3496L53.3018 16.4111L30.1846 29.7559L53.2959 43.0996L51.5283 46.1611L27.8359 32.4814V59.5H24.3008V33.1543L1.77344 46.1611L0.00585938 43.0996L23.1152 29.7559L0 16.4111L1.76758 13.3496L24.3008 26.3584V0H27.8359V27.0312Z" fill="#DD4041"></path>
            </svg>
          </span>
        </div>
        <div className="about-method-row2">
          <div className="about-method-shel anim-shel">של</div>
          <div className="about-method-frame">העסק שלך</div>
        </div>
        <p className="about-method-heading2">המעטפת המלאה לבניית מותג מוביל.</p>
        <p className="about-method-desc">כדי להפוך לשם גדול, העסק שלך זקוק למנגנון שעובד בסנכרון מלא. ב&quot;נקודת מפנה&quot; אנחנו מחזיקים את כל שרשרת הערך בכתובת אחת:</p>
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
                <span className="about-services-dot-title">אסטרטגיה ומיצוב</span>
              </button>
              <button type="button" className="about-services-dot" data-service-index="1" aria-label="זהות חזותית ומיתוג" aria-current="false">
                <span className="about-services-dot-icon-wrap">
                  <svg className="about-services-dot-icon about-services-dot-icon--closed" viewBox="0 0 54 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M27.8359 27.0312L51.5342 13.3496L53.3018 16.4111L30.1846 29.7559L53.2959 43.0996L51.5283 46.1611L27.8359 32.4814V59.5H24.3008V33.1543L1.77344 46.1611L0.00585938 43.0996L23.1152 29.7559L0 16.4111L1.76758 13.3496L24.3008 26.3584V0H27.8359V27.0312Z"></path></svg>
                  <svg className="about-services-dot-icon about-services-dot-icon--open" viewBox="0 0 61 52" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M4.44162 27.5012C3.29162 27.4912 1.54168 26.8812 1.50168 26.2112C1.44168 25.1212 2.82168 24.0012 3.87168 23.9912L26.8617 23.7812L14.8517 3.7012C15.0617 2.9712 16.8617 1.4512 17.5117 1.5012L30.3416 21.9012L42.4516 2.32121C42.8316 1.70121 44.5016 1.47121 44.8216 1.91121C45.2316 2.46121 45.4917 4.2612 45.1317 4.8612L33.5816 23.7412L56.3917 24.0312C57.1117 24.0312 58.5217 24.6112 58.9017 25.1612C59.2817 25.7112 57.8917 27.4112 56.8617 27.4312L33.7916 27.7212L45.7916 47.7012C46.0516 48.4712 43.7116 50.1612 43.0516 49.7212L30.3517 29.4412L18.0516 48.9212C17.7016 49.3212 17.1417 50.0612 16.8617 49.8312L14.6217 47.9912L26.7817 27.7012L4.44162 27.4912L4.44162 27.5012Z"></path></svg>
                </span>
                <span className="about-services-dot-title">זהות חזותית ומיתוג</span>
              </button>
              <button type="button" className="about-services-dot" data-service-index="2" aria-label="קריאייטיב וקופי" aria-current="false">
                <span className="about-services-dot-icon-wrap">
                  <svg className="about-services-dot-icon about-services-dot-icon--closed" viewBox="0 0 54 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M27.8359 27.0312L51.5342 13.3496L53.3018 16.4111L30.1846 29.7559L53.2959 43.0996L51.5283 46.1611L27.8359 32.4814V59.5H24.3008V33.1543L1.77344 46.1611L0.00585938 43.0996L23.1152 29.7559L0 16.4111L1.76758 13.3496L24.3008 26.3584V0H27.8359V27.0312Z"></path></svg>
                  <svg className="about-services-dot-icon about-services-dot-icon--open" viewBox="0 0 61 52" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M4.44162 27.5012C3.29162 27.4912 1.54168 26.8812 1.50168 26.2112C1.44168 25.1212 2.82168 24.0012 3.87168 23.9912L26.8617 23.7812L14.8517 3.7012C15.0617 2.9712 16.8617 1.4512 17.5117 1.5012L30.3416 21.9012L42.4516 2.32121C42.8316 1.70121 44.5016 1.47121 44.8216 1.91121C45.2316 2.46121 45.4917 4.2612 45.1317 4.8612L33.5816 23.7412L56.3917 24.0312C57.1117 24.0312 58.5217 24.6112 58.9017 25.1612C59.2817 25.7112 57.8917 27.4112 56.8617 27.4312L33.7916 27.7212L45.7916 47.7012C46.0516 48.4712 43.7116 50.1612 43.0516 49.7212L30.3517 29.4412L18.0516 48.9212C17.7016 49.3212 17.1417 50.0612 16.8617 49.8312L14.6217 47.9912L26.7817 27.7012L4.44162 27.4912L4.44162 27.5012Z"></path></svg>
                </span>
                <span className="about-services-dot-title">קריאייטיב וקופי</span>
              </button>
              <button type="button" className="about-services-dot" data-service-index="3" aria-label="ניהול והוצאה לאוויר" aria-current="false">
                <span className="about-services-dot-icon-wrap">
                  <svg className="about-services-dot-icon about-services-dot-icon--closed" viewBox="0 0 54 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M27.8359 27.0312L51.5342 13.3496L53.3018 16.4111L30.1846 29.7559L53.2959 43.0996L51.5283 46.1611L27.8359 32.4814V59.5H24.3008V33.1543L1.77344 46.1611L0.00585938 43.0996L23.1152 29.7559L0 16.4111L1.76758 13.3496L24.3008 26.3584V0H27.8359V27.0312Z"></path></svg>
                  <svg className="about-services-dot-icon about-services-dot-icon--open" viewBox="0 0 61 52" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M4.44162 27.5012C3.29162 27.4912 1.54168 26.8812 1.50168 26.2112C1.44168 25.1212 2.82168 24.0012 3.87168 23.9912L26.8617 23.7812L14.8517 3.7012C15.0617 2.9712 16.8617 1.4512 17.5117 1.5012L30.3416 21.9012L42.4516 2.32121C42.8316 1.70121 44.5016 1.47121 44.8216 1.91121C45.2316 2.46121 45.4917 4.2612 45.1317 4.8612L33.5816 23.7412L56.3917 24.0312C57.1117 24.0312 58.5217 24.6112 58.9017 25.1612C59.2817 25.7112 57.8917 27.4112 56.8617 27.4312L33.7916 27.7212L45.7916 47.7012C46.0516 48.4712 43.7116 50.1612 43.0516 49.7212L30.3517 29.4412L18.0516 48.9212C17.7016 49.3212 17.1417 50.0612 16.8617 49.8312L14.6217 47.9912L26.7817 27.7012L4.44162 27.4912L4.44162 27.5012Z"></path></svg>
                </span>
                <span className="about-services-dot-title">ניהול והוצאה לאוויר</span>
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
                      <img className="about-services-image" src="/about/Rectangle 106.png" alt="אסטרטגיה ומיצוב" />
                    </div>
                  </div>
                  <div className="about-services-text-col">
                    <p className="about-services-desc">בניית התשתית להובלה הכל מתחיל באבחון עסקי מדויק, מחקר שוק וזיקוק הבטחת המותג. זה השלב שבו אנחנו מחליטים איך השוק יראה אתכם כדי שתפסיקו להסביר ותתחילו להוביל.</p>
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
                      <img className="about-services-image" src="/about/Rectangle 106.png" alt="זהות חזותית ומיתוג" />
                    </div>
                  </div>
                  <div className="about-services-text-col">
                    <p className="about-services-desc">יצירת נראות של מותג מוביל אנחנו מתרגמים את הכוח האסטרטגי לשפה ויזואלית עוצמתית – מעיצוב לוגו ועד לשפה גרפית מלאה שגורמת לעסק להיראות בדיוק כמה שהוא שווה באמת.</p>
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
                      <img className="about-services-image" src="/about/Rectangle 106.png" alt="קריאייטיב וקופי" />
                    </div>
                  </div>
                  <div className="about-services-text-col">
                    <p className="about-services-desc">הפיכת המקצוענות למסרים שמוכרים זיקוק הסיפור העסקי שלך למילים חדות שסוגרות עסקאות. אנחנו כותבים את האתר, הסלוגנים והקמפיינים בקול אחד, שחוסך ממך את הצורך בשיעורי הסבר מתישים מול הלקוח.</p>
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
                      <img className="about-services-image" src="/about/Rectangle 106.png" alt="ניהול והוצאה לאוויר" />
                    </div>
                  </div>
                  <div className="about-services-text-col">
                    <p className="about-services-desc">מובילים את המהלך עד לתוצאה בשטח אנחנו לא רק מתכננים – אנחנו מבצעים. ניהול פרויקט מלא ותיאום מול כל הספקים כדי לוודא שהחזון האסטרטגי הופך למציאות מול העיניים של השוק.</p>
                  </div>
                </div>
              </article>

            </div>
          </div>
        </div>
      </section>

      <section className="logos-section">

        <p className="logos-heading">
          עסקים ומוסדות שבחרו בנקודת מפנה <strong>כדי להוביל</strong>
        </p>

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

      <section className="rec-section">
        <div className="rec-inner">

          <div className="rec-header-col">

            <div className="rec-title-block">
              <div className="rec-title-row1">
                <span className="rec-title-text">מה קורה</span>
                <img src="/Group 161.svg" className="rec-icon" alt="" aria-hidden="true" />
              </div>
              <strong className="rec-title-bold">כשסוגרים</strong>
              <span className="rec-title-line3">את הפער</span>
            </div>

            <div className="rec-nav">
              <button className="rec-nav-btn" aria-label="המלצה קודמת">
                <img src="/Group 57.svg" className="rec-nav-arrow" alt="" />
              </button>
              <button className="rec-nav-btn" aria-label="המלצה הבאה">
                <img src="/Group 58.svg" className="rec-nav-arrow" alt="" />
              </button>
            </div>

          </div>

          <div className="rec-content-col">
            <div className="rec-item"
                 data-video-src=""
                 data-name="ר׳ שמחה וידנבוים"
                 data-desc='אירוע "אזמרגדים"'>

              <div className="rec-video-wrap">
                <div className="rec-video-placeholder">
                  <svg className="rec-play-icon" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="30" cy="30" r="29" stroke="white" strokeOpacity="0.6" strokeWidth="2"></circle>
                    <path d="M24 20L44 30L24 40V20Z" fill="white" fillOpacity="0.8"></path>
                  </svg>
                </div>
              </div>

              <div className="rec-caption-wrap">
                <p className="rec-caption">ר׳ שמחה וידנבוים אירוע ״אזמרגדים״</p>
              </div>

            </div>
          </div>

        </div>
      </section>

      <section className="footer-section">

        <div className="footer-top-badge">
          <svg className="footer-badge-icon" viewBox="0 0 241 263" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="100.5" cy="102.751" r="77.5" fill="white" stroke="#E14E50" strokeWidth="4"></circle>
            <path className="footer-badge-star" d="M65.4396 139.546L75.3339 146.181L98.4879 111.461L123.147 144.856L132.468 137.735L106.555 105.299L146.321 91.9533L142.342 80.7993L103.397 95.2206L103.028 53.49L91.0749 53.8214L93.1621 95.9428L52.8927 82.9894L49.609 94.2979L89.7737 105.628L65.4396 139.546Z" fill="#E14E50"></path>
          </svg>
        </div>

        <div className="footer-inner">

          <div className="footer-content-col">

            <div className="footer-title-block">
              <div className="footer-heading-group">
                <div className="footer-heading-row">
                  <span className="footer-heading-text">השלב הבא שלך</span>
                  <img src="/Group 82.svg" className="footer-heading-icon" alt="" aria-hidden="true" />
                </div>
                <div className="footer-red-block">
                  <span className="footer-red-text">מתחיל כאן.</span>
                </div>
              </div>

              <p className="footer-desc">
                אם העסק שלך בפרשת דרכים והגעת למסקנה<br />
                שהגיע הזמן לנקודת מפנה אמיתית – בוא נדבר.
              </p>
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

              <button type="submit" className="about-cta footer-submit-btn">
                <span className="acirc">
                  <svg viewBox="0 0 32 31" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.9549 2H2.00001V20.9756" stroke="white" strokeWidth="4"></path>
                    <path d="M1.75078 1.77246L30.3279 29.3771" stroke="white" strokeWidth="4"></path>
                  </svg>
                </span>
                <span className="cta-text">שליחה</span>
              </button>

            </form>
          </div>

        </div>
      </section>

      <div className="bottom-bar">
        <div className="bottom-bar-inner">
          <p className="bottom-bar-text">© כל הזכויות שמורות 2026</p>
          <p className="bottom-bar-text">עיצוב: רות בנדיקט | פיתוח: חיה פוגל Csite</p>
        </div>
      </div>
    </>
  );
}

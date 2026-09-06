/*
 * header-scroll.ts
 *
 * Desktop-only state for the shared site header. The nav pill rides along
 * transparently while the sticky <header> scrolls with the page; the moment
 * that header pins to the top of the viewport the pill turns solid and
 * compact again. All the visual rules live in turningpoint.css under
 * `@media (min-width:1025px)` and key off the `is-stuck` class this module
 * toggles on `body > header`.
 *
 * Mobile / tablet (the hamburger menu, <=1024px) is intentionally left alone:
 * `is-stuck` is only ever set while the desktop media query matches, and no
 * mobile rule reads it. This never touches document scroll/overflow or any
 * element outside the header, so cleanup only has to release listeners.
 */
export function initHeaderScroll(): () => void {
  if (typeof window === "undefined") return () => {};

  const header = document.querySelector<HTMLElement>("body > header");
  if (!header) return () => {};

  const desktopMQ = window.matchMedia("(min-width:1025px)");
  let frame = 0;

  const apply = () => {
    frame = 0;
    if (!desktopMQ.matches) {
      header.classList.remove("is-stuck");
      return;
    }
    // The header is `position:sticky; top:0`, so once it sticks its box top
    // clamps to 0. A tiny epsilon absorbs sub-pixel rounding.
    const stuck = header.getBoundingClientRect().top <= 1;
    header.classList.toggle("is-stuck", stuck);
  };

  const schedule = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(apply);
  };

  apply();
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);

  return () => {
    if (frame) window.cancelAnimationFrame(frame);
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    header.classList.remove("is-stuck");
  };
}

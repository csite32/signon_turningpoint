/* Shared public-site navigation helpers.
   Used by the duplicated page chrome (header/mobile-menu) in every public
   page component. No styling, no state — just scroll behaviour. */
import type { MouseEvent } from "react";

/** Smooth-scroll to the shared recommendations section (id="recommendations"). */
export function scrollToRecommendations(e?: MouseEvent) {
  e?.preventDefault();
  document
    .getElementById("recommendations")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Smooth-scroll to the very top of the page (logo click while already on "/"). */
export function scrollToTop(e: MouseEvent) {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

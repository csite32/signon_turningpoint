/*
 * project-detail-effects.ts
 *
 * Ported from the two <script> blocks in prototype/project-maalot.html
 * (hero pin-shrink-on-scroll, and the gallery-2 last-image fullscreen-expand
 * effect). The math/logic is preserved as close to word-for-word as TS
 * syntax allows — this file changes HOW it's wired into the page (a React
 * effect with a real cleanup function), never WHAT it computes.
 *
 * Both effects attach only global window/IntersectionObserver listeners plus
 * mutate a handful of known elements by id — nothing here ever touches
 * document.body's own scroll/overflow (verified against the original: it
 * doesn't either), so there is no body/scroll state to restore on cleanup,
 * only listeners/observers/rAF ids to release.
 */

function attachHeroPinShrink(): () => void {
  const zoneRaw = document.getElementById("pmHeroZone");
  const boxRaw = document.getElementById("pmHeroBox");
  const overlayRaw = document.getElementById("pmHeroOverlay");
  const textRaw = document.getElementById("pmHeroText");
  const stickyRaw = zoneRaw?.querySelector<HTMLElement>(".pm-hero-sticky") ?? null;
  const headerEl = document.querySelector<HTMLElement>("body > header");
  if (!zoneRaw || !boxRaw || !overlayRaw || !textRaw || !stickyRaw) return () => {};
  // The guard above narrows these to non-null in this scope only; TS does not
  // carry that narrowing into the nested helper functions below (they close
  // over the bindings). Re-bind under the original names with an explicit
  // non-null type so every helper type-checks. Purely a typing change — the
  // values, order and behaviour are identical to before.
  const zone: HTMLElement = zoneRaw;
  const box: HTMLElement = boxRaw;
  const overlay: HTMLElement = overlayRaw;
  const text: HTMLElement = textRaw;
  const sticky: HTMLElement = stickyRaw;

  const reduceMotionMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobileMQ = window.matchMedia("(max-width:760px)");
  function isMobile() {
    return mobileMQ.matches;
  }

  // Desktop State B (shrunk, scroll-end) is fixed Figma design units. Mobile
  // gets its own State B in stateB() below.
  const B_DESKTOP = { w: 965.325, h: 575, r: 22 };

  let smoothP = 0;
  let rawP = 0;
  let isActive = false;
  let rafId: number | null = null;
  let pinned: boolean | null = false;
  const EASE = 0.18;

  let mobileTop = 0;
  let mobileOpenH = 0;
  let mobileTrack = 0;
  let mobileStickyH = 0;

  function clamp(v: number, a: number, b: number) {
    return Math.max(a, Math.min(b, v));
  }
  function scale() {
    return Math.min(window.innerWidth, 1920) / 1920;
  }

  function svhPx(): number {
    const probe = document.createElement("div");
    probe.style.cssText =
      "position:fixed; top:-9999px; left:0; height:1svh; width:0; visibility:hidden; pointer-events:none;";
    document.body.appendChild(probe);
    const px = probe.getBoundingClientRect().height;
    document.body.removeChild(probe);
    return px || window.innerHeight / 100;
  }

  function recomputeMobileMetrics() {
    const headerH = headerEl ? headerEl.offsetTop + headerEl.offsetHeight : 0;
    mobileTop = headerH + 10;
    mobileOpenH = clamp(svhPx() * 70, 480, 650);
    mobileTrack = Math.round(window.innerHeight * 0.9);
    const cardH = stateB(scale()).h;
    mobileStickyH = mobileTop + cardH + 44;
  }

  function mobileZoneHeight() {
    return mobileTrack + mobileStickyH;
  }

  function stateA(S: number) {
    if (isMobile()) {
      const marginX = 13;
      return {
        x: marginX,
        y: mobileTop,
        w: window.innerWidth - 2 * marginX,
        h: mobileOpenH,
        r: 43 * S,
      };
    }
    const marginTB = 27 * S;
    const containerInset = zone.getBoundingClientRect().left;
    return {
      x: 13 - containerInset,
      y: marginTB,
      w: window.innerWidth - 33,
      h: window.innerHeight - 2 * marginTB,
      r: 43 * S,
    };
  }

  function stateB(S: number) {
    if (isMobile()) {
      const w = window.innerWidth * 0.88;
      const aspect = B_DESKTOP.h / B_DESKTOP.w;
      return { w, h: w * aspect, r: 22 * S };
    }
    return { w: B_DESKTOP.w * S, h: B_DESKTOP.h * S, r: B_DESKTOP.r * S };
  }

  function apply(p: number) {
    const S = scale();
    const A = stateA(S);
    const Bs = stateB(S);
    const w = A.w + (Bs.w - A.w) * p;
    const h = A.h + (Bs.h - A.h) * p;
    const r = A.r + (Bs.r - A.r) * p;
    const startLeft = A.x;
    const startTop = A.y;
    let endLeft: number;
    let endTop: number;
    if (isMobile()) {
      endLeft = (window.innerWidth - w) / 2;
      endTop = mobileTop;
    } else {
      endLeft = (1920 * S - w) / 2;
      endTop = Math.max(0, (window.innerHeight - h) / 2);
    }
    box.style.width = w + "px";
    box.style.height = h + "px";
    box.style.borderRadius = r + "px";
    box.style.left = startLeft + (endLeft - startLeft) * p + "px";
    box.style.top = startTop + (endTop - startTop) * p + "px";
    const textP = clamp((p - 0.7) / 0.3, 0, 1);
    overlay.style.opacity = String(textP);
    text.style.opacity = String(textP);
  }

  function readRawP(): number {
    const rect = zone.getBoundingClientRect();
    const track = zone.offsetHeight - sticky.offsetHeight;
    if (track <= 0) return 0;
    return clamp(-rect.top / track, 0, 1);
  }

  function loop() {
    rawP = readRawP();
    const diff = rawP - smoothP;
    if (Math.abs(diff) < 0.001) {
      smoothP = rawP;
      apply(smoothP);
      rafId = null;
      return;
    }
    smoothP += diff * EASE;
    apply(smoothP);
    rafId = requestAnimationFrame(loop);
  }

  function scheduleLoop() {
    if (isActive && rafId === null) rafId = requestAnimationFrame(loop);
  }

  function enterStatic() {
    pinned = false;
    sticky.style.position = "relative";
    sticky.style.height = "auto";
    zone.style.height = window.innerHeight + "px";
    box.style.width = "";
    box.style.height = "";
    box.style.borderRadius = "";
    box.style.left = "";
    box.style.top = "";
    overlay.style.opacity = "0";
    text.style.opacity = "0";
  }

  function applyMobilePinnedHeights() {
    zone.style.height = mobileZoneHeight() + "px";
    sticky.style.height = mobileStickyH + "px";
  }

  function enterPinned() {
    pinned = true;
    sticky.style.position = "";
    sticky.style.height = "";
    if (isMobile()) applyMobilePinnedHeights();
    else zone.style.height = "";
    smoothP = rawP = readRawP();
    apply(smoothP);
  }

  function syncMode() {
    if (isMobile()) recomputeMobileMetrics();
    const shouldBeStatic = reduceMotionMQ.matches;
    if (shouldBeStatic && pinned !== false) enterStatic();
    else if (!shouldBeStatic && pinned !== true) enterPinned();
    else if (!shouldBeStatic) {
      if (isMobile()) applyMobilePinnedHeights();
      else zone.style.height = "";
      apply(smoothP);
    } else enterStatic();
  }

  function onWindowScroll() {
    if (pinned) scheduleLoop();
  }

  pinned = null; // force the first syncMode() call to take a branch
  syncMode();

  window.addEventListener("resize", syncMode);
  window.addEventListener("orientationchange", syncMode);
  const observer = new IntersectionObserver(
    (entries) => {
      isActive = entries[0].isIntersecting;
      if (isActive && pinned) scheduleLoop();
    },
    { threshold: 0 },
  );
  observer.observe(zone);
  window.addEventListener("scroll", onWindowScroll, { passive: true });

  return function cleanup() {
    window.removeEventListener("resize", syncMode);
    window.removeEventListener("orientationchange", syncMode);
    window.removeEventListener("scroll", onWindowScroll);
    observer.disconnect();
    if (rafId !== null) cancelAnimationFrame(rafId);
  };
}

function attachGalleryExpand(): () => void {
  const originalBoxRaw = document.getElementById("pmLastImgBox");
  const originalImgRaw = originalBoxRaw?.querySelector<HTMLImageElement>("img") ?? null;
  const trackRaw = document.getElementById("pmExpandTrack");
  const cloneRaw = document.getElementById("pmExpandClone");
  const cloneImgRaw = document.getElementById("pmExpandCloneImg") as HTMLImageElement | null;
  const resultsElRaw = document.getElementById("pmResultsSection");
  if (!originalBoxRaw || !originalImgRaw || !trackRaw || !cloneRaw || !cloneImgRaw || !resultsElRaw)
    return () => {};
  // Same reason as in attachHeroPinShrink: re-bind under the original names
  // with explicit non-null types so the nested helpers type-check. Purely a
  // typing change — values, order and behaviour are identical to before.
  const originalBox: HTMLElement = originalBoxRaw;
  const originalImg: HTMLImageElement = originalImgRaw;
  const track: HTMLElement = trackRaw;
  const clone: HTMLElement = cloneRaw;
  const cloneImg: HTMLImageElement = cloneImgRaw;
  const resultsEl: HTMLElement = resultsElRaw;

  const reduceMotionMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobileMQ = window.matchMedia("(max-width:760px)");

  let rafId: number | null = null;
  let isActive = false;
  let engaged = false;

  let startRadius = 0;
  let targetW = 0;
  let targetH = 0;
  let holdTop = 0;
  let growDistance = 0;
  let holdDistance = 0;
  let sequenceEnd = 0;
  let totalTravel = 0;

  function svhPx(): number {
    const probe = document.createElement("div");
    probe.style.cssText =
      "position:fixed; top:-9999px; left:0; height:1svh; width:0; visibility:hidden; pointer-events:none;";
    document.body.appendChild(probe);
    const px = probe.getBoundingClientRect().height;
    document.body.removeChild(probe);
    return px || window.innerHeight / 100;
  }

  function recomputeMetrics() {
    originalBox.style.visibility = "";
    startRadius = parseFloat(getComputedStyle(originalBox).borderRadius) || 0;

    if (reduceMotionMQ.matches || mobileMQ.matches) {
      track.style.height = "0px";
      sequenceEnd = 0;
      totalTravel = 0;
      update();
      return;
    }

    const availW = window.innerWidth;
    const availH = svhPx() * 100;

    targetW = availW;
    targetH = availH;
    cloneImg.style.objectFit = "cover";
    cloneImg.style.objectPosition = "50% 62%";
    holdTop = (availH - targetH) / 2;

    growDistance = Math.round(window.innerHeight * 0.75);
    holdDistance = Math.round(window.innerHeight * 0.15);
    const exitDistance = Math.max(1, Math.round(holdTop + targetH));
    sequenceEnd = growDistance + holdDistance + exitDistance;

    const gapPx = 60;
    const naturalTotal = sequenceEnd + gapPx;
    track.style.height = "0px";
    const naturalGap =
      resultsEl.getBoundingClientRect().top - originalBox.getBoundingClientRect().top;
    totalTravel = Math.max(naturalTotal, naturalGap);
    track.style.height = Math.max(0, totalTravel - naturalGap) + "px";

    update();
  }

  function applyGrow(rect: DOMRect, growP: number) {
    const w = rect.width + (targetW - rect.width) * growP;
    const h = rect.height + (targetH - rect.height) * growP;
    const r = startRadius * (1 - growP);
    const startCenterX = rect.left + rect.width / 2;
    const endCenterX = targetW / 2;
    const startCenterY = rect.height / 2;
    const endCenterY = holdTop + targetH / 2;
    const cx = startCenterX + (endCenterX - startCenterX) * growP;
    const cy = startCenterY + (endCenterY - startCenterY) * growP;
    clone.style.width = w + "px";
    clone.style.height = h + "px";
    clone.style.left = cx - w / 2 + "px";
    clone.style.top = cy - h / 2 + "px";
    clone.style.borderRadius = r + "px";
  }

  function applyExit(exitPx: number) {
    clone.style.width = targetW + "px";
    clone.style.height = targetH + "px";
    clone.style.left = "0px";
    clone.style.top = holdTop - exitPx + "px";
    clone.style.borderRadius = "0px";
  }

  function activate() {
    if (engaged) return;
    engaged = true;
    originalBox.style.visibility = "hidden";
    clone.style.display = "block";
  }

  function deactivate() {
    if (!engaged) return;
    engaged = false;
    clone.style.display = "none";
    originalBox.style.visibility = "";
  }

  function update() {
    rafId = null;
    if (sequenceEnd <= 0) {
      deactivate();
      return;
    }
    const rect = originalBox.getBoundingClientRect();
    const raw = -rect.top;
    if (raw <= 0 || raw >= sequenceEnd) {
      deactivate();
      return;
    }
    activate();
    if (raw <= growDistance) {
      applyGrow(rect, raw / growDistance);
    } else if (raw <= growDistance + holdDistance) {
      applyGrow(rect, 1);
    } else {
      applyExit(raw - growDistance - holdDistance);
    }
  }

  function scheduleUpdate() {
    if (isActive && rafId === null) rafId = requestAnimationFrame(update);
  }

  function onImageLoad() {
    recomputeMetrics();
  }

  recomputeMetrics();
  if (originalImg.naturalWidth === 0) {
    originalImg.addEventListener("load", onImageLoad, { once: true });
  }

  window.addEventListener("resize", recomputeMetrics);
  window.addEventListener("orientationchange", recomputeMetrics);
  const observer = new IntersectionObserver(
    (entries) => {
      isActive = entries[0].isIntersecting;
      if (isActive) scheduleUpdate();
    },
    { rootMargin: "150% 0px 0px 0px", threshold: 0 },
  );
  observer.observe(track);
  window.addEventListener("scroll", scheduleUpdate, { passive: true });

  return function cleanup() {
    window.removeEventListener("resize", recomputeMetrics);
    window.removeEventListener("orientationchange", recomputeMetrics);
    window.removeEventListener("scroll", scheduleUpdate);
    originalImg.removeEventListener("load", onImageLoad);
    observer.disconnect();
    if (rafId !== null) cancelAnimationFrame(rafId);
    deactivate();
  };
}

/**
 * Attaches both scroll effects and returns a single combined cleanup
 * function. Call from a useEffect keyed on the project's slug in
 * ProjectDetailPage.tsx, AFTER the project's real content (and therefore the
 * real #pmHeroZone/#pmLastImgBox/etc DOM nodes) has rendered:
 *
 *   useEffect(() => {
 *     if (!project) return;
 *     const cleanup = attachProjectDetailEffects();
 *     return cleanup;
 *   }, [project?.id]);
 */
export function attachProjectDetailEffects(): () => void {
  const cleanupHero = attachHeroPinShrink();
  const cleanupExpand = attachGalleryExpand();
  return function cleanup() {
    cleanupHero();
    cleanupExpand();
  };
}

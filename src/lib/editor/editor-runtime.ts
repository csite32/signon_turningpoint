/*
 * editor-runtime.ts
 *
 * Read-only "apply overrides" engine — ported from prototype/assets/editor/editor-runtime.js
 * (the נקודת מפנה local project). This module has NO selection/editing/save capability — it
 * only fetches overrides (Supabase instead of the local project's static JSON files) and
 * applies stored text/style overrides to elements carrying a data-editor-id attribute, per
 * the active responsive tier. It is safe to run in production: it runs everywhere (including
 * for anonymous visitors) but cannot mutate anything itself.
 *
 * The floating editing panel (editor-ui.ts/.css) is a completely separate module, gated
 * behind isEditorEnvironment() + an authenticated admin session — see __root.tsx.
 */
import { getOverrides } from "./overrides-repo";

const DATA_BASE = "/editor-data/";
const MANIFEST_URL = DATA_BASE + "config/elements.json";
const BREAKPOINTS_URL = DATA_BASE + "config/breakpoints.json";

type ElementMeta = {
  scope: "global" | "page";
  region?: string;
  page?: string;
  label?: string;
  enabledControls?: string[];
  textMode?: "plain" | "rich";
  textTarget?: string;
  linkMode?: "anchor" | "button";
  mediaType?: "img" | "icon" | "background" | "mask";
  moveStrategy?: "wrapper" | "disabled";
  excludeReason?: { text?: string };
};

let manifest: Record<string, ElementMeta> = {};
const DEFAULT_BREAKPOINTS = { mobileMax: 760, tabletMax: 1024, laptopMax: 1439 };

/* Route → page key. Ported from PAGE_KEY_BY_FILE in the local project, which matched
   HTML filenames (index_59.html/about.html); adapted here to match TanStack Start's
   real routes since there is no filename to inspect anymore. */
const PAGE_KEY_BY_PATH: Record<string, string> = {
  "/": "index",
  "/about": "about"
};

/* Small, deliberately-limited allowlist sanitizer for the rich-text editor (STRONG/BR/SPAN/P
   only, no attributes except a validated `class` on SPAN). Ported verbatim from
   editor-runtime.js — same "small deliberate duplication" as the local project (also
   duplicated in editor-ui.ts): this copy is the one that matters most, it runs in
   production and is the last gate before stored HTML ever reaches innerHTML on a real page.
   Parses via a detached <template> — its .content is an inert document (no scripts run, no
   images load, no event handlers fire) even while we read/write its DOM. */
const RICH_ALLOWED_TAGS: Record<string, boolean> = { STRONG: true, BR: true, SPAN: true, P: true };
const RICH_ALLOWED_ATTRS: Record<string, string[]> = { SPAN: ["class"] };
const RICH_DROP_ENTIRELY: Record<string, boolean> = { SCRIPT: true, STYLE: true, IFRAME: true, OBJECT: true, EMBED: true, LINK: true, META: true };
const RICH_SAFE_CLASS_RE = /^[a-zA-Z0-9_\- ]*$/;

function sanitizeRichChildren(sourceParent: Node, destParent: Node) {
  const nodes = sourceParent.childNodes;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.nodeType === 3) {
      destParent.appendChild(document.createTextNode(node.nodeValue || ""));
      continue;
    }
    if (node.nodeType !== 1) continue; /* drop comments etc. */
    const el = node as Element;
    const tag = el.tagName;
    if (RICH_DROP_ENTIRELY[tag]) continue; /* drop tag + its whole subtree */
    if (RICH_ALLOWED_TAGS[tag]) {
      const clean = document.createElement(tag.toLowerCase());
      const allowedAttrs = RICH_ALLOWED_ATTRS[tag] || [];
      for (let a = 0; a < allowedAttrs.length; a++) {
        const attrName = allowedAttrs[a];
        if (!el.hasAttribute(attrName)) continue;
        const val = el.getAttribute(attrName) || "";
        if (attrName === "class" && !RICH_SAFE_CLASS_RE.test(val)) continue;
        clean.setAttribute(attrName, val);
      }
      sanitizeRichChildren(el, clean);
      destParent.appendChild(clean);
      continue;
    }
    /* unknown tag (div, b, i, a, img, on*...) — unwrap: keep its sanitized children, drop
       the tag itself. Never echo raw input. */
    sanitizeRichChildren(el, destParent);
  }
}

export function sanitizeRichHtml(rawHtml: unknown): string {
  const template = document.createElement("template");
  template.innerHTML = typeof rawHtml === "string" ? rawHtml : "";
  const out = document.createDocumentFragment();
  sanitizeRichChildren(template.content, out);
  const wrapper = document.createElement("div");
  wrapper.appendChild(out);
  return wrapper.innerHTML;
}

/* ---------- link editing: URL allowlist + apply ---------- */

/* Allowlist, not denylist: anything with an explicit scheme must be one of these four;
   anything scheme-less (relative path, absolute path, anchor, query string) is allowed
   through untouched. */
const LINK_SAFE_SCHEMES: Record<string, boolean> = { "http:": true, "https:": true, "mailto:": true, "tel:": true };

export function isSafeLinkUrl(raw: unknown): boolean {
  if (typeof raw !== "string") return false;
  const trimmed = raw.trim();
  if (trimmed === "") return true; /* empty = explicit "no link" */
  /* Browsers strip whitespace from a URL before resolving its scheme — the classic
     "java\tscript:" bypass relies on exactly this, so the check must mirror it rather
     than trust the literal string. */
  const cleaned = trimmed.replace(/\s+/g, "").toLowerCase();
  const specialIdx = cleaned.search(/[:/?#]/);
  const hasScheme = specialIdx > 0 && cleaned.charAt(specialIdx) === ":";
  if (!hasScheme) return true; /* relative/absolute path, anchor, or query-only */
  const scheme = cleaned.slice(0, specialIdx + 1);
  if (!LINK_SAFE_SCHEMES[scheme]) return false;
  if (scheme === "http:" || scheme === "https:") {
    try {
      new URL(trimmed);
    } catch {
      return false;
    }
  }
  return true;
}

type LinkEntry = { url?: string; target?: string } | undefined;

function applyAnchorLink(el: Element, linkEntry: LinkEntry) {
  if (!linkEntry) return; /* no override — leave the element's original href alone */
  const url = typeof linkEntry.url === "string" ? linkEntry.url.trim() : "";
  if (!url || !isSafeLinkUrl(url)) {
    el.removeAttribute("href");
    el.removeAttribute("target");
    el.removeAttribute("rel");
    return;
  }
  el.setAttribute("href", url);
  if (linkEntry.target === "_blank") {
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener noreferrer");
  } else {
    el.removeAttribute("target");
    el.removeAttribute("rel");
  }
}

/* <button> elements never get their tag swapped to <a> (risks losing a native form-submit
   role or any pre-existing listener) — a click handler is the "structured mechanism" for
   buttons instead. Storing the handler on the element itself lets re-application (resize,
   re-select) replace a stale handler rather than stacking duplicates. */
function applyButtonLink(el: HTMLElement, linkEntry: LinkEntry) {
  const withHandler = el as HTMLElement & { __tpLinkHandler?: (e: Event) => void };
  if (withHandler.__tpLinkHandler) {
    el.removeEventListener("click", withHandler.__tpLinkHandler);
    withHandler.__tpLinkHandler = undefined;
  }
  if (!linkEntry) return;
  const url = typeof linkEntry.url === "string" ? linkEntry.url.trim() : "";
  if (!url || !isSafeLinkUrl(url)) return; /* explicitly removed / invalid — default behavior (e.g. form submit) stays intact */
  const target = linkEntry.target;
  const handler = (e: Event) => {
    e.preventDefault();
    if (target === "_blank") {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = url;
    }
  };
  withHandler.__tpLinkHandler = handler;
  el.addEventListener("click", handler);
}

function applyLink(elementId: string, el: HTMLElement, linkEntry: LinkEntry) {
  const meta = manifest[elementId];
  const mode = meta && meta.linkMode;
  if (mode === "anchor") applyAnchorLink(el, linkEntry);
  else if (mode === "button") applyButtonLink(el, linkEntry);
}

/* ---------- media (images/icons): URL allowlist + apply ---------- */

/* Same allowlist shape as isSafeLinkUrl above, applied to media URLs (img src /
   background-image / mask-image) instead of anchor hrefs. Protocol-relative
   ("//host/...") is rejected here too, since it silently picks whatever scheme the page
   is loaded under. */
function isSafeMediaUrl(raw: unknown): boolean {
  if (typeof raw !== "string") return false;
  const trimmed = raw.trim();
  if (trimmed === "") return true;
  if (trimmed.indexOf("//") === 0) return false;
  const specialIdx = trimmed.search(/[:/?#]/);
  const hasScheme = specialIdx > 0 && trimmed.charAt(specialIdx) === ":";
  if (!hasScheme) return true;
  const scheme = trimmed.slice(0, specialIdx + 1).toLowerCase();
  return scheme === "http:" || scheme === "https:";
}

type MediaEntry = { url?: string; alt?: string } | undefined;

/* mediaType is read from the manifest, same as linkMode above:
   - "img" / "icon": el is an <img> — swap its src (and alt, if the saved entry carries
     one) via real DOM attributes, not a CSS property.
   - "background" / "mask": el's own class declares background-image/mask-image in the
     stylesheet — override it via an inline property + a mirrored --ov-* custom property,
     so the override always wins the cascade and Reset can cleanly remove just this one
     property to reveal the original rule again. */
function applyMedia(elementId: string, el: HTMLElement, mediaEntry: MediaEntry) {
  if (!mediaEntry || typeof mediaEntry.url !== "string" || !mediaEntry.url) return;
  if (!isSafeMediaUrl(mediaEntry.url)) return;
  const meta = manifest[elementId];
  const mediaType = meta && meta.mediaType;
  if (mediaType === "img" || mediaType === "icon") {
    el.setAttribute("src", mediaEntry.url);
    if (typeof mediaEntry.alt === "string") el.setAttribute("alt", mediaEntry.alt);
  } else if (mediaType === "background") {
    const cssUrl = 'url("' + mediaEntry.url.replace(/"/g, '\\"') + '")';
    el.style.setProperty("--ov-background-image", cssUrl);
    el.style.setProperty("background-image", "var(--ov-background-image)");
  } else if (mediaType === "mask") {
    const maskCssUrl = 'url("' + mediaEntry.url.replace(/"/g, '\\"') + '")';
    el.style.setProperty("--ov-mask-image", maskCssUrl);
    el.style.setProperty("mask-image", "var(--ov-mask-image)");
    el.style.setProperty("-webkit-mask-image", "var(--ov-mask-image)");
  }
}

/* Every property key that might appear under a tier entry, mapped to its real CSS property
   name. Kept in sync with editor-ui.ts's STYLE_PROPS registry by hand (small, deliberately
   duplicated rather than shared — same pattern as the local project). */
const CSS_PROP_MAP: Record<string, string> = {
  fontSize: "font-size",
  color: "color",
  backgroundColor: "background-color",
  borderRadius: "border-radius",
  fontWeight: "font-weight",
  lineHeight: "line-height",
  letterSpacing: "letter-spacing",
  textAlign: "text-align",
  margin: "margin",
  padding: "padding",
  width: "width",
  maxWidth: "max-width",
  gap: "gap"
};

/* Move/Scale — only elements whose manifest entry lists these in enabledControls actually
   have a data-editor-move-wrap element in the markup. Unlike every other tier property,
   these three don't map to independent CSS properties — they compose into a single
   `transform` on the WRAPPER, never on the tagged element itself, so they can never
   collide with that element's own CSS animations/hover transforms. */
const MOVE_PROP_KEYS: Record<string, boolean> = { translateX: true, translateY: true, scale: true };

function findMoveWrapper(elementId: string): HTMLElement | null {
  return document.querySelector('[data-editor-move-wrap="' + cssEscape(elementId) + '"]');
}

function applyMoveScale(wrapper: HTMLElement, tierValues: Record<string, string> | undefined) {
  const tx = (tierValues && tierValues.translateX) || "0px";
  const ty = (tierValues && tierValues.translateY) || "0px";
  const sc = (tierValues && tierValues.scale) || "1";
  wrapper.style.setProperty("--ov-translate-x", tx);
  wrapper.style.setProperty("--ov-translate-y", ty);
  wrapper.style.setProperty("--ov-scale", sc);
  if (tx === "0px" && ty === "0px" && sc === "1") {
    wrapper.style.removeProperty("transform");
  } else {
    wrapper.style.setProperty("transform", "translate(var(--ov-translate-x), var(--ov-translate-y)) scale(var(--ov-scale))");
  }
}

function currentPageKey(): string | null {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (Object.prototype.hasOwnProperty.call(PAGE_KEY_BY_PATH, path)) {
    return PAGE_KEY_BY_PATH[path];
  }
  return null;
}

function tierFromWidth(width: number, breakpoints: typeof DEFAULT_BREAKPOINTS): "mobile" | "tablet" | "laptop" | "desktop" {
  if (width <= breakpoints.mobileMax) return "mobile";
  if (width <= breakpoints.tabletMax) return "tablet";
  if (width <= breakpoints.laptopMax) return "laptop";
  return "desktop";
}

function cssEscape(value: string): string {
  if (window.CSS && typeof CSS.escape === "function") return CSS.escape(value);
  return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

function fetchJson(url: string): Promise<any> {
  return fetch(url, { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : {}))
    .catch(() => ({}));
}

type OverrideEntry = {
  text?: string;
  richText?: string;
  link?: LinkEntry;
  media?: MediaEntry;
  desktop?: Record<string, string>;
  laptop?: Record<string, string>;
  tablet?: Record<string, string>;
  mobile?: Record<string, string>;
};

function applyEntry(elementId: string, entry: OverrideEntry | undefined, tier: string) {
  if (!entry) return;
  const el = document.querySelector<HTMLElement>('[data-editor-id="' + cssEscape(elementId) + '"]');
  if (!el) return; /* markup for this id isn't on the current page — no-op, never an error */

  if (typeof entry.richText === "string") {
    /* sanitize again here, even though editor-ui.ts already sanitized before save — this
       is the actual production gate a hand-edited or otherwise-untrusted override row has
       to pass through. A few elements (icon-bearing CTA buttons) scope this to a
       text-only child via textTarget, so the icon sibling is never touched. */
    const meta = manifest[elementId];
    let target: HTMLElement = el;
    if (meta && meta.textTarget) {
      const sub = el.querySelector<HTMLElement>(meta.textTarget);
      if (sub) target = sub;
    }
    target.innerHTML = sanitizeRichHtml(entry.richText);
  } else if (typeof entry.text === "string") {
    el.textContent = entry.text;
    /* preserves user-entered line breaks without switching to innerHTML — textContent
       stays injection-safe, pre-line just stops the browser from collapsing \n the way
       it collapses plain whitespace. */
    el.style.setProperty("white-space", "pre-line");
  }

  const tierValues = (entry as any)[tier] as Record<string, string> | undefined;
  if (tierValues) {
    Object.keys(tierValues).forEach((propKey) => {
      if (MOVE_PROP_KEYS[propKey]) return; /* handled separately below */
      const cssProp = CSS_PROP_MAP[propKey];
      const value = tierValues[propKey];
      if (!cssProp || !value) return;
      el.style.setProperty("--ov-" + cssProp, value);
      el.style.setProperty(cssProp, "var(--ov-" + cssProp + ")");
      /* text-align has no visible effect on a flex item that shrink-wraps its own
         content, so give it room by stretching to the flex parent's cross axis. */
      if (cssProp === "text-align") {
        el.style.setProperty("align-self", "stretch");
      }
    });
    if (tierValues.translateX || tierValues.translateY || tierValues.scale) {
      const wrapper = findMoveWrapper(elementId);
      if (wrapper) applyMoveScale(wrapper, tierValues);
    }
  }

  if (entry.link) applyLink(elementId, el, entry.link);
  if (entry.media) applyMedia(elementId, el, entry.media);
}

function applyStore(store: Record<string, OverrideEntry>, tier: string) {
  Object.keys(store || {}).forEach((elementId) => {
    applyEntry(elementId, store[elementId], tier);
  });
}

export type OriginalStashEntry = {
  html: string;
  hasHref: boolean;
  href: string;
  hasTarget: boolean;
  target: string;
  hasSrc: boolean;
  src: string;
  hasAlt: boolean;
  alt: string;
};

/* In-memory, not DOM attributes: writing data-editor-original-* attributes directly onto
   server-rendered elements caused a React hydration-mismatch warning on this project's
   Suspense-streamed sections. Keeping this entirely in JS memory, keyed by the stable
   data-editor-id (itself real server-rendered JSX output, never a source of mismatch),
   sidesteps the problem instead of racing to time it — the DOM is never touched here. */
const originalStash: Record<string, OriginalStashEntry> = {};

export function getOriginalStash(elementId: string): OriginalStashEntry | undefined {
  return originalStash[elementId];
}

function stashOriginalText() {
  const els = document.querySelectorAll<HTMLElement>("[data-editor-id]");
  for (let i = 0; i < els.length; i++) {
    const el = els[i];
    const id = el.getAttribute("data-editor-id");
    if (!id || originalStash[id] !== undefined) continue;
    originalStash[id] = {
      html: el.innerHTML,
      hasHref: el.hasAttribute("href"),
      href: el.getAttribute("href") || "",
      hasTarget: el.hasAttribute("target"),
      target: el.getAttribute("target") || "",
      hasSrc: el.hasAttribute("src"),
      src: el.getAttribute("src") || "",
      hasAlt: el.hasAttribute("alt"),
      alt: el.getAttribute("alt") || "",
    };
  }
}

/* Fetches every override row relevant to the current page (all global-scope rows +
   page-scope rows for this page) in a single Supabase query, and reshapes them into the
   {elementId: entry} store applyStore expects — the local project's equivalent did this
   with one HTTP fetch per global region (header/footer/logos/rec) + one for the page,
   since each was a separate static JSON file; a single filtered query replaces all of
   that here, same end result. */
async function loadOverridesStore(pageKey: string | null): Promise<Record<string, OverrideEntry>> {
  const rows = await getOverrides("page", pageKey || "");
  const store: Record<string, OverrideEntry> = {};
  rows.forEach((row: any) => {
    store[row.element_id] = row.data as OverrideEntry;
  });
  return store;
}

let breakpointsCache: typeof DEFAULT_BREAKPOINTS | null = null;
let configLoaded: Promise<void> | null = null;

function ensureConfigLoaded(): Promise<void> {
  if (!configLoaded) {
    configLoaded = Promise.all([fetchJson(BREAKPOINTS_URL), fetchJson(MANIFEST_URL)]).then(([breakpointsRes, manifestRes]) => {
      breakpointsCache = breakpointsRes && breakpointsRes.mobileMax ? breakpointsRes : DEFAULT_BREAKPOINTS;
      manifest = manifestRes || {};
    });
  }
  return configLoaded;
}

let lastTier: string | null = null;

/* Re-scans the DOM for the CURRENT page (stashes any newly-appeared tagged elements —
   stashOriginalText is already idempotent per-element — and (re-)applies overrides for
   them). Safe to call repeatedly. Needed after every client-side TanStack Router
   navigation: SPA route changes swap page content without a full reload, so a one-time
   boot() would otherwise never see elements that only exist on a page navigated to
   later (e.g. the footer doesn't exist on /admin, only on /). */
export function rescanEditorRuntime(): void {
  if (typeof window === "undefined") return;
  ensureConfigLoaded().then(() => {
    const bp = breakpointsCache || DEFAULT_BREAKPOINTS;
    stashOriginalText();
    const pageKey = currentPageKey();
    const tier = tierFromWidth(window.innerWidth, bp);
    lastTier = tier;
    loadOverridesStore(pageKey).then((store) => {
      applyStore(store, tier);
      window.dispatchEvent(new CustomEvent("tp-overrides-applied"));
    });
  });
}

let resizeListenerAttached = false;

/* Sets up the resize-driven re-apply (once). Actual stash+apply work now happens via
   rescanEditorRuntime(), called once on mount and again on every route change from
   __root.tsx — this function no longer does that work itself. */
export function initEditorRuntime(): void {
  if (resizeListenerAttached) return;
  resizeListenerAttached = true;
  if (typeof window === "undefined") return;
  window.addEventListener("resize", () => {
    const bp = breakpointsCache || DEFAULT_BREAKPOINTS;
    const tier = tierFromWidth(window.innerWidth, bp);
    if (tier !== lastTier) {
      rescanEditorRuntime();
    }
  });
}

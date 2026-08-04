/*
 * editor-ui.ts — ADMIN ONLY.
 *
 * The floating editing panel — ported from prototype/assets/editor/editor-ui.js (the
 * נקודת מפנה local project): element-selection mode, a generic set of text/style
 * controls, Save/Undo/Reset, rich text, link editing, media editing. This module is only
 * ever initialized when BOTH isEditorEnvironment() and an authenticated admin session are
 * true — see EditorPanel.tsx / __root.tsx. It talks to overrides-repo.ts / media-provider.ts
 * (Supabase), which are the only place editor_overrides rows get written.
 *
 * NOT ported in this pass: the local project's device-width preview iframe
 * (setDevicePreview/buildPreviewOverlay/onPreviewFrameLoad/rebindSelectionToElement).
 * That subsystem simulates a Desktop/Laptop/Tablet/Mobile viewport inside a nested
 * iframe — given Lovable's own Preview already runs our app inside an iframe, nesting a
 * second iframe was flagged as a likely source of new rendering bugs and deferred as a
 * separate, explicitly-approved follow-up rather than ported blind. The tier dropdown
 * itself (which breakpoint's values you're editing) is NOT affected by that omission —
 * it's fully intact below, only the visual "show me what that width actually looks like"
 * simulation is missing for now.
 */
import { sanitizeRichHtml, isSafeLinkUrl, getOriginalStash } from "./editor-runtime";
import { getOverrides, upsertOverride, resetOverride, resetOverrideForPage } from "./overrides-repo";
import { uploadEditorMedia } from "./media-provider";
import { disableEditMode } from "./edit-mode";

const MANIFEST_URL = "/editor-data/config/elements.json";
const BREAKPOINTS_URL = "/editor-data/config/breakpoints.json";
const MAX_UNDO = 20;

/* Device-width preview: a single fixed-pixel-width iframe re-loads the current route at
   the target breakpoint's width, so the site's own @media queries evaluate for real. */
const DEVICE_WIDTHS: Record<string, number> = { desktop: 1600, laptop: 1200, tablet: 900, mobile: 390 };
let activeDoc: Document = document;
let previewMode: string = "normal";
let previewOverlay: HTMLDivElement | null = null;
let previewFrame: HTMLIFrameElement | null = null;

/* Route → page key — duplicated from editor-runtime.ts's PAGE_KEY_BY_PATH, same
   deliberate small-duplication pattern as the local project (editor-ui.js/editor-runtime.js
   each had their own copy of this and of the sanitizer/link-allowlist). */
const PAGE_KEY_BY_PATH: Record<string, string> = {
  "/": "index",
  "/about": "about"
};

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

type StylePropSpec = {
  cssProp?: string;
  cssVar?: string;
  moveProp?: boolean;
  label: string;
  inputType: "number" | "color" | "text" | "select";
  unit?: string;
  step?: string;
  placeholder?: string;
  includeEmpty?: boolean;
  options?: [string, string][];
};

/* Every style property the panel can expose. `cssProp` is also the suffix of the custom
   property the value is mirrored into (--ov-<cssProp>). Which of these actually shows up
   for a given element is controlled entirely by that element's enabledControls in
   elements.json — this registry just says HOW to render/apply/parse each one generically,
   not WHERE it's allowed. Ported verbatim from editor-ui.js's STYLE_PROPS. */
const STYLE_PROPS: Record<string, StylePropSpec> = {
  fontSize: { cssProp: "font-size", label: "גודל פונט (px)", inputType: "number", unit: "px", placeholder: "ברירת מחדל מהעיצוב המקורי" },
  color: { cssProp: "color", label: "צבע טקסט", inputType: "color" },
  backgroundColor: { cssProp: "background-color", label: "צבע רקע", inputType: "color" },
  borderRadius: { cssProp: "border-radius", label: "עיגול פינות — Radius (למשל: 20px)", inputType: "text", placeholder: "ברירת מחדל מהעיצוב" },
  fontWeight: {
    cssProp: "font-weight",
    label: "משקל פונט",
    inputType: "select",
    includeEmpty: true,
    options: [
      ["300", "300 — דק"],
      ["400", "400 — רגיל"],
      ["500", "500 — בינוני"],
      ["600", "600 — מודגש למחצה"],
      ["700", "700 — מודגש"],
      ["800", "800 — מודגש מאוד"]
    ]
  },
  lineHeight: { cssProp: "line-height", label: "גובה שורה", inputType: "number", step: "0.05", placeholder: "ברירת מחדל" },
  letterSpacing: { cssProp: "letter-spacing", label: "ריווח אותיות (px)", inputType: "number", unit: "px", placeholder: "ברירת מחדל" },
  textAlign: {
    cssProp: "text-align",
    label: "יישור",
    inputType: "select",
    includeEmpty: true,
    /* physical values (right/left), not logical (start/end) — the site is permanently
       dir="rtl" and never flips. */
    options: [
      ["right", "ימין"],
      ["center", "מרכז"],
      ["left", "שמאל"]
    ]
  },
  margin: { cssProp: "margin", label: "מרווח חיצוני — Margin (למשל: 10px 20px)", inputType: "text", placeholder: "ברירת מחדל מהעיצוב" },
  padding: { cssProp: "padding", label: "ריווח פנימי — Padding (למשל: 10px 20px)", inputType: "text", placeholder: "ברירת מחדל מהעיצוב" },
  width: { cssProp: "width", label: "רוחב (px או %)", inputType: "text", placeholder: "ברירת מחדל מהעיצוב" },
  maxWidth: { cssProp: "max-width", label: "רוחב מקסימלי (px או %)", inputType: "text", placeholder: "ללא הגבלה" },
  gap: { cssProp: "gap", label: "רווח בין פריטים — Gap (px)", inputType: "text", placeholder: "ברירת מחדל מהעיצוב" },
  /* Move/Scale. moveProp:true routes these through applyMoveProp/wrapper handling
     everywhere below instead of applyPropToElement, since all three compose into one
     `transform` on the WRAPPER rather than each owning an independent CSS property. */
  translateX: { moveProp: true, cssVar: "--ov-translate-x", label: "הזזה אופקית — X (px)", inputType: "number", unit: "px", placeholder: "0" },
  translateY: { moveProp: true, cssVar: "--ov-translate-y", label: "הזזה אנכית — Y (px)", inputType: "number", unit: "px", placeholder: "0" },
  scale: { moveProp: true, cssVar: "--ov-scale", label: "הגדלה/הקטנה — Scale", inputType: "number", step: "0.05", placeholder: "1" }
};

/* <b>/<i> are what document.execCommand('bold') actually produces in some browsers; our
   allowlist only ever stores <strong>, so normalize right after every toolbar
   action/keystroke — keeps the sanitizer's allowlist small instead of growing it to match
   execCommand's output. */
function normalizeBoldTags(container: HTMLElement) {
  const bTags = container.querySelectorAll("b");
  for (let i = 0; i < bTags.length; i++) {
    const b = bTags[i];
    const strong = document.createElement("strong");
    while (b.firstChild) strong.appendChild(b.firstChild);
    b.parentNode?.replaceChild(strong, b);
  }
}

function applyAnchorLink(el: HTMLElement, linkEntry: { url?: string; target?: string } | null | undefined) {
  if (!linkEntry) return;
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

/* Dev-panel preview only — clicking a selected element while editing should never
   actually navigate away from the page being edited, so this mirrors applyButtonLink's
   href handling but never attaches a real click-navigation handler. */
function applyButtonLinkPreview(el: HTMLElement, linkEntry: { url?: string; target?: string } | null | undefined) {
  if (linkEntry && typeof linkEntry.url === "string" && linkEntry.url.trim() && isSafeLinkUrl(linkEntry.url.trim())) {
    el.dataset.tpPreviewLink = linkEntry.url.trim() + "|" + (linkEntry.target === "_blank" ? "_blank" : "_self");
  } else {
    delete el.dataset.tpPreviewLink;
  }
}

function applyLinkPreview(elementId: string, el: HTMLElement, linkEntry: { url?: string; target?: string } | null | undefined) {
  const meta = manifest[elementId];
  const mode = meta && meta.linkMode;
  if (mode === "anchor") applyAnchorLink(el, linkEntry);
  else if (mode === "button") applyButtonLinkPreview(el, linkEntry);
}

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

function mediaTypeFor(elementId: string) {
  const meta = manifest[elementId];
  return meta ? meta.mediaType : undefined;
}

/* Reads whatever background-image the element's OWN class currently declares (via the
   cascade, computed style) — used only the very first time an element is selected with
   no draft/saved override yet, so the preview starts out showing the true original
   image, not a blank box. */
function extractBackgroundUrl(el: HTMLElement): string {
  const bg = getComputedStyle(el).backgroundImage;
  const m = bg && bg.match(/url\((['"]?)(.*?)\1\)/);
  return m ? m[2] : "";
}

function extractMaskUrl(el: HTMLElement): string {
  const cs = getComputedStyle(el);
  const mask = cs.maskImage || (cs as any).webkitMaskImage || "";
  const m = mask && mask.match(/url\((['"]?)(.*?)\1\)/);
  return m ? m[2] : "";
}

type MediaEntry = { url?: string; alt?: string };

/* draft (this session, unsaved) > saved-on-disk > whatever the live DOM currently shows */
function getEffectiveMedia(elementId: string, el: HTMLElement): MediaEntry {
  const draft = draftByElement[elementId];
  if (draft && draft.media !== undefined) return draft.media;
  const saved = savedCache[elementId];
  if (saved && saved.media) return saved.media;
  const mediaType = mediaTypeFor(elementId);
  if (mediaType === "img" || mediaType === "icon") {
    return { url: el.getAttribute("src") || "", alt: el.getAttribute("alt") || "" };
  }
  if (mediaType === "background") {
    return { url: extractBackgroundUrl(el) };
  }
  if (mediaType === "mask") {
    return { url: extractMaskUrl(el) };
  }
  return { url: "" };
}

/* Live-preview counterpart to editor-runtime.ts's applyMedia — same branch-by-mediaType
   logic, but this copy runs on every keystroke/file pick, not just once on page load. */
function applyMediaToElement(elementId: string, el: HTMLElement, mediaEntry: MediaEntry | undefined) {
  const mediaType = mediaTypeFor(elementId);
  if (!mediaType || !mediaEntry) return;
  if (mediaType === "img" || mediaType === "icon") {
    if (typeof mediaEntry.url === "string" && mediaEntry.url && isSafeMediaUrl(mediaEntry.url)) {
      el.setAttribute("src", mediaEntry.url);
    }
    if (typeof mediaEntry.alt === "string") el.setAttribute("alt", mediaEntry.alt);
  } else if (mediaType === "background") {
    if (typeof mediaEntry.url === "string" && mediaEntry.url && isSafeMediaUrl(mediaEntry.url)) {
      const cssUrl = 'url("' + mediaEntry.url.replace(/"/g, '\\"') + '")';
      el.style.setProperty("--ov-background-image", cssUrl);
      el.style.setProperty("background-image", "var(--ov-background-image)");
    }
  } else if (mediaType === "mask") {
    if (typeof mediaEntry.url === "string" && mediaEntry.url && isSafeMediaUrl(mediaEntry.url)) {
      const maskCssUrl = 'url("' + mediaEntry.url.replace(/"/g, '\\"') + '")';
      el.style.setProperty("--ov-mask-image", maskCssUrl);
      el.style.setProperty("mask-image", "var(--ov-mask-image)");
      el.style.setProperty("-webkit-mask-image", "var(--ov-mask-image)");
    }
  }
}

function populateMediaFields(elementId: string, el: HTMLElement) {
  const mediaType = mediaTypeFor(elementId);
  if (!mediaType) return;
  const media = getEffectiveMedia(elementId, el);
  if (els.mediaPreview.dataset.blobUrl) {
    URL.revokeObjectURL(els.mediaPreview.dataset.blobUrl);
    delete els.mediaPreview.dataset.blobUrl;
  }
  (els.mediaPreview as HTMLImageElement).src = media.url || "";
  els.mediaPreview.classList.toggle("tp-hidden", !media.url);
  const showAlt = mediaType === "img" || mediaType === "icon";
  els.mediaAltField.classList.toggle("tp-hidden", !showAlt);
  if (showAlt) (els.mediaAlt as HTMLInputElement).value = media.alt || "";
  els.mediaError.classList.add("tp-hidden");
}

type OverrideEntry = {
  text?: string;
  richText?: string;
  link?: { url?: string; target?: string };
  media?: MediaEntry;
  desktop?: Record<string, string>;
  laptop?: Record<string, string>;
  tablet?: Record<string, string>;
  mobile?: Record<string, string>;
};

type DraftEntry = {
  text?: string;
  richText?: string;
  link?: { url?: string; target?: string };
  media?: MediaEntry;
  tiers?: Record<string, Record<string, string | null>>;
};

type UndoEntry = {
  elementId: string;
  property: string;
  tier: string | null;
  previousValue: string;
};

let manifest: Record<string, ElementMeta> = {};
let breakpoints = { mobileMax: 760, tabletMax: 1024, laptopMax: 1439 };
let undoStack: UndoEntry[] = [];
let selectModeActive = false;
let selected: { id: string; el: HTMLElement } | null = null;
let activeEditSession: { elementId: string; property: string } | null = null;
const draftByElement: Record<string, DraftEntry> = {};
const savedCache: Record<string, OverrideEntry | null> = {};

type PanelEls = {
  root: HTMLElement;
  toggle: HTMLButtonElement;
  panel: HTMLElement;
  selectBtn: HTMLButtonElement;
  empty: HTMLElement;
  form: HTMLElement;
  label: HTMLElement;
  text: HTMLTextAreaElement;
  textField: HTMLElement;
  richField: HTMLElement;
  richEditor: HTMLElement;
  richBoldBtn: HTMLButtonElement;
  richClearBtn: HTMLButtonElement;
  textDisabledNote: HTMLElement;
  linkField: HTMLElement;
  linkUrl: HTMLInputElement;
  linkTarget: HTMLSelectElement;
  linkError: HTMLElement;
  mediaField: HTMLElement;
  mediaPreview: HTMLImageElement;
  mediaFile: HTMLInputElement;
  mediaAltField: HTMLElement;
  mediaAlt: HTMLInputElement;
  mediaError: HTMLElement;
  tier: HTMLSelectElement;
  controls: HTMLElement;
  dynamicFields: Record<string, HTMLInputElement | HTMLSelectElement>;
  status: HTMLElement;
  saveBtn: HTMLButtonElement;
  undoBtn: HTMLButtonElement;
  resetElBtn: HTMLButtonElement;
  resetPageBtn: HTMLButtonElement;
  exitBtn: HTMLButtonElement;
};

let els: PanelEls;

/* ---------- small helpers ---------- */

function currentPageKey(): string | null {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (Object.prototype.hasOwnProperty.call(PAGE_KEY_BY_PATH, path)) {
    return PAGE_KEY_BY_PATH[path];
  }
  return null;
}

function tierFromWidth(width: number): "mobile" | "tablet" | "laptop" | "desktop" {
  if (width <= breakpoints.mobileMax) return "mobile";
  if (width <= breakpoints.tabletMax) return "tablet";
  if (width <= breakpoints.laptopMax) return "laptop";
  return "desktop";
}

function cssEscape(value: string): string {
  if (window.CSS && typeof CSS.escape === "function") return CSS.escape(value);
  return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

function rgbToHex(rgbStr: string | null | undefined): string {
  const m = rgbStr && rgbStr.match(/\d+/g);
  if (!m || m.length < 3) return "#000000";
  return (
    "#" +
    m
      .slice(0, 3)
      .map((n) => ("0" + parseInt(n, 10).toString(16)).slice(-2))
      .join("")
  );
}

function fetchJson(url: string): Promise<any> {
  return fetch(url, { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : {}))
    .catch(() => ({}));
}

function findById(elementId: string): HTMLElement | null {
  return activeDoc.querySelector('[data-editor-id="' + cssEscape(elementId) + '"]');
}

function scopePayload(elementId: string): { scope: "global"; region?: string } | { scope: "page"; page?: string } | null {
  const meta = manifest[elementId];
  if (!meta) return null;
  if (meta.scope === "global") return { scope: "global", region: meta.region };
  return { scope: "page", page: meta.page };
}

async function ensureSavedLoaded(elementId: string): Promise<OverrideEntry | null> {
  if (savedCache[elementId]) return savedCache[elementId];
  const meta = manifest[elementId];
  if (!meta) return null;
  const scopeKey = meta.scope === "global" ? meta.region || "" : meta.page || "";
  const rows = await getOverrides(meta.scope, scopeKey);
  const row = rows.find((r: any) => r.element_id === elementId);
  const entry = (row ? row.data : {}) as OverrideEntry;
  savedCache[elementId] = entry;
  return entry;
}

function enabledPropsFor(elementId: string): string[] {
  const meta = manifest[elementId];
  return (meta && meta.enabledControls) || [];
}

/* draft (this session, unsaved) > saved-on-disk > no override */
function getDisplayValue(elementId: string, tier: string, propKey: string): string | null {
  const draft = draftByElement[elementId];
  if (draft && draft.tiers && draft.tiers[tier] && draft.tiers[tier][propKey] !== undefined) {
    return draft.tiers[tier][propKey]; // may be null = explicitly cleared this session
  }
  const saved = savedCache[elementId];
  const savedTier = saved && (saved as any)[tier];
  if (savedTier && savedTier[propKey]) {
    return savedTier[propKey];
  }
  return null;
}

/* Move/Scale: the wrapper is the tagged element's own parent by construction —
   .closest() finds it correctly. */
function moveWrapperEl(elementId: string, el: HTMLElement): HTMLElement | null {
  return el.closest('[data-editor-move-wrap="' + cssEscape(elementId) + '"]');
}

function recomputeTransform(wrapper: HTMLElement) {
  const tx = wrapper.style.getPropertyValue("--ov-translate-x") || "0px";
  const ty = wrapper.style.getPropertyValue("--ov-translate-y") || "0px";
  const sc = wrapper.style.getPropertyValue("--ov-scale") || "1";
  if (tx === "0px" && ty === "0px" && sc === "1") {
    wrapper.style.removeProperty("transform");
  } else {
    wrapper.style.setProperty("transform", "translate(" + tx + ", " + ty + ") scale(" + sc + ")");
  }
}

function applyMoveProp(wrapper: HTMLElement, spec: StylePropSpec, value: string | null) {
  if (value) {
    wrapper.style.setProperty(spec.cssVar!, value);
  } else {
    wrapper.style.removeProperty(spec.cssVar!);
  }
  recomputeTransform(wrapper);
}

function resetMoveProps(wrapper: HTMLElement) {
  wrapper.style.removeProperty("--ov-translate-x");
  wrapper.style.removeProperty("--ov-translate-y");
  wrapper.style.removeProperty("--ov-scale");
  wrapper.style.removeProperty("transform");
}

function applyPropToElement(el: HTMLElement, spec: StylePropSpec, value: string | null) {
  const ovVar = "--ov-" + spec.cssProp;
  if (value) {
    el.style.setProperty(ovVar, value);
    el.style.setProperty(spec.cssProp!, "var(" + ovVar + ")");
    /* text-align is invisible on a box that shrink-wraps its own content — align-self:
       stretch gives it the full cross-axis width of its flex parent so the control
       actually does something; it's a no-op outside a flex/grid context. */
    if (spec.cssProp === "text-align") {
      el.style.setProperty("align-self", "stretch");
    }
  } else {
    el.style.removeProperty(spec.cssProp!);
    el.style.removeProperty(ovVar);
    if (spec.cssProp === "text-align") {
      el.style.removeProperty("align-self");
    }
  }
}

function formatFieldValue(spec: StylePropSpec, raw: string): string | null {
  if (raw === "" || raw === null || raw === undefined) return null;
  return spec.unit ? raw + spec.unit : raw;
}

function fieldDisplayValue(spec: StylePropSpec, stored: string | null, el: HTMLElement | null): string | number {
  if (stored) {
    if (spec.inputType === "number") {
      const n = parseFloat(stored);
      return isNaN(n) ? "" : n;
    }
    return stored;
  }
  if (spec.inputType === "color" && el) {
    return rgbToHex(getComputedStyle(el).color);
  }
  return "";
}

function setButtonLoading(btn: HTMLButtonElement, loadingText: string) {
  if (btn.dataset.originalText === undefined) btn.dataset.originalText = btn.textContent || "";
  btn.disabled = true;
  btn.textContent = loadingText;
}

function clearButtonLoading(btn: HTMLButtonElement) {
  btn.disabled = false;
  if (btn.dataset.originalText !== undefined) btn.textContent = btn.dataset.originalText;
}

/* ---------- undo history (session-only, up to 20 steps, in-memory) ---------- */

function pushUndo(entry: UndoEntry) {
  undoStack.push(entry);
  if (undoStack.length > MAX_UNDO) undoStack.shift();
}

function beginEditSession(propertyKey: string) {
  if (!selected) return;
  if (activeEditSession && activeEditSession.elementId === selected.id && activeEditSession.property === propertyKey) {
    return; /* session for this exact field is already open */
  }
  let previousValue: string;
  if (propertyKey === "text") {
    previousValue = textModeFor(selected.id) === "rich" ? richTextTargetEl(selected.id, selected.el).innerHTML : selected.el.textContent || "";
  } else if (propertyKey === "link") {
    previousValue = JSON.stringify(getEffectiveLink(selected.id, selected.el));
  } else if (propertyKey === "media") {
    previousValue = JSON.stringify(getEffectiveMedia(selected.id, selected.el));
  } else {
    const spec = STYLE_PROPS[propertyKey];
    if (spec && spec.moveProp) {
      const wrapper = moveWrapperEl(selected.id, selected.el);
      previousValue = wrapper ? wrapper.style.getPropertyValue(spec.cssVar!) || "" : "";
    } else {
      previousValue = spec ? selected.el.style.getPropertyValue("--ov-" + spec.cssProp) || "" : "";
    }
  }
  pushUndo({
    elementId: selected.id,
    property: propertyKey,
    tier: propertyKey === "text" || propertyKey === "link" || propertyKey === "media" ? null : els.tier.value,
    previousValue: previousValue
  });
  activeEditSession = { elementId: selected.id, property: propertyKey };
}

function endEditSession() {
  activeEditSession = null;
}

function onUndo() {
  const entry = undoStack.pop();
  if (!entry) {
    setStatus("אין פעולות לביטול");
    return;
  }
  const el = findById(entry.elementId);
  if (!el) {
    setStatus("האלמנט של הפעולה הזו לא נמצא בעמוד הנוכחי");
    return;
  }
  const draft = (draftByElement[entry.elementId] = draftByElement[entry.elementId] || {});
  let propLabel = entry.property;
  if (entry.property === "text") {
    if (textModeFor(entry.elementId) === "rich") {
      const restoredHtml = sanitizeRichHtml(entry.previousValue);
      richTextTargetEl(entry.elementId, el).innerHTML = restoredHtml;
      draft.richText = restoredHtml;
    } else {
      el.textContent = entry.previousValue;
      el.style.setProperty("white-space", "pre-line");
      draft.text = entry.previousValue;
    }
    propLabel = "טקסט";
  } else if (entry.property === "link") {
    const restoredLink = JSON.parse(entry.previousValue);
    draft.link = restoredLink;
    applyLinkPreview(entry.elementId, el, restoredLink);
    propLabel = "קישור";
  } else if (entry.property === "media") {
    const restoredMedia = JSON.parse(entry.previousValue);
    draft.media = restoredMedia;
    applyMediaToElement(entry.elementId, el, restoredMedia);
    propLabel = "מדיה";
  } else {
    const spec = STYLE_PROPS[entry.property];
    if (spec) {
      draft.tiers = draft.tiers || {};
      draft.tiers[entry.tier!] = draft.tiers[entry.tier!] || {};
      draft.tiers[entry.tier!][entry.property] = entry.previousValue || null;
      if (spec.moveProp) {
        const wrapper = moveWrapperEl(entry.elementId, el);
        if (wrapper) applyMoveProp(wrapper, spec, entry.previousValue);
      } else {
        applyPropToElement(el, spec, entry.previousValue);
      }
      propLabel = spec.label;
    }
  }
  activeEditSession = null;
  if (selected && selected.id === entry.elementId) {
    if (entry.property !== "text" && entry.tier) {
      els.tier.value = entry.tier;
    }
    syncFieldsFromDom();
  } else if (activateSelection(entry.elementId, el, entry.tier || undefined)) {
    ensureSavedLoaded(entry.elementId);
    syncFieldsFromDom();
  }
  setStatus("בוטל: " + propLabel + " (" + undoStack.length + "/" + MAX_UNDO + " בהיסטוריה)");
}

/* ---------- selection ---------- */

function clearHoverOutline(el: HTMLElement) {
  el.classList.remove("tp-hover-outline");
}

function onMouseOver(e: MouseEvent) {
  if (!selectModeActive) return;
  const target = (e.target as HTMLElement).closest?.("[data-editor-id]") as HTMLElement | null;
  if (target) target.classList.add("tp-hover-outline");
}

function onMouseOut(e: MouseEvent) {
  const target = (e.target as HTMLElement)?.closest?.("[data-editor-id]") as HTMLElement | null;
  if (target) clearHoverOutline(target);
}

function onDocumentClick(e: MouseEvent) {
  if (!selectModeActive) return;
  if (els.root.contains(e.target as Node)) return; /* clicks inside the panel behave normally */
  e.preventDefault();
  e.stopPropagation();
  const target = (e.target as HTMLElement).closest?.("[data-editor-id]") as HTMLElement | null;
  if (!target) {
    setStatus("האלמנט הזה עדיין לא ניתן לעריכה בשלב הנוכחי");
    return;
  }
  selectElement(target.getAttribute("data-editor-id")!, target);
}

function attachSelectionListeners() {
  document.addEventListener("mouseover", onMouseOver);
  document.addEventListener("mouseout", onMouseOut);
  document.addEventListener("click", onDocumentClick, true);
}

function detachSelectionListeners() {
  document.removeEventListener("mouseover", onMouseOver);
  document.removeEventListener("mouseout", onMouseOut);
  document.removeEventListener("click", onDocumentClick, true);
}

function toggleSelectMode() {
  selectModeActive = !selectModeActive;
  document.documentElement.classList.toggle("tp-select-mode", selectModeActive);
  els.selectBtn.classList.toggle("tp-active", selectModeActive);
  els.selectBtn.textContent = selectModeActive ? "בחירה פעילה (Esc ליציאה)" : "בחירת אלמנט";
}

function exitSelectMode() {
  if (!selectModeActive) return;
  toggleSelectMode();
}

/* Sets up selection UI (outline, panel, label, tier dropdown, the right set of dynamic
   property fields) without touching field VALUES — callers decide whether to load
   values from disk (fresh click) or from the live DOM (after an Undo). */
function activateSelection(elementId: string, el: HTMLElement, preferredTier?: string): boolean {
  if (selected) selected.el.classList.remove("tp-selected-outline");
  const meta = manifest[elementId];
  if (!meta) {
    setStatus("לא נמצא מניפסט עבור " + elementId);
    return false;
  }
  selected = { id: elementId, el: el };
  activeEditSession = null;
  el.classList.add("tp-selected-outline");
  clearHoverOutline(el);
  setPanelOpen(true);
  els.empty.classList.add("tp-hidden");
  els.form.classList.remove("tp-hidden");
  els.label.textContent = meta.label || elementId;
  els.tier.value = preferredTier || tierFromWidth(window.innerWidth);
  const mode = meta.textMode;
  els.textField.classList.toggle("tp-hidden", mode !== "plain");
  els.richField.classList.toggle("tp-hidden", mode !== "rich");
  els.textDisabledNote.classList.toggle("tp-hidden", !(!mode && meta.excludeReason && meta.excludeReason.text));
  els.linkField.classList.toggle("tp-hidden", !meta.linkMode);
  els.mediaField.classList.toggle("tp-hidden", !meta.mediaType);
  renderDynamicControls();
  return true;
}

function textModeFor(elementId: string) {
  const meta = manifest[elementId];
  return meta ? meta.textMode : undefined;
}

function linkModeFor(elementId: string) {
  const meta = manifest[elementId];
  return meta ? meta.linkMode : undefined;
}

/* draft (unsaved this session) > saved-on-disk > for anchors, whatever the live DOM's
   href/target currently reflect > empty. */
function getEffectiveLink(elementId: string, el: HTMLElement): { url: string; target: string } {
  const draft = draftByElement[elementId];
  if (draft && draft.link !== undefined) return draft.link as { url: string; target: string };
  const saved = savedCache[elementId];
  if (saved && saved.link) return saved.link as { url: string; target: string };
  if (linkModeFor(elementId) === "anchor") {
    return { url: el.getAttribute("href") || "", target: el.getAttribute("target") === "_blank" ? "_blank" : "_self" };
  }
  return { url: "", target: "_self" };
}

function populateLinkFields(elementId: string, el: HTMLElement) {
  const link = getEffectiveLink(elementId, el);
  els.linkUrl.value = link.url || "";
  els.linkTarget.value = link.target === "_blank" ? "_blank" : "_self";
  els.linkError.classList.add("tp-hidden");
}

/* A few icon-bearing CTA buttons scope rich-text editing to a text-only child
   (textTarget, e.g. ".cta-text") so the icon sibling is never touched by
   save/undo/reset of the text. */
function richTextTargetEl(elementId: string, el: HTMLElement): HTMLElement {
  const meta = manifest[elementId];
  if (meta && meta.textTarget) {
    const sub = el.querySelector<HTMLElement>(meta.textTarget);
    if (sub) return sub;
  }
  return el;
}

function selectElement(elementId: string, el: HTMLElement) {
  if (!activateSelection(elementId, el)) return;
  const draft = draftByElement[elementId];
  const mode = textModeFor(elementId);
  if (mode === "rich") {
    els.richEditor.innerHTML = draft && draft.richText !== undefined ? draft.richText : sanitizeRichHtml(richTextTargetEl(elementId, el).innerHTML);
  } else if (mode === "plain") {
    els.text.value = draft && draft.text !== undefined ? draft.text : el.textContent || "";
  }
  if (linkModeFor(elementId)) populateLinkFields(elementId, el);
  if (mediaTypeFor(elementId)) populateMediaFields(elementId, el);
  setStatus("");
  ensureSavedLoaded(elementId).then(() => {
    if (!selected || selected.id !== elementId) return; /* selection moved on while this was loading */
    applyTierToDom(els.tier.value);
    if (linkModeFor(elementId) === "button") populateLinkFields(elementId, selected.el);
  });
}

/* Builds the property fields for whichever controls THIS element's manifest entry
   enables — never a fixed set for every element. */
function renderDynamicControls() {
  els.controls.innerHTML = "";
  els.dynamicFields = {};
  if (!selected) return;
  enabledPropsFor(selected.id).forEach((propKey) => {
    if (propKey === "text") return;
    const spec = STYLE_PROPS[propKey];
    if (!spec) return;

    const fieldId = "tp-prop-" + propKey;
    const wrap = document.createElement("div");
    wrap.className = "tp-field";
    const label = document.createElement("label");
    label.setAttribute("for", fieldId);
    label.textContent = spec.label;
    wrap.appendChild(label);

    let input: HTMLInputElement | HTMLSelectElement;
    if (spec.inputType === "select") {
      const select = document.createElement("select");
      if (spec.includeEmpty) {
        const emptyOpt = document.createElement("option");
        emptyOpt.value = "";
        emptyOpt.textContent = "ברירת מחדל";
        select.appendChild(emptyOpt);
      }
      (spec.options || []).forEach((opt) => {
        const o = document.createElement("option");
        o.value = opt[0];
        o.textContent = opt[1];
        select.appendChild(o);
      });
      input = select;
    } else if (spec.inputType === "color") {
      input = document.createElement("input");
      input.type = "color";
    } else if (spec.inputType === "number") {
      input = document.createElement("input");
      input.type = "number";
      if (spec.step) input.step = spec.step;
      if (spec.placeholder) input.placeholder = spec.placeholder;
    } else {
      input = document.createElement("input");
      input.type = "text";
      if (spec.placeholder) input.placeholder = spec.placeholder;
    }
    input.id = fieldId;
    wrap.appendChild(input);
    els.controls.appendChild(wrap);
    els.dynamicFields[propKey] = input;

    input.addEventListener("focus", () => beginEditSession(propKey));
    input.addEventListener("input", () => onPropInput(propKey));
    input.addEventListener("blur", endEditSession);
  });
}

function applyTierToDom(tier: string) {
  if (!selected) return;
  enabledPropsFor(selected.id).forEach((propKey) => {
    if (propKey === "text") return;
    const spec = STYLE_PROPS[propKey];
    if (!spec) return;
    const val = getDisplayValue(selected!.id, tier, propKey);
    if (spec.moveProp) {
      const wrapper = moveWrapperEl(selected!.id, selected!.el);
      if (wrapper) applyMoveProp(wrapper, spec, val);
    } else {
      applyPropToElement(selected!.el, spec, val);
    }
    const input = els.dynamicFields[propKey];
    if (input) (input as HTMLInputElement).value = String(fieldDisplayValue(spec, val, selected!.el));
  });
}

/* After Undo: the DOM already holds the correct (just-reverted) draft value — read the
   fields FROM the DOM, never re-fetch from disk here. */
function syncFieldsFromDom() {
  if (!selected) return;
  const mode = textModeFor(selected.id);
  if (mode === "rich") {
    els.richEditor.innerHTML = richTextTargetEl(selected.id, selected.el).innerHTML;
  } else if (mode === "plain") {
    els.text.value = selected.el.textContent || "";
  }
  if (linkModeFor(selected.id)) populateLinkFields(selected.id, selected.el);
  if (mediaTypeFor(selected.id)) populateMediaFields(selected.id, selected.el);
  enabledPropsFor(selected.id).forEach((propKey) => {
    if (propKey === "text") return;
    const spec = STYLE_PROPS[propKey];
    const input = els.dynamicFields[propKey];
    if (!spec || !input) return;
    let raw: string;
    if (spec.moveProp) {
      const wrapper = moveWrapperEl(selected!.id, selected!.el);
      raw = wrapper ? wrapper.style.getPropertyValue(spec.cssVar!) : "";
    } else {
      raw = selected!.el.style.getPropertyValue("--ov-" + spec.cssProp);
    }
    (input as HTMLInputElement).value = String(fieldDisplayValue(spec, raw, selected!.el));
  });
}

/* ---------- field handlers ---------- */

function onTextInput() {
  if (!selected) return;
  selected.el.textContent = els.text.value;
  selected.el.style.setProperty("white-space", "pre-line");
  const d = (draftByElement[selected.id] = draftByElement[selected.id] || {});
  d.text = els.text.value;
}

function onLinkInput() {
  if (!selected) return;
  const url = els.linkUrl.value;
  const link = { url: url, target: els.linkTarget.value === "_blank" ? "_blank" : "_self" };
  if (url.trim() && !isSafeLinkUrl(url)) {
    els.linkError.textContent = "כתובת לא בטוחה או לא תקינה — נתמכים: http(s)://, mailto:, tel:, קישור פנימי/עוגן";
    els.linkError.classList.remove("tp-hidden");
  } else {
    els.linkError.classList.add("tp-hidden");
  }
  const d = (draftByElement[selected.id] = draftByElement[selected.id] || {});
  d.link = link;
  applyLinkPreview(selected.id, selected.el, link);
}

function onMediaAltInput() {
  if (!selected) return;
  const mediaType = mediaTypeFor(selected.id);
  if (mediaType !== "img" && mediaType !== "icon") return;
  const d = (draftByElement[selected.id] = draftByElement[selected.id] || {});
  const currentUrl = d.media && d.media.url !== undefined ? d.media.url : getEffectiveMedia(selected.id, selected.el).url;
  d.media = { url: currentUrl, alt: els.mediaAlt.value };
  selected.el.setAttribute("alt", els.mediaAlt.value);
}

/* Uploads the chosen file directly to Supabase Storage via uploadEditorMedia() (see
   media-provider.ts) and, once it returns a URL, applies it live and stores it in the
   draft the same way every other field does — nothing is written to editor_overrides
   until Save. An instant local preview (via a throwaway object URL) shows immediately,
   before the upload finishes, then gets replaced by the real public URL. The local
   project's equivalent proxied this through a dev-server upload endpoint
   (/__editor/media/upload); uploading straight to Storage from the browser replaces
   that round-trip. */
function onMediaFileChange() {
  if (!selected) return;
  const file = els.mediaFile.files && els.mediaFile.files[0];
  els.mediaFile.value = ""; /* clears the input so choosing the SAME file again still fires 'change' */
  if (!file) return;
  if (!/^image\//.test(file.type)) {
    els.mediaError.textContent = "יש להעלות קובץ תמונה (PNG / JPG / WEBP / GIF / SVG)";
    els.mediaError.classList.remove("tp-hidden");
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    els.mediaError.textContent = "הקובץ גדול מדי (מקסימום 8MB)";
    els.mediaError.classList.remove("tp-hidden");
    return;
  }
  els.mediaError.classList.add("tp-hidden");

  const elementId = selected.id;
  const el = selected.el;
  if (els.mediaPreview.dataset.blobUrl) URL.revokeObjectURL(els.mediaPreview.dataset.blobUrl);
  const objectUrl = URL.createObjectURL(file);
  els.mediaPreview.dataset.blobUrl = objectUrl;
  els.mediaPreview.src = objectUrl;
  els.mediaPreview.classList.remove("tp-hidden");

  setStatus("מעלה קובץ...");
  uploadEditorMedia(file)
    .then((url) => {
      if (!selected || selected.id !== elementId) return; /* selection moved on while this was uploading */
      const d = (draftByElement[elementId] = draftByElement[elementId] || {});
      const mediaType = mediaTypeFor(elementId);
      const existingAlt = d.media && d.media.alt !== undefined ? d.media.alt : mediaType === "img" || mediaType === "icon" ? getEffectiveMedia(elementId, el).alt : undefined;
      d.media = { url };
      if (existingAlt !== undefined) d.media.alt = existingAlt;
      applyMediaToElement(elementId, el, d.media);
      if (els.mediaPreview.dataset.blobUrl) {
        URL.revokeObjectURL(els.mediaPreview.dataset.blobUrl);
        delete els.mediaPreview.dataset.blobUrl;
      }
      els.mediaPreview.src = url;
      setStatus("הקובץ הועלה ✓ (לא נשמר עדיין — לחצי שמירה)");
    })
    .catch((err) => {
      if (!selected || selected.id !== elementId) return;
      setStatus("שגיאה בהעלאת הקובץ: " + (err instanceof Error ? err.message : "לא ידוע"));
    });
}

/* ---------- rich-text editor (strong/br/span only) ---------- */

function onRichInput() {
  if (!selected) return;
  normalizeBoldTags(els.richEditor);
  const sanitized = sanitizeRichHtml(els.richEditor.innerHTML);
  richTextTargetEl(selected.id, selected.el).innerHTML = sanitized;
  const d = (draftByElement[selected.id] = draftByElement[selected.id] || {});
  d.richText = sanitized;
}

function insertBreakAtCaret() {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  if (!els.richEditor.contains(range.commonAncestorContainer)) return;
  range.deleteContents();
  const br = document.createElement("br");
  range.insertNode(br);
  let anchor: Text;
  if (br.nextSibling && br.nextSibling.nodeType === 3) {
    anchor = br.nextSibling as Text;
  } else {
    anchor = document.createTextNode("");
    br.parentNode?.insertBefore(anchor, br.nextSibling);
  }
  range.setStart(anchor, 0);
  range.setEnd(anchor, 0);
  sel.removeAllRanges();
  sel.addRange(range);
}

function onRichKeydown(e: KeyboardEvent) {
  if (e.key !== "Enter") return;
  e.preventDefault();
  insertBreakAtCaret();
  onRichInput();
}

function onRichPaste(e: ClipboardEvent) {
  e.preventDefault();
  const text = (e.clipboardData || (window as any).clipboardData).getData("text/plain");
  document.execCommand("insertText", false, text);
  onRichInput();
}

function onRichBold() {
  if (!selected) return;
  els.richEditor.focus();
  document.execCommand("bold");
  onRichInput();
}

function onRichClearFormat() {
  if (!selected) return;
  els.richEditor.focus();
  document.execCommand("removeFormat");
  onRichInput();
}

function onPropInput(propKey: string) {
  if (!selected) return;
  const spec = STYLE_PROPS[propKey];
  const input = els.dynamicFields[propKey];
  if (!spec || !input) return;
  const value = formatFieldValue(spec, (input as HTMLInputElement).value);
  const tier = els.tier.value;
  const d = (draftByElement[selected.id] = draftByElement[selected.id] || {});
  d.tiers = d.tiers || {};
  d.tiers[tier] = d.tiers[tier] || {};
  d.tiers[tier][propKey] = value; /* null = explicit "cleared this session", distinct from "untouched" */
  if (spec.moveProp) {
    const wrapper = moveWrapperEl(selected.id, selected.el);
    if (wrapper) applyMoveProp(wrapper, spec, value);
  } else {
    applyPropToElement(selected.el, spec, value);
  }
}

function onTierChange() {
  endEditSession();
  const tier = els.tier.value;
  applyTierToDom(tier); /* savedCache is already warm from selectElement() */
}

/* ---------- save / reset ---------- */

function onSave() {
  if (!selected) return;
  const scope = scopePayload(selected.id);
  if (!scope) return;

  const draft = draftByElement[selected.id] || {};
  const changes: OverrideEntry = {};
  const textMode = textModeFor(selected.id);
  if (textMode === "rich") {
    changes.richText = sanitizeRichHtml(richTextTargetEl(selected.id, selected.el).innerHTML);
  } else if (textMode === "plain") {
    changes.text = selected.el.textContent || "";
  }
  const tiers: Record<string, Record<string, string>> = {};
  if (draft.tiers) {
    Object.keys(draft.tiers).forEach((tier) => {
      const tierProps: Record<string, string> = {};
      const tierDraft = draft.tiers![tier];
      Object.keys(tierDraft).forEach((propKey) => {
        const val = tierDraft[propKey];
        if (val) tierProps[propKey] = val;
      });
      if (Object.keys(tierProps).length) tiers[tier] = tierProps;
    });
  }
  if (Object.keys(tiers).length) Object.assign(changes, tiers);

  if (linkModeFor(selected.id)) {
    const linkUrl = els.linkUrl.value;
    if (linkUrl.trim() && !isSafeLinkUrl(linkUrl)) {
      els.linkError.textContent = "לא ניתן לשמור — כתובת לא בטוחה או לא תקינה";
      els.linkError.classList.remove("tp-hidden");
      setStatus("שגיאה: תקני את הקישור לפני השמירה");
      return; /* block the entire save, not just the link, so nothing half-saves */
    }
    changes.link = { url: linkUrl.trim(), target: els.linkTarget.value === "_blank" ? "_blank" : "_self" };
  }

  if (mediaTypeFor(selected.id)) {
    const media = getEffectiveMedia(selected.id, selected.el);
    if (media && typeof media.url === "string" && media.url && !isSafeMediaUrl(media.url)) {
      setStatus("שגיאה: כתובת המדיה אינה תקינה — לא ניתן לשמור");
      return;
    }
    changes.media = media;
  }

  const elementId = selected.id;
  const scopeKey = scope.scope === "global" ? scope.region || "" : scope.page || "";

  setButtonLoading(els.saveBtn, "שומרת...");
  setStatus("");
  upsertOverride(elementId, scope.scope, scopeKey, changes)
    .then(() => {
      clearButtonLoading(els.saveBtn);
      savedCache[elementId] = null; /* force a fresh read next time it's needed */
      draftByElement[elementId] = {};
      endEditSession();
      setStatus("השינויים נשמרו ✓");
    })
    .catch((err) => {
      clearButtonLoading(els.saveBtn);
      setStatus("שגיאה בשמירה: " + (err instanceof Error ? err.message : "לא ידוע"));
    });
}

function restoreElementInPlace(elementId: string, el: HTMLElement) {
  const stash = getOriginalStash(elementId);
  if (stash) {
    el.innerHTML = stash.html;
  }
  enabledPropsFor(elementId).forEach((propKey) => {
    if (propKey === "text") return;
    const spec = STYLE_PROPS[propKey];
    if (!spec || spec.moveProp) return;
    el.style.removeProperty(spec.cssProp!);
    el.style.removeProperty("--ov-" + spec.cssProp);
    if (spec.cssProp === "text-align") el.style.removeProperty("align-self");
  });
  el.style.removeProperty("white-space");

  const moveWrapper = moveWrapperEl(elementId, el);
  if (moveWrapper) resetMoveProps(moveWrapper);

  const linkMode = linkModeFor(elementId);
  if (linkMode === "anchor") {
    if (stash && stash.hasHref) {
      el.setAttribute("href", stash.href);
    } else {
      el.removeAttribute("href");
    }
    if (stash && stash.hasTarget) {
      el.setAttribute("target", stash.target);
      el.setAttribute("rel", "noopener noreferrer");
    } else {
      el.removeAttribute("target");
      el.removeAttribute("rel");
    }
  } else if (linkMode === "button") {
    delete el.dataset.tpPreviewLink;
  }

  const mediaType = mediaTypeFor(elementId);
  if (mediaType === "img" || mediaType === "icon") {
    if (stash && stash.hasSrc) {
      el.setAttribute("src", stash.src);
    } else {
      el.removeAttribute("src");
    }
    if (stash && stash.hasAlt) {
      el.setAttribute("alt", stash.alt);
    } else {
      el.removeAttribute("alt");
    }
  } else if (mediaType === "background") {
    el.style.removeProperty("background-image");
    el.style.removeProperty("--ov-background-image");
  } else if (mediaType === "mask") {
    el.style.removeProperty("mask-image");
    el.style.removeProperty("-webkit-mask-image");
    el.style.removeProperty("--ov-mask-image");
  }

  delete draftByElement[elementId];
  savedCache[elementId] = {};
  if (selected && selected.id === elementId) {
    const mode = textModeFor(elementId);
    if (mode === "rich") {
      els.richEditor.innerHTML = richTextTargetEl(elementId, el).innerHTML;
    } else if (mode === "plain") {
      els.text.value = el.textContent || "";
    }
    if (linkMode) populateLinkFields(elementId, el);
    if (mediaType) populateMediaFields(elementId, el);
    applyTierToDom(els.tier.value);
  }
}

function onResetElement() {
  if (!selected) return;
  const scope = scopePayload(selected.id);
  if (!scope) return;
  const elementId = selected.id;
  const el = selected.el;

  setButtonLoading(els.resetElBtn, "מאפסת...");
  setStatus("");
  resetOverride(elementId)
    .then(() => {
      clearButtonLoading(els.resetElBtn);
      restoreElementInPlace(elementId, el);
      setStatus("האלמנט אופס ✓");
    })
    .catch((err) => {
      clearButtonLoading(els.resetElBtn);
      setStatus("שגיאה באיפוס: " + (err instanceof Error ? err.message : "לא ידוע"));
    });
}

function onResetPage() {
  const pageKey = currentPageKey();
  if (!pageKey) return;
  if (!window.confirm("לאפס את כל השינויים השמורים בעמוד הזה? הפעולה אינה ניתנת לביטול.")) {
    return;
  }
  setButtonLoading(els.resetPageBtn, "מאפסת עמוד...");
  setStatus("");
  resetOverrideForPage(pageKey)
    .then(() => {
      clearButtonLoading(els.resetPageBtn);
      Object.keys(manifest).forEach((id) => {
        const meta = manifest[id];
        if (meta.scope !== "page" || meta.page !== pageKey) return;
        const el = document.querySelector<HTMLElement>('[data-editor-id="' + cssEscape(id) + '"]');
        if (el) restoreElementInPlace(id, el);
      });
      setStatus("העמוד אופס ✓");
    })
    .catch((err) => {
      clearButtonLoading(els.resetPageBtn);
      setStatus("שגיאה באיפוס העמוד: " + (err instanceof Error ? err.message : "לא ידוע"));
    });
}

function setStatus(text: string) {
  els.status.textContent = text;
}

function onExitEditMode() {
  disableEditMode();
  window.location.href = "/admin";
}

/* ---------- panel shell ---------- */

function setPanelOpen(open: boolean) {
  els.panel.classList.toggle("tp-hidden", !open);
  els.toggle.classList.toggle("tp-active", open);
}

function togglePanel() {
  setPanelOpen(els.panel.classList.contains("tp-hidden"));
}

function buildPanel() {
  const existing = document.getElementById("tp-editor-root");
  if (existing) existing.remove();
  const root = document.createElement("div");
  root.id = "tp-editor-root";
  root.setAttribute("dir", "rtl");
  root.innerHTML =
    '<button type="button" id="tp-editor-toggle" title="עורך חזותי">✎</button>' +
    '<div id="tp-editor-panel" class="tp-hidden">' +
    '  <div class="tp-header">' +
    "    <span>עורך חזותי</span>" +
    '    <button type="button" id="tp-close-btn" title="סגירה">×</button>' +
    "  </div>" +
    '  <div class="tp-body">' +
    '    <button type="button" id="tp-exit-edit-mode" class="tp-btn tp-danger-outline" style="width:100%;margin-bottom:10px;">יציאה ממצב עריכה</button>' +
    '    <button type="button" id="tp-select-btn" class="tp-select-toggle">בחירת אלמנט</button>' +
    '    <div id="tp-empty" class="tp-empty">לחצי על “בחירת אלמנט” ואז לחצי על אלמנט מסומן בעמוד. רק אלמנטים ששולבו בשלב הנוכחי ניתנים לעריכה.</div>' +
    '    <div id="tp-form" class="tp-hidden">' +
    '      <div class="tp-field"><label>אלמנט נבחר</label><div id="tp-label" class="tp-label-box"></div></div>' +
    '      <div class="tp-field" id="tp-text-field"><label for="tp-text">טקסט (Enter = שורה חדשה)</label><textarea id="tp-text" rows="4"></textarea></div>' +
    '      <div class="tp-field tp-hidden" id="tp-rich-field">' +
    "        <label>טקסט (עריכה עשירה)</label>" +
    '        <div class="tp-rich-toolbar">' +
    '          <button type="button" id="tp-rich-bold" title="הדגשה (Bold)"><b>מודגש</b></button>' +
    '          <button type="button" id="tp-rich-clear" title="הסרת הדגשה מהטקסט המסומן">הסרת עיצוב</button>' +
    "        </div>" +
    '        <div id="tp-rich-editor" contenteditable="true"></div>' +
    '        <div class="tp-hint">סמני טקסט ולחצי "מודגש" כדי להדגיש/להסיר הדגשה. Enter = שורה חדשה. הדבקה (Paste) נטענת כטקסט רגיל בלבד.</div>' +
    "      </div>" +
    '      <div id="tp-text-disabled-note" class="tp-hint tp-hidden">האלמנט הזה מכיל תוכן שעורך הטקסט המוגבל לא תומך בו (למשל אייקון) — כדי לא לשבור אותו, עריכת טקסט לא זמינה כאן. אפשר לערוך את שאר המאפיינים למטה.</div>' +
    '      <div class="tp-field tp-hidden" id="tp-link-field">' +
    '        <label for="tp-link-url">קישור — URL</label>' +
    '        <input type="text" id="tp-link-url" placeholder="https://... , /about , #section , mailto:... , tel:...">' +
    '        <div class="tp-hint">עמוד פנימי: /about — עוגן: #section — חיצוני: https://... — מייל: mailto:... — טלפון: tel:...</div>' +
    '        <label for="tp-link-target" style="margin-top:8px">פתיחה</label>' +
    '        <select id="tp-link-target">' +
    '          <option value="_self">באותה לשונית</option>' +
    '          <option value="_blank">בלשונית חדשה</option>' +
    "        </select>" +
    '        <div id="tp-link-error" class="tp-hint tp-link-error tp-hidden"></div>' +
    '        <div class="tp-hint">השאירי את השדה ריק ולחצי שמירה כדי להסיר קישור קיים.</div>' +
    "      </div>" +
    '      <div class="tp-field tp-hidden" id="tp-media-field">' +
    "        <label>מדיה נוכחית</label>" +
    '        <img id="tp-media-preview" class="tp-media-preview tp-hidden" alt="">' +
    '        <input type="file" id="tp-media-file" accept="image/*">' +
    '        <div class="tp-hint">PNG / JPG / WEBP / GIF / SVG — עד 8MB</div>' +
    '        <div class="tp-field tp-hidden" id="tp-media-alt-field">' +
    '          <label for="tp-media-alt">טקסט חלופי (alt)</label>' +
    '          <input type="text" id="tp-media-alt" placeholder="תיאור התמונה">' +
    "        </div>" +
    '        <div id="tp-media-error" class="tp-hint tp-link-error tp-hidden"></div>' +
    "      </div>" +
    '      <div class="tp-field"><label for="tp-tier">מסך (Desktop / Laptop / Tablet / Mobile)</label>' +
    '        <select id="tp-tier">' +
    '          <option value="desktop">Desktop</option>' +
    '          <option value="laptop">Laptop</option>' +
    '          <option value="tablet">Tablet</option>' +
    '          <option value="mobile">Mobile</option>' +
    "        </select>" +
    '        <div class="tp-hint">לאיזה רוחב מסך נשמרים הערכים למטה.</div>' +
    "      </div>" +
    '      <div id="tp-controls"></div>' +
    '      <div class="tp-actions">' +
    '        <button type="button" id="tp-save" class="tp-btn tp-primary">שמירה</button>' +
    '        <button type="button" id="tp-undo" class="tp-btn">ביטול פעולה אחרונה</button>' +
    "      </div>" +
    '      <div class="tp-actions">' +
    '        <button type="button" id="tp-reset-el" class="tp-btn tp-danger-outline">איפוס אלמנט</button>' +
    '        <button type="button" id="tp-reset-page" class="tp-btn tp-danger-outline">איפוס כל העמוד</button>' +
    "      </div>" +
    '      <div id="tp-status" class="tp-status"></div>' +
    "    </div>" +
    "  </div>" +
    "</div>";
  document.body.appendChild(root);

  els = {
    root,
    toggle: root.querySelector("#tp-editor-toggle")!,
    panel: root.querySelector("#tp-editor-panel")!,
    selectBtn: root.querySelector("#tp-select-btn")!,
    empty: root.querySelector("#tp-empty")!,
    form: root.querySelector("#tp-form")!,
    label: root.querySelector("#tp-label")!,
    text: root.querySelector("#tp-text")!,
    textField: root.querySelector("#tp-text-field")!,
    richField: root.querySelector("#tp-rich-field")!,
    richEditor: root.querySelector("#tp-rich-editor")!,
    richBoldBtn: root.querySelector("#tp-rich-bold")!,
    richClearBtn: root.querySelector("#tp-rich-clear")!,
    textDisabledNote: root.querySelector("#tp-text-disabled-note")!,
    linkField: root.querySelector("#tp-link-field")!,
    linkUrl: root.querySelector("#tp-link-url")!,
    linkTarget: root.querySelector("#tp-link-target")!,
    linkError: root.querySelector("#tp-link-error")!,
    mediaField: root.querySelector("#tp-media-field")!,
    mediaPreview: root.querySelector("#tp-media-preview")!,
    mediaFile: root.querySelector("#tp-media-file")!,
    mediaAltField: root.querySelector("#tp-media-alt-field")!,
    mediaAlt: root.querySelector("#tp-media-alt")!,
    mediaError: root.querySelector("#tp-media-error")!,
    tier: root.querySelector("#tp-tier")!,
    controls: root.querySelector("#tp-controls")!,
    dynamicFields: {},
    status: root.querySelector("#tp-status")!,
    saveBtn: root.querySelector("#tp-save")!,
    undoBtn: root.querySelector("#tp-undo")!,
    resetElBtn: root.querySelector("#tp-reset-el")!,
    resetPageBtn: root.querySelector("#tp-reset-page")!,
    exitBtn: root.querySelector("#tp-exit-edit-mode")!
  };

  els.toggle.addEventListener("click", togglePanel);
  root.querySelector("#tp-close-btn")!.addEventListener("click", () => setPanelOpen(false));
  els.selectBtn.addEventListener("click", toggleSelectMode);

  els.text.addEventListener("focus", () => beginEditSession("text"));
  els.text.addEventListener("input", onTextInput);
  els.text.addEventListener("blur", endEditSession);

  els.richEditor.addEventListener("focus", () => beginEditSession("text"));
  els.richEditor.addEventListener("input", onRichInput);
  els.richEditor.addEventListener("blur", endEditSession);
  els.richEditor.addEventListener("keydown", onRichKeydown);
  els.richEditor.addEventListener("paste", onRichPaste);
  els.richEditor.addEventListener("drop", (e) => e.preventDefault());
  els.richBoldBtn.addEventListener("click", onRichBold);
  els.richClearBtn.addEventListener("click", onRichClearFormat);

  els.linkUrl.addEventListener("focus", () => beginEditSession("link"));
  els.linkUrl.addEventListener("input", onLinkInput);
  els.linkUrl.addEventListener("blur", endEditSession);
  els.linkTarget.addEventListener("focus", () => beginEditSession("link"));
  els.linkTarget.addEventListener("change", onLinkInput);
  els.linkTarget.addEventListener("blur", endEditSession);

  els.mediaFile.addEventListener("focus", () => beginEditSession("media"));
  els.mediaFile.addEventListener("change", onMediaFileChange);
  els.mediaFile.addEventListener("blur", endEditSession);

  els.mediaAlt.addEventListener("focus", () => beginEditSession("media"));
  els.mediaAlt.addEventListener("input", onMediaAltInput);
  els.mediaAlt.addEventListener("blur", endEditSession);

  els.tier.addEventListener("change", onTierChange);

  els.saveBtn.addEventListener("click", onSave);
  els.undoBtn.addEventListener("click", onUndo);
  els.resetElBtn.addEventListener("click", onResetElement);
  els.resetPageBtn.addEventListener("click", onResetPage);
  els.exitBtn.addEventListener("click", onExitEditMode);
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") exitSelectMode();
}

function wireGlobalListeners() {
  attachSelectionListeners();
  document.addEventListener("keydown", onKeydown);
}

let initGeneration = 0;
let built = false;

export function initEditorPanel() {
  const myGeneration = ++initGeneration;
  Promise.all([fetchJson(MANIFEST_URL), fetchJson(BREAKPOINTS_URL)]).then(([manifestRes, breakpointsRes]) => {
    if (myGeneration !== initGeneration) return; // superseded by a later init/destroy cycle (e.g. StrictMode's double-invoke)
    manifest = manifestRes || {};
    if (breakpointsRes && breakpointsRes.mobileMax) breakpoints = breakpointsRes;
    buildPanel();
    wireGlobalListeners();
    built = true;
  });
}

/* Symmetric teardown for React's useEffect cleanup — the local project's script tag
   never needed this (the page loads once), but our admin session can end without a full
   page reload (sign-out), so the panel must be able to fully remove itself. */
export function destroyEditorPanel() {
  initGeneration++; // invalidates any in-flight init from this or an earlier call
  if (!built) return;
  built = false;
  selectModeActive = false;
  document.documentElement.classList.remove("tp-select-mode");
  detachSelectionListeners();
  document.removeEventListener("keydown", onKeydown);
  if (selected) {
    selected.el.classList.remove("tp-selected-outline");
    selected = null;
  }
  const root = document.getElementById("tp-editor-root");
  if (root) root.remove();
}

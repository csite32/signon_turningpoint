/**
 * Title -> URL slug. Transliterates nothing (Hebrew titles are common here) —
 * it strips characters that aren't safe in a URL path segment and collapses
 * whitespace/dashes, matching the `/^[a-z0-9-]+$/`-style pattern used
 * elsewhere in this project (e.g. the editor-runtime page-key regex) while
 * still allowing Hebrew letters through, since real project titles are
 * Hebrew and a transliterated slug would be unreadable.
 */
export function slugify(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

/** Appends -2, -3, ... until `candidate` isn't in `taken`. */
export function uniqueSlug(candidate: string, taken: Set<string>): string {
  if (!taken.has(candidate)) return candidate;
  let n = 2;
  while (taken.has(`${candidate}-${n}`)) n++;
  return `${candidate}-${n}`;
}

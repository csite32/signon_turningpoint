const KEY = "tp-edit-mode";
const EVENT = "tp-editmode-changed";

export function isEditModeEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(KEY) === "1";
}

export function enableEditMode() {
  sessionStorage.setItem(KEY, "1");
  window.dispatchEvent(new Event(EVENT));
}

export function disableEditMode() {
  sessionStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVENT));
}

export function onEditModeChange(cb: () => void): () => void {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

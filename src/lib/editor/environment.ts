const PUBLISHED_HOSTS = ["signon-turning-point.lovable.app"];
const PROJECT_PREVIEW_HOST = "preview-signon-turning-point.lovable.app";

export function isEditorEnvironment(): boolean {
  if (typeof window === "undefined") return false;
  if (import.meta.env.MODE !== "development") return false;
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return true;
  if (host === PROJECT_PREVIEW_HOST) return true;
  if (PUBLISHED_HOSTS.includes(host)) return false;
  return /^id-preview(-[a-z0-9]+)?--/.test(host) && host.endsWith(".lovable.app");
}

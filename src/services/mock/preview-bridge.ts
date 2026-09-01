import type { Project } from "@/types/project";
import type { ProjectImage } from "@/types/project-image";

/**
 * Cross-tab preview bridge for the mock data stage. Preview always opens in
 * a brand-new tab (see admin/preview.tsx) so the public-looking
 * ProjectDetailPage can render full-width, with none of the dashboard chrome
 * around it. sessionStorage is not a reliable way to hand data to that new
 * tab (browsers only copy it into a window.open()-created auxiliary
 * context in some cases, never into a tab opened any other way, and it is
 * not guaranteed inside every embedding/automation environment either) — so
 * this uses a BroadcastChannel with an explicit handshake instead:
 *
 *   1. The opener (ProjectForm/ProjectTable) picks a random requestId,
 *      opens /admin/preview?req=<requestId> in a new tab, and starts
 *      listening on the channel for a "ready" message carrying that same id.
 *   2. The new tab mounts, opens the SAME channel, and immediately posts
 *      "ready" with the requestId from its own URL.
 *   3. The opener replies with the actual project+images payload, tagged
 *      with the same requestId (so a stray ready from an unrelated preview
 *      request — e.g. a previous tab left open — is ignored).
 *   4. Both sides close their channel and clear their listeners/timeouts
 *      once the handshake completes (or times out).
 *
 * This is purely an in-memory message bridge, not storage: nothing here
 * persists across a reload, and there is nothing to migrate away when a
 * real Supabase-backed implementation replaces the mock services layer —
 * this whole file simply stops being imported at that point.
 */

const CHANNEL_NAME = "tp-preview-bridge";
const HANDSHAKE_TIMEOUT_MS = 8000;

interface ReadyMessage {
  type: "preview-ready";
  requestId: string;
}
interface DataMessage {
  type: "preview-data";
  requestId: string;
  project: Project;
  images: ProjectImage[];
  /**
   * blob: URL string -> the actual Blob bytes, for every blob: URL that
   * appears in `project`/`images` above (an image just uploaded via
   * GalleryUploader/the hero-image field, not yet saved — storageService.mock
   * always returns URL.createObjectURL(file)). A blob: URL only resolves
   * inside the exact document that created it, so shipping the string alone
   * would leave a broken <img> in the new preview tab. Structured clone
   * (what BroadcastChannel uses) DOES copy real Blob bytes, unlike a blob:
   * URL string, which is just an opaque per-document reference — so the
   * opener fetches each one back into a Blob here, and the receiver mints
   * its own fresh, tab-local object URL from it before rendering. Empty for
   * any project/images that only reference already-saved (real path or
   * previously-persisted) URLs.
   */
  blobAssets: Record<string, Blob>;
}
type BridgeMessage = ReadyMessage | DataMessage;

function isBridgeMessage(value: unknown): value is BridgeMessage {
  return !!value && typeof value === "object" && "type" in value && "requestId" in value;
}

function collectBlobUrls(project: Project, images: ProjectImage[]): string[] {
  const urls = images.map((img) => img.image_url);
  if (project.hero_image_url) urls.push(project.hero_image_url);
  return Array.from(new Set(urls.filter((url) => url.startsWith("blob:"))));
}

/** Must run in the tab that originally created the blob: URLs — only that
    document can still resolve them via fetch(). Silently skips any URL that
    fails (e.g. already revoked) rather than blocking the whole preview. */
async function collectBlobAssets(
  project: Project,
  images: ProjectImage[],
): Promise<Record<string, Blob>> {
  const urls = collectBlobUrls(project, images);
  const assets: Record<string, Blob> = {};
  await Promise.all(
    urls.map(async (url) => {
      try {
        assets[url] = await fetch(url).then((res) => res.blob());
      } catch {
        // Left out of `assets` — the receiver leaves that one URL as-is,
        // same as any other broken image would render.
      }
    }),
  );
  return assets;
}

/** Runs in the receiving tab: mints a fresh, this-tab-valid object URL from
    each received Blob and substitutes it wherever the original blob: URL
    appeared, so freshly-uploaded-but-unsaved images actually render in
    Preview instead of showing as broken <img>s. */
function resolveBlobAssets(
  project: Project,
  images: ProjectImage[],
  blobAssets: Record<string, Blob>,
): { project: Project; images: ProjectImage[] } {
  const swap = (url: string): string => {
    const blob = blobAssets[url];
    return blob ? URL.createObjectURL(blob) : url;
  };
  return {
    project: project.hero_image_url
      ? { ...project, hero_image_url: swap(project.hero_image_url) }
      : project,
    images: images.map((img) => ({ ...img, image_url: swap(img.image_url) })),
  };
}

/**
 * Opens a new tab at /admin/preview and, once that tab signals it is
 * mounted and listening, sends it the given project+images. Works for a
 * project that is already saved, one with unsaved form edits, or a
 * brand-new project that only exists in memory — the caller always passes
 * whatever it currently has, there is no dependency on the project being
 * persisted anywhere.
 */
export function openPreviewTab(project: Project, images: ProjectImage[]): void {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return;

  const requestId = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const channel = new BroadcastChannel(CHANNEL_NAME);

  const cleanup = () => {
    clearTimeout(timeoutId);
    channel.close();
  };

  const timeoutId = setTimeout(cleanup, HANDSHAKE_TIMEOUT_MS);

  channel.onmessage = (event: MessageEvent) => {
    const msg = event.data;
    if (!isBridgeMessage(msg) || msg.requestId !== requestId) return;
    if (msg.type === "preview-ready") {
      // Resolving blob: URLs happens here, in the opener — this is the only
      // tab that can still fetch() them. Runs after "ready" (not blocking
      // window.open itself, which must stay synchronous with the click to
      // avoid the popup blocker) — the new tab just waits a beat longer.
      collectBlobAssets(project, images).then((blobAssets) => {
        const dataMsg: DataMessage = {
          type: "preview-data",
          requestId,
          project,
          images,
          blobAssets,
        };
        channel.postMessage(dataMsg);
        cleanup();
      });
    }
  };

  // Opened synchronously, in the same tick as the caller's click handler —
  // required for browsers to treat this as a real user-gesture popup instead
  // of blocking it.
  window.open(`/admin/preview?req=${requestId}`, "_blank");
}

/**
 * Receiver side, used only by admin/preview.tsx. Announces readiness on
 * mount and resolves once the opener replies (or the handshake times out).
 * Returns a cleanup function to call on unmount so nothing lingers if the
 * user closes the tab mid-handshake.
 */
export function receivePreviewData(
  requestId: string,
  onData: (project: Project, images: ProjectImage[]) => void,
  onTimeout: () => void,
): () => void {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    onTimeout();
    return () => {};
  }

  const channel = new BroadcastChannel(CHANNEL_NAME);

  const cleanup = () => {
    clearTimeout(timeoutId);
    channel.close();
  };

  const timeoutId = setTimeout(() => {
    cleanup();
    onTimeout();
  }, HANDSHAKE_TIMEOUT_MS);

  channel.onmessage = (event: MessageEvent) => {
    const msg = event.data;
    if (!isBridgeMessage(msg) || msg.requestId !== requestId) return;
    if (msg.type === "preview-data") {
      cleanup();
      const { project, images } = resolveBlobAssets(msg.project, msg.images, msg.blobAssets);
      onData(project, images);
    }
  };

  const readyMsg: ReadyMessage = { type: "preview-ready", requestId };
  channel.postMessage(readyMsg);

  return cleanup;
}

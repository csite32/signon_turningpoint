import type { GalleryType, ProjectImage } from "@/types/project-image";
import { MOCK_PROJECT_IMAGES } from "@/data/mock/project-images";
import { ok, err, mockDelay, type Result } from "@/services/util/result";
import { loadPersisted, savePersisted } from "./persist";

const STORAGE_KEY = "project-images";

let store: ProjectImage[] = loadPersisted(STORAGE_KEY, () => structuredClone(MOCK_PROJECT_IMAGES));

function persist(): void {
  savePersisted(STORAGE_KEY, store);
}

function nextId(): string {
  return `img-${Math.random().toString(36).slice(2, 10)}`;
}

function sortedFor(projectId: string, galleryType: GalleryType): ProjectImage[] {
  return store
    .filter((i) => i.project_id === projectId && i.gallery_type === galleryType)
    .sort((a, b) => a.sort_order - b.sort_order);
}

/** Not part of the public service surface — called only by projectsService.mock.ts on project delete. */
export function deleteProjectImagesForProject(projectId: string): void {
  store = store.filter((i) => i.project_id !== projectId);
  persist();
}

export async function getProjectImages(
  projectId: string,
  galleryType: GalleryType,
): Promise<Result<ProjectImage[]>> {
  await mockDelay();
  return ok(sortedFor(projectId, galleryType));
}

export async function getAllProjectImages(projectId: string): Promise<Result<ProjectImage[]>> {
  await mockDelay();
  return ok(
    store.filter((i) => i.project_id === projectId).sort((a, b) => a.sort_order - b.sort_order),
  );
}

export async function uploadProjectImage(
  projectId: string,
  input: { imageUrl: string; storagePath: string; galleryType: GalleryType; altText?: string },
): Promise<Result<ProjectImage>> {
  await mockDelay();
  const existing = sortedFor(projectId, input.galleryType);
  const image: ProjectImage = {
    id: nextId(),
    project_id: projectId,
    gallery_type: input.galleryType,
    storage_path: input.storagePath,
    image_url: input.imageUrl,
    alt_text: input.altText ?? "",
    sort_order: existing.length,
    created_at: new Date().toISOString(),
  };
  store = [...store, image];
  persist();
  return ok(image);
}

/** "Replace" (per the plan: upload onto an existing slot) — keeps id/sort_order/alt_text, swaps only the file. */
export async function replaceProjectImage(
  imageId: string,
  input: { imageUrl: string; storagePath: string },
): Promise<Result<ProjectImage>> {
  await mockDelay();
  const idx = store.findIndex((i) => i.id === imageId);
  if (idx === -1) return err("not_found");
  const updated: ProjectImage = {
    ...store[idx],
    image_url: input.imageUrl,
    storage_path: input.storagePath,
  };
  store = store.map((i) => (i.id === imageId ? updated : i));
  persist();
  return ok(updated);
}

export async function updateProjectImage(
  imageId: string,
  patch: { alt_text?: string },
): Promise<Result<ProjectImage>> {
  await mockDelay();
  const idx = store.findIndex((i) => i.id === imageId);
  if (idx === -1) return err("not_found");
  const updated: ProjectImage = { ...store[idx], ...patch };
  store = store.map((i) => (i.id === imageId ? updated : i));
  persist();
  return ok(updated);
}

export async function deleteProjectImage(imageId: string): Promise<Result<true>> {
  await mockDelay();
  const target = store.find((i) => i.id === imageId);
  if (!target) return err("not_found");
  store = store.filter((i) => i.id !== imageId);
  // Renormalize sort_order for the remaining images in the same gallery so gaps never appear.
  const reindexed = sortedFor(target.project_id, target.gallery_type).map((img, i) => ({
    ...img,
    sort_order: i,
  }));
  store = store.map((i) => reindexed.find((r) => r.id === i.id) ?? i);
  persist();
  return ok(true);
}

export async function reorderProjectImages(
  projectId: string,
  galleryType: GalleryType,
  orderedImageIds: string[],
): Promise<Result<ProjectImage[]>> {
  await mockDelay();
  const order = new Map(orderedImageIds.map((id, i) => [id, i]));
  store = store.map((img) =>
    img.project_id === projectId && img.gallery_type === galleryType && order.has(img.id)
      ? { ...img, sort_order: order.get(img.id)! }
      : img,
  );
  persist();
  return ok(sortedFor(projectId, galleryType));
}

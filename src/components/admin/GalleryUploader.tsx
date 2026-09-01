import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Repeat, Trash2 } from "lucide-react";
import type { GalleryType, ProjectImage } from "@/types/project-image";
import * as projectImagesService from "@/services/projectImagesService";
import * as storageService from "@/services/storageService";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";

/**
 * One reusable gallery editor, parameterized by galleryType — used for all
 * three galleries (main_gallery, secondary_gallery, and brand_colors, which
 * gets exactly the same six capabilities as the other two: upload, replace,
 * delete, preview, alt-text editing, drag & drop reorder with persisted
 * sort_order). Talks directly to projectImagesService/storageService — the
 * project this gallery belongs to always has a real id by the time this
 * renders (see projects/$id.tsx: a brand-new project is created as a draft
 * immediately, before its editor form is shown), so there is no "unsaved
 * gallery" state to reconcile on save.
 */
export function GalleryUploader({
  projectId,
  galleryType,
  title,
  hint,
}: {
  projectId: string;
  galleryType: GalleryType;
  title?: string;
  hint?: string;
}) {
  const [images, setImages] = useState<ProjectImage[] | null>(null);
  const [busySlot, setBusySlot] = useState<string | "new" | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectImage | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    const res = await projectImagesService.getProjectImages(projectId, galleryType);
    setImages(res.ok ? res.data : []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, galleryType]);

  async function handleUploadNew(file: File) {
    setBusySlot("new");
    const up = await storageService.uploadImage(file, { folder: galleryType });
    if (!up.ok) {
      toast.error("העלאת התמונה נכשלה");
      setBusySlot(null);
      return;
    }
    const res = await projectImagesService.uploadProjectImage(projectId, {
      imageUrl: up.data.url,
      storagePath: up.data.path,
      galleryType,
    });
    setBusySlot(null);
    if (!res.ok) {
      toast.error("שמירת התמונה נכשלה");
      return;
    }
    toast.success("התמונה הועלתה");
    load();
  }

  async function handleReplace(image: ProjectImage, file: File) {
    setBusySlot(image.id);
    const up = await storageService.uploadImage(file, { folder: galleryType });
    if (!up.ok) {
      toast.error("העלאת התמונה נכשלה");
      setBusySlot(null);
      return;
    }
    const res = await projectImagesService.replaceProjectImage(image.id, {
      imageUrl: up.data.url,
      storagePath: up.data.path,
    });
    setBusySlot(null);
    if (!res.ok) {
      toast.error("החלפת התמונה נכשלה");
      return;
    }
    toast.success("התמונה הוחלפה");
    load();
  }

  async function handleAltBlur(image: ProjectImage, value: string) {
    if (value === (image.alt_text ?? "")) return;
    const res = await projectImagesService.updateProjectImage(image.id, { alt_text: value });
    if (!res.ok) {
      toast.error("שמירת הטקסט החלופי נכשלה");
      return;
    }
    load();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await projectImagesService.deleteProjectImage(deleteTarget.id);
    setDeleting(false);
    if (!res.ok) {
      toast.error("מחיקת התמונה נכשלה");
      return;
    }
    toast.success("התמונה נמחקה");
    setDeleteTarget(null);
    load();
  }

  async function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId || !images) {
      setDragId(null);
      return;
    }
    const ids = images.map((i) => i.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from === -1 || to === -1) {
      setDragId(null);
      return;
    }
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    setDragId(null);
    const res = await projectImagesService.reorderProjectImages(projectId, galleryType, ids);
    if (!res.ok) {
      toast.error("שינוי הסדר נכשל");
      return;
    }
    setImages(res.data);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          {title && <h3 className="text-sm font-medium">{title}</h3>}
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={busySlot !== null}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUploadNew(f);
              e.target.value = "";
            }}
          />
          <span className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}>
            <ImagePlus className="h-4 w-4" />
            {busySlot === "new" ? "מעלה..." : "העלאת תמונה"}
          </span>
        </label>
      </div>

      {images === null ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : images.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          אין תמונות בגלריה זו עדיין.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img) => (
            <div
              key={img.id}
              draggable
              onDragStart={() => setDragId(img.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(img.id)}
              className="cursor-grab space-y-2 rounded-lg border border-border bg-card p-2 shadow-sm active:cursor-grabbing"
            >
              <img
                src={img.image_url}
                alt={img.alt_text ?? ""}
                className="h-28 w-full rounded-md object-cover"
              />
              <Input
                defaultValue={img.alt_text ?? ""}
                placeholder="טקסט חלופי"
                onBlur={(e) => handleAltBlur(img, e.target.value)}
              />
              <div className="flex gap-2">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={busySlot !== null}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleReplace(img, f);
                      e.target.value = "";
                    }}
                  />
                  <span
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "w-full gap-1.5",
                    )}
                  >
                    <Repeat className="h-3.5 w-3.5" />
                    {busySlot === img.id ? "מעלה..." : "החלפה"}
                  </span>
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="gap-1.5"
                  onClick={() => setDeleteTarget(img)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  מחיקה
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="מחיקת תמונה"
        description="האם למחוק את התמונה מהגלריה? הפעולה אינה הפיכה."
        busy={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Images } from "lucide-react";
import type { Recommendation, RecommendationInput } from "@/types/recommendation";
import * as recommendationsService from "@/services/recommendationsService";
import * as storageService from "@/services/storageService";
import type { MediaItem } from "@/services/storageService";
import { toYouTubeEmbedUrl } from "@/lib/youtube";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { MediaLibraryDialog } from "@/components/admin/MediaLibraryDialog";

type MediaType = Recommendation["media_type"];

interface Draft {
  mediaType: MediaType;
  imageUrl: string;
  imagePath: string | null;
  imageAlt: string;
  youtubeUrl: string;
  text: string;
}

const EMPTY: Draft = {
  mediaType: "image",
  imageUrl: "",
  imagePath: null,
  imageAlt: "",
  youtubeUrl: "",
  text: "",
};

function toDraft(rec: Recommendation | null): Draft {
  if (!rec) return { ...EMPTY };
  return {
    mediaType: rec.media_type,
    imageUrl: rec.image ?? "",
    imagePath: rec.image_path,
    imageAlt: rec.image_alt ?? "",
    youtubeUrl: rec.youtube_url ?? "",
    text: rec.text ?? "",
  };
}

function uploadErrorMessage(code: string): string {
  switch (code) {
    case "not_an_image":
      return "אפשר להעלות קובצי תמונה בלבד";
    case "file_too_large":
      return "הקובץ גדול מדי — עד 10MB";
    case "forbidden":
      return "אין לך הרשאה להעלות תמונות";
    default:
      return "העלאת התמונה נכשלה";
  }
}

/**
 * Add / edit one recommendation, in a dialog. Media is EITHER an image (picked
 * from the shared media library or uploaded, ALT required) OR a YouTube link
 * (any of watch / youtu.be / embed — converted to a safe embed URL here; no raw
 * HTML or <iframe> input). The caption is multi-line RTL. Everything is written
 * through recommendationsService, so this form has no idea whether the store is
 * the local mock or a future Supabase table.
 */
export function RecommendationForm({
  open,
  onOpenChange,
  recommendation,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recommendation: Recommendation | null;
  onSaved: () => void;
}) {
  const isEdit = !!recommendation;
  const [draft, setDraft] = useState<Draft>(() => toDraft(recommendation));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(toDraft(recommendation));
      setErrors({});
    }
  }, [open, recommendation]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const embedUrl = toYouTubeEmbedUrl(draft.youtubeUrl);
  const youtubeInvalid = draft.youtubeUrl.trim() !== "" && !embedUrl;

  async function handleUpload(file: File) {
    const precheck = storageService.validateImageFile(file);
    if (!precheck.ok) {
      toast.error(uploadErrorMessage(precheck.error));
      return;
    }
    setUploading(true);
    const up = await storageService.uploadImage(file, { folder: "recommendations" });
    setUploading(false);
    if (!up.ok) {
      toast.error(uploadErrorMessage(up.error));
      return;
    }
    setDraft((d) => ({ ...d, imageUrl: up.data.url, imagePath: up.data.path }));
  }

  function handlePickFromLibrary(item: MediaItem, alt: string) {
    setDraft((d) => ({
      ...d,
      imageUrl: item.url,
      imagePath: item.storagePath ?? null,
      imageAlt: d.imageAlt || alt || item.alt || "",
    }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (draft.mediaType === "image") {
      if (!draft.imageUrl) next.image = "יש לבחור או להעלות תמונה";
      if (!draft.imageAlt.trim()) next.imageAlt = "טקסט חלופי הוא חובה עבור תמונה";
    } else {
      if (!draft.youtubeUrl.trim()) next.youtubeUrl = "יש להזין קישור ל-YouTube";
      else if (!embedUrl) next.youtubeUrl = "הקישור אינו קישור YouTube תקין";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave() {
    if (saving || uploading) return;
    if (!validate()) return;

    const input: RecommendationInput = {
      media_type: draft.mediaType,
      image: draft.mediaType === "image" ? draft.imageUrl : null,
      image_path: draft.mediaType === "image" ? draft.imagePath : null,
      image_alt: draft.mediaType === "image" ? draft.imageAlt.trim() : null,
      youtube_url: draft.mediaType === "youtube" ? draft.youtubeUrl.trim() : null,
      text: draft.text,
    };

    setSaving(true);
    const res = recommendation
      ? await recommendationsService.updateRecommendation(recommendation.id, input)
      : await recommendationsService.createRecommendation(input);
    setSaving(false);

    if (!res.ok) {
      toast.error(res.error === "forbidden" ? "אין לך הרשאה" : "השמירה נכשלה");
      return;
    }
    toast.success(isEdit ? "ההמלצה עודכנה" : "ההמלצה נוספה");
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "עריכת המלצה" : "המלצה חדשה"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Media type */}
          <div className="space-y-2">
            <Label>סוג מדיה</Label>
            <RadioGroup
              value={draft.mediaType}
              onValueChange={(v) => set("mediaType", v as MediaType)}
              className="flex gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="image" id="mt-image" />
                <Label htmlFor="mt-image" className="font-normal">
                  תמונה
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="youtube" id="mt-youtube" />
                <Label htmlFor="mt-youtube" className="font-normal">
                  סרטון YouTube
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Image branch */}
          {draft.mediaType === "image" && (
            <div className="space-y-3 rounded-lg border border-border p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="aspect-video w-full shrink-0 overflow-hidden rounded-lg border border-border bg-muted sm:w-56">
                  {draft.imageUrl ? (
                    <img
                      src={draft.imageUrl}
                      alt={draft.imageAlt}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      אין תמונה
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setLibraryOpen(true)}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
                  >
                    <Images className="h-4 w-4" />
                    בחירה מספריית התמונות
                  </button>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUpload(f);
                        e.target.value = "";
                      }}
                    />
                    <span
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "gap-2",
                        uploading && "pointer-events-none opacity-50",
                      )}
                    >
                      <ImagePlus className="h-4 w-4" />
                      {uploading ? "מעלה..." : "העלאת תמונה"}
                    </span>
                  </label>
                </div>
              </div>
              {errors.image && <p className="text-xs text-destructive">{errors.image}</p>}

              <div className="space-y-1.5">
                <Label htmlFor="rec-alt">
                  טקסט חלופי (ALT) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="rec-alt"
                  value={draft.imageAlt}
                  onChange={(e) => set("imageAlt", e.target.value)}
                  placeholder="תיאור קצר של התמונה"
                />
                {errors.imageAlt && <p className="text-xs text-destructive">{errors.imageAlt}</p>}
              </div>
            </div>
          )}

          {/* YouTube branch */}
          {draft.mediaType === "youtube" && (
            <div className="space-y-3 rounded-lg border border-border p-3">
              <div className="space-y-1.5">
                <Label htmlFor="rec-yt">קישור YouTube</Label>
                <Input
                  id="rec-yt"
                  dir="ltr"
                  className="text-left"
                  value={draft.youtubeUrl}
                  onChange={(e) => set("youtubeUrl", e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <p className="text-xs text-muted-foreground">
                  מקבל קישורי youtube.com, youtu.be או embed. הקוד להטמעה נבנה אוטומטית — אין צורך
                  להדביק iframe.
                </p>
                {errors.youtubeUrl && (
                  <p className="text-xs text-destructive">{errors.youtubeUrl}</p>
                )}
                {youtubeInvalid && !errors.youtubeUrl && (
                  <p className="text-xs text-destructive">לא זוהה מזהה סרטון תקין בקישור.</p>
                )}
              </div>

              {embedUrl && (
                <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-black sm:max-w-md">
                  <iframe
                    src={embedUrl}
                    title="תצוגה מקדימה של סרטון ההמלצה"
                    className="h-full w-full"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          )}

          {/* Caption */}
          <div className="space-y-1.5">
            <Label htmlFor="rec-text">טקסט ההמלצה</Label>
            <Textarea
              id="rec-text"
              dir="rtl"
              rows={4}
              value={draft.text}
              onChange={(e) => set("text", e.target.value)}
              placeholder="הכיתוב שיוצג מתחת למדיה"
            />
            <p className="text-xs text-muted-foreground">מוצג מתחת למדיה. ניתן לכתוב בכמה שורות.</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button type="button" disabled={saving || uploading} onClick={handleSave}>
            {saving ? "שומר..." : isEdit ? "שמירת שינויים" : "הוספה"}
          </Button>
        </DialogFooter>

        <MediaLibraryDialog
          open={libraryOpen}
          onOpenChange={setLibraryOpen}
          title="בחירת תמונה להמלצה מספריית התמונות"
          onSelect={handlePickFromLibrary}
        />
      </DialogContent>
    </Dialog>
  );
}

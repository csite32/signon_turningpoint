import { type ReactNode, useEffect, useRef, useState } from "react";
import { useBlocker } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ImagePlus, Eye, Images, Save, Send } from "lucide-react";
import type { Project } from "@/types/project";
import * as projectsService from "@/services/projectsService";
import * as projectImagesService from "@/services/projectImagesService";
import * as storageService from "@/services/storageService";
import { slugify } from "@/services/util/slugify";
import { openPreviewTab } from "@/services/mock/preview-bridge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GalleryUploader } from "@/components/admin/GalleryUploader";
import { MediaLibraryDialog } from "@/components/admin/MediaLibraryDialog";

const schema = z.object({
  title: z.string().min(1, "כותרת הפרויקט נדרשת"),
  slug: z
    .string()
    .min(1, "slug נדרש")
    .regex(/^[a-z0-9-]+$/, "אותיות לועזיות קטנות, ספרות ומקפים בלבד"),
  hero_image_alt: z.string(),
  tagline: z.string(),
  challenge_text: z.string(),
  solution_text: z.string(),
  subtitle: z.string(),
  extra_paragraph: z.string(),
  result_text: z.string(),
  testimonial_text: z.string(),
});
type FormValues = z.infer<typeof schema>;

function toFormValues(p: Project): FormValues {
  return {
    title: p.title,
    slug: p.slug,
    hero_image_alt: p.hero_image_alt ?? "",
    tagline: p.tagline ?? "",
    challenge_text: p.challenge_text ?? "",
    solution_text: p.solution_text ?? "",
    subtitle: p.subtitle ?? "",
    extra_paragraph: p.extra_paragraph ?? "",
    result_text: p.result_text ?? "",
    testimonial_text: p.testimonial_text ?? "",
  };
}

/** One visual section of the editor — a titled card, consistent spacing across all nine sections. */
function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  );
}

/**
 * Full project editor: title/slug/hero image/tagline/challenge/solution/
 * subtitle/extra paragraph/result/testimonial (all wired through
 * projectsService), grouped into clearly separated sections, plus the three
 * GalleryUploader instances (edit mode only).
 *
 * Create mode (`isNew`, project.id === ""): nothing is persisted until the user
 * saves. The first "save draft" / "publish" is a SINGLE
 * projectsService.createProject(); after that project.id is real and every
 * later save is updateProject / publishProject. Galleries + preview stay hidden
 * until that first save (they need a real project id). A synchronous in-flight
 * ref guarantees a double-click / repeated Enter can never fire two
 * createProject() calls.
 */
export function ProjectForm({
  project,
  isNew = false,
  onSaved,
}: {
  project: Project;
  isNew?: boolean;
  onSaved: (p: Project) => void;
}) {
  const [slugTouched, setSlugTouched] = useState(project.slug !== slugify(project.title));
  const [heroImage, setHeroImage] = useState<{ url: string; path: string }>({
    url: project.hero_image_url ?? "",
    path: project.hero_image_path ?? "",
  });
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroLibraryOpen, setHeroLibraryOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [currentProject, setCurrentProject] = useState(project);

  // No real row yet — the first save is a createProject(), galleries + preview
  // stay hidden. `inFlight` is a synchronous guard on top of the `busy` state
  // so a double-click can't fire two createProject() calls before React re-renders.
  const isCreateMode = isNew && currentProject.id === "";
  const inFlight = useRef(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    getValues,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: toFormValues(project) });

  const title = watch("title");
  useEffect(() => {
    if (!slugTouched) setValue("slug", slugify(title || ""), { shouldDirty: true });
  }, [title, slugTouched, setValue]);

  const heroChanged = heroImage.url !== (currentProject.hero_image_url ?? "");
  const dirty = isDirty || heroChanged;
  const busy = saving || publishing;

  useBlocker({ shouldBlockFn: () => dirty, enableBeforeUnload: true, disabled: !dirty });

  async function handleHeroUpload(file: File) {
    const precheck = storageService.validateImageFile(file);
    if (!precheck.ok) {
      toast.error(
        precheck.error === "not_an_image"
          ? "אפשר להעלות קובץ תמונה בלבד"
          : precheck.error === "file_too_large"
            ? "הקובץ גדול מדי — עד 10MB"
            : "הקובץ אינו תקין",
      );
      return;
    }
    setHeroUploading(true);
    const up = await storageService.uploadImage(file, { folder: "hero" });
    setHeroUploading(false);
    if (!up.ok) {
      toast.error(
        up.error === "not_an_image"
          ? "אפשר להעלות קובץ תמונה בלבד"
          : up.error === "file_too_large"
            ? "הקובץ גדול מדי — עד 10MB"
            : up.error === "forbidden"
              ? "אין לך הרשאה להעלות תמונות"
              : "העלאת התמונה הראשית נכשלה",
      );
      return;
    }
    setHeroImage({ url: up.data.url, path: up.data.path });
  }

  /** projectsService error code -> message for the save / publish actions. */
  function saveErrorMessage(code: string): string {
    switch (code) {
      case "duplicate_slug":
        return "כתובת ה-slug כבר תפוסה. בחרו כתובת אחרת.";
      case "forbidden":
        return "אין לך הרשאה לשמור את הפרויקט.";
      case "not_found":
        return "הפרויקט לא נמצא — ייתכן שנמחק בינתיים.";
      default:
        return "השמירה נכשלה. נסו שוב.";
    }
  }

  function buildPatch(values: FormValues) {
    return {
      title: values.title,
      slug: values.slug,
      hero_image_url: heroImage.url || null,
      hero_image_path: heroImage.path || null,
      hero_image_alt: values.hero_image_alt || null,
      tagline: values.tagline || null,
      challenge_text: values.challenge_text || null,
      solution_text: values.solution_text || null,
      subtitle: values.subtitle || null,
      extra_paragraph: values.extra_paragraph || null,
      result_text: values.result_text || null,
      testimonial_text: values.testimonial_text || null,
    };
  }

  const onSaveDraft = handleSubmit(async (values) => {
    if (busy || inFlight.current) return;
    inFlight.current = true;
    setSaving(true);
    const res = isCreateMode
      ? await projectsService.createProject({ ...buildPatch(values), status: "draft" })
      : await projectsService.updateProject(currentProject.id, buildPatch(values));
    setSaving(false);
    inFlight.current = false;
    if (!res.ok) {
      toast.error(saveErrorMessage(res.error));
      return;
    }
    toast.success("נשמר כטיוטה");
    setCurrentProject(res.data);
    reset(toFormValues(res.data));
    onSaved(res.data);
  });

  const onPublish = handleSubmit(async (values) => {
    if (busy || inFlight.current) return;
    inFlight.current = true;
    setPublishing(true);

    if (isCreateMode) {
      // Brand-new project: one createProject() straight to "published" (it sets
      // published_at itself) — no separate publishProject() round-trip.
      const res = await projectsService.createProject({
        ...buildPatch(values),
        status: "published",
      });
      setPublishing(false);
      inFlight.current = false;
      if (!res.ok) {
        toast.error(saveErrorMessage(res.error));
        return;
      }
      toast.success("הפרויקט פורסם");
      setCurrentProject(res.data);
      reset(toFormValues(res.data));
      onSaved(res.data);
      return;
    }

    const patchRes = await projectsService.updateProject(currentProject.id, buildPatch(values));
    if (!patchRes.ok) {
      setPublishing(false);
      inFlight.current = false;
      toast.error(saveErrorMessage(patchRes.error));
      return;
    }
    const pubRes = await projectsService.publishProject(currentProject.id);
    setPublishing(false);
    inFlight.current = false;
    if (!pubRes.ok) {
      toast.error(pubRes.error === "forbidden" ? "אין לך הרשאה לפרסם" : "הפרסום נכשל");
      return;
    }
    toast.success("הפרויקט פורסם");
    setCurrentProject(pubRes.data);
    reset(toFormValues(pubRes.data));
    onSaved(pubRes.data);
  });

  async function handlePreview() {
    const values = getValues();
    const [main, brand, secondary] = await Promise.all([
      projectImagesService.getProjectImages(currentProject.id, "main_gallery"),
      projectImagesService.getProjectImages(currentProject.id, "brand_colors"),
      projectImagesService.getProjectImages(currentProject.id, "secondary_gallery"),
    ]);
    const images = [
      ...(main.ok ? main.data : []),
      ...(brand.ok ? brand.data : []),
      ...(secondary.ok ? secondary.data : []),
    ];
    // Includes any not-yet-saved edits currently in the form — works just as
    // well for a brand-new project that has no real slug yet. Opens in a new
    // tab, full-width, no dashboard chrome — see preview-bridge.ts for how
    // that tab gets this data without relying on cross-tab sessionStorage.
    const draftProject: Project = { ...currentProject, ...buildPatch(values) } as Project;
    openPreviewTab(draftProject, images);
  }

  return (
    <form dir="rtl" className="space-y-6 pb-28" onSubmit={(e) => e.preventDefault()}>
      <FormSection title="מידע ראשי">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="title">כותרת הפרויקט</Label>
            <Input id="title" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug" className="flex items-center justify-between">
              <span>slug</span>
              <button
                type="button"
                className="text-xs font-normal text-muted-foreground underline underline-offset-2"
                onClick={() => setSlugTouched(false)}
              >
                חשב אוטומטית מהכותרת
              </button>
            </Label>
            <Input
              id="slug"
              dir="ltr"
              className="text-left"
              {...register("slug", { onChange: () => setSlugTouched(true) })}
            />
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tagline">משפט מפתח ראשי</Label>
          <Input id="tagline" {...register("tagline")} />
        </div>
      </FormSection>

      <FormSection title="תמונה ראשית">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          {heroImage.url ? (
            <img
              src={heroImage.url}
              alt=""
              className="h-28 w-44 shrink-0 rounded-lg border border-border object-cover"
            />
          ) : (
            <div className="flex h-28 w-44 shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-muted text-xs text-muted-foreground">
              אין תמונה
            </div>
          )}
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={heroUploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleHeroUpload(f);
                    e.target.value = "";
                  }}
                />
                <span className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm shadow-sm hover:bg-accent">
                  <ImagePlus className="h-4 w-4" />
                  {heroUploading ? "מעלה..." : heroImage.url ? "החלפת תמונה" : "העלאת תמונה"}
                </span>
              </label>
              <button
                type="button"
                onClick={() => setHeroLibraryOpen(true)}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm shadow-sm hover:bg-accent"
              >
                <Images className="h-4 w-4" />
                בחירה מספריית התמונות
              </button>
            </div>
            <Input placeholder="טקסט חלופי לתמונה הראשית" {...register("hero_image_alt")} />
          </div>
        </div>
        <MediaLibraryDialog
          open={heroLibraryOpen}
          onOpenChange={setHeroLibraryOpen}
          title="בחירת תמונה ראשית מספריית התמונות"
          onSelect={(item, alt) => {
            setHeroImage({ url: item.url, path: item.storagePath ?? item.url });
            if (alt && !getValues("hero_image_alt")) {
              setValue("hero_image_alt", alt, { shouldDirty: true });
            }
          }}
        />
      </FormSection>

      <FormSection title="האתגר והפתרון">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="challenge_text">טקסט "האתגר"</Label>
            <Textarea id="challenge_text" rows={6} {...register("challenge_text")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="solution_text">טקסט "הפתרון"</Label>
            <Textarea id="solution_text" rows={6} {...register("solution_text")} />
          </div>
        </div>
      </FormSection>

      {isCreateMode && (
        <FormSection title="גלריות ותצוגה מקדימה">
          <p className="text-sm text-muted-foreground">
            שמרו תחילה את הפרויקט כטיוטה כדי להוסיף תמונות לגלריות ולהציג תצוגה מקדימה.
          </p>
        </FormSection>
      )}

      {!isCreateMode && (
        <FormSection title="גלריה ראשונה" description="עד ארבע תמונות. ניתן לגרור כדי לשנות סדר.">
          <GalleryUploader projectId={currentProject.id} galleryType="main_gallery" title="" />
        </FormSection>
      )}

      {!isCreateMode && (
        <FormSection
          title="צבעי המותג"
          description="שלוש התמונות המקוריות מוצגות בעמוד בדיוק כפי שהועלו — ללא עיבוד."
        >
          <GalleryUploader projectId={currentProject.id} galleryType="brand_colors" title="" />
        </FormSection>
      )}

      <FormSection title="תוכן נוסף">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="subtitle">כותרת משנה</Label>
            <Input id="subtitle" {...register("subtitle")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="extra_paragraph">פסקה נוספת</Label>
            <Textarea id="extra_paragraph" rows={4} {...register("extra_paragraph")} />
          </div>
        </div>
      </FormSection>

      {!isCreateMode && (
        <FormSection
          title="גלריה שנייה"
          description="עד ארבע תמונות. התמונה האחרונה מקבלת אפקט הרחבה למסך מלא בעמוד."
        >
          <GalleryUploader projectId={currentProject.id} galleryType="secondary_gallery" title="" />
        </FormSection>
      )}

      <FormSection title="התוצאה והמלצת הלקוח">
        <div className="space-y-1.5">
          <Label htmlFor="result_text">טקסט "התוצאה בשטח"</Label>
          <Textarea id="result_text" rows={5} {...register("result_text")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="testimonial_text">המלצת הלקוח</Label>
          <Textarea id="testimonial_text" rows={3} {...register("testimonial_text")} />
        </div>
      </FormSection>

      <FormSection title="סטטוס ופעולות">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted-foreground">סטטוס נוכחי:</span>
          <Badge variant={currentProject.status === "published" ? "default" : "secondary"}>
            {currentProject.status === "published" ? "פורסם" : "טיוטה"}
          </Badge>
          {dirty && <span className="text-xs text-muted-foreground">· יש שינויים שלא נשמרו</span>}
        </div>
      </FormSection>

      {/* Sticky action bar — always reachable, on desktop and mobile alike. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:right-64">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <Button
            type="button"
            size="lg"
            disabled={busy}
            onClick={onPublish}
            className="gap-2 bg-[#e14e50] text-white hover:bg-[#c93f41]"
          >
            <Send className="h-4 w-4" />
            {publishing
              ? "מפרסם..."
              : currentProject.status === "published"
                ? "עדכן ופרסם"
                : "פרסם"}
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            disabled={busy}
            onClick={onSaveDraft}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? "שומר..." : "שמור כטיוטה"}
          </Button>
          {!isCreateMode && (
            <Button
              type="button"
              size="lg"
              variant="ghost"
              onClick={handlePreview}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              תצוגה מקדימה
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}

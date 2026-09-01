import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  FolderKanban,
  GripVertical,
  Pencil,
  Plus,
  Send,
  Trash2,
  Undo2,
} from "lucide-react";
import type { Project, ProjectStatus } from "@/types/project";
import * as projectsService from "@/services/projectsService";
import * as projectImagesService from "@/services/projectImagesService";
import { openPreviewTab } from "@/services/mock/preview-bridge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";

type StatusFilter = "all" | ProjectStatus;

export function ProjectTable() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  async function load() {
    setError(null);
    const res = await projectsService.getProjects({
      status: statusFilter === "all" ? undefined : statusFilter,
      search,
    });
    if (!res.ok) {
      setError(res.error);
      setProjects([]);
      return;
    }
    setProjects(res.data);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  async function handleTogglePublish(project: Project) {
    if (pendingId) return;
    setPendingId(project.id);
    const res =
      project.status === "published"
        ? await projectsService.unpublishProject(project.id)
        : await projectsService.publishProject(project.id);
    setPendingId(null);
    if (!res.ok) {
      toast.error("הפעולה נכשלה");
      return;
    }
    toast.success(project.status === "published" ? "הפרויקט הוחזר לטיוטה" : "הפרויקט פורסם");
    load();
  }

  async function handlePreview(project: Project) {
    if (previewingId) return;
    setPreviewingId(project.id);
    const [main, brand, secondary] = await Promise.all([
      projectImagesService.getProjectImages(project.id, "main_gallery"),
      projectImagesService.getProjectImages(project.id, "brand_colors"),
      projectImagesService.getProjectImages(project.id, "secondary_gallery"),
    ]);
    setPreviewingId(null);
    const images = [
      ...(main.ok ? main.data : []),
      ...(brand.ok ? brand.data : []),
      ...(secondary.ok ? secondary.data : []),
    ];
    // Opens in a new tab via the BroadcastChannel handshake — see
    // preview-bridge.ts. Never a plain <a href>/window.location assignment,
    // which would just navigate this same tab away instead.
    openPreviewTab(project, images);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await projectsService.deleteProject(deleteTarget.id);
    setDeleting(false);
    if (!res.ok) {
      toast.error("מחיקת הפרויקט נכשלה");
      return;
    }
    toast.success("הפרויקט נמחק");
    setDeleteTarget(null);
    load();
  }

  // Reorder only in the unfiltered view — there the on-screen list IS the full
  // set, so writing sort_order = 0..n-1 keeps the archive, the homepage strip
  // and this table in one agreed sequence. A search/status filter hides that
  // control (see the hint below the header).
  const canReorder = statusFilter === "all" && search.trim() === "";

  async function persistOrder(orderedIds: string[]) {
    if (!projects || savingOrder) return;
    const byId = new Map(projects.map((p) => [p.id, p]));
    const reordered = orderedIds.map((id) => byId.get(id)).filter((p): p is Project => !!p);
    setProjects(reordered); // optimistic
    setSavingOrder(true);
    const res = await projectsService.reorderProjects(orderedIds);
    setSavingOrder(false);
    if (!res.ok) {
      toast.error("שינוי סדר הפרויקטים נכשל");
      load();
      return;
    }
    setProjects(res.data);
  }

  function moveRow(index: number, dir: -1 | 1) {
    if (!projects) return;
    const target = index + dir;
    if (target < 0 || target >= projects.length) return;
    const ids = projects.map((p) => p.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    persistOrder(ids);
  }

  function handleRowDrop(targetId: string) {
    if (!dragId || dragId === targetId || !projects) {
      setDragId(null);
      return;
    }
    const ids = projects.map((p) => p.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    setDragId(null);
    if (from === -1 || to === -1) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    persistOrder(ids);
  }

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <FolderKanban className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">פרויקטים</h1>
        </div>
        <Button
          size="lg"
          className="gap-2"
          onClick={() => navigate({ to: "/admin/dashboard/projects/$id", params: { id: "new" } })}
        >
          <Plus className="h-4 w-4" />
          פרויקט חדש
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center">
          <Input
            placeholder="חיפוש לפי כותרת או slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-xs"
          />
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסטטוסים</SelectItem>
              <SelectItem value="draft">טיוטה</SelectItem>
              <SelectItem value="published">פורסם</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="pt-6">
          {error && <p className="text-sm text-destructive">שגיאה בטעינת הפרויקטים: {error}</p>}

          {projects !== null && projects.length > 0 && (
            <p className="mb-4 text-xs text-muted-foreground">
              {canReorder
                ? "גררו שורה, או השתמשו בחיצים, כדי לשנות את סדר הפרויקטים בארכיון ובעמוד הבית."
                : "בטלו את הסינון והחיפוש כדי לשנות את סדר הפרויקטים."}
            </p>
          )}

          {projects === null ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : projects.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              אין פרויקטים תואמים לחיפוש.
            </p>
          ) : (
            <div className="-mx-6 overflow-x-auto px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    {canReorder && <TableHead className="w-24">סדר</TableHead>}
                    <TableHead>תמונה</TableHead>
                    <TableHead>כותרת</TableHead>
                    <TableHead>סטטוס</TableHead>
                    <TableHead>עדכון אחרון</TableHead>
                    <TableHead className="text-left">פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((p, index) => (
                    <TableRow
                      key={p.id}
                      draggable={canReorder}
                      onDragStart={canReorder ? () => setDragId(p.id) : undefined}
                      onDragOver={canReorder ? (e) => e.preventDefault() : undefined}
                      onDrop={canReorder ? () => handleRowDrop(p.id) : undefined}
                      className={canReorder ? "cursor-grab active:cursor-grabbing" : undefined}
                    >
                      {canReorder && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <GripVertical
                              className="h-4 w-4 shrink-0 text-muted-foreground"
                              aria-hidden="true"
                            />
                            <div className="flex flex-col">
                              <button
                                type="button"
                                aria-label={`הזז את "${p.title}" מעלה`}
                                disabled={index === 0 || savingOrder}
                                onClick={() => moveRow(index, -1)}
                                className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                aria-label={`הזז את "${p.title}" מטה`}
                                disabled={index === projects.length - 1 || savingOrder}
                                onClick={() => moveRow(index, 1)}
                                className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        {p.hero_image_url ? (
                          <img
                            src={p.hero_image_url}
                            alt=""
                            className="h-12 w-20 rounded-md object-cover"
                          />
                        ) : (
                          <div className="h-12 w-20 rounded-md bg-muted" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{p.title}</div>
                        <div dir="ltr" className="text-right text-xs text-muted-foreground">
                          /{p.slug}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.status === "published" ? "default" : "secondary"}>
                          {p.status === "published" ? "פורסם" : "טיוטה"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(p.updated_at).toLocaleDateString("he-IL")}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            disabled={previewingId === p.id}
                            onClick={() => handlePreview(p)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            תצוגה מקדימה
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={() =>
                              navigate({
                                to: "/admin/dashboard/projects/$id",
                                params: { id: p.id },
                              })
                            }
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            עריכה
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            disabled={pendingId === p.id}
                            onClick={() => handleTogglePublish(p)}
                          >
                            {p.status === "published" ? (
                              <Undo2 className="h-3.5 w-3.5" />
                            ) : (
                              <Send className="h-3.5 w-3.5" />
                            )}
                            {p.status === "published" ? "בטל פרסום" : "פרסם"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-1.5"
                            onClick={() => setDeleteTarget(p)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            מחיקה
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="מחיקת פרויקט"
        description={`האם למחוק לצמיתות את הפרויקט "${deleteTarget?.title ?? ""}"? הפעולה אינה הפיכה.`}
        busy={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

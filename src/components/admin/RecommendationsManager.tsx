import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  MessageSquareQuote,
  Pencil,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import type { Recommendation } from "@/types/recommendation";
import * as recommendationsService from "@/services/recommendationsService";
import { youTubeThumbnailUrl } from "@/lib/youtube";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";
import { RecommendationForm } from "@/components/admin/RecommendationForm";

/** Small media preview for a list row — image thumb, YouTube thumb, or a fallback tile. */
function RowMedia({ rec }: { rec: Recommendation }) {
  const ytThumb = rec.media_type === "youtube" ? youTubeThumbnailUrl(rec.youtube_url) : null;
  const src = rec.media_type === "image" ? rec.image : ytThumb;

  if (src) {
    return (
      <img
        src={src}
        alt={rec.media_type === "image" ? (rec.image_alt ?? "") : ""}
        className="h-12 w-20 rounded-md object-cover"
      />
    );
  }
  return (
    <div className="flex h-12 w-20 items-center justify-center rounded-md bg-muted text-muted-foreground">
      <Play className="h-4 w-4" />
    </div>
  );
}

export function RecommendationsManager() {
  const [items, setItems] = useState<Recommendation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Recommendation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Recommendation | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setError(null);
    const res = await recommendationsService.getRecommendations();
    if (!res.ok) {
      setError(res.error);
      setItems([]);
      return;
    }
    setItems(res.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function persistOrder(orderedIds: string[]) {
    if (!items || savingOrder) return;
    const byId = new Map(items.map((r) => [r.id, r]));
    const reordered = orderedIds.map((id) => byId.get(id)).filter((r): r is Recommendation => !!r);
    setItems(reordered); // optimistic
    setSavingOrder(true);
    const res = await recommendationsService.reorderRecommendations(orderedIds);
    setSavingOrder(false);
    if (!res.ok) {
      toast.error("שינוי סדר ההמלצות נכשל");
      load();
      return;
    }
    setItems(res.data);
  }

  function moveRow(index: number, dir: -1 | 1) {
    if (!items) return;
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const ids = items.map((r) => r.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    persistOrder(ids);
  }

  function handleRowDrop(targetId: string) {
    if (!dragId || dragId === targetId || !items) {
      setDragId(null);
      return;
    }
    const ids = items.map((r) => r.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    setDragId(null);
    if (from === -1 || to === -1) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    persistOrder(ids);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await recommendationsService.deleteRecommendation(deleteTarget.id);
    setDeleting(false);
    if (!res.ok) {
      toast.error("מחיקת ההמלצה נכשלה");
      return;
    }
    toast.success("ההמלצה נמחקה");
    setDeleteTarget(null);
    load();
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(rec: Recommendation) {
    setEditing(rec);
    setFormOpen(true);
  }

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <MessageSquareQuote className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">המלצות</h1>
        </div>
        <Button size="lg" className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          המלצה חדשה
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="mb-4 text-xs text-muted-foreground">
            ההמלצות מוצגות בסליידר שבתחתית עמוד הבית ועמוד אודות, לפי הסדר כאן. גררו שורה או השתמשו
            בחיצים כדי לשנות את הסדר.
          </p>

          {error && <p className="text-sm text-destructive">שגיאה בטעינת ההמלצות: {error}</p>}

          {items === null ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : items.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              עדיין אין המלצות. לחצו על „המלצה חדשה" כדי להוסיף.
            </p>
          ) : (
            <div className="-mx-6 overflow-x-auto px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">סדר</TableHead>
                    <TableHead>מדיה</TableHead>
                    <TableHead>טקסט</TableHead>
                    <TableHead className="text-left">פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((rec, index) => (
                    <TableRow
                      key={rec.id}
                      draggable
                      onDragStart={() => setDragId(rec.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleRowDrop(rec.id)}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <GripVertical
                            className="h-4 w-4 shrink-0 text-muted-foreground"
                            aria-hidden="true"
                          />
                          <div className="flex flex-col">
                            <button
                              type="button"
                              aria-label="הזז מעלה"
                              disabled={index === 0 || savingOrder}
                              onClick={() => moveRow(index, -1)}
                              className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label="הזז מטה"
                              disabled={index === items.length - 1 || savingOrder}
                              onClick={() => moveRow(index, 1)}
                              className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <RowMedia rec={rec} />
                          <Badge variant="secondary">
                            {rec.media_type === "image" ? "תמונה" : "YouTube"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-sm">
                        <p className="line-clamp-2 whitespace-pre-line text-sm text-muted-foreground">
                          {rec.text || "—"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={() => openEdit(rec)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            עריכה
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-1.5"
                            onClick={() => setDeleteTarget(rec)}
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

      <RecommendationForm
        open={formOpen}
        onOpenChange={setFormOpen}
        recommendation={editing}
        onSaved={load}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="מחיקת המלצה"
        description="האם למחוק את ההמלצה? הפעולה אינה הפיכה."
        busy={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

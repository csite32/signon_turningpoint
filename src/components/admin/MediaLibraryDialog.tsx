import { useCallback, useEffect, useMemo, useState } from "react";
import { ImageOff, RefreshCw, Search } from "lucide-react";
import * as storageService from "@/services/storageService";
import type { MediaItem } from "@/services/storageService";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

/** Stable empty reference so the `filtered` useMemo doesn't re-run every render. */
const EMPTY_ITEMS: MediaItem[] = [];

/**
 * Reusable "choose from the project media library" picker. Shared by the hero
 * image field and all three galleries in ProjectForm. It never uploads — the
 * caller gets back the existing image's `url` / `storage_path` plus a
 * per-use ALT the picker collects, and does whatever "use this" means for
 * that slot (set the hero fields, or insert one new project_images row).
 *
 * The Dialog already handles Escape, backdrop click, the X button and focus
 * trapping; the thumbnail grid is a keyboard-navigable list of buttons.
 */
export function MediaLibraryDialog({
  open,
  onOpenChange,
  onSelect,
  title = "בחירה מספריית התמונות",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: MediaItem, alt: string) => void;
  title?: string;
}) {
  const [state, setState] = useState<
    { status: "loading" } | { status: "error" } | { status: "ready"; items: MediaItem[] }
  >({ status: "loading" });
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [alt, setAlt] = useState("");

  const load = useCallback(async () => {
    setState({ status: "loading" });
    const res = await storageService.listMediaLibrary();
    setState(res.ok ? { status: "ready", items: res.data } : { status: "error" });
  }, []);

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setSelectedKey(null);
    setAlt("");
    load();
  }, [open, load]);

  const items = state.status === "ready" ? state.items : EMPTY_ITEMS;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) => it.name.toLowerCase().includes(q) || (it.alt ?? "").toLowerCase().includes(q),
    );
  }, [items, search]);

  const selected = items.find((it) => it.key === selectedKey) ?? null;

  function pick(item: MediaItem) {
    setSelectedKey(item.key);
    setAlt(item.alt ?? "");
  }

  function confirm() {
    if (!selected) return;
    onSelect(selected, alt.trim());
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pr-9 pl-3"
            placeholder="חיפוש לפי שם קובץ או טקסט חלופי..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="חיפוש בספריית התמונות"
          />
        </div>

        <div
          className="max-h-[46vh] min-h-[220px] overflow-y-auto rounded-lg border border-border p-3"
          aria-live="polite"
        >
          {state.status === "loading" && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full" />
              ))}
            </div>
          )}

          {state.status === "error" && (
            <div className="flex flex-col items-center gap-3 py-12 text-center text-sm text-muted-foreground">
              <ImageOff className="h-8 w-8" />
              <p>טעינת ספריית התמונות נכשלה.</p>
              <Button type="button" variant="outline" size="sm" className="gap-2" onClick={load}>
                <RefreshCw className="h-3.5 w-3.5" />
                נסו שוב
              </Button>
            </div>
          )}

          {state.status === "ready" && filtered.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {items.length === 0
                ? "אין עדיין תמונות בספריית הפרויקטים."
                : "אין תמונות שתואמות לחיפוש."}
            </p>
          )}

          {state.status === "ready" && filtered.length > 0 && (
            <ul
              className="grid grid-cols-3 gap-3 sm:grid-cols-4"
              role="listbox"
              aria-label="תמונות"
            >
              {filtered.map((it) => {
                const active = it.key === selectedKey;
                return (
                  <li key={it.key} role="option" aria-selected={active}>
                    <button
                      type="button"
                      onClick={() => pick(it)}
                      onDoubleClick={() => {
                        pick(it);
                        onSelect(it, (it.alt ?? "").trim());
                        onOpenChange(false);
                      }}
                      title={it.name}
                      className={`group relative block w-full overflow-hidden rounded-md border-2 transition-colors ${
                        active ? "border-primary" : "border-transparent hover:border-border"
                      }`}
                    >
                      <img
                        src={it.url}
                        alt={it.alt ?? it.name}
                        loading="lazy"
                        className="aspect-square w-full bg-muted object-cover"
                      />
                      <span className="block truncate px-1.5 py-1 text-right text-[11px] text-muted-foreground">
                        {it.name}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {selected && (
          <div className="flex items-start gap-3 rounded-lg border border-border p-3">
            <img
              src={selected.url}
              alt={selected.alt ?? selected.name}
              className="h-20 w-28 shrink-0 rounded-md border border-border object-cover"
            />
            <div className="min-w-0 flex-1 space-y-1.5">
              <p dir="ltr" className="truncate text-right text-xs text-muted-foreground">
                {selected.name}
              </p>
              <Label htmlFor="media-alt" className="text-xs">
                טקסט חלופי לשימוש זה
              </Label>
              <Input
                id="media-alt"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="תיאור התמונה"
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button type="button" disabled={!selected} onClick={confirm}>
            בחירת התמונה
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

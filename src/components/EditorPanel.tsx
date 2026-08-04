import { useEffect, useRef, useState } from "react";
import { useEditorSession } from "@/hooks/use-editor-session";
import { upsertOverride, resetOverride } from "@/lib/editor/overrides-repo";

export function EditorPanel() {
  const { isSignedIn } = useEditorSession();
  const [elementId, setElementId] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const originals = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!isSignedIn) return;
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const el = target?.closest?.("[data-editor-id]") as HTMLElement | null;
      if (!el) return;
      if (el.closest("[data-editor-panel]")) return;
      e.preventDefault();
      e.stopPropagation();
      const id = el.getAttribute("data-editor-id")!;
      if (!(id in originals.current)) {
        originals.current[id] = el.textContent ?? "";
      }
      setError(null);
      setElementId(id);
      setValue(el.textContent ?? "");
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [isSignedIn]);

  if (!isSignedIn || !elementId) return null;

  const currentEl = () =>
    document.querySelector(`[data-editor-id="${elementId}"]`) as HTMLElement | null;

  async function handleSave() {
    if (!elementId) return;
    setBusy(true);
    setError(null);
    try {
      await upsertOverride(elementId, "page", "index", { text: value });
      const el = currentEl();
      if (el) el.textContent = value;
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בשמירה");
    }
    setBusy(false);
  }

  async function handleReset() {
    if (!elementId) return;
    setBusy(true);
    setError(null);
    try {
      await resetOverride(elementId);
      const original = originals.current[elementId] ?? "";
      const el = currentEl();
      if (el) el.textContent = original;
      setValue(original);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה באיפוס");
    }
    setBusy(false);
  }

  const card: React.CSSProperties = {
    position: "fixed",
    bottom: "12px",
    right: "12px",
    zIndex: 999998,
    background: "#ffffff",
    color: "#1f2937",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: "13px",
    lineHeight: 1.4,
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.12)",
    direction: "rtl",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    width: "300px",
  };

  const heading: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: 600,
    margin: 0,
    color: "#111827",
  };

  const button: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: 500,
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    background: "#111827",
    color: "#ffffff",
  };

  const secondary: React.CSSProperties = {
    ...button,
    background: "#f3f4f6",
    color: "#111827",
    border: "1px solid #d1d5db",
  };

  const disabled: React.CSSProperties = { opacity: 0.55, cursor: "not-allowed" };

  return (
    <div style={card} data-editor-panel="">
      <p style={heading}>עריכת אלמנט</p>
      <span style={{ fontSize: "11px", color: "#6b7280", direction: "ltr", textAlign: "left" }}>
        {elementId}
      </span>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={4}
        style={{
          fontSize: "13px",
          padding: "6px 8px",
          borderRadius: "6px",
          border: "1px solid #d1d5db",
          width: "100%",
          boxSizing: "border-box",
          resize: "vertical",
        }}
      />
      <div style={{ display: "flex", gap: "8px" }}>
        <button type="button" onClick={handleSave} disabled={busy} style={busy ? { ...button, ...disabled } : button}>
          שמירה
        </button>
        <button type="button" onClick={handleReset} disabled={busy} style={busy ? { ...secondary, ...disabled } : secondary}>
          איפוס
        </button>
        <button type="button" onClick={() => setElementId(null)} disabled={busy} style={busy ? { ...secondary, ...disabled } : secondary}>
          סגירה
        </button>
      </div>
      {error && <span style={{ color: "#dc2626", fontSize: "12px" }}>{error}</span>}
    </div>
  );
}

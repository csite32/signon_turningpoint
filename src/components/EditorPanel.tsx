import { useEffect } from "react";
import { initEditorPanel, destroyEditorPanel } from "@/lib/editor/editor-ui";
import "@/lib/editor/editor-ui.css";

export function EditorPanel() {
  useEffect(() => {
    initEditorPanel();
    return () => {
      destroyEditorPanel();
    };
  }, []);

  return null;
}

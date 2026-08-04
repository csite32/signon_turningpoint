import { useEffect } from "react";
import { useEditorSession } from "@/hooks/use-editor-session";
import { isEditorEnvironment } from "@/lib/editor/environment";
import { initEditorPanel, destroyEditorPanel } from "@/lib/editor/editor-ui";
import "@/lib/editor/editor-ui.css";

export function EditorPanel() {
  const { isSignedIn } = useEditorSession();
  const active = isEditorEnvironment() && isSignedIn;

  useEffect(() => {
    if (!active) return;
    initEditorPanel();
    return () => {
      destroyEditorPanel();
    };
  }, [active]);

  return null;
}

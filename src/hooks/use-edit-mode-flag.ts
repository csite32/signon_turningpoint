import { useEffect, useState } from "react";
import { isEditModeEnabled, onEditModeChange } from "@/lib/editor/edit-mode";

export function useEditModeFlag(): boolean {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    setEnabled(isEditModeEnabled());
    return onEditModeChange(() => setEnabled(isEditModeEnabled()));
  }, []);
  return enabled;
}

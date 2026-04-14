"use client";

import { useCallback } from "react";
import { useCanvasStore } from "@/store/canvasStore";
import type { ClaudeLayout } from "@/utils/zodSchemas";

export function useHistory(
  loadLayout: (layout: ClaudeLayout) => Promise<void>
) {
  const { undo: storeUndo, redo: storeRedo } = useCanvasStore();

  const undo = useCallback(async () => {
    const layout = storeUndo();
    if (layout) await loadLayout(layout);
  }, [storeUndo, loadLayout]);

  const redo = useCallback(async () => {
    const layout = storeRedo();
    if (layout) await loadLayout(layout);
  }, [storeRedo, loadLayout]);

  return { undo, redo };
}

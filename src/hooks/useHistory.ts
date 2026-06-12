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
    if (!layout) return;
    try {
      await loadLayout(layout);
    } catch (err) {
      console.error("[History] undo failed:", err);
    }
  }, [storeUndo, loadLayout]);

  const redo = useCallback(async () => {
    const layout = storeRedo();
    if (!layout) return;
    try {
      await loadLayout(layout);
    } catch (err) {
      console.error("[History] redo failed:", err);
    }
  }, [storeRedo, loadLayout]);

  return { undo, redo };
}

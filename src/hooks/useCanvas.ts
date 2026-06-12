"use client";

import { useEffect, useRef, useCallback } from "react";
import { useCanvasStore } from "@/store/canvasStore";
import type { ClaudeLayout } from "@/utils/zodSchemas";
import type { Canvas as FabricCanvas, FabricObject } from "fabric";

export function useCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const fabricRef = useRef<FabricCanvas | null>(null);
  const fabricModuleRef = useRef<typeof import("fabric") | null>(null);
  const {
    format,
    setLayers,
    setSelectedLayerId,
    updateLayerVisibility,
    updateLayerLock,
  } = useCanvasStore();

  // Sync layers from canvas objects
  const syncLayers = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const objects = canvas.getObjects();
    const layers = objects
      .filter((o) => o.layra)
      .map((o, i) => ({
        id: o.layra!.id,
        name: o.layra!.name,
        type: o.layra!.elementType,
        visible: o.layra!.visible,
        locked: o.layra!.locked,
        zIndex: i,
      }))
      .reverse(); // Top layer first in panel
    setLayers(layers);
  }, [setLayers]);

  // Initialize Fabric canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    let canvas: FabricCanvas;

    (async () => {
      const fabric = await import("fabric");
      fabricModuleRef.current = fabric;

      canvas = new fabric.Canvas(canvasRef.current!, {
        backgroundColor: "#1a1a2e",
        selection: true,
        preserveObjectStacking: true,
        width: format.width,
        height: format.height,
      });
      fabricRef.current = canvas;

      // Selection events
      canvas.on("selection:created", (e) => {
        const active = e.selected?.[0];
        if (active?.layra) setSelectedLayerId(active.layra.id);
      });
      canvas.on("selection:updated", (e) => {
        const active = e.selected?.[0];
        if (active?.layra) setSelectedLayerId(active.layra.id);
      });
      canvas.on("selection:cleared", () => setSelectedLayerId(null));

      // Object modification → sync layers
      canvas.on("object:modified", syncLayers);
      canvas.on("object:added", syncLayers);
      canvas.on("object:removed", syncLayers);
    })();

    return () => {
      fabricRef.current?.dispose();
      fabricRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resize canvas when format changes
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.set({ width: format.width, height: format.height });
    canvas.renderAll();
  }, [format]);

  const loadLayout = useCallback(
    async (layout: ClaudeLayout) => {
      const canvas = fabricRef.current;
      const fabric = fabricModuleRef.current;
      if (!canvas || !fabric) return;

      const { jsonToCanvas } = await import("@/utils/jsonToCanvas");
      await jsonToCanvas(layout, canvas, fabric);
      syncLayers();
    },
    [syncLayers]
  );

  const addText = useCallback(() => {
    const canvas = fabricRef.current;
    const fabric = fabricModuleRef.current;
    if (!canvas || !fabric) return;
    const id = `text_${Date.now()}`;
    const text = new fabric.Textbox("Cliquez pour éditer", {
      left: 100,
      top: 100,
      width: 400,
      fontSize: 36,
      fill: "#ffffff",
      fontFamily: "Inter",
    });
    text.layra = { id, name: "Texte", elementType: "text", locked: false, visible: true };
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  }, []);

  const addShape = useCallback((shapeType: "rect" | "circle" | "triangle") => {
    const canvas = fabricRef.current;
    const fabric = fabricModuleRef.current;
    if (!canvas || !fabric) return;
    const id = `shape_${Date.now()}`;
    let shape: FabricObject;
    const opts = { left: 200, top: 200, fill: "#6366f1", width: 200, height: 200 };
    if (shapeType === "circle") {
      shape = new fabric.Ellipse({ ...opts, rx: 100, ry: 100 });
    } else if (shapeType === "triangle") {
      shape = new fabric.Triangle(opts);
    } else {
      shape = new fabric.Rect({ ...opts, rx: 8, ry: 8 });
    }
    shape.layra = { id, name: shapeType, elementType: "shape", locked: false, visible: true, shapeType };
    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
  }, []);

  const addImage = useCallback(async (url: string) => {
    const canvas = fabricRef.current;
    const fabric = fabricModuleRef.current;
    if (!canvas || !fabric) return;
    try {
      const id = `image_${Date.now()}`;
      const img = await fabric.FabricImage.fromURL(url, { crossOrigin: "anonymous" });
      img.scaleToWidth(400);
      img.set({ left: 100, top: 100 });
      img.layra = { id, name: "Image", elementType: "image", locked: false, visible: true };
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
    } catch {
      console.error("Failed to load image");
    }
  }, []);

  const deleteSelected = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObjects();
    if (active.length > 0) {
      canvas.remove(...active);
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  }, []);

  const setLayerVisible = useCallback(
    (id: string, visible: boolean) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const obj = canvas.getObjects().find((o) => o.layra?.id === id);
      if (obj) {
        obj.visible = visible;
        if (obj.layra) obj.layra.visible = visible;
        canvas.renderAll();
      }
      updateLayerVisibility(id, visible);
    },
    [updateLayerVisibility]
  );

  const setLayerLocked = useCallback(
    (id: string, locked: boolean) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const obj = canvas.getObjects().find((o) => o.layra?.id === id);
      if (obj) {
        obj.selectable = !locked;
        obj.evented = !locked;
        if (obj.layra) obj.layra.locked = locked;
        canvas.renderAll();
      }
      updateLayerLock(id, locked);
    },
    [updateLayerLock]
  );

  const selectLayerById = useCallback((id: string) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const obj = canvas.getObjects().find((o) => o.layra?.id === id);
    if (obj) {
      canvas.setActiveObject(obj);
      canvas.renderAll();
    }
  }, []);

  const addSvg = useCallback(async (svgString: string) => {
    const canvas = fabricRef.current;
    const fabric = fabricModuleRef.current;
    if (!canvas || !fabric) return;
    const id = `svg_${Date.now()}`;
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    try {
      const img = await fabric.FabricImage.fromURL(url, { crossOrigin: "anonymous" });
      img.scaleToWidth(Math.min(400, canvas.width!));
      img.set({ left: 100, top: 100 });
      img.layra = { id, name: "SVG vectoriel", elementType: "image", locked: false, visible: true };
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
    } finally {
      URL.revokeObjectURL(url);
    }
  }, []);

  const exportPNG = useCallback((): string => {
    const canvas = fabricRef.current;
    if (!canvas) return "";
    return canvas.toDataURL({ format: "png", multiplier: 1 });
  }, []);

  const exportJPEG = useCallback((): string => {
    const canvas = fabricRef.current;
    if (!canvas) return "";
    return canvas.toDataURL({ format: "jpeg", quality: 0.92, multiplier: 1 });
  }, []);

  const getActiveObject = useCallback(() => {
    return fabricRef.current?.getActiveObject() ?? null;
  }, []);

  const updateActiveObjectStyle = useCallback(
    (styles: Record<string, unknown>) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const active = canvas.getActiveObject();
      if (active) {
        active.set(styles as Parameters<typeof active.set>[0]);
        canvas.renderAll();
      }
    },
    []
  );

  return {
    fabricRef,
    loadLayout,
    addText,
    addShape,
    addImage,
    addSvg,
    deleteSelected,
    setLayerVisible,
    setLayerLocked,
    selectLayerById,
    exportPNG,
    exportJPEG,
    getActiveObject,
    updateActiveObjectStyle,
    syncLayers,
  };
}

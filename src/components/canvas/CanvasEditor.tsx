"use client";

import { useRef, useState, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";
import { useCanvas } from "@/hooks/useCanvas";
import { useHistory } from "@/hooks/useHistory";
import { useAI } from "@/hooks/useAI";
import { useCanvasStore, CANVAS_FORMATS } from "@/store/canvasStore";
import { Toolbar } from "./Toolbar";
import { GenerationOverlay } from "@/components/ai/GenerationOverlay";
import type { FabricObject } from "fabric";
import type { ClaudeLayout } from "@/utils/zodSchemas";

type Tool = "select" | "text" | "rect" | "circle" | "triangle" | "image";

export type CanvasEditorHandle = {
  exportPNG: () => string;
  exportJPEG: () => string;
  getActiveObject: () => FabricObject | null;
  updateActiveObjectStyle: (styles: Record<string, unknown>) => void;
  setLayerVisible: (id: string, visible: boolean) => void;
  setLayerLocked: (id: string, locked: boolean) => void;
  selectLayerById: (id: string) => void;
  loadLayout: (layout: ClaudeLayout) => Promise<void>;
};

export const CanvasEditor = forwardRef<CanvasEditorHandle, {}>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [scale, setScale] = useState(0.4);

  const {
    format,
    isGenerating,
    generationProgress,
    generationError,
    historyIndex,
    history,
    setFormat,
    setGenerationError,
  } = useCanvasStore();

  const {
    fabricRef,
    loadLayout,
    addText,
    addShape,
    addImage,
    deleteSelected,
    exportPNG,
    exportJPEG,
    getActiveObject,
    updateActiveObjectStyle,
    setLayerVisible,
    setLayerLocked,
    selectLayerById,
  } = useCanvas(canvasRef);

  const { undo, redo } = useHistory(loadLayout);
  const { generate } = useAI(fabricRef, loadLayout);

  useImperativeHandle(ref, () => ({
    exportPNG,
    exportJPEG,
    getActiveObject,
    updateActiveObjectStyle,
    setLayerVisible,
    setLayerLocked,
    selectLayerById,
    loadLayout,
  }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        redo();
      }
      if (e.key === "Delete" || e.key === "Backspace") deleteSelected();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, deleteSelected]);

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      const padding = 80;
      setScale(Math.min((width - padding) / format.width, (height - padding) / format.height, 1));
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [format]);

  const handleAddImage = useCallback(() => fileInputRef.current?.click(), []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await addImage(URL.createObjectURL(file));
      setActiveTool("select");
    },
    [addImage]
  );

  useEffect(() => {
    const onGenerate = (e: Event) => {
      const ce = e as CustomEvent<{ prompt: string; reprompt: boolean }>;
      generate(ce.detail.prompt, ce.detail.reprompt);
    };
    window.addEventListener("layra:generate", onGenerate);
    return () => window.removeEventListener("layra:generate", onGenerate);
  }, [generate]);

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border-b border-zinc-800 overflow-x-auto">
        <span className="text-xs text-zinc-500 shrink-0">Format :</span>
        {CANVAS_FORMATS.map((f) => (
          <button
            key={f.name}
            onClick={() => setFormat(f)}
            className={`text-xs px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
              format.name === f.name
                ? "bg-rose-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
            }`}
          >
            {f.name}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <Toolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          onAddText={() => { addText(); setActiveTool("select"); }}
          onAddShape={(t) => { addShape(t); setActiveTool("select"); }}
          onAddImage={handleAddImage}
          onDelete={deleteSelected}
          onUndo={undo}
          onRedo={redo}
          historyIndex={historyIndex}
          historyLength={history.length}
        />

        <div
          ref={containerRef}
          className="flex-1 flex items-center justify-center canvas-workspace overflow-hidden relative"
        >
          {(isGenerating || generationError) && (
            <GenerationOverlay
              progress={generationProgress}
              isError={!!generationError}
              onDismiss={generationError ? () => setGenerationError(null) : undefined}
            />
          )}

          <div
            style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}
            className="shadow-2xl shadow-black/50"
          >
            <canvas ref={canvasRef} />
          </div>

          <div className="absolute bottom-4 right-4 text-xs text-zinc-600 bg-zinc-900 px-2 py-1 rounded-md">
            {Math.round(scale * 100)}% — {format.width}×{format.height}px
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
});

CanvasEditor.displayName = "CanvasEditor";

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
import { cn } from "@/lib/utils";

type Tool = "select" | "text" | "rect" | "circle" | "triangle" | "image";

export type CanvasEditorHandle = {
  exportPNG: () => string; exportJPEG: () => string;
  getActiveObject: () => FabricObject | null;
  updateActiveObjectStyle: (s: Record<string,unknown>) => void;
  setLayerVisible: (id: string, v: boolean) => void;
  setLayerLocked: (id: string, v: boolean) => void;
  selectLayerById: (id: string) => void;
  loadLayout: (l: ClaudeLayout) => Promise<void>;
  addSvg: (s: string) => Promise<void>;
};

export const CanvasEditor = forwardRef<CanvasEditorHandle>((_, ref) => {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [scale, setScale] = useState(0.4);

  const { format, isGenerating, generationProgress, generationError, historyIndex, history, setFormat, setGenerationError } = useCanvasStore();
  const showOverlay = isGenerating || !!generationError;

  const { fabricRef, loadLayout, addText, addShape, addImage, addSvg, deleteSelected, exportPNG, exportJPEG, getActiveObject, updateActiveObjectStyle, setLayerVisible, setLayerLocked, selectLayerById } = useCanvas(canvasRef);
  const { undo, redo } = useHistory(loadLayout);
  const { generate }   = useAI(fabricRef, loadLayout);

  useImperativeHandle(ref, () => ({ exportPNG, exportJPEG, getActiveObject, updateActiveObjectStyle, setLayerVisible, setLayerLocked, selectLayerById, loadLayout, addSvg }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") { e.preventDefault(); redo(); }
      if (e.key === "Delete" || e.key === "Backspace") deleteSelected();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, deleteSelected]);

  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      setScale(Math.min((width - 80) / format.width, (height - 80) / format.height, 1));
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [format]);

  const handleAddImage   = useCallback(() => fileInputRef.current?.click(), []);
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    await addImage(url);
    URL.revokeObjectURL(url);
    e.target.value = "";
    setActiveTool("select");
  }, [addImage]);

  useEffect(() => {
    const onGen = (e: Event) => {
      const ce = e as CustomEvent<{ prompt: string; reprompt: boolean }>;
      generate(ce.detail.prompt, ce.detail.reprompt);
    };
    window.addEventListener("layra:generate", onGen);
    return () => window.removeEventListener("layra:generate", onGen);
  }, [generate]);

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg-base)" }}>
      {/* Format bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b shrink-0 overflow-x-auto" style={{ background: "var(--bg-panel)", borderColor: "var(--border-dim)" }}>
        <span className="text-[10px] font-semibold text-white/20 uppercase tracking-widest shrink-0">Format</span>
        <div className="w-px h-3 mx-1" style={{ background: "var(--border)" }} />
        {CANVAS_FORMATS.map((f) => (
          <button
            key={f.name}
            onClick={() => setFormat(f)}
            className={cn(
              "text-[11px] px-3 py-1 rounded-full whitespace-nowrap font-semibold transition-all duration-150 border",
              format.name === f.name
                ? "btn-accent text-white border-transparent shadow-sm"
                : "text-white/35 border-white/[0.07] hover:text-white/70 hover:border-white/[0.14]"
            )}
            style={format.name !== f.name ? { background: "var(--bg-card)" } : {}}
          >
            {f.name}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <Toolbar
          activeTool={activeTool} onToolChange={setActiveTool}
          onAddText={() => { addText(); setActiveTool("select"); }}
          onAddShape={(t) => { addShape(t); setActiveTool("select"); }}
          onAddImage={handleAddImage} onDelete={deleteSelected}
          onUndo={undo} onRedo={redo}
          historyIndex={historyIndex} historyLength={history.length}
        />

        <div ref={containerRef} className="flex-1 flex items-center justify-center canvas-workspace overflow-hidden relative">
          {showOverlay && (
            <GenerationOverlay
              progress={generationError ?? generationProgress}
              isError={!!generationError}
              onDismiss={generationError ? () => setGenerationError(null) : undefined}
            />
          )}
          <div style={{ transform: `scale(${scale})`, transformOrigin: "center center" }} className="shadow-2xl shadow-black/70">
            <canvas ref={canvasRef} />
          </div>
          <div className="absolute bottom-3 right-3 text-[10px] text-white/20 font-mono px-2 py-1 rounded-md border" style={{ background: "var(--bg-panel)", borderColor: "var(--border-dim)" }}>
            {Math.round(scale * 100)}% · {format.width}×{format.height}
          </div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  );
});

CanvasEditor.displayName = "CanvasEditor";

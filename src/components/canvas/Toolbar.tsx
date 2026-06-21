"use client";

import { MousePointer2, Type, Square, Circle, Triangle, ImagePlus, Trash2, Undo2, Redo2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Tool = "select" | "text" | "rect" | "circle" | "triangle" | "image";
type Props = {
  activeTool: Tool; onToolChange: (t: Tool) => void;
  onAddText: () => void; onAddShape: (t: "rect"|"circle"|"triangle") => void; onAddImage: () => void;
  onDelete: () => void; onUndo: () => void; onRedo: () => void;
  historyIndex?: number; historyLength?: number;
};

const tools = [
  { id: "select"   as Tool, icon: MousePointer2, label: "Sélectionner" },
  { id: "text"     as Tool, icon: Type,          label: "Texte"        },
  { id: "rect"     as Tool, icon: Square,        label: "Rectangle"    },
  { id: "circle"   as Tool, icon: Circle,        label: "Cercle"       },
  { id: "triangle" as Tool, icon: Triangle,      label: "Triangle"     },
  { id: "image"    as Tool, icon: ImagePlus,     label: "Image"        },
];

export function Toolbar({ activeTool, onToolChange, onAddText, onAddShape, onAddImage, onDelete, onUndo, onRedo, historyIndex = -1, historyLength = 0 }: Props) {
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyLength - 1;

  function handleToolClick(tool: Tool) {
    onToolChange(tool);
    if (tool === "text") onAddText();
    else if (tool === "rect" || tool === "circle" || tool === "triangle") onAddShape(tool);
    else if (tool === "image") onAddImage();
  }

  return (
    <div className="flex flex-col items-center gap-0.5 py-3 px-1.5 border-r w-11" style={{ background: "var(--bg-panel)", borderColor: "var(--border-dim)" }}>
      {/* Undo / Redo */}
      <button onClick={onUndo} disabled={!canUndo} title="Annuler (Ctrl+Z)"
        className={cn("w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
          canUndo ? "text-white/45 hover:text-white hover:bg-white/[0.07]" : "text-white/12 cursor-not-allowed")}>
        <Undo2 size={15} />
      </button>
      <button onClick={onRedo} disabled={!canRedo} title="Refaire (Ctrl+Y)"
        className={cn("w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
          canRedo ? "text-white/45 hover:text-white hover:bg-white/[0.07]" : "text-white/12 cursor-not-allowed")}>
        <Redo2 size={15} />
      </button>

      {historyLength > 0 && (
        <span className="text-[8px] text-white/15 tabular-nums font-mono mt-0.5">
          {historyIndex + 1}/{historyLength}
        </span>
      )}

      <div className="w-5 h-px my-2" style={{ background: "var(--border-dim)" }} />

      {/* Tools */}
      {tools.map((t) => (
        <button key={t.id} onClick={() => handleToolClick(t.id)} title={t.label}
          className={cn("w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 relative",
            activeTool === t.id ? "text-white" : "text-white/30 hover:text-white hover:bg-white/[0.07]")}>
          {activeTool === t.id && <span className="absolute inset-0 rounded-lg btn-accent" />}
          <t.icon size={15} className="relative z-10" />
        </button>
      ))}

      <div className="w-5 h-px my-2" style={{ background: "var(--border-dim)" }} />

      <button onClick={onDelete} title="Supprimer"
        className="w-8 h-8 flex items-center justify-center rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150">
        <Trash2 size={15} />
      </button>
    </div>
  );
}

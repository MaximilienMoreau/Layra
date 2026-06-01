"use client";

import { MousePointer2, Type, Square, Circle, Triangle, ImagePlus, Trash2, Undo2, Redo2, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Tool = "select" | "text" | "rect" | "circle" | "triangle" | "image";

type Props = {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  onAddText: () => void;
  onAddShape: (type: "rect" | "circle" | "triangle") => void;
  onAddImage: () => void;
  onVectorize: () => void;
  onDelete: () => void;
  onUndo: () => void;
  onRedo: () => void;
  historyIndex?: number;
  historyLength?: number;
};

const tools = [
  { id: "select" as Tool, icon: MousePointer2, label: "Sélectionner" },
  { id: "text" as Tool, icon: Type, label: "Texte" },
  { id: "rect" as Tool, icon: Square, label: "Rectangle" },
  { id: "circle" as Tool, icon: Circle, label: "Cercle" },
  { id: "triangle" as Tool, icon: Triangle, label: "Triangle" },
  { id: "image" as Tool, icon: ImagePlus, label: "Image" },
];

export function Toolbar({ activeTool, onToolChange, onAddText, onAddShape, onAddImage, onVectorize, onDelete, onUndo, onRedo, historyIndex = -1, historyLength = 0 }: Props) {
  function handleToolClick(tool: Tool) {
    onToolChange(tool);
    if (tool === "text") onAddText();
    else if (tool === "rect" || tool === "circle" || tool === "triangle") onAddShape(tool);
    else if (tool === "image") onAddImage();
  }

  return (
    <div className="flex flex-col items-center gap-1 p-2 bg-zinc-900 border-r border-zinc-800 w-12">
      {/* Undo/Redo */}
      <button
        onClick={onUndo}
        disabled={historyIndex <= 0}
        className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title={`Annuler (Ctrl+Z)${historyIndex > 0 ? ` — étape ${historyIndex + 1}/${historyLength}` : ""}`}
      >
        <Undo2 size={16} />
      </button>
      <button
        onClick={onRedo}
        disabled={historyIndex >= historyLength - 1}
        className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title={`Refaire (Ctrl+Y)${historyIndex < historyLength - 1 ? ` — étape ${historyIndex + 2}/${historyLength}` : ""}`}
      >
        <Redo2 size={16} />
      </button>
      {historyLength > 0 && (
        <span className="text-[9px] text-gray-700 tabular-nums" title="Position dans l'historique">
          {historyIndex + 1}/{historyLength}
        </span>
      )}

      <div className="w-6 h-px bg-zinc-700 my-1" />

      {/* Tools */}
      {tools.map((t) => (
        <button
          key={t.id}
          onClick={() => handleToolClick(t.id)}
          className={cn(
            "p-2 rounded-lg transition-colors",
            activeTool === t.id
              ? "bg-rose-600 text-white"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800"
          )}
          title={t.label}
        >
          <t.icon size={16} />
        </button>
      ))}

      <div className="w-6 h-px bg-zinc-700 my-1" />

      <button
        onClick={onVectorize}
        className="p-2 rounded-lg text-violet-400 hover:text-violet-300 hover:bg-violet-900/30 transition-colors"
        title="Vectoriser une image"
      >
        <Wand2 size={16} />
      </button>

      <div className="w-6 h-px bg-zinc-700 my-1" />

      <button
        onClick={onDelete}
        className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-900/30 transition-colors"
        title="Supprimer"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

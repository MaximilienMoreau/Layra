"use client";

import { useState } from "react";
import { TEMPLATES, type Template } from "./templates";
import { useCanvasStore } from "@/store/canvasStore";
import { LayoutTemplate, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  onApply: (template: Template) => void;
};

const CATEGORIES = ["Tous", "Instagram", "LinkedIn", "Publicité", "YouTube"];

export function TemplateGallery({ onApply }: Props) {
  const [activeCategory, setActiveCategory] = useState("Tous");
  const { setActiveView } = useCanvasStore();

  const filtered = activeCategory === "Tous"
    ? TEMPLATES
    : TEMPLATES.filter((t) => t.category === activeCategory);

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2 mb-1">
          <LayoutTemplate size={20} className="text-rose-400" />
          <h2 className="text-lg font-semibold text-white">Templates</h2>
        </div>
        <p className="text-sm text-zinc-500">Choisissez un point de départ, puis personnalisez</p>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 px-6 py-3 overflow-x-auto border-b border-zinc-800">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors",
              activeCategory === cat
                ? "bg-rose-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((template) => (
            <div
              key={template.id}
              className="group relative bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-rose-600 transition-all cursor-pointer"
              onClick={() => {
                onApply(template);
                setActiveView("canvas");
              }}
            >
              {/* Preview */}
              <div
                className={cn(
                  "h-36 flex items-center justify-center",
                  template.preview
                )}
              >
                <div className="text-center p-3">
                  <p className="text-white text-xs font-semibold truncate max-w-[120px] drop-shadow">
                    {template.layout.copy?.headline?.slice(0, 30) || template.name}
                  </p>
                </div>
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-rose-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex items-center gap-1 bg-white text-rose-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                    Utiliser
                    <ChevronRight size={12} />
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-xs font-medium text-white truncate">{template.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-zinc-500">{template.category}</span>
                  <span className="text-xs text-zinc-600">
                    {template.format.width}×{template.format.height}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

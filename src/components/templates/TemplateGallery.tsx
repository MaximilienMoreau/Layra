"use client";

import { useState } from "react";
import { TEMPLATES, type Template } from "./templates";
import { useCanvasStore } from "@/store/canvasStore";
import { Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { onApply: (template: Template) => void };

const CATEGORIES = ["Tous", "Instagram", "LinkedIn", "Publicité", "YouTube"];

export function TemplateGallery({ onApply }: Props) {
  const [activeCategory, setActiveCategory] = useState("Tous");
  const { setActiveView } = useCanvasStore();

  const filtered = activeCategory === "Tous" ? TEMPLATES : TEMPLATES.filter((t) => t.category === activeCategory);

  return (
    <div className="flex flex-col h-full bg-[#0c0c14]">
      {/* Header */}
      <div className="px-8 pt-8 pb-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-xl btn-accent flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Sparkles size={15} className="text-white" />
          </div>
          <h2 className="text-lg font-semibold text-white">Templates</h2>
        </div>
        <p className="text-sm text-white/35 font-medium">Choisissez un point de départ, personnalisez avec l'IA</p>
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 px-8 py-4 overflow-x-auto border-b border-white/[0.06]">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "text-xs px-4 py-1.5 rounded-full whitespace-nowrap transition-all duration-200 font-medium border",
              activeCategory === cat
                ? "btn-accent text-white border-transparent shadow-sm shadow-rose-500/20"
                : "bg-white/[0.04] border-white/[0.07] text-white/40 hover:text-white/70 hover:bg-white/[0.07]"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((template) => (
            <div
              key={template.id}
              className="group relative glass border border-white/[0.07] hover:border-white/[0.18] rounded-2xl overflow-hidden cursor-pointer transition-all duration-250 hover:shadow-lg hover:shadow-black/40 hover:-translate-y-0.5"
              onClick={() => { onApply(template); setActiveView("canvas"); }}
            >
              {/* Preview */}
              <div className={cn("h-36 flex items-center justify-center relative", template.preview)}>
                <div className="text-center px-3">
                  <p className="text-white text-xs font-semibold truncate max-w-[120px] drop-shadow-lg">
                    {template.layout.copy?.headline?.slice(0, 28) || template.name}
                  </p>
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
                  <div className="flex items-center gap-1.5 btn-accent px-4 py-1.5 rounded-full text-xs font-semibold text-white shadow-lg translate-y-1 group-hover:translate-y-0 transition-transform duration-200">
                    Utiliser
                    <ArrowRight size={11} />
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-3 border-t border-white/[0.06]">
                <p className="text-xs font-semibold text-white/80 truncate">{template.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-white/30 font-medium">{template.category}</span>
                  <span className="text-[10px] text-white/20 font-mono">{template.format.width}×{template.format.height}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

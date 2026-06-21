"use client";

import { Eye, EyeOff, Lock, Unlock, Type, Image, Square, Video, Layers } from "lucide-react";
import { useCanvasStore, type LayerItem } from "@/store/canvasStore";
import { cn } from "@/lib/utils";

type Props = {
  onLayerSelect: (id: string) => void;
  onLayerVisible: (id: string, visible: boolean) => void;
  onLayerLock: (id: string, locked: boolean) => void;
};

const typeIcons = { text: Type, image: Image, shape: Square, video: Video, background: Layers };

export function LayerPanel({ onLayerSelect, onLayerVisible, onLayerLock }: Props) {
  const { layers, selectedLayerId } = useCanvasStore();

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2.5 border-b border-white/[0.06]">
        <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Calques</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-1.5">
        {layers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Layers size={20} className="text-white/10" />
            <p className="text-xs text-white/20 font-medium">Aucun calque</p>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {layers.map((layer: LayerItem) => {
              const Icon = typeIcons[layer.type] || Square;
              const isSelected = selectedLayerId === layer.id;
              return (
                <div
                  key={layer.id}
                  onClick={() => onLayerSelect(layer.id)}
                  className={cn(
                    "flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all duration-150 group border",
                    isSelected
                      ? "bg-rose-500/[0.08] border-rose-500/20 text-white"
                      : "hover:bg-white/[0.04] border-transparent text-white/50 hover:text-white/80"
                  )}
                >
                  <Icon size={12} className={cn("shrink-0", isSelected ? "text-rose-400" : "text-white/25")} />
                  <span className="text-xs font-medium truncate flex-1 min-w-0">{layer.name}</span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <button
                      onClick={(e) => { e.stopPropagation(); onLayerVisible(layer.id, !layer.visible); }}
                      className="p-1 rounded text-white/25 hover:text-white transition-colors"
                    >
                      {layer.visible ? <Eye size={11} /> : <EyeOff size={11} />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onLayerLock(layer.id, !layer.locked); }}
                      className="p-1 rounded text-white/25 hover:text-white transition-colors"
                    >
                      {layer.locked ? <Lock size={11} /> : <Unlock size={11} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

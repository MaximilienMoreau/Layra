"use client";

import { Eye, EyeOff, Lock, Unlock, Type, Image, Square, Video, Layers } from "lucide-react";
import { useCanvasStore, type LayerItem } from "@/store/canvasStore";
import { cn } from "@/lib/utils";

type Props = {
  onLayerSelect: (id: string) => void;
  onLayerVisible: (id: string, visible: boolean) => void;
  onLayerLock: (id: string, locked: boolean) => void;
};

const typeIcons = {
  text: Type,
  image: Image,
  shape: Square,
  video: Video,
  background: Layers,
};

export function LayerPanel({ onLayerSelect, onLayerVisible, onLayerLock }: Props) {
  const { layers, selectedLayerId } = useCanvasStore();

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-gray-800">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Calques
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        {layers.length === 0 ? (
          <div className="p-4 text-center text-gray-600 text-sm">
            <Layers size={24} className="mx-auto mb-2 opacity-40" />
            Aucun calque
          </div>
        ) : (
          <div className="flex flex-col gap-0.5 p-1">
            {layers.map((layer: LayerItem) => {
              const Icon = typeIcons[layer.type] || Square;
              return (
                <div
                  key={layer.id}
                  onClick={() => onLayerSelect(layer.id)}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors group",
                    selectedLayerId === layer.id
                      ? "bg-indigo-900/50 border border-indigo-700/50"
                      : "hover:bg-gray-800 border border-transparent"
                  )}
                >
                  <Icon size={13} className="text-gray-500 shrink-0" />
                  <span className="text-xs text-gray-300 truncate flex-1 min-w-0">
                    {layer.name}
                  </span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); onLayerVisible(layer.id, !layer.visible); }}
                      className="p-0.5 rounded text-gray-500 hover:text-white transition-colors"
                      title={layer.visible ? "Masquer" : "Afficher"}
                    >
                      {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onLayerLock(layer.id, !layer.locked); }}
                      className="p-0.5 rounded text-gray-500 hover:text-white transition-colors"
                      title={layer.locked ? "Déverrouiller" : "Verrouiller"}
                    >
                      {layer.locked ? <Lock size={12} /> : <Unlock size={12} />}
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

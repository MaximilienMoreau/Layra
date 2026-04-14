import { create } from "zustand";
import type { CanvasElement, Background, ClaudeLayout } from "@/utils/zodSchemas";

export type CanvasFormat = {
  width: number;
  height: number;
  name: string;
};

export const CANVAS_FORMATS: CanvasFormat[] = [
  { width: 1080, height: 1080, name: "Instagram carré" },
  { width: 1080, height: 1920, name: "Story 9:16" },
  { width: 1200, height: 627, name: "LinkedIn" },
  { width: 1920, height: 1080, name: "YouTube 16:9" },
  { width: 1080, height: 1920, name: "Reels/TikTok" },
];

export type LayerItem = {
  id: string;
  name: string;
  type: "text" | "image" | "shape" | "video" | "background";
  visible: boolean;
  locked: boolean;
  zIndex: number;
};

type CanvasState = {
  format: CanvasFormat;
  elements: CanvasElement[];
  background: Background;
  layers: LayerItem[];
  selectedLayerId: string | null;
  history: ClaudeLayout[];
  historyIndex: number;
  isGenerating: boolean;
  generationProgress: string;
  activeView: "canvas" | "video" | "templates";

  setFormat: (format: CanvasFormat) => void;
  setElements: (elements: CanvasElement[]) => void;
  setBackground: (bg: Background) => void;
  setLayers: (layers: LayerItem[]) => void;
  setSelectedLayerId: (id: string | null) => void;
  pushHistory: (layout: ClaudeLayout) => void;
  undo: () => ClaudeLayout | null;
  redo: () => ClaudeLayout | null;
  setIsGenerating: (v: boolean) => void;
  setGenerationProgress: (msg: string) => void;
  setActiveView: (view: "canvas" | "video" | "templates") => void;
  updateLayerVisibility: (id: string, visible: boolean) => void;
  updateLayerLock: (id: string, locked: boolean) => void;
  reorderLayers: (layers: LayerItem[]) => void;
};

export const useCanvasStore = create<CanvasState>((set, get) => ({
  format: CANVAS_FORMATS[0],
  elements: [],
  background: { type: "color", value: "#1a1a2e" },
  layers: [],
  selectedLayerId: null,
  history: [],
  historyIndex: -1,
  isGenerating: false,
  generationProgress: "",
  activeView: "canvas",

  setFormat: (format) => set({ format }),
  setElements: (elements) => set({ elements }),
  setBackground: (background) => set({ background }),
  setLayers: (layers) => set({ layers }),
  setSelectedLayerId: (selectedLayerId) => set({ selectedLayerId }),

  pushHistory: (layout) => {
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(layout);
    if (newHistory.length > 50) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return null;
    const newIndex = historyIndex - 1;
    set({ historyIndex: newIndex });
    return history[newIndex];
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return null;
    const newIndex = historyIndex + 1;
    set({ historyIndex: newIndex });
    return history[newIndex];
  },

  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setGenerationProgress: (generationProgress) => set({ generationProgress }),
  setActiveView: (activeView) => set({ activeView }),

  updateLayerVisibility: (id, visible) => {
    const layers = get().layers.map((l) =>
      l.id === id ? { ...l, visible } : l
    );
    set({ layers });
  },

  updateLayerLock: (id, locked) => {
    const layers = get().layers.map((l) =>
      l.id === id ? { ...l, locked } : l
    );
    set({ layers });
  },

  reorderLayers: (layers) => set({ layers }),
}));

"use client";

import { useRef, useState, useCallback } from "react";
import { useCanvas } from "@/hooks/useCanvas";
import { useHistory } from "@/hooks/useHistory";
import { useCanvasStore } from "@/store/canvasStore";
import { useBrandStore } from "@/store/brandStore";
import { useCreditsStore } from "@/store/creditsStore";
import { CanvasEditor } from "@/components/canvas/CanvasEditor";
import { LayerPanel } from "@/components/canvas/LayerPanel";
import { PropertiesPanel } from "@/components/canvas/PropertiesPanel";
import { PromptBar } from "@/components/ai/PromptBar";
import { BrandKitPanel } from "@/components/brand/BrandKitPanel";
import { TemplateGallery } from "@/components/templates/TemplateGallery";
import { ExportModal } from "@/components/export/ExportModal";
import { useAI } from "@/hooks/useAI";
import type { Template } from "@/components/templates/templates";
import {
  Layers,
  Palette,
  Settings2,
  LayoutTemplate,
  Download,
  Zap,
  Coins,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type LeftTab = "layers" | "brand" | "templates";
type RightTab = "properties";

export function EditorLayout() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [leftTab, setLeftTab] = useState<LeftTab>("layers");
  const [rightTab] = useState<RightTab>("properties");
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [showExport, setShowExport] = useState(false);

  const { activeView, setActiveView } = useCanvasStore();
  const { activeBrand } = useBrandStore();
  const { credits } = useCreditsStore();

  const {
    fabricRef,
    loadLayout,
    addText,
    addShape,
    addImage,
    deleteSelected,
    setLayerVisible,
    setLayerLocked,
    selectLayerById,
    exportPNG,
    exportJPEG,
    getActiveObject,
    updateActiveObjectStyle,
  } = useCanvas(canvasRef);

  const { undo, redo } = useHistory(loadLayout);
  const { generate } = useAI(fabricRef, loadLayout);

  // Expose generate via custom event for PromptBar
  const handleGenerate = useCallback(
    (prompt: string, reprompt: boolean) => generate(prompt, reprompt),
    [generate]
  );

  // Listen for events from CanvasEditor's generate button
  // (PromptBar already dispatches these)

  const handleApplyTemplate = useCallback(
    async (template: Template) => {
      useCanvasStore.getState().setFormat(template.format);
      await loadLayout(template.layout);
    },
    [loadLayout]
  );

  const leftTabs = [
    { id: "layers" as LeftTab, icon: Layers, label: "Calques" },
    { id: "brand" as LeftTab, icon: Palette, label: "Marque" },
    { id: "templates" as LeftTab, icon: LayoutTemplate, label: "Templates" },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white overflow-hidden">
      {/* Top Nav */}
      <header className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-bold text-white tracking-tight">Layra</span>
          </div>

          <div className="w-px h-4 bg-gray-700" />

          {/* View switcher */}
          <div className="flex gap-1 bg-gray-800 rounded-lg p-0.5">
            {(["canvas", "templates"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setActiveView(v)}
                className={cn(
                  "text-xs px-3 py-1 rounded-md transition-colors capitalize",
                  activeView === v
                    ? "bg-gray-700 text-white"
                    : "text-gray-500 hover:text-gray-300"
                )}
              >
                {v === "canvas" ? "Éditeur" : "Templates"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Brand indicator */}
          <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
            <div className="flex gap-1">
              {activeBrand.colors.slice(0, 3).map((c, i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-full border border-gray-700"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <span>{activeBrand.name}</span>
          </div>

          {/* Credits */}
          <div className="flex items-center gap-1.5 bg-gray-800 rounded-lg px-2.5 py-1.5">
            <Coins size={13} className={credits < 50 ? "text-red-400" : "text-amber-400"} />
            <span className={cn("text-xs font-medium", credits < 50 ? "text-red-400" : "text-gray-300")}>
              {credits}
            </span>
          </div>

          {/* Export */}
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-medium transition-colors"
          >
            <Download size={14} />
            Exporter
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        {activeView === "canvas" && (
          <div className={cn(
            "flex shrink-0 border-r border-gray-800 bg-gray-900 transition-all duration-200",
            leftOpen ? "w-56" : "w-12"
          )}>
            {leftOpen ? (
              <div className="flex flex-col w-full">
                {/* Tabs */}
                <div className="flex border-b border-gray-800">
                  {leftTabs.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setLeftTab(t.id)}
                      className={cn(
                        "flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors",
                        leftTab === t.id
                          ? "text-indigo-400 border-b-2 border-indigo-500"
                          : "text-gray-500 hover:text-gray-300"
                      )}
                    >
                      <t.icon size={14} />
                      <span className="text-[10px]">{t.label}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => setLeftOpen(false)}
                    className="px-2 text-gray-600 hover:text-gray-400"
                  >
                    <ChevronLeft size={14} />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  {leftTab === "layers" && (
                    <LayerPanel
                      onLayerSelect={selectLayerById}
                      onLayerVisible={setLayerVisible}
                      onLayerLock={setLayerLocked}
                    />
                  )}
                  {leftTab === "brand" && <BrandKitPanel />}
                  {leftTab === "templates" && (
                    <div className="p-2">
                      <p className="text-xs text-gray-500 mb-2">Ouvrez la vue Templates</p>
                      <button
                        onClick={() => setActiveView("templates")}
                        className="w-full text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1.5 rounded-md text-gray-400 hover:text-white transition-colors"
                      >
                        Voir tous les templates →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-2 w-full">
                <button
                  onClick={() => setLeftOpen(true)}
                  className="text-gray-600 hover:text-gray-400 p-1"
                >
                  <ChevronRight size={14} />
                </button>
                {leftTabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setLeftTab(t.id); setLeftOpen(true); }}
                    className="p-2 text-gray-600 hover:text-gray-400 transition-colors"
                    title={t.label}
                  >
                    <t.icon size={16} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Central area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeView === "canvas" ? (
            <>
              <div className="flex-1 overflow-hidden">
                <CanvasEditor />
              </div>
              <PromptBar />
            </>
          ) : (
            <TemplateGallery onApply={handleApplyTemplate} />
          )}
        </div>

        {/* Right panel */}
        {activeView === "canvas" && (
          <div className={cn(
            "flex shrink-0 border-l border-gray-800 bg-gray-900 transition-all duration-200",
            rightOpen ? "w-56" : "w-12"
          )}>
            {rightOpen ? (
              <div className="flex flex-col w-full">
                <div className="flex items-center border-b border-gray-800 px-1">
                  <div className="flex-1 flex">
                    <button className="flex-1 flex flex-col items-center gap-0.5 py-2 text-xs text-indigo-400 border-b-2 border-indigo-500">
                      <Settings2 size={14} />
                      <span className="text-[10px]">Propriétés</span>
                    </button>
                  </div>
                  <button
                    onClick={() => setRightOpen(false)}
                    className="px-2 text-gray-600 hover:text-gray-400"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <PropertiesPanel
                    getActiveObject={getActiveObject}
                    updateStyle={updateActiveObjectStyle}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-2 w-full">
                <button
                  onClick={() => setRightOpen(true)}
                  className="text-gray-600 hover:text-gray-400 p-1"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => setRightOpen(true)}
                  className="p-2 text-gray-600 hover:text-gray-400"
                  title="Propriétés"
                >
                  <Settings2 size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Export modal */}
      {showExport && (
        <ExportModal
          onClose={() => setShowExport(false)}
          onExportPNG={exportPNG}
          onExportJPEG={exportJPEG}
        />
      )}
    </div>
  );
}

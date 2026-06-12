"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useCanvasStore } from "@/store/canvasStore";
import { useBrandStore } from "@/store/brandStore";
import { useCreditsStore } from "@/store/creditsStore";
import { useThemeStore } from "@/store/themeStore";
import { CanvasEditor, type CanvasEditorHandle } from "@/components/canvas/CanvasEditor";
import { LayerPanel } from "@/components/canvas/LayerPanel";
import { PropertiesPanel } from "@/components/canvas/PropertiesPanel";
import { PromptBar } from "@/components/ai/PromptBar";
import { BrandKitPanel } from "@/components/brand/BrandKitPanel";
import { TemplateGallery } from "@/components/templates/TemplateGallery";
import { ExportModal } from "@/components/export/ExportModal";
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
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type LeftTab = "layers" | "brand" | "templates";

export function EditorLayout() {
  const canvasEditorRef = useRef<CanvasEditorHandle>(null);
  const [leftTab, setLeftTab] = useState<LeftTab>("layers");
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [showExport, setShowExport] = useState(false);

  const { activeView, setActiveView } = useCanvasStore();
  const { activeBrand } = useBrandStore();
  const { credits } = useCreditsStore();
  const { isDark, toggle: toggleTheme } = useThemeStore();

  useEffect(() => {
    document.documentElement.classList.toggle("light", !isDark);
  }, [isDark]);

  const exportPNG = useCallback(() => canvasEditorRef.current?.exportPNG() ?? "", []);
  const exportJPEG = useCallback(() => canvasEditorRef.current?.exportJPEG() ?? "", []);

  const getActiveObject = useCallback(
    () => canvasEditorRef.current?.getActiveObject() ?? null,
    []
  );
  const updateActiveObjectStyle = useCallback(
    (styles: Record<string, unknown>) => canvasEditorRef.current?.updateActiveObjectStyle(styles),
    []
  );
  const setLayerVisible = useCallback(
    (id: string, visible: boolean) => canvasEditorRef.current?.setLayerVisible(id, visible),
    []
  );
  const setLayerLocked = useCallback(
    (id: string, locked: boolean) => canvasEditorRef.current?.setLayerLocked(id, locked),
    []
  );
  const selectLayerById = useCallback(
    (id: string) => canvasEditorRef.current?.selectLayerById(id),
    []
  );
  const handleApplyTemplate = useCallback(async (template: Template) => {
    useCanvasStore.getState().setFormat(template.format);
    await canvasEditorRef.current?.loadLayout(template.layout);
  }, []);

  const leftTabs = [
    { id: "layers" as LeftTab, icon: Layers, label: "Calques" },
    { id: "brand" as LeftTab, icon: Palette, label: "Marque" },
    { id: "templates" as LeftTab, icon: LayoutTemplate, label: "Templates" },
  ];

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Top Nav */}
      <header className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-bold text-white tracking-tight">Layra</span>
          </div>

          <div className="w-px h-4 bg-zinc-700" />

          {/* View switcher */}
          <div className="flex gap-1 bg-zinc-800 rounded-lg p-0.5">
            {(["canvas", "templates"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setActiveView(v)}
                className={cn(
                  "text-xs px-3 py-1 rounded-md transition-colors capitalize",
                  activeView === v
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {v === "canvas" ? "Éditeur" : "Templates"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Brand indicator */}
          <div className="hidden md:flex items-center gap-2 text-xs text-zinc-500">
            <div className="flex gap-1">
              {activeBrand.colors.slice(0, 3).map((c, i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-full border border-zinc-700"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <span>{activeBrand.name}</span>
          </div>

          {/* Credits */}
          <div className="flex items-center gap-1.5 bg-zinc-800 rounded-lg px-2.5 py-1.5">
            <Coins size={13} className={credits < 50 ? "text-red-400" : "text-amber-400"} />
            <span className={cn("text-xs font-medium", credits < 50 ? "text-red-400" : "text-zinc-300")}>
              {credits}
            </span>
          </div>

          {/* Day / Night toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
            title={isDark ? "Mode diurne" : "Mode nocturne"}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Export */}
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 rounded-lg text-xs font-medium transition-colors"
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
            "flex shrink-0 border-r border-zinc-800 bg-zinc-900 transition-all duration-200",
            leftOpen ? "w-56" : "w-12"
          )}>
            {leftOpen ? (
              <div className="flex flex-col w-full">
                <div className="flex border-b border-zinc-800">
                  {leftTabs.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setLeftTab(t.id)}
                      className={cn(
                        "flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors",
                        leftTab === t.id
                          ? "text-rose-400 border-b-2 border-rose-500"
                          : "text-zinc-500 hover:text-zinc-300"
                      )}
                    >
                      <t.icon size={14} />
                      <span className="text-[10px]">{t.label}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => setLeftOpen(false)}
                    className="px-2 text-zinc-600 hover:text-zinc-400"
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
                      <p className="text-xs text-zinc-500 mb-2">Ouvrez la vue Templates</p>
                      <button
                        onClick={() => setActiveView("templates")}
                        className="w-full text-xs bg-zinc-800 hover:bg-zinc-700 px-2 py-1.5 rounded-md text-zinc-400 hover:text-white transition-colors"
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
                  className="text-zinc-600 hover:text-zinc-400 p-1"
                >
                  <ChevronRight size={14} />
                </button>
                {leftTabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setLeftTab(t.id); setLeftOpen(true); }}
                    className="p-2 text-zinc-600 hover:text-zinc-400 transition-colors"
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
                <CanvasEditor ref={canvasEditorRef} />
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
            "flex shrink-0 border-l border-zinc-800 bg-zinc-900 transition-all duration-200",
            rightOpen ? "w-56" : "w-12"
          )}>
            {rightOpen ? (
              <div className="flex flex-col w-full">
                <div className="flex items-center border-b border-zinc-800 px-1">
                  <div className="flex-1 flex">
                    <button className="flex-1 flex flex-col items-center gap-0.5 py-2 text-xs text-rose-400 border-b-2 border-rose-500">
                      <Settings2 size={14} />
                      <span className="text-[10px]">Propriétés</span>
                    </button>
                  </div>
                  <button
                    onClick={() => setRightOpen(false)}
                    className="px-2 text-zinc-600 hover:text-zinc-400"
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
                  className="text-zinc-600 hover:text-zinc-400 p-1"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => setRightOpen(true)}
                  className="p-2 text-zinc-600 hover:text-zinc-400"
                  title="Propriétés"
                >
                  <Settings2 size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

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

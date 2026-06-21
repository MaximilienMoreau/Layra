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
  Layers, Palette, Settings2, LayoutTemplate,
  Download, Zap, Coins, ChevronLeft, ChevronRight, Sun, Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type LeftTab = "layers" | "brand" | "templates";

export function EditorLayout() {
  const canvasEditorRef = useRef<CanvasEditorHandle>(null);
  const [leftTab, setLeftTab]   = useState<LeftTab>("layers");
  const [leftOpen, setLeftOpen]   = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [showExport, setShowExport] = useState(false);

  const { activeView, setActiveView } = useCanvasStore();
  const { activeBrand }  = useBrandStore();
  const { credits }      = useCreditsStore();
  const { isDark, toggle: toggleTheme } = useThemeStore();

  useEffect(() => {
    document.documentElement.classList.toggle("light", !isDark);
  }, [isDark]);

  const exportPNG  = useCallback(() => canvasEditorRef.current?.exportPNG()  ?? "", []);
  const exportJPEG = useCallback(() => canvasEditorRef.current?.exportJPEG() ?? "", []);
  const getActiveObject         = useCallback(() => canvasEditorRef.current?.getActiveObject() ?? null, []);
  const updateActiveObjectStyle = useCallback((s: Record<string,unknown>) => canvasEditorRef.current?.updateActiveObjectStyle(s), []);
  const setLayerVisible = useCallback((id: string, v: boolean) => canvasEditorRef.current?.setLayerVisible(id, v), []);
  const setLayerLocked  = useCallback((id: string, v: boolean) => canvasEditorRef.current?.setLayerLocked(id, v), []);
  const selectLayerById = useCallback((id: string) => canvasEditorRef.current?.selectLayerById(id), []);

  const handleApplyTemplate = useCallback(async (t: Template) => {
    const store = useCanvasStore.getState();
    store.setFormat(t.format);
    await canvasEditorRef.current?.loadLayout(t.layout);
    store.pushHistory(t.layout);
  }, []);

  const leftTabs = [
    { id: "layers"    as LeftTab, icon: Layers,         label: "Calques"   },
    { id: "brand"     as LeftTab, icon: Palette,        label: "Marque"    },
    { id: "templates" as LeftTab, icon: LayoutTemplate, label: "Templates" },
  ];

  return (
    <div className="flex flex-col h-screen text-white overflow-hidden" style={{ background: "var(--bg-base)" }}>

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-5 py-2.5 shrink-0 z-20 border-b" style={{ background: "var(--bg-panel)", borderColor: "var(--border-dim)" }}>
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg btn-accent flex items-center justify-center shadow-lg shadow-rose-500/25">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-bold text-sm text-gradient tracking-tight">Layra</span>
          </div>

          <div className="w-px h-4" style={{ background: "var(--border)" }} />

          {/* View switcher */}
          <div className="flex gap-0.5 rounded-lg p-0.5 border" style={{ background: "var(--bg-card)", borderColor: "var(--border-dim)" }}>
            {(["canvas", "templates"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setActiveView(v)}
                className={cn(
                  "text-xs px-3 py-1 rounded-md font-medium transition-all duration-150",
                  activeView === v
                    ? "bg-white/10 text-white"
                    : "text-white/35 hover:text-white/65"
                )}
              >
                {v === "canvas" ? "Éditeur" : "Templates"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Brand */}
          <div className="hidden md:flex items-center gap-2 text-xs text-white/30 mr-1">
            <div className="flex gap-0.5">
              {activeBrand.colors.slice(0, 3).map((c, i) => (
                <div key={i} className="w-3 h-3 rounded-full ring-1 ring-white/10" style={{ background: c }} />
              ))}
            </div>
            <span className="font-medium">{activeBrand.name}</span>
          </div>

          {/* Credits */}
          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border",
            credits < 50
              ? "text-red-400 border-red-500/20" : "text-white/50 border-white/[0.06]"
          )} style={{ background: "var(--bg-card)" }}>
            <Coins size={12} className={credits < 50 ? "text-red-400" : "text-amber-400"} />
            {credits}
          </div>

          {/* Theme */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/35 hover:text-white transition-colors border border-white/[0.06]"
            style={{ background: "var(--bg-card)" }}
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {/* Export */}
          <button
            onClick={() => setShowExport(true)}
            className="btn-accent flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white shadow-lg shadow-rose-500/20"
          >
            <Download size={13} />
            Exporter
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left panel ── */}
        {activeView === "canvas" && (
          <div
            className={cn("flex shrink-0 border-r transition-all duration-200", leftOpen ? "w-56" : "w-11")}
            style={{ background: "var(--bg-panel)", borderColor: "var(--border-dim)" }}
          >
            {leftOpen ? (
              <div className="flex flex-col w-full">
                <div className="flex items-center border-b px-1 pt-1" style={{ borderColor: "var(--border-dim)" }}>
                  {leftTabs.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setLeftTab(t.id)}
                      className={cn(
                        "flex-1 flex flex-col items-center gap-0.5 py-2 text-xs relative transition-colors duration-150",
                        leftTab === t.id ? "text-white" : "text-white/30 hover:text-white/60"
                      )}
                    >
                      <t.icon size={13} />
                      <span className="text-[10px] font-semibold">{t.label}</span>
                      {leftTab === t.id && <span className="tab-active-dot" />}
                    </button>
                  ))}
                  <button onClick={() => setLeftOpen(false)} className="px-1.5 py-2 text-white/15 hover:text-white/40 transition-colors">
                    <ChevronLeft size={13} />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  {leftTab === "layers"    && <LayerPanel onLayerSelect={selectLayerById} onLayerVisible={setLayerVisible} onLayerLock={setLayerLocked} />}
                  {leftTab === "brand"     && <BrandKitPanel />}
                  {leftTab === "templates" && (
                    <div className="p-4 flex flex-col gap-3">
                      <p className="text-xs text-white/25 leading-relaxed">Accédez à la galerie pour choisir un template.</p>
                      <button onClick={() => setActiveView("templates")} className="w-full text-xs px-3 py-2 rounded-lg text-white/40 hover:text-white transition-colors border border-white/[0.07] hover:border-white/[0.15]" style={{ background: "var(--bg-card)" }}>
                        Voir les templates →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 py-2 w-full">
                <button onClick={() => setLeftOpen(true)} className="p-1.5 text-white/15 hover:text-white/40 transition-colors">
                  <ChevronRight size={13} />
                </button>
                <div className="w-4 h-px my-1" style={{ background: "var(--border-dim)" }} />
                {leftTabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setLeftTab(t.id); setLeftOpen(true); }}
                    className={cn("p-2 rounded-lg transition-colors", leftTab === t.id ? "text-white bg-white/[0.07]" : "text-white/25 hover:text-white/60")}
                    title={t.label}
                  >
                    <t.icon size={15} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Central area ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeView === "canvas" ? (
            <>
              <div className="flex-1 overflow-hidden"><CanvasEditor ref={canvasEditorRef} /></div>
              <PromptBar />
            </>
          ) : (
            <TemplateGallery onApply={handleApplyTemplate} />
          )}
        </div>

        {/* ── Right panel ── */}
        {activeView === "canvas" && (
          <div
            className={cn("flex shrink-0 border-l transition-all duration-200", rightOpen ? "w-56" : "w-11")}
            style={{ background: "var(--bg-panel)", borderColor: "var(--border-dim)" }}
          >
            {rightOpen ? (
              <div className="flex flex-col w-full">
                <div className="flex items-center border-b px-1 pt-1" style={{ borderColor: "var(--border-dim)" }}>
                  <button className="flex-1 flex flex-col items-center gap-0.5 py-2 text-xs text-white relative">
                    <Settings2 size={13} />
                    <span className="text-[10px] font-semibold">Propriétés</span>
                    <span className="tab-active-dot" />
                  </button>
                  <button onClick={() => setRightOpen(false)} className="px-1.5 py-2 text-white/15 hover:text-white/40 transition-colors">
                    <ChevronRight size={13} />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <PropertiesPanel getActiveObject={getActiveObject} updateStyle={updateActiveObjectStyle} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 py-2 w-full">
                <button onClick={() => setRightOpen(true)} className="p-1.5 text-white/15 hover:text-white/40 transition-colors">
                  <ChevronLeft size={13} />
                </button>
                <div className="w-4 h-px my-1" style={{ background: "var(--border-dim)" }} />
                <button onClick={() => setRightOpen(true)} className="p-2 text-white/25 hover:text-white/60 transition-colors" title="Propriétés">
                  <Settings2 size={15} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showExport && <ExportModal onClose={() => setShowExport(false)} onExportPNG={exportPNG} onExportJPEG={exportJPEG} />}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Download, X, Image, FileImage, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreditsStore } from "@/store/creditsStore";

type Props = { onClose: () => void; onExportPNG: () => string; onExportJPEG: () => string };
type ExportFormat = "png" | "jpg" | "svg";

export function ExportModal({ onClose, onExportPNG, onExportJPEG }: Props) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("png");
  const [isExporting, setIsExporting]       = useState(false);
  const { spend, canUse } = useCreditsStore();

  const formats = [
    { id: "png" as ExportFormat,  label: "PNG",          desc: "Qualité maximale · fond transparent", icon: Image     },
    { id: "jpg" as ExportFormat,  label: "JPEG",         desc: "Fichier léger · fond blanc",          icon: FileImage },
    { id: "svg" as ExportFormat,  label: "SVG",          desc: "Vectoriel · bientôt disponible",      icon: FileImage, disabled: true },
  ];

  async function handleExport() {
    if (!canUse("export_hd")) return;
    setIsExporting(true);
    try {
      let dataUrl = "";
      if (selectedFormat === "png") dataUrl = onExportPNG();
      else if (selectedFormat === "jpg") dataUrl = onExportJPEG();
      if (dataUrl) {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `layra-${Date.now()}.${selectedFormat}`;
        a.click();
        spend("export_hd");
      }
    } finally {
      setIsExporting(false);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(7,7,14,0.8)", backdropFilter: "blur(16px)" }}>
      <div className="glass border border-white/[0.1] rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg btn-accent flex items-center justify-center shadow-sm shadow-rose-500/20">
              <Download size={13} className="text-white" />
            </div>
            <h2 className="text-sm font-semibold text-white">Exporter le design</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/[0.07] transition-all duration-150">
            <X size={15} />
          </button>
        </div>

        {/* Format selection */}
        <div className="p-5 flex flex-col gap-2">
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-2">Format</p>
          {formats.map((f) => (
            <button
              key={f.id}
              disabled={f.disabled}
              onClick={() => !f.disabled && setSelectedFormat(f.id)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all duration-150 text-left",
                f.disabled
                  ? "opacity-30 cursor-not-allowed border-white/[0.05] bg-white/[0.02]"
                  : selectedFormat === f.id
                  ? "border-rose-500/40 bg-rose-500/[0.08] shadow-sm shadow-rose-500/10"
                  : "border-white/[0.07] bg-white/[0.03] hover:border-white/[0.14] hover:bg-white/[0.05]"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                selectedFormat === f.id && !f.disabled ? "btn-accent shadow-sm shadow-rose-500/20" : "bg-white/[0.06]"
              )}>
                <f.icon size={15} className={selectedFormat === f.id && !f.disabled ? "text-white" : "text-white/40"} />
              </div>
              <div>
                <p className={cn("text-sm font-semibold", f.disabled ? "text-white/30" : "text-white/80")}>{f.label}</p>
                <p className="text-[11px] text-white/30 mt-0.5">{f.desc}</p>
              </div>
              {selectedFormat === f.id && !f.disabled && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full btn-accent" />
              )}
            </button>
          ))}

          {/* Video coming soon */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.05] bg-white/[0.02] opacity-30 cursor-not-allowed">
            <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
              <Film size={15} className="text-white/40" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white/30">MP4 / GIF</p>
              <p className="text-[11px] text-white/20">Export vidéo animée · bientôt</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/[0.07] flex items-center justify-between">
          <span className="text-[11px] text-white/25 font-medium">5 crédits · HD 1×</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-white/40 hover:text-white hover:bg-white/[0.06] transition-all duration-150 border border-white/[0.06]"
            >
              Annuler
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="btn-accent flex items-center gap-2 px-4 py-2 text-white text-xs font-semibold rounded-lg shadow-lg shadow-rose-500/20 disabled:opacity-40"
            >
              <Download size={13} />
              {isExporting ? "Export…" : `Télécharger ${selectedFormat.toUpperCase()}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

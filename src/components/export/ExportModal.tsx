"use client";

import { useState } from "react";
import { Download, X, Image, FileImage, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreditsStore } from "@/store/creditsStore";

type Props = {
  onClose: () => void;
  onExportPNG: () => string;
  onExportJPEG: () => string;
};

type ExportFormat = "png" | "jpg" | "svg";

export function ExportModal({ onClose, onExportPNG, onExportJPEG }: Props) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("png");
  const [isExporting, setIsExporting] = useState(false);
  const { spend, canUse } = useCreditsStore();

  const formats = [
    { id: "png" as ExportFormat, label: "PNG", desc: "Meilleure qualité, fond transparent", icon: Image },
    { id: "jpg" as ExportFormat, label: "JPEG", desc: "Fichier plus léger, fond blanc", icon: FileImage },
    { id: "svg" as ExportFormat, label: "SVG (bientôt)", desc: "Vectoriel, scalable", icon: FileImage, disabled: true },
  ];

  async function handleExport() {
    if (!canUse("export_hd")) return;
    setIsExporting(true);
    try {
      let dataUrl = "";
      if (selectedFormat === "png") dataUrl = onExportPNG();
      else if (selectedFormat === "jpg") dataUrl = onExportJPEG();

      if (dataUrl && canUse("export_hd")) {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `layra-design-${Date.now()}.${selectedFormat}`;
        a.click();
        spend("export_hd");
      }
    } finally {
      setIsExporting(false);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Download size={18} className="text-rose-400" />
            <h2 className="text-base font-semibold text-white">Exporter</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Format selection */}
        <div className="p-6 flex flex-col gap-3">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">
            Format d'export
          </p>
          {formats.map((f) => (
            <button
              key={f.id}
              disabled={f.disabled}
              onClick={() => !f.disabled && setSelectedFormat(f.id)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                f.disabled
                  ? "opacity-40 cursor-not-allowed border-zinc-800 bg-zinc-900"
                  : selectedFormat === f.id
                  ? "border-rose-500 bg-rose-900/30"
                  : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                selectedFormat === f.id ? "bg-rose-600" : "bg-zinc-700"
              )}>
                <f.icon size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{f.label}</p>
                <p className="text-xs text-zinc-500">{f.desc}</p>
              </div>
            </button>
          ))}

          {/* Video (coming soon) */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-zinc-800 opacity-40 cursor-not-allowed">
            <div className="w-8 h-8 rounded-lg bg-zinc-700 flex items-center justify-center">
              <Film size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">MP4 / GIF (bientôt)</p>
              <p className="text-xs text-zinc-500">Export vidéo animée</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-xs text-zinc-600">5 crédits · HD 1080p</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Download size={15} />
              {isExporting ? "Export..." : `Télécharger ${selectedFormat.toUpperCase()}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

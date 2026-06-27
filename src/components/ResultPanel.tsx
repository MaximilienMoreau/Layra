"use client";

import { Download, RotateCcw } from "lucide-react";

interface Props {
  file: File;
  originalUrl: string;
  svgUrl: string;
  svgSizeKb: number | null;
  onReset: () => void;
  onDownload: () => void;
}

export function ResultPanel({ file, originalUrl, svgUrl, svgSizeKb, onReset, onDownload }: Props) {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div style={{ borderRadius: 20, overflow: "hidden", border: "1px solid var(--border-medium)", background: "var(--bg-surface)" }}>
          <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Original</span>
            <span className="text-xs" style={{ color: "var(--text-faint)" }}>{file.name}</span>
          </div>
          <div className="flex items-center justify-center p-6" style={{ minHeight: 260 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={originalUrl} alt="Original" className="max-h-56 max-w-full object-contain" />
          </div>
        </div>

        <div style={{ borderRadius: 20, overflow: "hidden", border: "1px solid var(--color-accent-border)", background: "var(--bg-surface)" }}>
          <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <span className="text-xs font-semibold" style={{ color: "var(--color-accent)" }}>SVG vectoriel</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "var(--color-fast-bg)", color: "var(--color-fast)" }}
            >
              ✓ Prêt{svgSizeKb !== null ? ` · ${svgSizeKb} Ko` : ""}
            </span>
          </div>
          <div className="checker flex items-center justify-center p-6" style={{ minHeight: 260 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={svgUrl} alt="SVG" className="max-h-56 max-w-full object-contain" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "var(--bg-subtle)", color: "var(--text-muted)", border: "1px solid var(--border-medium)" }}
          >
            <RotateCcw size={15} /> Vectoriser une autre image
          </button>
          {svgSizeKb !== null && (
            <span className="text-xs hidden sm:inline" style={{ color: "var(--text-dim)" }}>
              {Math.round(file.size / 1024)} Ko → {svgSizeKb} Ko SVG
            </span>
          )}
        </div>
        <button
          onClick={onDownload}
          className="btn-accent flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-xl shadow-rose-500/20"
        >
          <Download size={15} /> Télécharger le SVG
        </button>
      </div>
    </div>
  );
}

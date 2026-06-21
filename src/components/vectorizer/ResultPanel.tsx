"use client";

import { Download, RotateCcw } from "lucide-react";
import { truncateName } from "@/lib/format";

type Props = {
  originalUrl: string;
  svgUrl: string;
  fileName: string;
  onReset: () => void;
  onDownload: () => void;
};

export function ResultPanel({ originalUrl, svgUrl, fileName, onReset, onDownload }: Props) {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Original */}
        <div className="result-card">
          <div className="result-card-header">
            <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>Original</span>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>{truncateName(fileName, 22)}</span>
          </div>
          <div className="result-card-body">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={originalUrl} alt="Original" className="max-h-56 max-w-full object-contain" />
          </div>
        </div>

        {/* SVG vectoriel */}
        <div className="result-card" style={{ borderColor: "rgba(249,115,22,0.2)" }}>
          <div className="result-card-header">
            <span className="text-xs font-semibold" style={{ color: "#fb923c" }}>SVG vectoriel</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "rgba(52,211,153,0.1)", color: "#34d399" }}
            >
              ✓ Prêt
            </span>
          </div>
          <div className="checker result-card-body">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={svgUrl} alt="SVG" className="max-h-56 max-w-full object-contain" />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.5)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <RotateCcw size={15} /> Vectoriser une autre image
        </button>
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

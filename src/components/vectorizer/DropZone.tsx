"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, Loader2, RotateCcw, FileImage, ArrowRight } from "lucide-react";
import { truncateName } from "@/lib/format";
import type { Status, Mode } from "@/hooks/useVectorize";

type Props = {
  status: Status;
  mode: Mode;
  file: File | null;
  originalUrl: string | null;
  onFile: (f: File) => void;
  onReset: () => void;
};

export function DropZone({ status, mode, file, originalUrl, onFile, onReset }: Props) {
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  }, [onFile]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
  }, []);

  const isLoading = status === "loading";

  return (
    <>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className="drop-zone"
        style={{
          border: `2px dashed ${dragging ? "#f97316" : file ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.08)"}`,
          background: dragging ? "rgba(249,115,22,0.05)" : file ? "#0d0d1a" : "rgba(255,255,255,0.02)",
          borderRadius: 24,
          cursor: isLoading ? "default" : "pointer",
          transition: "border-color 0.2s, background 0.2s",
          minHeight: file ? 240 : 320,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {isLoading ? <LoadingState mode={mode} /> : file && originalUrl ? (
          <FilePreview file={file} originalUrl={originalUrl} onReset={onReset} />
        ) : (
          <IdleState />
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }}
      />
    </>
  );
}

function LoadingState({ mode }: { mode: Mode }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-14 h-14 rounded-2xl btn-accent flex items-center justify-center shadow-xl shadow-rose-500/25">
        <Loader2 size={26} className="text-white animate-spin" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-white text-sm mb-1">Vectorisation en cours…</p>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
          {mode === "fast" ? "Traitement local" : "Analyse par IA"}
        </p>
      </div>
    </div>
  );
}

function FilePreview({ file, originalUrl, onReset }: { file: File; originalUrl: string; onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-5 p-6 w-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={originalUrl}
        alt="Aperçu"
        className="max-h-48 max-w-full object-contain rounded-xl"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
      />
      <div className="flex items-center gap-3">
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
          {truncateName(file.name)} · {(file.size / 1024).toFixed(0)} Ko
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onReset(); }}
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors"
          style={{ color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.06)" }}
        >
          <RotateCcw size={11} /> Changer
        </button>
      </div>
    </div>
  );
}

function IdleState() {
  return (
    <div className="flex flex-col items-center gap-5 p-10">
      <div className="w-16 h-16 rounded-2xl btn-accent flex items-center justify-center shadow-xl shadow-rose-500/20">
        <Upload size={28} className="text-white" />
      </div>
      <div className="text-center">
        <p className="font-bold text-white text-lg mb-1">Glissez votre image ici</p>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
          ou cliquez pour sélectionner · PNG, JPEG, WebP · max 20 Mo
        </p>
      </div>
      <div className="flex items-center gap-2">
        {["PNG", "JPEG", "WebP"].map((fmt) => (
          <span
            key={fmt}
            className="flex items-center gap-1 text-xs px-3 py-1 rounded-full font-semibold"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}
          >
            <FileImage size={11} /> {fmt}
          </span>
        ))}
        <ArrowRight size={14} style={{ color: "rgba(255,255,255,0.2)" }} />
        <span
          className="text-xs px-3 py-1 rounded-full font-semibold"
          style={{ background: "rgba(249,115,22,0.1)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.2)" }}
        >
          SVG
        </span>
      </div>
    </div>
  );
}

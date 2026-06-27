"use client";

import { useRef } from "react";
import { Upload, Loader2, RotateCcw, FileImage, ArrowRight, X } from "lucide-react";
import type { Mode, Status } from "@/types/app";

interface Props {
  file: File | null;
  originalUrl: string | null;
  status: Status;
  mode: Mode;
  dragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (f: File) => void;
  onReset: () => void;
  onCancel: () => void;
}

export function DropZone({
  file, originalUrl, status, mode, dragging,
  onDragOver, onDragLeave, onDrop, onFileSelect, onReset, onCancel,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const openPicker = () => { if (status !== "loading") inputRef.current?.click(); };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-label="Zone de dépôt — cliquez ou glissez une image"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPicker(); } }}
        onClick={openPicker}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${dragging ? "var(--color-accent-alt)" : file ? "var(--border-strong)" : "var(--border-medium)"}`,
          background: dragging ? "var(--color-accent-subtle)" : file ? "var(--bg-surface)" : "var(--bg-idle)",
          borderRadius: 24,
          cursor: status === "loading" ? "default" : "pointer",
          transition: "border-color 0.2s, background 0.2s",
          minHeight: file ? 240 : 320,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {status === "loading" ? (
          <LoadingState mode={mode} onCancel={onCancel} />
        ) : file && originalUrl ? (
          <FilePreview file={file} originalUrl={originalUrl} onReset={onReset} />
        ) : (
          <EmptyState />
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileSelect(f); e.target.value = ""; }}
      />
    </>
  );
}

function LoadingState({ mode, onCancel }: { mode: Mode; onCancel: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-14 h-14 rounded-2xl btn-accent flex items-center justify-center shadow-xl shadow-rose-500/25">
        <Loader2 size={26} className="text-white animate-spin" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-sm mb-1" style={{ color: "var(--text-primary)" }}>
          Vectorisation en cours…
        </p>
        <p style={{ color: "var(--text-dim)", fontSize: 12 }}>
          {mode === "fast" ? "Traitement local" : "Analyse par IA"}
        </p>
      </div>
      {mode === "ai" && (
        <button
          onClick={(e) => { e.stopPropagation(); onCancel(); }}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
          style={{ color: "var(--text-inactive)", background: "var(--bg-subtle)", border: "1px solid var(--border-medium)" }}
        >
          <X size={11} /> Annuler
        </button>
      )}
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
        <span style={{ color: "var(--text-dim)", fontSize: 13 }}>
          {file.name} · {(file.size / 1024).toFixed(0)} Ko
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onReset(); }}
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors"
          style={{ color: "var(--text-inactive)", background: "var(--bg-subtle)" }}
        >
          <RotateCcw size={11} /> Changer
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-5 p-10">
      <div className="w-16 h-16 rounded-2xl btn-accent flex items-center justify-center shadow-xl shadow-rose-500/20">
        <Upload size={28} className="text-white" />
      </div>
      <div className="text-center">
        <p className="font-bold text-lg mb-1" style={{ color: "var(--text-primary)" }}>
          Glissez votre image ici
        </p>
        <p style={{ color: "var(--text-dim)", fontSize: 13 }}>
          ou cliquez pour sélectionner · PNG, JPEG, WebP · max 20 Mo
        </p>
      </div>
      <div className="flex items-center gap-2">
        {["PNG", "JPEG", "WebP"].map((fmt) => (
          <span
            key={fmt}
            className="flex items-center gap-1 text-xs px-3 py-1 rounded-full font-semibold"
            style={{ background: "var(--bg-subtle)", color: "var(--text-muted)" }}
          >
            <FileImage size={11} /> {fmt}
          </span>
        ))}
        <ArrowRight size={14} style={{ color: "var(--text-faint)" }} />
        <span
          className="text-xs px-3 py-1 rounded-full font-semibold"
          style={{ background: "var(--color-accent-bg)", color: "var(--color-accent)", border: "1px solid var(--color-accent-border)" }}
        >
          SVG
        </span>
      </div>
    </div>
  );
}

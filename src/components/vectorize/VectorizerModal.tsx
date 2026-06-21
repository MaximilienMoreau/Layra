"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { X, Upload, Wand2, Download, LayoutTemplate, AlertCircle, Loader2, Zap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreditsStore } from "@/store/creditsStore";
import { getSessionId } from "@/lib/session";

type Mode = "fast" | "ai";
type Status = "idle" | "loading" | "success" | "error";

type Props = {
  onClose: () => void;
  onPlaceOnCanvas: (svgString: string) => void;
};

const MODES = [
  {
    id: "fast" as Mode,
    label: "Rapide",
    sub: "gratuit",
    icon: Zap,
    desc: "Logos, illustrations, flat design",
  },
  {
    id: "ai" as Mode,
    label: "IA",
    sub: "15 crédits",
    icon: Sparkles,
    desc: "Photos, rendus réalistes, IA générative",
  },
];

export function VectorizerModal({ onClose, onPlaceOnCanvas }: Props) {
  const [mode, setMode] = useState<Mode>("fast");
  const [status, setStatus] = useState<Status>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [svgResult, setSvgResult] = useState<string | null>(null);
  const [svgPreviewUrl, setSvgPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const svgPreviewUrlRef = useRef<string | null>(null);
  const vectorizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { spend, canUse } = useCreditsStore();

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      if (svgPreviewUrlRef.current) URL.revokeObjectURL(svgPreviewUrlRef.current);
      if (vectorizeTimeoutRef.current) clearTimeout(vectorizeTimeoutRef.current);
    };
  }, []);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) return;
    setFile(f);
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = URL.createObjectURL(f);
    previewUrlRef.current = url;
    setPreviewUrl(url);
    setSvgResult(null);
    if (svgPreviewUrlRef.current) {
      URL.revokeObjectURL(svgPreviewUrlRef.current);
      svgPreviewUrlRef.current = null;
    }
    setSvgPreviewUrl(null);
    setStatus("idle");
    setError(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  function resetResult() {
    if (svgPreviewUrlRef.current) {
      URL.revokeObjectURL(svgPreviewUrlRef.current);
      svgPreviewUrlRef.current = null;
    }
    setSvgResult(null);
    setSvgPreviewUrl(null);
    setStatus("idle");
    setError(null);
  }

  async function vectorizeFast() {
    if (!previewUrl) return;
    setStatus("loading");
    setError(null);
    try {
      // Dynamic import — avoids SSR issues, imagetracerjs needs browser canvas
      const ImageTracer = await import("imagetracerjs");
      const tracer = (ImageTracer as unknown as { default?: typeof ImageTracer }).default ?? ImageTracer;
      const svg = await new Promise<string>((resolve, reject) => {
        vectorizeTimeoutRef.current = setTimeout(
          () => reject(new Error("Timeout : vectorisation trop longue (>30s)")),
          30_000
        );
        (tracer as typeof ImageTracer).imageToSVG(
          previewUrl,
          (svgString: string) => {
            if (vectorizeTimeoutRef.current) clearTimeout(vectorizeTimeoutRef.current);
            if (!svgString) reject(new Error("Résultat vide"));
            else resolve(svgString);
          },
          { numberofcolors: 16, scale: 1, simplify: 0, pathomit: 8 }
        );
      });
      const blob = new Blob([svg], { type: "image/svg+xml" });
      if (svgPreviewUrlRef.current) URL.revokeObjectURL(svgPreviewUrlRef.current);
      const svgUrl = URL.createObjectURL(blob);
      svgPreviewUrlRef.current = svgUrl;
      setSvgResult(svg);
      setSvgPreviewUrl(svgUrl);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de vectorisation");
      setStatus("error");
    }
  }

  async function vectorizeAI() {
    if (!file || !canUse("vectorize_image")) return;
    setStatus("loading");
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("sessionId", getSessionId());
      const res = await fetch("/api/vectorize", { method: "POST", body: formData });
      if (!res.ok) {
        const json = await res.json().catch(() => ({ error: "Erreur inconnue" }));
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      const svg = await res.text();
      spend("vectorize_image"); // Sync client-side counter with server spend
      const blob = new Blob([svg], { type: "image/svg+xml" });
      if (svgPreviewUrlRef.current) URL.revokeObjectURL(svgPreviewUrlRef.current);
      const svgUrl = URL.createObjectURL(blob);
      svgPreviewUrlRef.current = svgUrl;
      setSvgResult(svg);
      setSvgPreviewUrl(svgUrl);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de vectorisation");
      setStatus("error");
    }
  }

  function downloadSvg() {
    if (!svgResult) return;
    const url = URL.createObjectURL(new Blob([svgResult], { type: "image/svg+xml" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `layra-vector-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const canVectorize =
    !!file &&
    status !== "loading" &&
    (mode === "fast" || canUse("vectorize_image"));

  const notConfigured = error?.includes("non configuré");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Wand2 size={18} className="text-violet-400" />
            <h2 className="text-base font-semibold text-white">Vectoriser une image</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {/* Mode toggle */}
          <div className="grid grid-cols-2 gap-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => { setMode(m.id); resetResult(); }}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl border text-left transition-all",
                  mode === m.id
                    ? "border-violet-500 bg-violet-900/30"
                    : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  mode === m.id ? "bg-violet-600" : "bg-zinc-700"
                )}>
                  <m.icon size={15} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-white">{m.label}</span>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                      m.id === "fast"
                        ? "bg-emerald-900/60 text-emerald-400"
                        : "bg-amber-900/60 text-amber-400"
                    )}>
                      {m.sub}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{m.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Drop zone / image preview */}
          {status !== "success" && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative border-2 border-dashed rounded-xl cursor-pointer transition-all overflow-hidden",
                dragging ? "border-violet-500 bg-violet-900/20" : "border-zinc-700 hover:border-zinc-500",
                previewUrl ? "h-44" : "h-32 flex items-center justify-center"
              )}
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Aperçu" className="w-full h-full object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-zinc-500">
                  <Upload size={24} />
                  <p className="text-sm">Glissez une image ou cliquez</p>
                  <p className="text-xs text-zinc-600">PNG · JPG · WebP</p>
                </div>
              )}
            </div>
          )}

          {/* SVG result */}
          {status === "success" && svgPreviewUrl && (
            <div className="rounded-xl overflow-hidden border border-zinc-700 bg-zinc-800 h-52 flex items-center justify-center relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={svgPreviewUrl} alt="Résultat vectoriel" className="max-h-full max-w-full object-contain p-2" />
              <button
                onClick={resetResult}
                className="absolute top-2 right-2 text-xs text-zinc-400 hover:text-white bg-zinc-900/80 px-2 py-1 rounded-md transition-colors"
              >
                Recommencer
              </button>
            </div>
          )}

          {/* Loading */}
          {status === "loading" && (
            <div className="flex items-center gap-3 text-zinc-400 text-sm">
              <Loader2 size={16} className="animate-spin text-violet-400" />
              {mode === "fast" ? "Analyse et traçage en cours…" : "Vectorisation IA en cours…"}
            </div>
          )}

          {/* Error */}
          {status === "error" && error && (
            <div className="flex items-start gap-2 p-3 bg-red-900/30 border border-red-800 rounded-lg text-sm text-red-300">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <div>
                <p>{error}</p>
                {notConfigured && (
                  <p className="mt-1 text-xs text-red-400">
                    Ajoutez <code className="font-mono">VECTORIZER_API_ID</code> et <code className="font-mono">VECTORIZER_API_SECRET</code> dans votre <code className="font-mono">.env.local</code>.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between gap-2">
          <span className="text-xs text-zinc-600">
            {mode === "fast" ? "Traitement local · aucune donnée envoyée" : "Traitement IA · 15 crédits"}
          </span>
          <div className="flex gap-2">
            {status === "success" ? (
              <>
                <button
                  onClick={downloadSvg}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                >
                  <Download size={13} />
                  Télécharger SVG
                </button>
                <button
                  onClick={() => { onPlaceOnCanvas(svgResult!); onClose(); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-violet-600 hover:bg-violet-500 text-white transition-colors"
                >
                  <LayoutTemplate size={13} />
                  Placer sur le canvas
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={mode === "fast" ? vectorizeFast : vectorizeAI}
                  disabled={!canVectorize}
                  className="flex items-center gap-1.5 px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Wand2 size={13} />
                  Vectoriser
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}

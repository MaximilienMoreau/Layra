"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  Upload, Download, Zap, Sparkles, RotateCcw,
  ArrowRight, AlertCircle, Loader2, FileImage,
} from "lucide-react";
import { getSessionId } from "@/lib/session";

type Mode   = "fast" | "ai";
type Status = "idle" | "loading" | "done" | "error";

export default function VectorizerApp() {
  const [mode, setMode]           = useState<Mode>("fast");
  const [status, setStatus]       = useState<Status>("idle");
  const [file, setFile]           = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [svgResult, setSvgResult] = useState<string | null>(null);
  const [svgUrl, setSvgUrl]       = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [dragging, setDragging]   = useState(false);

  const fileInputRef  = useRef<HTMLInputElement>(null);
  const origUrlRef    = useRef<string | null>(null);
  const svgUrlRef     = useRef<string | null>(null);

  useEffect(() => () => {
    if (origUrlRef.current) URL.revokeObjectURL(origUrlRef.current);
    if (svgUrlRef.current)  URL.revokeObjectURL(svgUrlRef.current);
  }, []);

  const loadFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) return;
    if (origUrlRef.current) URL.revokeObjectURL(origUrlRef.current);
    if (svgUrlRef.current)  { URL.revokeObjectURL(svgUrlRef.current); svgUrlRef.current = null; }
    const url = URL.createObjectURL(f);
    origUrlRef.current = url;
    setFile(f);
    setOriginalUrl(url);
    setSvgResult(null);
    setSvgUrl(null);
    setStatus("idle");
    setError(null);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) loadFile(f);
  }, [loadFile]);

  async function vectorize() {
    if (!file) return;
    setStatus("loading");
    setError(null);

    try {
      let svg: string;

      if (mode === "fast") {
        const ImageTracer = await import("imagetracerjs");
        const tracer = (ImageTracer as unknown as { default?: typeof ImageTracer }).default ?? ImageTracer;
        svg = await new Promise<string>((resolve, reject) => {
          const t = setTimeout(() => reject(new Error("Timeout (>30s)")), 30_000);
          (tracer as typeof ImageTracer).imageToSVG(
            origUrlRef.current!,
            (s: string) => { clearTimeout(t); s ? resolve(s) : reject(new Error("Résultat vide")); },
            { numberofcolors: 16, scale: 1, simplify: 0, pathomit: 8 }
          );
        });
      } else {
        const formData = new FormData();
        formData.append("image", file);
        formData.append("sessionId", getSessionId());
        const res = await fetch("/api/vectorize", { method: "POST", body: formData });
        if (!res.ok) {
          const json = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          throw new Error(json.error ?? `HTTP ${res.status}`);
        }
        svg = await res.text();
      }

      if (svgUrlRef.current) URL.revokeObjectURL(svgUrlRef.current);
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url  = URL.createObjectURL(blob);
      svgUrlRef.current = url;
      setSvgResult(svg);
      setSvgUrl(url);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setStatus("error");
    }
  }

  function download() {
    if (!svgResult) return;
    const url = URL.createObjectURL(new Blob([svgResult], { type: "image/svg+xml" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `layra-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    if (origUrlRef.current) { URL.revokeObjectURL(origUrlRef.current); origUrlRef.current = null; }
    if (svgUrlRef.current)  { URL.revokeObjectURL(svgUrlRef.current);  svgUrlRef.current  = null; }
    setFile(null);
    setOriginalUrl(null);
    setSvgResult(null);
    setSvgUrl(null);
    setStatus("idle");
    setError(null);
  }

  const hasDone = status === "done" && svgUrl;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#09090f", color: "#f0f0ff" }}>

      {/* ── Header ── */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#0d0d16" }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl btn-accent flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-base text-gradient tracking-tight">Layra</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full ml-1" style={{ background: "rgba(249,115,22,0.12)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.2)" }}>
              PNG & JPEG → SVG
            </span>
          </div>

          {/* Mode toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "#141420", border: "1px solid rgba(255,255,255,0.07)" }}>
            {([
              { id: "fast" as Mode, label: "Rapide", icon: Zap,      sub: "gratuit"   },
              { id: "ai"   as Mode, label: "IA",     icon: Sparkles,  sub: "premium" },
            ] as const).map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150"
                style={mode === m.id
                  ? { background: "rgba(255,255,255,0.1)", color: "#fff" }
                  : { color: "rgba(255,255,255,0.35)" }}
              >
                <m.icon size={13} />
                {m.label}
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{
                  background: m.id === "fast" ? "rgba(52,211,153,0.12)" : "rgba(251,191,36,0.12)",
                  color:      m.id === "fast" ? "#34d399" : "#fbbf24",
                }}>
                  {m.sub}
                </span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Hero text ── */}
      {!file && (
        <div className="text-center px-6 pt-16 pb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-3 text-gradient">
            PNG & JPEG → SVG
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 16 }}>
            Transformez vos images en SVG vectoriels parfaits en quelques secondes.
          </p>
        </div>
      )}

      {/* ── Main area ── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 pb-16" style={{ paddingTop: file ? 40 : 0 }}>

        {!hasDone ? (
          /* ── Upload zone ── */
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => status !== "loading" && fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? "#f97316" : file ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.08)"}`,
              background: dragging ? "rgba(249,115,22,0.05)" : file ? "#0d0d1a" : "rgba(255,255,255,0.02)",
              borderRadius: 24,
              cursor: status === "loading" ? "default" : "pointer",
              transition: "all 0.2s",
              minHeight: file ? 240 : 320,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {status === "loading" ? (
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
            ) : file && originalUrl ? (
              <div className="flex flex-col items-center gap-5 p-6 w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={originalUrl} alt="Original" className="max-h-48 max-w-full object-contain rounded-xl" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }} />
                <div className="flex items-center gap-3">
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                    {file.name} · {(file.size / 1024).toFixed(0)} Ko
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); reset(); }}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors"
                    style={{ color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.06)" }}
                  >
                    <RotateCcw size={11} /> Changer
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-5 p-10">
                <div className="w-16 h-16 rounded-2xl btn-accent flex items-center justify-center shadow-xl shadow-rose-500/20">
                  <Upload size={28} className="text-white" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-white text-lg mb-1">Glissez votre image ici</p>
                  <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>ou cliquez pour sélectionner · PNG, JPEG, WebP</p>
                </div>
                {/* Formats badge */}
                <div className="flex items-center gap-2">
                  {["PNG", "JPEG", "WebP"].map((f) => (
                    <span key={f} className="flex items-center gap-1 text-xs px-3 py-1 rounded-full font-semibold" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
                      <FileImage size={11} /> {f}
                    </span>
                  ))}
                  <ArrowRight size={14} style={{ color: "rgba(255,255,255,0.2)" }} />
                  <span className="flex items-center gap-1 text-xs px-3 py-1 rounded-full font-semibold" style={{ background: "rgba(249,115,22,0.1)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.2)" }}>
                    SVG
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── Result: before / after ── */
          <div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Original */}
              <div style={{ borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", background: "#0d0d1a" }}>
                <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>Original</span>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>{file?.name}</span>
                </div>
                <div className="flex items-center justify-center p-6" style={{ minHeight: 260 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={originalUrl!} alt="Original" className="max-h-56 max-w-full object-contain" />
                </div>
              </div>

              {/* SVG result */}
              <div style={{ borderRadius: 20, overflow: "hidden", border: "1px solid rgba(249,115,22,0.2)", background: "#0d0d1a" }}>
                <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <span className="text-xs font-semibold" style={{ color: "#fb923c" }}>SVG vectoriel</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(52,211,153,0.1)", color: "#34d399" }}>✓ Prêt</span>
                </div>
                <div className="checker flex items-center justify-center p-6" style={{ minHeight: 260 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={svgUrl!} alt="SVG" className="max-h-56 max-w-full object-contain" />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <button
                onClick={reset}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <RotateCcw size={15} /> Vectoriser une autre image
              </button>
              <button
                onClick={download}
                className="btn-accent flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-xl shadow-rose-500/20"
              >
                <Download size={15} /> Télécharger le SVG
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {status === "error" && error && (
          <div className="mt-4 flex items-start gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertCircle size={16} style={{ color: "#f87171", flexShrink: 0, marginTop: 1 }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "#f87171" }}>{error}</p>
              {error.includes("non configuré") && (
                <p className="text-xs mt-1" style={{ color: "rgba(248,113,113,0.7)" }}>
                  Ajoutez <code className="font-mono">VECTORIZER_API_ID</code> et <code className="font-mono">VECTORIZER_API_SECRET</code> dans <code className="font-mono">.env.local</code>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Vectorize CTA */}
        {file && status !== "loading" && status !== "done" && (
          <button
            onClick={vectorize}
            className="btn-accent w-full mt-5 flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-base font-bold text-white shadow-2xl shadow-rose-500/20"
          >
            {mode === "fast" ? <Zap size={18} /> : <Sparkles size={18} />}
            {mode === "fast" ? "Vectoriser rapidement (gratuit)" : "Vectoriser avec l'IA"}
          </button>
        )}

        {/* Info */}
        {!file && (
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { icon: Zap,      title: "Mode Rapide — gratuit",         desc: "Traitement 100% local, aucune donnée envoyée. Parfait pour logos et illustrations flat." },
              { icon: Sparkles, title: "Mode IA — résultats pro",         desc: "Résultats haute qualité sur photos et visuels complexes. Nécessite une clé API." },
              { icon: Download, title: "SVG scalable à l'infini",       desc: "Le fichier généré est propre, léger, et s'adapte à toutes les tailles sans perte." },
            ].map((item) => (
              <div key={item.title} className="px-5 py-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <item.icon size={18} style={{ color: "#f97316", marginBottom: 10 }} />
                <p className="text-sm font-semibold text-white mb-1">{item.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="text-center pb-6" style={{ color: "rgba(255,255,255,0.15)", fontSize: 12 }}>
        Layra · {mode === "fast" ? "Traitement local · aucune donnée envoyée" : "Traitement IA · résultats premium"}
      </footer>

      <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); e.target.value = ""; }} />
    </div>
  );
}

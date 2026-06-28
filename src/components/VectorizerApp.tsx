"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { Zap, Sparkles, Download, AlertCircle } from "lucide-react";
import { getSessionId } from "@/lib/session";
import { useTheme } from "@/hooks/useTheme";
import { useCredits } from "@/hooks/useCredits";
import { AppHeader } from "@/components/AppHeader";
import { DropZone } from "@/components/DropZone";
import { ResultPanel } from "@/components/ResultPanel";
import type { Mode, Status } from "@/types/app";

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_FILE_SIZE = 20 * 1024 * 1024;

const MODE_COLORS = {
  fast: { color: "var(--color-fast)", bg: "var(--color-fast-subtle)", border: "var(--color-fast-border)" },
  ai:   { color: "var(--color-ai)",   bg: "var(--color-ai-subtle)",   border: "var(--color-ai-border)"   },
} as const;

const INFO_CARDS = [
  { icon: Zap,      mode: "fast" as Mode, title: "Mode Rapide",          desc: "Traitement 100% local, aucune donnée envoyée. Parfait pour logos et illustrations flat." },
  { icon: Sparkles, mode: "ai"  as Mode,  title: "Mode IA",              desc: "Résultats haute qualité sur photos et visuels complexes. Nécessite une clé API." },
  { icon: Download, mode: null,            title: "SVG scalable à l'infini", desc: "Le fichier généré est propre, léger, et s'adapte à toutes les tailles sans perte." },
] satisfies Array<{ icon: React.ComponentType<{ size?: number }>, mode: Mode | null, title: string, desc: string }>;

export default function VectorizerApp() {
  const [mode, setMode]               = useState<Mode>("fast");
  const [status, setStatus]           = useState<Status>("idle");
  const [file, setFile]               = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [svgResult, setSvgResult]     = useState<string | null>(null);
  const [svgUrl, setSvgUrl]           = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [dragging, setDragging]       = useState(false);

  const origUrlRef = useRef<string | null>(null);
  const svgUrlRef  = useRef<string | null>(null);
  const abortRef   = useRef<AbortController | null>(null);

  const { theme, toggleTheme }   = useTheme();
  const { credits, fetchCredits } = useCredits(mode);

  // Abort any in-progress AI request when the user switches modes
  useEffect(() => {
    if (status !== "loading") return;
    abortRef.current?.abort();
    setStatus("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => () => {
    abortRef.current?.abort();
    if (origUrlRef.current) URL.revokeObjectURL(origUrlRef.current);
    if (svgUrlRef.current)  URL.revokeObjectURL(svgUrlRef.current);
  }, []);

  const loadFile = useCallback((f: File) => {
    if (!ALLOWED_TYPES.has(f.type)) {
      setError(`Format non supporté (${f.type || "inconnu"}). Utilisez PNG, JPEG ou WebP.`);
      setStatus("error");
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setError(`Fichier trop volumineux (${(f.size / 1024 / 1024).toFixed(1)} Mo). Maximum : 20 Mo.`);
      setStatus("error");
      return;
    }
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

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const data = e.clipboardData;
      if (!data) return;
      const direct = data.files[0];
      if (direct && ALLOWED_TYPES.has(direct.type)) { loadFile(direct); return; }
      for (const item of data.items) {
        if (item.kind === "file" && ALLOWED_TYPES.has(item.type)) {
          const f = item.getAsFile();
          if (f) { loadFile(f); return; }
        }
      }
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [loadFile]);

  const vectorize = useCallback(async () => {
    if (!file || !origUrlRef.current) return;
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
            (s: string) => { clearTimeout(t); if (s) { resolve(s); } else { reject(new Error("Résultat vide")); } },
            { numberofcolors: 16, scale: 1, simplify: 0, pathomit: 8 }
          );
        });
      } else {
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        const formData = new FormData();
        formData.append("image", file);
        formData.append("sessionId", getSessionId());
        const res = await fetch("/api/vectorize", {
          method: "POST",
          body: formData,
          signal: abortRef.current.signal,
        });
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
      if (mode === "ai") fetchCredits();
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setStatus("idle");
        return;
      }
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setStatus("error");
    }
  }, [file, mode, fetchCredits]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (origUrlRef.current) { URL.revokeObjectURL(origUrlRef.current); origUrlRef.current = null; }
    if (svgUrlRef.current)  { URL.revokeObjectURL(svgUrlRef.current);  svgUrlRef.current  = null; }
    setFile(null);
    setOriginalUrl(null);
    setSvgResult(null);
    setSvgUrl(null);
    setStatus("idle");
    setError(null);
  }, []);

  const download = useCallback(() => {
    if (!svgUrl || !file) return;
    const a = document.createElement("a");
    a.href = svgUrl;
    a.download = file.name.replace(/\.[^.]+$/, "") + ".svg";
    a.click();
  }, [svgUrl, file]);

  const hasDone   = status === "done" && !!svgUrl;
  const svgSizeKb = useMemo(
    () => svgResult ? Math.round(new Blob([svgResult]).size / 1024) : null,
    [svgResult]
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>
      <AppHeader
        mode={mode}
        onModeChange={setMode}
        theme={theme}
        onToggleTheme={toggleTheme}
        credits={credits}
      />

      <div style={{ background: "var(--bg-subtle)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-2">
          {mode === "fast" ? (
            <>
              <Zap size={11} style={{ color: "var(--color-fast)", flexShrink: 0 }} />
              <span className="text-xs font-medium" style={{ color: "var(--color-fast)" }}>Mode Rapide</span>
              <span className="text-xs" style={{ color: "var(--text-dim)" }}>traitement 100% local, aucune donnée envoyée</span>
            </>
          ) : (
            <>
              <Sparkles size={11} style={{ color: "var(--color-ai)", flexShrink: 0 }} />
              <span className="text-xs font-medium" style={{ color: "var(--color-ai)" }}>Mode IA</span>
              <span className="text-xs" style={{ color: "var(--text-dim)" }}>résultats haute qualité, traitement côté serveur</span>
            </>
          )}
        </div>
      </div>

      {!file && (
        <div className="text-center px-6 pt-16 pb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-3 text-gradient">
            PNG, JPEG & WebP → SVG
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 16 }}>
            Transformez vos images en SVG vectoriels parfaits en quelques secondes.
          </p>
        </div>
      )}

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 pb-16" style={{ paddingTop: file ? 40 : 0 }}>
        {hasDone && file && originalUrl ? (
          <ResultPanel
            file={file}
            originalUrl={originalUrl}
            svgUrl={svgUrl}
            svgSizeKb={svgSizeKb}
            onReset={reset}
            onDownload={download}
          />
        ) : (
          <DropZone
            file={file}
            originalUrl={originalUrl}
            status={status}
            mode={mode}
            dragging={dragging}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false); }}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) loadFile(f); }}
            onFileSelect={loadFile}
            onReset={reset}
            onCancel={() => abortRef.current?.abort()}
          />
        )}

        {status === "error" && error && (
          <div
            className="mt-4 flex items-start gap-3 px-4 py-3 rounded-xl"
            style={{ background: "var(--color-error-bg)", border: "1px solid var(--color-error-border)" }}
          >
            <AlertCircle size={16} style={{ color: "var(--color-error)", flexShrink: 0, marginTop: 1 }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--color-error)" }}>{error}</p>
              {error.includes("non configuré") && (
                <p className="text-xs mt-1" style={{ color: "var(--color-error)", opacity: 0.7 }}>
                  Ajoutez <code className="font-mono">VECTORIZER_API_ID</code> et{" "}
                  <code className="font-mono">VECTORIZER_API_SECRET</code> dans{" "}
                  <code className="font-mono">.env.local</code>
                </p>
              )}
            </div>
          </div>
        )}

        {file && status !== "loading" && status !== "done" && (
          <button
            onClick={vectorize}
            className="btn-accent w-full mt-5 flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-base font-bold text-white shadow-2xl shadow-rose-500/20"
          >
            {mode === "fast" ? <Zap size={18} /> : <Sparkles size={18} />}
            {mode === "fast" ? "Vectoriser rapidement (gratuit)" : "Vectoriser avec l'IA"}
          </button>
        )}

        {!file && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {INFO_CARDS.map((card) => {
              const active = card.mode === mode;
              const colors = card.mode ? MODE_COLORS[card.mode] : null;
              return (
                <div
                  key={card.title}
                  className="px-5 py-4 rounded-2xl transition-all duration-200"
                  style={{
                    background: active && colors ? colors.bg : "var(--bg-card)",
                    border: `1px solid ${active && colors ? colors.border : "var(--border-subtle)"}`,
                  }}
                >
                  <card.icon
                    size={18}
                    style={{ color: active && colors ? colors.color : "var(--color-accent-alt)", marginBottom: 10 }}
                  />
                  <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{card.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-dim)" }}>{card.desc}</p>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="text-center pb-6" style={{ color: "var(--text-faint)", fontSize: 12 }}>
        Layra · {mode === "fast" ? "Traitement local · aucune donnée envoyée" : "Traitement IA · résultats premium"}
      </footer>
    </div>
  );
}

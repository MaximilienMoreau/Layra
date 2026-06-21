"use client";

import { Zap, Sparkles, Download, AlertCircle, Coins } from "lucide-react";
import { useVectorize } from "@/hooks/useVectorize";
import { useCreditsStore } from "@/store/creditsStore";
import { DropZone } from "@/components/vectorizer/DropZone";
import { ResultPanel } from "@/components/vectorizer/ResultPanel";
import { ModeToggle } from "@/components/vectorizer/ModeToggle";

const INFO_CARDS = [
  { icon: Zap,      title: "Mode Rapide — gratuit",   desc: "Traitement 100% local, aucune donnée envoyée. Parfait pour logos et illustrations flat." },
  { icon: Sparkles, title: "Mode IA — résultats pro", desc: "Résultats haute qualité sur photos et visuels complexes. Nécessite une clé API." },
  { icon: Download, title: "SVG scalable à l'infini", desc: "Le fichier généré est propre, léger, et s'adapte à toutes les tailles sans perte." },
] as const;

export default function VectorizerApp() {
  const { mode, setMode, status, file, originalUrl, svgUrl, error, loadFile, vectorize, reset, download } = useVectorize();
  const { credits, canUse } = useCreditsStore();

  const hasDone   = status === "done" && !!svgUrl;
  const aiBlocked = mode === "ai" && !canUse("vectorize_image");

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#09090f", color: "#f0f0ff" }}>

      {/* ── Header ── */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#0d0d16" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl btn-accent flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-base text-gradient tracking-tight">Layra</span>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full ml-1 hidden sm:inline-block"
              style={{ background: "rgba(249,115,22,0.12)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.2)" }}
            >
              PNG & JPEG → SVG
            </span>
          </div>

          <div className="flex items-center gap-3">
            {mode === "ai" && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                style={{
                  background: credits > 0 ? "rgba(251,191,36,0.08)" : "rgba(239,68,68,0.08)",
                  color:      credits > 0 ? "#fbbf24" : "#f87171",
                  border:    `1px solid ${credits > 0 ? "rgba(251,191,36,0.18)" : "rgba(239,68,68,0.2)"}`,
                }}
              >
                <Coins size={11} />
                {credits} crédit{credits !== 1 ? "s" : ""}
              </div>
            )}
            <ModeToggle mode={mode} onChange={setMode} />
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

      {/* ── Main ── */}
      <main
        className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 pb-16"
        style={{ paddingTop: file ? 40 : 0 }}
      >
        {hasDone ? (
          <ResultPanel
            originalUrl={originalUrl!}
            svgUrl={svgUrl!}
            fileName={file!.name}
            onReset={reset}
            onDownload={download}
          />
        ) : (
          <DropZone
            status={status}
            mode={mode}
            file={file}
            originalUrl={originalUrl}
            onFile={loadFile}
            onReset={reset}
          />
        )}

        {/* Erreur */}
        {status === "error" && error && (
          <div
            className="mt-4 flex items-start gap-3 px-4 py-3 rounded-xl"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            <AlertCircle size={16} style={{ color: "#f87171", flexShrink: 0, marginTop: 1 }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "#f87171" }}>{error}</p>
              {error.includes("non configuré") && (
                <p className="text-xs mt-1" style={{ color: "rgba(248,113,113,0.7)" }}>
                  Ajoutez <code className="font-mono">VECTORIZER_API_ID</code> et{" "}
                  <code className="font-mono">VECTORIZER_API_SECRET</code> dans{" "}
                  <code className="font-mono">.env.local</code>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Crédits insuffisants */}
        {aiBlocked && (
          <div
            className="mt-4 flex items-start gap-3 px-4 py-3 rounded-xl"
            style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)" }}
          >
            <Coins size={16} style={{ color: "#fbbf24", flexShrink: 0, marginTop: 1 }} />
            <p className="text-sm" style={{ color: "#fbbf24" }}>
              <span className="font-semibold">Crédits insuffisants</span> — le mode IA nécessite 15 crédits.
              Passez en mode <strong>Rapide</strong> (gratuit) ou rechargez vos crédits.
            </p>
          </div>
        )}

        {/* Bouton Vectoriser */}
        {file && status !== "loading" && !hasDone && (
          <button
            onClick={vectorize}
            disabled={aiBlocked}
            className="btn-accent w-full mt-5 flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-base font-bold text-white shadow-2xl shadow-rose-500/20"
          >
            {mode === "fast" ? <Zap size={18} /> : <Sparkles size={18} />}
            {mode === "fast" ? "Vectoriser rapidement (gratuit)" : "Vectoriser avec l'IA"}
          </button>
        )}

        {/* Info cards */}
        {!file && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {INFO_CARDS.map((card) => (
              <div
                key={card.title}
                className="px-5 py-4 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <card.icon size={18} style={{ color: "#f97316", marginBottom: 10 }} />
                <p className="text-sm font-semibold text-white mb-1">{card.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>{card.desc}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="text-center pb-6" style={{ color: "rgba(255,255,255,0.15)", fontSize: 12 }}>
        Layra · {mode === "fast" ? "Traitement local · aucune donnée envoyée" : "Traitement IA · résultats premium"}
      </footer>
    </div>
  );
}

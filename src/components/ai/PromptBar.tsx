"use client";

import { useState, useRef } from "react";
import { Sparkles, RefreshCw, ArrowUp, Loader2 } from "lucide-react";
import { useCanvasStore } from "@/store/canvasStore";
import { useCreditsStore, CREDIT_COSTS } from "@/store/creditsStore";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Post Instagram café artisanal, chaud et chaleureux",
  "Pub LinkedIn startup tech, minimaliste et premium",
  "Bannière YouTube gaming, esthétique néon sombre",
  "Story vente flash, couleurs vives et dynamiques",
];

export function PromptBar() {
  const [prompt, setPrompt]         = useState("");
  const [isReprompt, setIsReprompt] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isGenerating, layers } = useCanvasStore();
  const { credits, canUse }      = useCreditsStore();

  const hasCanvas   = layers.length > 0;
  const canGenerate = canUse("generate_design") && !isGenerating && prompt.trim().length > 3;

  function handleSubmit() {
    if (!canGenerate) return;
    window.dispatchEvent(new CustomEvent("layra:generate", {
      detail: { prompt: prompt.trim(), reprompt: isReprompt && hasCanvas },
    }));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  }

  return (
    <div className="shrink-0 border-t" style={{ background: "var(--bg-panel)", borderColor: "var(--border-dim)" }}>
      {/* Suggestions */}
      {prompt.length === 0 && !isGenerating && (
        <div className="flex flex-wrap gap-1.5 px-5 pt-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => { setPrompt(s); textareaRef.current?.focus(); }}
              className="text-[11px] px-3 py-1.5 rounded-full border text-white/40 hover:text-white/75 transition-all duration-150 font-medium hover:border-white/[0.16]"
              style={{ background: "var(--bg-card)", borderColor: "var(--border-dim)" }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Main input */}
      <div className="px-5 py-3 flex items-end gap-3">

        {/* Reprompt toggle */}
        {hasCanvas && (
          <div className="flex shrink-0 rounded-lg p-0.5 border self-end mb-px" style={{ background: "var(--bg-card)", borderColor: "var(--border-dim)" }}>
            <button
              onClick={() => setIsReprompt(false)}
              className={cn("text-[11px] px-2.5 py-1 rounded-md font-semibold transition-all duration-150",
                !isReprompt ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60")}
            >
              Nouveau
            </button>
            <button
              onClick={() => setIsReprompt(true)}
              className={cn("flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md font-semibold transition-all duration-150",
                isReprompt ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60")}
            >
              <RefreshCw size={10} />
              Modifier
            </button>
          </div>
        )}

        {/* Input with gradient ring */}
        <div className="flex-1 gradient-ring rounded-[13px]">
          <div
            className="relative rounded-[12px] border flex items-end gap-2 px-3 py-2.5 transition-colors duration-150"
            style={{ background: "var(--bg-input)", borderColor: "var(--border)" }}
          >
            <Sparkles size={15} className="text-rose-400/60 shrink-0 mb-0.5" />
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isReprompt ? "Décris la modification souhaitée…" : "Décris ton design — l'IA s'occupe du reste"}
              disabled={isGenerating}
              rows={1}
              className="flex-1 bg-transparent text-sm text-white placeholder-white/30 resize-none outline-none disabled:opacity-50 leading-relaxed"
              style={{ minHeight: "26px", maxHeight: "110px" }}
              onInput={(e) => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = "auto";
                t.style.height = `${Math.min(t.scrollHeight, 110)}px`;
              }}
            />
          </div>
        </div>

        {/* Generate */}
        <button
          onClick={handleSubmit}
          disabled={!canGenerate}
          className={cn(
            "shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 self-end",
            canGenerate
              ? "btn-accent text-white shadow-lg shadow-rose-500/25"
              : "text-white/20 cursor-not-allowed border border-white/[0.06]"
          )}
          style={!canGenerate ? { background: "var(--bg-card)" } : {}}
        >
          {isGenerating
            ? <Loader2 size={15} className="animate-spin" />
            : <ArrowUp size={15} />
          }
          <span className="hidden sm:inline">{isGenerating ? "Génération…" : "Générer"}</span>
        </button>
      </div>

      {/* Footer */}
      <div className="px-5 pb-2.5 flex items-center justify-center gap-2">
        <span className="text-[10px] font-medium" style={{ color: credits < 50 ? "#f87171" : "rgba(255,255,255,0.2)" }}>
          {credits} crédits
        </span>
        <span className="text-[10px] text-white/10">·</span>
        <span className="text-[10px] text-white/20 font-medium">{CREDIT_COSTS.generate_design} cr / génération</span>
      </div>
    </div>
  );
}

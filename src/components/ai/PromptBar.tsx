"use client";

import { useState, useRef } from "react";
import { Sparkles, RefreshCw, Send, Zap } from "lucide-react";
import { useCanvasStore } from "@/store/canvasStore";
import { useCreditsStore, CREDIT_COSTS } from "@/store/creditsStore";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Un post Instagram pour un café artisanal, ambiance chaleureuse",
  "Une pub LinkedIn pour une startup tech, style minimaliste",
  "Un visuel motivant pour Instagram, couleurs vives",
  "Une bannière YouTube pour une chaîne gaming, esthétique néon sombre",
  "Une annonce de lancement de produit, style premium",
  "Une story Instagram pour une vente flash",
];

export function PromptBar() {
  const [prompt, setPrompt] = useState("");
  const [isReprompt, setIsReprompt] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isGenerating, layers } = useCanvasStore();
  const { credits, canUse } = useCreditsStore();

  const hasCanvas = layers.length > 0;
  const canGenerate = canUse("generate_design") && !isGenerating && prompt.trim().length > 3;

  function handleSubmit() {
    if (!canGenerate) return;
    window.dispatchEvent(
      new CustomEvent("layra:generate", {
        detail: { prompt: prompt.trim(), reprompt: isReprompt && hasCanvas },
      })
    );
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function applySuggestion(s: string) {
    setPrompt(s);
    textareaRef.current?.focus();
  }

  return (
    <div>
      {/* Main prompt bar */}
      <div className="bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800 px-4 py-3">
        {/* Suggestions (shown when empty) */}
        {prompt.length === 0 && !isGenerating && (
          <div className="flex flex-wrap gap-1.5 mb-3 max-w-4xl mx-auto">
            {SUGGESTIONS.slice(0, 4).map((s) => (
              <button
                key={s}
                onClick={() => applySuggestion(s)}
                className="text-xs bg-zinc-800 hover:bg-rose-950/60 border border-zinc-700 hover:border-rose-800 text-zinc-400 hover:text-rose-200 px-3 py-1.5 rounded-full transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          {/* Mode toggle (new vs reprompt) */}
          {hasCanvas && (
            <div className="flex bg-zinc-800 rounded-lg p-0.5 shrink-0 self-end mb-0.5">
              <button
                onClick={() => setIsReprompt(false)}
                className={cn(
                  "text-xs px-2 py-1 rounded-md transition-colors",
                  !isReprompt ? "bg-rose-600 text-white" : "text-zinc-400 hover:text-white"
                )}
              >
                Nouveau
              </button>
              <button
                onClick={() => setIsReprompt(true)}
                className={cn(
                  "text-xs px-2 py-1 rounded-md transition-colors",
                  isReprompt ? "bg-rose-600 text-white" : "text-zinc-400 hover:text-white"
                )}
              >
                <RefreshCw size={11} className="inline mr-1" />
                Modifier
              </button>
            </div>
          )}

          {/* Textarea */}
          <div className="flex-1 relative">
            <div className="absolute left-3 top-2.5 text-rose-400">
              <Sparkles size={16} />
            </div>
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isReprompt
                  ? "Décris la modification souhaitée..."
                  : "Décris ton design en quelques mots..."
              }
              disabled={isGenerating}
              rows={1}
              className="w-full pl-9 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 focus:border-rose-500 rounded-xl text-sm text-white placeholder-zinc-500 resize-none outline-none transition-colors disabled:opacity-50"
              style={{ minHeight: "42px", maxHeight: "120px" }}
              onInput={(e) => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = "auto";
                t.style.height = `${Math.min(t.scrollHeight, 120)}px`;
              }}
            />
          </div>

          {/* Generate button */}
          <button
            onClick={handleSubmit}
            disabled={!canGenerate}
            className={cn(
              "shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
              canGenerate
                ? "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/50"
                : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
            )}
          >
            {isGenerating ? (
              <Zap size={16} className="animate-pulse" />
            ) : (
              <Send size={16} />
            )}
            <span className="hidden sm:inline">
              {isGenerating ? "Génération..." : "Générer"}
            </span>
          </button>
        </div>

        {/* Credits indicator */}
        <div className="flex justify-center mt-1.5">
          <span className="text-xs">
            <span className={credits < 50 ? "text-red-400" : "text-zinc-500"}>
              {credits} crédits
            </span>
            <span className="text-zinc-700"> · {CREDIT_COSTS.generate_design} crédits/génération</span>
          </span>
        </div>
      </div>
    </div>
  );
}

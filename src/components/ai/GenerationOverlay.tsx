"use client";

import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

type Step = { label: string; done: boolean };

const STEPS: Step[] = [
  { label: "Analyse du prompt",   done: false },
  { label: "Génération Claude",   done: false },
  { label: "Application design",  done: false },
];

function stepsFromProgress(progress: string): Step[] {
  const p = progress.toLowerCase();
  return STEPS.map((s, i) => {
    if (i === 0) return { ...s, done: p.includes("génération") || p.includes("claude") || p.includes("application") || p.includes("terminé") };
    if (i === 1) return { ...s, done: p.includes("application") || p.includes("terminé") };
    if (i === 2) return { ...s, done: p.includes("terminé") };
    return s;
  });
}

function progressPercent(progress: string): number {
  const p = progress.toLowerCase();
  if (p.includes("terminé"))   return 100;
  if (p.includes("application")) return 80;
  if (p.includes("génération") || p.includes("claude")) return 45;
  if (p.includes("analyse"))   return 15;
  return 10;
}

type Props = { progress: string; isError: boolean; onDismiss?: () => void };

export function GenerationOverlay({ progress, isError, onDismiss }: Props) {
  const steps   = stepsFromProgress(progress);
  const percent = isError ? 0 : progressPercent(progress);
  const isDone  = progress.toLowerCase().includes("terminé");

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center" style={{ background: "rgba(7,7,14,0.85)", backdropFilter: "blur(12px)" }}>
      <div className="flex flex-col items-center gap-5 w-72 mx-4 glass border border-white/[0.08] rounded-2xl p-7 shadow-2xl">

        {/* Icon */}
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isError ? "bg-red-500/15 border border-red-500/20" : isDone ? "bg-emerald-500/15 border border-emerald-500/20" : "btn-accent"}`}>
          {isError
            ? <AlertCircle  size={22} className="text-red-400" />
            : isDone
            ? <CheckCircle2 size={22} className="text-emerald-400" />
            : <Loader2      size={22} className="text-white animate-spin" />
          }
        </div>

        {/* Message */}
        <p className={`text-sm font-medium text-center leading-snug ${isError ? "text-red-300" : "text-white"}`}>
          {progress || "Initialisation…"}
        </p>

        {/* Progress */}
        {!isError && (
          <div className="w-full">
            <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full btn-accent rounded-full transition-all duration-700 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {steps.map((step, i) => {
                const isActive = !step.done && (i === 0 || steps[i - 1].done);
                return (
                  <div key={step.label} className="flex items-center gap-2.5">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-300 ${
                      step.done ? "bg-emerald-400 shadow-sm shadow-emerald-400/50"
                      : isActive ? "bg-rose-400 animate-pulse shadow-sm shadow-rose-400/50"
                      : "bg-white/[0.1]"
                    }`} />
                    <span className={`text-xs font-medium transition-colors duration-300 ${
                      step.done ? "text-emerald-400"
                      : isActive ? "text-white/80"
                      : "text-white/20"
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isError && onDismiss && (
          <button
            onClick={onDismiss}
            className="px-5 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.07] hover:bg-white/[0.12] text-white/60 hover:text-white transition-all duration-150 border border-white/[0.08]"
          >
            Fermer
          </button>
        )}
      </div>
    </div>
  );
}

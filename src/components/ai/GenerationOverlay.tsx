"use client";

import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

type Step = { label: string; done: boolean };

const STEPS: Step[] = [
  { label: "Analyse du prompt", done: false },
  { label: "Génération avec Claude", done: false },
  { label: "Application du design", done: false },
];

function stepsFromProgress(progress: string): Step[] {
  const p = progress.toLowerCase();
  return STEPS.map((s, i) => {
    if (i === 0) return { ...s, done: !p.includes("analyse") };
    if (i === 1) return { ...s, done: p.includes("application") || p.includes("terminé") };
    if (i === 2) return { ...s, done: p.includes("terminé") };
    return s;
  });
}

function progressPercent(progress: string): number {
  const p = progress.toLowerCase();
  if (p.includes("terminé")) return 100;
  if (p.includes("application")) return 80;
  if (p.includes("génération") || p.includes("claude")) return 45;
  if (p.includes("analyse")) return 15;
  return 10;
}

type Props = {
  progress: string;
  isError: boolean;
  onDismiss?: () => void;
};

export function GenerationOverlay({ progress, isError, onDismiss }: Props) {
  const steps = stepsFromProgress(progress);
  const percent = isError ? 0 : progressPercent(progress);
  const isDone = progress.toLowerCase().includes("terminé");

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-950/85 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-5 bg-gray-900 rounded-2xl p-8 border border-gray-700 shadow-2xl w-80 mx-4">

        {/* Icône centrale */}
        {isError ? (
          <AlertCircle className="text-red-400" size={40} />
        ) : isDone ? (
          <CheckCircle2 className="text-green-400" size={40} />
        ) : (
          <Loader2 className="text-indigo-400 animate-spin" size={40} />
        )}

        {/* Message principal */}
        <p className={`text-sm font-medium text-center leading-snug ${isError ? "text-red-300" : "text-white"}`}>
          {progress || "Initialisation…"}
        </p>

        {/* Barre de progression */}
        {!isError && (
          <div className="w-full">
            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>

            {/* Étapes */}
            <div className="mt-3 flex flex-col gap-1.5">
              {steps.map((step, i) => {
                const isActive =
                  !step.done &&
                  (i === 0 ||
                    (i > 0 && steps[i - 1].done));
                return (
                  <div key={step.label} className="flex items-center gap-2">
                    <div
                      className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                        step.done
                          ? "bg-green-400"
                          : isActive
                          ? "bg-indigo-400 animate-pulse"
                          : "bg-gray-700"
                      }`}
                    />
                    <span
                      className={`text-xs transition-colors ${
                        step.done
                          ? "text-green-400"
                          : isActive
                          ? "text-indigo-300"
                          : "text-gray-600"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bouton de fermeture sur erreur */}
        {isError && onDismiss && (
          <button
            onClick={onDismiss}
            className="mt-1 px-4 py-1.5 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors border border-gray-700"
          >
            Fermer
          </button>
        )}
      </div>
    </div>
  );
}

"use client";

import { Zap, Sparkles, Sun, Moon } from "lucide-react";
import type { Mode, Theme } from "@/types/app";

const MODES = [
  { id: "fast" as Mode, label: "Rapide", icon: Zap,      sub: "gratuit", color: "var(--color-fast)", bg: "var(--color-fast-bg)" },
  { id: "ai"   as Mode, label: "IA",     icon: Sparkles, sub: "premium", color: "var(--color-ai)",   bg: "var(--color-ai-bg)"   },
] as const;

interface Props {
  mode: Mode;
  onModeChange: (m: Mode) => void;
  theme: Theme;
  onToggleTheme: () => void;
  credits: number | null;
}

export function AppHeader({ mode, onModeChange, theme, onToggleTheme, credits }: Props) {
  return (
    <header style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-header)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl btn-accent flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-bold text-base text-gradient tracking-tight">Layra</span>
          <span
            className="hidden sm:inline-block text-xs font-medium px-2 py-0.5 rounded-full ml-1"
            style={{ background: "var(--color-accent-bg)", color: "var(--color-accent)", border: "1px solid var(--color-accent-border)" }}
          >
            PNG, JPEG & WebP → SVG
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "var(--bg-toggle)", border: "1px solid var(--border-toggle)" }}>
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => onModeChange(m.id)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150"
                style={mode === m.id
                  ? { background: "var(--bg-active)", color: "var(--text-primary)" }
                  : { color: "var(--text-inactive)" }}
              >
                <m.icon size={13} />
                {m.label}
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{ background: m.bg, color: m.color }}
                >
                  {m.id === "ai" && credits !== null ? `${credits} cr.` : m.sub}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={onToggleTheme}
            aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors duration-150"
            style={{ background: "var(--bg-subtle)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </div>
    </header>
  );
}

"use client";

import { Zap, Sparkles } from "lucide-react";
import type { Mode } from "@/hooks/useVectorize";

type Props = {
  mode: Mode;
  onChange: (mode: Mode) => void;
};

const MODES = [
  { id: "fast" as Mode, label: "Rapide", icon: Zap,     sub: "gratuit", subColor: "#34d399", subBg: "rgba(52,211,153,0.12)"  },
  { id: "ai"   as Mode, label: "IA",     icon: Sparkles, sub: "premium", subColor: "#fbbf24", subBg: "rgba(251,191,36,0.12)" },
] as const;

export function ModeToggle({ mode, onChange }: Props) {
  return (
    <div
      className="flex items-center gap-1 p-1 rounded-xl"
      style={{ background: "#141420", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {MODES.map((m) => (
        <button
          key={m.id}
          onClick={() => onChange(m.id)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150"
          style={
            mode === m.id
              ? { background: "rgba(255,255,255,0.1)", color: "#fff" }
              : { color: "rgba(255,255,255,0.35)" }
          }
        >
          <m.icon size={13} />
          {m.label}
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
            style={{ background: m.subBg, color: m.subColor }}
          >
            {m.sub}
          </span>
        </button>
      ))}
    </div>
  );
}

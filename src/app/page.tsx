"use client";

import dynamic from "next/dynamic";
import { Zap } from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const VectorizerApp = dynamic(() => import("@/components/VectorizerApp"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#09090f" }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl btn-accent flex items-center justify-center animate-pulse">
          <Zap size={20} className="text-white" />
        </div>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Chargement…</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <ErrorBoundary>
      <VectorizerApp />
    </ErrorBoundary>
  );
}

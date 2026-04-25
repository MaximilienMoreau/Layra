"use client";

import dynamic from "next/dynamic";
import { Zap } from "lucide-react";

const EditorLayout = dynamic(
  () => import("@/components/editor/EditorLayout").then((m) => m.EditorLayout),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center animate-pulse">
            <Zap size={20} className="text-white" />
          </div>
          <p className="text-zinc-500 text-sm">Chargement de Layra…</p>
        </div>
      </div>
    ),
  }
);

export default function Home() {
  return <EditorLayout />;
}

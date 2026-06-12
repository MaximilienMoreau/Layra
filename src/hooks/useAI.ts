"use client";

import { useCallback } from "react";
import { useCanvasStore } from "@/store/canvasStore";
import { useBrandStore } from "@/store/brandStore";
import { useCreditsStore } from "@/store/creditsStore";
import { generateLayout } from "@/api/claude";
import { canvasToJson } from "@/utils/canvasToJson";
import { useDesignPersistence } from "@/hooks/useDesignPersistence";
import type { ClaudeLayout } from "@/utils/zodSchemas";
import type { Canvas as FabricCanvas } from "fabric";

export function useAI(
  fabricRef: React.RefObject<FabricCanvas | null>,
  loadLayout: (layout: ClaudeLayout) => Promise<void>
) {
  const { format, setIsGenerating, setGenerationProgress, setGenerationError, pushHistory } =
    useCanvasStore();
  const { activeBrand } = useBrandStore();
  const { canUse, spend } = useCreditsStore();
  const { saveDesign } = useDesignPersistence();

  const generate = useCallback(
    async (prompt: string, isReprompt = false) => {
      if (!canUse("generate_design")) {
        setGenerationError("Crédits insuffisants. Passez à un plan supérieur.");
        return;
      }

      setIsGenerating(true);
      setGenerationError(null);
      setGenerationProgress("Analyse du prompt...");

      try {
        const currentCanvas =
          isReprompt && fabricRef.current
            ? canvasToJson(fabricRef.current)
            : undefined;

        setGenerationProgress("Génération avec Claude...");

        const layout = await generateLayout({
          userPrompt: prompt,
          format,
          brandKit: activeBrand,
          currentCanvas,
        });

        setGenerationProgress("Application du design...");
        await loadLayout(layout);
        pushHistory(layout);
        spend("generate_design");

        // Persistance silencieuse — ne bloque pas si Supabase n'est pas configuré
        saveDesign(layout, format, prompt.slice(0, 60) || "Design généré").catch((e) => {
          console.error("[AI] saveDesign unexpected error:", e);
        });

        setGenerationProgress("Terminé !");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur inconnue";
        setGenerationError(msg);
        setGenerationProgress("");
        console.error("[AI Generate]", err);
      } finally {
        setTimeout(() => {
          setIsGenerating(false);
          setGenerationProgress("");
        }, 1500);
      }
    },
    [
      canUse,
      spend,
      pushHistory,
      format,
      activeBrand,
      fabricRef,
      loadLayout,
      saveDesign,
      setIsGenerating,
      setGenerationProgress,
      setGenerationError,
    ]
  );

  return { generate };
}

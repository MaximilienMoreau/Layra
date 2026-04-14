"use client";

import { useCallback } from "react";
import { useCanvasStore } from "@/store/canvasStore";
import { useBrandStore } from "@/store/brandStore";
import { useCreditsStore } from "@/store/creditsStore";
import { generateLayout } from "@/api/claude";
import { canvasToJson } from "@/utils/canvasToJson";
import type { ClaudeLayout } from "@/utils/zodSchemas";
import type { Canvas as FabricCanvas } from "fabric";

export function useAI(
  fabricRef: React.RefObject<FabricCanvas | null>,
  loadLayout: (layout: ClaudeLayout) => Promise<void>
) {
  const { format, setIsGenerating, setGenerationProgress } = useCanvasStore();
  const { activeBrand } = useBrandStore();
  const { canUse, spend } = useCreditsStore();

  const generate = useCallback(
    async (prompt: string, isReprompt = false) => {
      if (!canUse("generate_design")) {
        alert("Crédits insuffisants. Passez à un plan supérieur.");
        return;
      }

      setIsGenerating(true);
      setGenerationProgress("Analyse du prompt...");

      try {
        const currentCanvas =
          isReprompt && fabricRef.current
            ? canvasToJson(fabricRef.current)
            : undefined;

        setGenerationProgress("Génération du layout avec Claude...");

        const layout = await generateLayout({
          userPrompt: prompt,
          format,
          brandKit: activeBrand,
          currentCanvas,
        });

        setGenerationProgress("Application du design...");
        await loadLayout(layout);
        spend("generate_design");
        setGenerationProgress("Terminé !");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur inconnue";
        setGenerationProgress(`Erreur : ${msg}`);
        console.error("[AI Generate]", err);
      } finally {
        setTimeout(() => {
          setIsGenerating(false);
          setGenerationProgress("");
        }, 1500);
      }
    },
    [canUse, spend, format, activeBrand, fabricRef, loadLayout, setIsGenerating, setGenerationProgress]
  );

  return { generate };
}

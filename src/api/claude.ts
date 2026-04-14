import type { ClaudeLayout, CanvasElement } from "@/utils/zodSchemas";
import type { CanvasFormat } from "@/store/canvasStore";
import type { BrandKit } from "@/store/brandStore";

type GenerateLayoutInput = {
  userPrompt: string;
  format: CanvasFormat;
  brandKit: BrandKit;
  currentCanvas?: CanvasElement[];
};

export async function generateLayout(
  input: GenerateLayoutInput
): Promise<ClaudeLayout> {
  const response = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Erreur lors de la génération");
  }

  const data = await response.json();
  return data.layout as ClaudeLayout;
}

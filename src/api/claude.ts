import type { ClaudeLayout, CanvasElement } from "@/utils/zodSchemas";
import type { CanvasFormat } from "@/store/canvasStore";
import type { BrandKit } from "@/store/brandStore";
import { getSessionId } from "@/lib/session";

type GenerateLayoutInput = {
  userPrompt: string;
  format: CanvasFormat;
  brandKit: BrandKit;
  currentCanvas?: CanvasElement[];
};

export async function generateLayout(
  input: GenerateLayoutInput
): Promise<ClaudeLayout> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  const locale =
    typeof navigator !== "undefined" ? navigator.language : "fr";
  const sessionId = getSessionId();

  const response = await fetch("/api/claude", {
    method: "POST",
    headers,
    body: JSON.stringify({ ...input, locale, sessionId }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Erreur lors de la génération");
  }

  const data = await response.json();
  return data.layout as ClaudeLayout;
}

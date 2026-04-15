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

  // Transmets le secret côté client s'il est exposé en variable publique.
  // En production, ce secret doit rester serveur-seul (LAYRA_API_SECRET sans
  // le préfixe NEXT_PUBLIC_).  Ici on le lit uniquement si exposé explicitement.
  const secret = process.env.NEXT_PUBLIC_LAYRA_API_SECRET;
  if (secret) headers["x-layra-secret"] = secret;

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

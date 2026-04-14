import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ClaudeLayoutSchema } from "@/utils/zodSchemas";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Tu es un expert en design graphique et en création de contenu visuel.
Tu génères des layouts structurés en JSON pour une application de création visuelle appelée Layra.

RÈGLES ABSOLUES :
1. Réponds UNIQUEMENT avec du JSON valide, sans markdown, sans commentaires, sans texte autour.
2. Tous les éléments doivent avoir des positions réalistes dans les dimensions données.
3. Les textes doivent être lisibles (contraste suffisant avec le fond).
4. Respecte strictement le brand kit si fourni.
5. Crée des designs professionnels, modernes et visuellement équilibrés.

FORMAT DE RÉPONSE :
{
  "layout": "hero | centered | split | grid",
  "background": { "type": "color | gradient | image", "value": "#hex", "gradient": { "from": "#hex", "to": "#hex", "direction": "to bottom right" } },
  "elements": [
    {
      "type": "text | image | shape | video",
      "id": "el_001",
      "content": "texte (pour type text)",
      "src": "url (pour type image)",
      "shapeType": "rect | circle | triangle (pour type shape)",
      "position": { "x": 0, "y": 0, "width": 1080, "height": 200 },
      "style": {
        "fontFamily": "Inter",
        "fontSize": 72,
        "fontWeight": "bold",
        "color": "#ffffff",
        "textAlign": "center",
        "lineHeight": 1.2,
        "opacity": 1,
        "fill": "#hex (pour shapes)",
        "stroke": "#hex (optionnel)",
        "strokeWidth": 0,
        "rx": 0
      },
      "zIndex": 1,
      "animation": "fadeIn | slideFromBottom | slideFromLeft | zoomIn",
      "locked": false,
      "visible": true
    }
  ],
  "colorPalette": ["#hex1", "#hex2", "#hex3"],
  "suggestedAnimations": ["fadeIn", "slideFromBottom"],
  "copy": { "headline": "...", "subline": "...", "cta": "..." }
}

CONSEILS DE DESIGN :
- Utilise des hiérarchies visuelles claires (grand titre, sous-titre, CTA)
- Les shapes servent de décors ou d'accents visuels
- Laisse des marges (minimum 40px sur les bords)
- Pour des fonds foncés, utilise du texte clair et vice-versa
- Les gradients doivent être doux et élégants`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userPrompt, format, brandKit, currentCanvas } = body;

    if (!userPrompt) {
      return NextResponse.json({ error: "userPrompt requis" }, { status: 400 });
    }

    const userMessage = `
Crée un design pour : "${userPrompt}"

FORMAT CIBLE : ${format?.name || "Instagram carré"} (${format?.width || 1080}×${format?.height || 1080}px)

${brandKit ? `BRAND KIT :
- Couleurs : ${brandKit.colors?.join(", ") || "libre"}
- Typographies : ${brandKit.fonts?.heading || "Inter"} (titres), ${brandKit.fonts?.body || "Inter"} (corps)
- Logo : ${brandKit.logoUrl || "aucun"}
- Respect strict : ${brandKit.locked ? "OUI — utilise UNIQUEMENT ces couleurs et fonts" : "NON — tu peux t'en inspirer librement"}` : ""}

${currentCanvas && currentCanvas.length > 0 ? `CANVAS ACTUEL (modifie intelligemment) :
${JSON.stringify(currentCanvas, null, 2)}

Instructions de modification : "${userPrompt}"` : "Crée un design complet depuis zéro."}

Génère maintenant le JSON du layout. Adapte la taille des éléments aux dimensions ${format?.width || 1080}×${format?.height || 1080}px.
    `.trim();

    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const rawText = message.content
      .filter((c) => c.type === "text")
      .map((c) => (c as { type: "text"; text: string }).text)
      .join("");

    // Extract JSON (handle possible markdown code blocks)
    let jsonText = rawText.trim();
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonText = jsonMatch[1].trim();

    const parsed = JSON.parse(jsonText);
    const validated = ClaudeLayoutSchema.parse(parsed);

    return NextResponse.json({ layout: validated });
  } catch (err) {
    console.error("[Claude API Error]", err);
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json(
      { error: `Génération échouée : ${message}` },
      { status: 500 }
    );
  }
}

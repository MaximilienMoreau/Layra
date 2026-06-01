import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ClaudeLayoutSchema } from "@/utils/zodSchemas";
import { serverCanUse, serverSpend } from "@/lib/serverCredits";

// ---------------------------------------------------------------------------
// Client — instancié une seule fois au démarrage du serveur
// ---------------------------------------------------------------------------
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Modèle configurable via variable d'environnement, fallback sur le modèle
// le plus récent supporté.
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

// ---------------------------------------------------------------------------
// Clé secrète côté serveur pour protéger la route d'un appel externe brut.
// Positionnez LAYRA_API_SECRET dans .env.local. Si absente, la protection
// est désactivée (acceptable en développement local).
// ---------------------------------------------------------------------------
const API_SECRET = process.env.LAYRA_API_SECRET;

// ---------------------------------------------------------------------------
// System prompt paramétrable par locale.
// Ajoutez d'autres locales ici si besoin.
// ---------------------------------------------------------------------------
function buildSystemPrompt(locale: string): string {
  const isFr = locale.startsWith("fr");

  if (isFr) {
    return `Tu es un expert en design graphique et en création de contenu visuel.
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
  }

  // Default: English
  return `You are an expert graphic designer and visual content creator.
You generate structured JSON layouts for a visual creation application called Layra.

ABSOLUTE RULES:
1. Reply ONLY with valid JSON — no markdown, no comments, no surrounding text.
2. All elements must have realistic positions within the given dimensions.
3. Text must be readable (sufficient contrast with the background).
4. Strictly honour the brand kit when provided.
5. Create professional, modern, and visually balanced designs.

RESPONSE FORMAT:
{
  "layout": "hero | centered | split | grid",
  "background": { "type": "color | gradient | image", "value": "#hex", "gradient": { "from": "#hex", "to": "#hex", "direction": "to bottom right" } },
  "elements": [
    {
      "type": "text | image | shape | video",
      "id": "el_001",
      "content": "text (for type text)",
      "src": "url (for type image)",
      "shapeType": "rect | circle | triangle (for type shape)",
      "position": { "x": 0, "y": 0, "width": 1080, "height": 200 },
      "style": {
        "fontFamily": "Inter",
        "fontSize": 72,
        "fontWeight": "bold",
        "color": "#ffffff",
        "textAlign": "center",
        "lineHeight": 1.2,
        "opacity": 1,
        "fill": "#hex (for shapes)",
        "stroke": "#hex (optional)",
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

DESIGN TIPS:
- Use clear visual hierarchies (large title, subtitle, CTA)
- Shapes serve as decorative or accent elements
- Leave margins (minimum 40px from edges)
- For dark backgrounds use light text and vice-versa
- Gradients should be soft and elegant`;
}

// ---------------------------------------------------------------------------
// POST /api/claude
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  // --- Authentification légère ---
  if (API_SECRET) {
    const authHeader = req.headers.get("x-layra-secret");
    if (authHeader !== API_SECRET) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
  }

  try {
    const body = await req.json();
    const { userPrompt, format, brandKit, currentCanvas, locale = "fr", sessionId } = body;

    if (!userPrompt || typeof userPrompt !== "string" || userPrompt.trim().length === 0) {
      return NextResponse.json({ error: "userPrompt requis" }, { status: 400 });
    }

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "sessionId requis" }, { status: 400 });
    }

    if (format !== undefined) {
      const w = format?.width;
      const h = format?.height;
      if (
        (w !== undefined && (typeof w !== "number" || w < 1 || w > 8000)) ||
        (h !== undefined && (typeof h !== "number" || h < 1 || h > 8000))
      ) {
        return NextResponse.json({ error: "Dimensions de format invalides" }, { status: 400 });
      }
    }

    // --- Validation des crédits côté serveur ---
    const allowed = await serverCanUse(sessionId, "generate_design");
    if (!allowed) {
      return NextResponse.json(
        { error: "Crédits insuffisants. Passez à un plan supérieur." },
        { status: 402 }
      );
    }

    const systemPrompt = buildSystemPrompt(locale);

    const isFr = locale.startsWith("fr");
    const userMessage = isFr
      ? buildUserMessageFr({ userPrompt, format, brandKit, currentCanvas })
      : buildUserMessageEn({ userPrompt, format, brandKit, currentCanvas });

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const rawText = message.content
      .filter((c) => c.type === "text")
      .map((c) => (c as { type: "text"; text: string }).text)
      .join("");

    // Extraire le JSON (gère les éventuels blocs markdown)
    let jsonText = rawText.trim();
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonText = jsonMatch[1].trim();

    const parsed = JSON.parse(jsonText);
    const validated = ClaudeLayoutSchema.parse(parsed);

    // Décompte côté serveur après succès de la génération
    await serverSpend(sessionId, "generate_design");

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

// ---------------------------------------------------------------------------
// Helpers — construction du message utilisateur
// ---------------------------------------------------------------------------
type MessageInput = {
  userPrompt: string;
  format?: { name?: string; width?: number; height?: number };
  brandKit?: { colors?: string[]; fonts?: { heading?: string; body?: string }; logoUrl?: string | null; locked?: boolean };
  currentCanvas?: unknown[];
};

function buildUserMessageFr({ userPrompt, format, brandKit, currentCanvas }: MessageInput): string {
  return `
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
}

function buildUserMessageEn({ userPrompt, format, brandKit, currentCanvas }: MessageInput): string {
  return `
Create a design for: "${userPrompt}"

TARGET FORMAT: ${format?.name || "Instagram square"} (${format?.width || 1080}×${format?.height || 1080}px)

${brandKit ? `BRAND KIT:
- Colors: ${brandKit.colors?.join(", ") || "free choice"}
- Typography: ${brandKit.fonts?.heading || "Inter"} (headings), ${brandKit.fonts?.body || "Inter"} (body)
- Logo: ${brandKit.logoUrl || "none"}
- Strict enforcement: ${brandKit.locked ? "YES — use ONLY these colors and fonts" : "NO — use them as inspiration"}` : ""}

${currentCanvas && currentCanvas.length > 0 ? `CURRENT CANVAS (modify intelligently):
${JSON.stringify(currentCanvas, null, 2)}

Modification instructions: "${userPrompt}"` : "Create a complete design from scratch."}

Generate the layout JSON now. Adapt element sizes to ${format?.width || 1080}×${format?.height || 1080}px dimensions.
  `.trim();
}

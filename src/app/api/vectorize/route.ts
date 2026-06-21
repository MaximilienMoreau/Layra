import { NextRequest, NextResponse } from "next/server";
import { serverCanUse, serverSpend } from "@/lib/serverCredits";
import { isRateLimited } from "@/lib/rateLimit";

const API_ID     = process.env.VECTORIZER_API_ID;
const API_SECRET = process.env.VECTORIZER_API_SECRET;

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_SIZE     = 20 * 1024 * 1024; // 20 Mo

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  if (!API_ID || !API_SECRET) {
    return NextResponse.json(
      { error: "Service de vectorisation non configuré. Ajoutez VECTORIZER_API_ID et VECTORIZER_API_SECRET dans .env.local." },
      { status: 503 }
    );
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Trop de requêtes. Réessayez dans une minute." },
      { status: 429 }
    );
  }

  try {
    const formData = await req.formData();
    const image = formData.get("image") as File | null;

    if (!image) {
      return NextResponse.json({ error: "Image requise" }, { status: 400 });
    }
    if (!ALLOWED_MIME.has(image.type)) {
      return NextResponse.json(
        { error: `Format non supporté : ${image.type || "inconnu"}. Utilisez PNG, JPEG ou WebP.` },
        { status: 415 }
      );
    }
    if (image.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `Fichier trop volumineux (max 20 Mo). Le fichier fait ${(image.size / 1024 / 1024).toFixed(1)} Mo.` },
        { status: 413 }
      );
    }

    const sessionId = formData.get("sessionId");
    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "sessionId requis" }, { status: 400 });
    }

    const allowed = await serverCanUse(sessionId, "vectorize_image");
    if (!allowed) {
      return NextResponse.json(
        { error: "Crédits insuffisants. Passez à un plan supérieur." },
        { status: 402 }
      );
    }

    const upstream = new FormData();
    upstream.append("image", image);

    const credentials = Buffer.from(`${API_ID}:${API_SECRET}`).toString("base64");

    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 60_000);

    const response = await fetch("https://vectorizer.ai/api/v1/vectorize", {
      method: "POST",
      headers: { Authorization: `Basic ${credentials}` },
      body: upstream,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: `Erreur API : ${text}` },
        { status: response.status }
      );
    }

    const svgText = await response.text();
    await serverSpend(sessionId, "vectorize_image");

    return new NextResponse(svgText, {
      status: 200,
      headers: { "Content-Type": "image/svg+xml" },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({ error: "Délai dépassé (>60s)" }, { status: 504 });
    }
    console.error("[Vectorize Error]", err);
    return NextResponse.json({ error: "Erreur de vectorisation" }, { status: 500 });
  }
}

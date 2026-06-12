import { NextRequest, NextResponse } from "next/server";
import { serverCanUse, serverSpend } from "@/lib/serverCredits";

const API_ID = process.env.VECTORIZER_API_ID;
const API_SECRET = process.env.VECTORIZER_API_SECRET;

export async function POST(req: NextRequest) {
  if (!API_ID || !API_SECRET) {
    return NextResponse.json(
      { error: "Service de vectorisation non configuré. Ajoutez VECTORIZER_API_ID et VECTORIZER_API_SECRET dans .env.local." },
      { status: 503 }
    );
  }

  try {
    const formData = await req.formData();
    const image = formData.get("image") as File | null;
    if (!image) {
      return NextResponse.json({ error: "Image requise" }, { status: 400 });
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

    const response = await fetch("https://vectorizer.ai/api/v1/vectorize", {
      method: "POST",
      headers: { Authorization: `Basic ${credentials}` },
      body: upstream,
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: `Vectorizer.ai : ${text}` },
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
    console.error("[Vectorize Error]", err);
    return NextResponse.json({ error: "Erreur de vectorisation" }, { status: 500 });
  }
}

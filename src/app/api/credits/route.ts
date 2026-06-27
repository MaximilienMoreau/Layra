import { NextRequest, NextResponse } from "next/server";
import { serverBalance } from "@/lib/serverCredits";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId requis" }, { status: 400 });
  }
  const credits = await serverBalance(sessionId);
  return NextResponse.json({ credits });
}

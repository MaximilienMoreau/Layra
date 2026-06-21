import { CREDIT_COSTS } from "@/store/creditsStore";
import type { SupabaseClient } from "@supabase/supabase-js";

type Action = keyof typeof CREDIT_COSTS;

const FREE_CREDITS = 500;

// ---------------------------------------------------------------------------
// In-memory fallback (dev sans Supabase)
// ---------------------------------------------------------------------------
const memStore = new Map<string, number>();

function memCanUse(sessionId: string, action: Action): boolean {
  return (memStore.get(sessionId) ?? FREE_CREDITS) >= CREDIT_COSTS[action];
}

function memSpend(sessionId: string, action: Action): boolean {
  const remaining = memStore.get(sessionId) ?? FREE_CREDITS;
  const cost = CREDIT_COSTS[action];
  if (remaining < cost) return false;
  memStore.set(sessionId, remaining - cost);
  return true;
}

// ---------------------------------------------------------------------------
// Supabase backend — singleton pour éviter une connexion par requête
// ---------------------------------------------------------------------------
let _sb: SupabaseClient | null = null;

async function getSupabase(): Promise<SupabaseClient | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (_sb) return _sb;
  const { createClient } = await import("@supabase/supabase-js");
  _sb = createClient(url, key);
  return _sb;
}

async function supabaseCanUse(sessionId: string, action: Action): Promise<boolean> {
  const sb = await getSupabase();
  if (!sb) return memCanUse(sessionId, action);

  const { data, error } = await sb
    .from("session_credits")
    .select("credits")
    .eq("session_id", sessionId)
    .single();

  if (error || !data) return CREDIT_COSTS[action] <= FREE_CREDITS;
  return data.credits >= CREDIT_COSTS[action];
}

async function supabaseSpend(sessionId: string, action: Action): Promise<boolean> {
  const sb = await getSupabase();
  if (!sb) return memSpend(sessionId, action);

  const cost = CREDIT_COSTS[action];

  const { data: existing } = await sb
    .from("session_credits")
    .select("credits")
    .eq("session_id", sessionId)
    .single();

  const current = existing?.credits ?? FREE_CREDITS;
  if (current < cost) return false;

  const { error } = await sb
    .from("session_credits")
    .upsert({ session_id: sessionId, credits: current - cost }, { onConflict: "session_id" });

  if (error) {
    console.error("[serverCredits] upsert failed:", error);
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// API publique
// ---------------------------------------------------------------------------
export async function serverCanUse(sessionId: string, action: Action): Promise<boolean> {
  return supabaseCanUse(sessionId, action);
}

export async function serverSpend(sessionId: string, action: Action): Promise<boolean> {
  return supabaseSpend(sessionId, action);
}

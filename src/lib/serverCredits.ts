import type { SupabaseClient } from "@supabase/supabase-js";

const CREDIT_COSTS = {
  vectorize_image: 15,
} as const;

type Action = keyof typeof CREDIT_COSTS;

const FREE_CREDITS = 500;

// In-memory fallback (dev sans Supabase)
const memStore = new Map<string, number>();

function memBalance(sessionId: string): number {
  return memStore.get(sessionId) ?? FREE_CREDITS;
}

function memSpend(sessionId: string, action: Action): boolean {
  const remaining = memBalance(sessionId);
  const cost = CREDIT_COSTS[action];
  if (remaining < cost) return false;
  memStore.set(sessionId, remaining - cost);
  return true;
}

function memRefund(sessionId: string, action: Action): void {
  memStore.set(sessionId, memBalance(sessionId) + CREDIT_COSTS[action]);
}

// Supabase backend
// Note: uses SUPABASE_URL / SUPABASE_ANON_KEY (server-only, no NEXT_PUBLIC_)
let _sb: SupabaseClient | null = null;

async function getSupabase(): Promise<SupabaseClient | null> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (_sb) return _sb;
  const { createClient } = await import("@supabase/supabase-js");
  _sb = createClient(url, key);
  return _sb;
}

async function sbGetCredits(sb: SupabaseClient, sessionId: string): Promise<number> {
  const { data } = await sb
    .from("session_credits")
    .select("credits")
    .eq("session_id", sessionId)
    .single();
  return data?.credits ?? FREE_CREDITS;
}

async function sbSetCredits(sb: SupabaseClient, sessionId: string, credits: number): Promise<void> {
  const { error } = await sb
    .from("session_credits")
    .upsert({ session_id: sessionId, credits }, { onConflict: "session_id" });
  if (error) console.error("[serverCredits] upsert failed:", error);
}

async function supabaseBalance(sessionId: string): Promise<number> {
  const sb = await getSupabase();
  if (!sb) return memBalance(sessionId);
  return sbGetCredits(sb, sessionId);
}

async function supabaseSpend(sessionId: string, action: Action): Promise<boolean> {
  const sb = await getSupabase();
  if (!sb) return memSpend(sessionId, action);

  const cost = CREDIT_COSTS[action];

  // Ensure the row exists before we try to update it (no-op if already there)
  await sb
    .from("session_credits")
    .upsert({ session_id: sessionId, credits: FREE_CREDITS }, { onConflict: "session_id", ignoreDuplicates: true });

  const current = await sbGetCredits(sb, sessionId);
  if (current < cost) return false;

  // Conditional update: only succeeds if the balance hasn't been modified by a concurrent request
  const { data } = await sb
    .from("session_credits")
    .update({ credits: current - cost })
    .eq("session_id", sessionId)
    .eq("credits", current)
    .select("credits");

  return Array.isArray(data) && data.length > 0;
}

async function supabaseRefund(sessionId: string, action: Action): Promise<void> {
  const sb = await getSupabase();
  if (!sb) { memRefund(sessionId, action); return; }
  const current = await sbGetCredits(sb, sessionId);
  await sbSetCredits(sb, sessionId, current + CREDIT_COSTS[action]);
}

// API publique
export async function serverBalance(sessionId: string): Promise<number> {
  return supabaseBalance(sessionId);
}

export async function serverSpend(sessionId: string, action: Action): Promise<boolean> {
  return supabaseSpend(sessionId, action);
}

export async function serverRefund(sessionId: string, action: Action): Promise<void> {
  return supabaseRefund(sessionId, action);
}

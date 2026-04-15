/**
 * Validation et décompte des crédits côté serveur.
 *
 * - En développement (pas de Supabase configuré) : stockage en mémoire du
 *   processus Node. Les compteurs sont réinitialisés à chaque redémarrage du
 *   serveur — suffisant pour le dev.
 * - En production : les compteurs sont persistés dans la table Supabase
 *   `session_credits`. La table est créée automatiquement si elle n'existe pas
 *   (via upsert + RLS permissif sur anon key).
 */

import { CREDIT_COSTS } from "@/store/creditsStore";

type Action = keyof typeof CREDIT_COSTS;

const FREE_CREDITS = 500;

// ---------------------------------------------------------------------------
// In-memory fallback (dev sans Supabase)
// ---------------------------------------------------------------------------
const memStore = new Map<string, number>();

function memCanUse(sessionId: string, action: Action): boolean {
  const remaining = memStore.get(sessionId) ?? FREE_CREDITS;
  return remaining >= CREDIT_COSTS[action];
}

function memSpend(sessionId: string, action: Action): boolean {
  const remaining = memStore.get(sessionId) ?? FREE_CREDITS;
  const cost = CREDIT_COSTS[action];
  if (remaining < cost) return false;
  memStore.set(sessionId, remaining - cost);
  return true;
}

// ---------------------------------------------------------------------------
// Supabase backend
// ---------------------------------------------------------------------------
async function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(url, key);
}

async function supabaseCanUse(sessionId: string, action: Action): Promise<boolean> {
  const sb = await getSupabase();
  if (!sb) return memCanUse(sessionId, action);

  const { data, error } = await sb
    .from("session_credits")
    .select("credits")
    .eq("session_id", sessionId)
    .single();

  if (error || !data) return CREDIT_COSTS[action] <= FREE_CREDITS; // première utilisation
  return data.credits >= CREDIT_COSTS[action];
}

async function supabaseSpend(sessionId: string, action: Action): Promise<boolean> {
  const sb = await getSupabase();
  if (!sb) return memSpend(sessionId, action);

  const cost = CREDIT_COSTS[action];

  // Upsert : insère la ligne si elle n'existe pas encore
  const { data: existing } = await sb
    .from("session_credits")
    .select("credits")
    .eq("session_id", sessionId)
    .single();

  const current = existing?.credits ?? FREE_CREDITS;
  if (current < cost) return false;

  await sb
    .from("session_credits")
    .upsert({ session_id: sessionId, credits: current - cost }, { onConflict: "session_id" });

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

/**
 * Client Supabase partagé côté client.
 * Retourne null si les variables d'environnement ne sont pas configurées —
 * la persistance est alors silencieusement désactivée.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  if (!_client) {
    _client = createClient(url, key);
  }
  return _client;
}

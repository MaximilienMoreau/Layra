"use client";

/**
 * Persistance des designs dans Supabase.
 *
 * Table attendue :
 *   CREATE TABLE designs (
 *     id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *     session_id  text NOT NULL,
 *     name        text NOT NULL DEFAULT 'Sans titre',
 *     layout      jsonb NOT NULL,
 *     format      jsonb NOT NULL,
 *     created_at  timestamptz DEFAULT now(),
 *     updated_at  timestamptz DEFAULT now()
 *   );
 *   ALTER TABLE designs ENABLE ROW LEVEL SECURITY;
 *   -- Politique permissive sur anon key pour le MVP (à restreindre avec Auth)
 *   CREATE POLICY "anon_all" ON designs FOR ALL USING (true) WITH CHECK (true);
 *
 * Si Supabase n'est pas configuré, les opérations sont des no-ops silencieux.
 */

import { useCallback } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { getSessionId } from "@/lib/session";
import type { ClaudeLayout } from "@/utils/zodSchemas";
import type { CanvasFormat } from "@/store/canvasStore";

export type SavedDesign = {
  id: string;
  name: string;
  layout: ClaudeLayout;
  format: CanvasFormat;
  created_at: string;
  updated_at: string;
};

export function useDesignPersistence() {
  const sessionId = typeof window !== "undefined" ? getSessionId() : "ssr";

  const saveDesign = useCallback(
    async (layout: ClaudeLayout, format: CanvasFormat, name = "Sans titre"): Promise<string | null> => {
      const sb = getSupabaseClient();
      if (!sb) return null;

      const { data, error } = await sb
        .from("designs")
        .insert({ session_id: sessionId, name, layout, format })
        .select("id")
        .single();

      if (error) {
        console.error("[Supabase] saveDesign error", error);
        return null;
      }
      return data.id as string;
    },
    [sessionId]
  );

  const updateDesign = useCallback(
    async (id: string, layout: ClaudeLayout, format: CanvasFormat, name?: string): Promise<void> => {
      const sb = getSupabaseClient();
      if (!sb) return;

      const patch: Record<string, unknown> = { layout, format, updated_at: new Date().toISOString() };
      if (name !== undefined) patch.name = name;

      const { error } = await sb
        .from("designs")
        .update(patch)
        .eq("id", id)
        .eq("session_id", sessionId);

      if (error) console.error("[Supabase] updateDesign error", error);
    },
    [sessionId]
  );

  const listDesigns = useCallback(async (): Promise<SavedDesign[]> => {
    const sb = getSupabaseClient();
    if (!sb) return [];

    const { data, error } = await sb
      .from("designs")
      .select("id, name, layout, format, created_at, updated_at")
      .eq("session_id", sessionId)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[Supabase] listDesigns error", error);
      return [];
    }
    return (data ?? []) as SavedDesign[];
  }, [sessionId]);

  const deleteDesign = useCallback(
    async (id: string): Promise<void> => {
      const sb = getSupabaseClient();
      if (!sb) return;

      const { error } = await sb
        .from("designs")
        .delete()
        .eq("id", id)
        .eq("session_id", sessionId);

      if (error) console.error("[Supabase] deleteDesign error", error);
    },
    [sessionId]
  );

  return { saveDesign, updateDesign, listDesigns, deleteDesign };
}

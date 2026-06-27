"use client";

import { useState, useCallback, useEffect } from "react";
import type { Mode } from "@/types/app";
import { getSessionId } from "@/lib/session";

export function useCredits(mode: Mode) {
  const [credits, setCredits] = useState<number | null>(null);

  const fetchCredits = useCallback(async () => {
    try {
      const res = await fetch(`/api/credits?sessionId=${getSessionId()}`);
      if (res.ok) {
        const data = await res.json();
        setCredits(data.credits);
      }
    } catch (err) {
      console.warn("[useCredits] fetch failed", err);
    }
  }, []);

  useEffect(() => {
    if (mode !== "ai") { setCredits(null); return; }
    fetchCredits();
  }, [mode, fetchCredits]);

  return { credits, fetchCredits };
}

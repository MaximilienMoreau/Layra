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
    if (mode !== "ai") return;
    // fetchCredits is async — setState is called after await, not synchronously
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCredits();
  }, [mode, fetchCredits]);

  return { credits: mode === "ai" ? credits : null, fetchCredits };
}

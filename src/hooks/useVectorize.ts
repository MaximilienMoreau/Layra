"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { getSessionId } from "@/lib/session";
import { useCreditsStore } from "@/store/creditsStore";

export type Mode   = "fast" | "ai";
export type Status = "idle" | "loading" | "done" | "error";

export const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 Mo

export function useVectorize() {
  const [mode, setMode]               = useState<Mode>("fast");
  const [status, setStatus]           = useState<Status>("idle");
  const [file, setFile]               = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [svgResult, setSvgResult]     = useState<string | null>(null);
  const [svgUrl, setSvgUrl]           = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);

  const { spend } = useCreditsStore();

  const origUrlRef = useRef<string | null>(null);
  const svgUrlRef  = useRef<string | null>(null);
  const abortRef   = useRef<AbortController | null>(null);

  useEffect(() => () => {
    abortRef.current?.abort();
    if (origUrlRef.current) URL.revokeObjectURL(origUrlRef.current);
    if (svgUrlRef.current)  URL.revokeObjectURL(svgUrlRef.current);
  }, []);

  const loadFile = useCallback((f: File) => {
    if (!ALLOWED_TYPES.has(f.type)) {
      setError(`Format non supporté (${f.type || "inconnu"}). Utilisez PNG, JPEG ou WebP.`);
      setStatus("error");
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setError(`Fichier trop volumineux (${(f.size / 1024 / 1024).toFixed(1)} Mo). Maximum : 20 Mo.`);
      setStatus("error");
      return;
    }
    if (origUrlRef.current) URL.revokeObjectURL(origUrlRef.current);
    if (svgUrlRef.current)  { URL.revokeObjectURL(svgUrlRef.current); svgUrlRef.current = null; }
    const url = URL.createObjectURL(f);
    origUrlRef.current = url;
    setFile(f);
    setOriginalUrl(url);
    setSvgResult(null);
    setSvgUrl(null);
    setStatus("idle");
    setError(null);
  }, []);

  const vectorize = useCallback(async () => {
    if (!file || !origUrlRef.current) return;
    setStatus("loading");
    setError(null);

    try {
      let svg: string;

      if (mode === "fast") {
        const ImageTracer = await import("imagetracerjs");
        const tracer = (ImageTracer as unknown as { default?: typeof ImageTracer }).default ?? ImageTracer;
        svg = await new Promise<string>((resolve, reject) => {
          const t = setTimeout(() => reject(new Error("Timeout (>30s)")), 30_000);
          (tracer as typeof ImageTracer).imageToSVG(
            origUrlRef.current!,
            (s: string) => { clearTimeout(t); s ? resolve(s) : reject(new Error("Résultat vide")); },
            { numberofcolors: 16, scale: 1, simplify: 0, pathomit: 8 }
          );
        });
      } else {
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        const formData = new FormData();
        formData.append("image", file);
        formData.append("sessionId", getSessionId());
        const res = await fetch("/api/vectorize", {
          method: "POST",
          body: formData,
          signal: abortRef.current.signal,
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          throw new Error(json.error ?? `HTTP ${res.status}`);
        }
        svg = await res.text();
        spend("vectorize_image");
      }

      if (svgUrlRef.current) URL.revokeObjectURL(svgUrlRef.current);
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url  = URL.createObjectURL(blob);
      svgUrlRef.current = url;
      setSvgResult(svg);
      setSvgUrl(url);
      setStatus("done");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setStatus("error");
    }
  }, [file, mode, spend]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (origUrlRef.current) { URL.revokeObjectURL(origUrlRef.current); origUrlRef.current = null; }
    if (svgUrlRef.current)  { URL.revokeObjectURL(svgUrlRef.current);  svgUrlRef.current  = null; }
    setFile(null);
    setOriginalUrl(null);
    setSvgResult(null);
    setSvgUrl(null);
    setStatus("idle");
    setError(null);
  }, []);

  const download = useCallback(() => {
    if (!svgResult || !file) return;
    const name = file.name.replace(/\.[^.]+$/, "") + ".svg";
    const url = URL.createObjectURL(new Blob([svgResult], { type: "image/svg+xml" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }, [svgResult, file]);

  return {
    mode, setMode,
    status,
    file, originalUrl,
    svgUrl,
    error,
    loadFile, vectorize, reset, download,
  };
}

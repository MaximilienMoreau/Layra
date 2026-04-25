"use client";

import { useState } from "react";
import { useBrandStore } from "@/store/brandStore";
import { Palette, Type, Lock, Unlock, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const GOOGLE_FONTS = [
  "Inter", "Roboto", "Playfair Display", "Montserrat", "Poppins",
  "Open Sans", "Lato", "Raleway", "Oswald", "Merriweather", "DM Sans",
];

export function BrandKitPanel() {
  const { activeBrand, updateActiveBrand } = useBrandStore();
  const [newColor, setNewColor] = useState("#6366f1");

  function addColor() {
    if (activeBrand.colors.length >= 5) return;
    updateActiveBrand({ colors: [...activeBrand.colors, newColor] });
  }

  function removeColor(idx: number) {
    const colors = activeBrand.colors.filter((_, i) => i !== idx);
    updateActiveBrand({ colors });
  }

  function updateColor(idx: number, color: string) {
    const colors = activeBrand.colors.map((c, i) => (i === idx ? color : c));
    updateActiveBrand({ colors });
  }

  return (
    <div className="flex flex-col gap-4 p-3 overflow-y-auto h-full">
      <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
        Brand Kit
      </h3>

      {/* Brand name */}
      <section className="flex flex-col gap-2">
        <label className="text-xs text-zinc-500">Nom de la marque</label>
        <input
          type="text"
          value={activeBrand.name}
          onChange={(e) => updateActiveBrand({ name: e.target.value })}
          className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1.5 text-sm text-white w-full outline-none focus:border-rose-500"
        />
      </section>

      {/* Lock brand */}
      <section>
        <button
          onClick={() => updateActiveBrand({ locked: !activeBrand.locked })}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors border",
            activeBrand.locked
              ? "bg-rose-900/40 border-rose-700 text-rose-300"
              : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white"
          )}
        >
          {activeBrand.locked ? <Lock size={14} /> : <Unlock size={14} />}
          {activeBrand.locked ? "Marque verrouillée" : "Verrouiller la marque"}
          <span className="ml-auto text-xs opacity-60">
            {activeBrand.locked ? "IA respecte les couleurs" : "IA est libre"}
          </span>
        </button>
      </section>

      {/* Colors */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-1 text-xs text-zinc-500">
          <Palette size={12} />
          <span>Palette ({activeBrand.colors.length}/5)</span>
        </div>
        <div className="flex flex-col gap-1.5">
          {activeBrand.colors.map((color, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => updateColor(idx, e.target.value)}
                className="w-7 h-7 rounded cursor-pointer border border-zinc-700 bg-zinc-800"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => updateColor(idx, e.target.value)}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white font-mono"
              />
              <button
                onClick={() => removeColor(idx)}
                className="text-zinc-600 hover:text-red-400 transition-colors text-xs px-1"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        {activeBrand.colors.length < 5 && (
          <div className="flex gap-2">
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-7 h-7 rounded cursor-pointer border border-zinc-700 bg-zinc-800"
            />
            <button
              onClick={addColor}
              className="flex-1 text-xs bg-zinc-800 hover:bg-zinc-700 border border-dashed border-zinc-700 rounded px-2 py-1 text-zinc-400 hover:text-white transition-colors"
            >
              + Ajouter
            </button>
          </div>
        )}
      </section>

      {/* Fonts */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-1 text-xs text-zinc-500">
          <Type size={12} />
          <span>Typographies</span>
        </div>
        <div className="flex flex-col gap-2">
          <div>
            <label className="text-xs text-zinc-600 mb-1 block">Titres</label>
            <select
              value={activeBrand.fonts.heading}
              onChange={(e) =>
                updateActiveBrand({ fonts: { ...activeBrand.fonts, heading: e.target.value } })
              }
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white"
            >
              {GOOGLE_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-600 mb-1 block">Corps</label>
            <select
              value={activeBrand.fonts.body}
              onChange={(e) =>
                updateActiveBrand({ fonts: { ...activeBrand.fonts, body: e.target.value } })
              }
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white"
            >
              {GOOGLE_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* Logo */}
      <section className="flex flex-col gap-2">
        <label className="text-xs text-zinc-500">Logo</label>
        {activeBrand.logoUrl ? (
          <div className="relative bg-zinc-800 rounded-lg p-2 border border-zinc-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeBrand.logoUrl}
              alt="Logo"
              className="max-h-16 mx-auto object-contain"
            />
            <button
              onClick={() => updateActiveBrand({ logoUrl: null })}
              className="absolute top-1 right-1 text-zinc-600 hover:text-red-400 text-xs"
            >
              ×
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center gap-2 p-3 bg-zinc-800 border border-dashed border-zinc-700 rounded-lg cursor-pointer hover:border-rose-600 transition-colors">
            <Upload size={16} className="text-zinc-500" />
            <span className="text-xs text-zinc-500">Importer PNG/SVG</span>
            <input
              type="file"
              accept="image/png,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = URL.createObjectURL(file);
                  updateActiveBrand({ logoUrl: url });
                }
              }}
            />
          </label>
        )}
      </section>
    </div>
  );
}

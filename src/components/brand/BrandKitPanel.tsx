"use client";

import { useState } from "react";
import { useBrandStore } from "@/store/brandStore";
import { Palette, Type, Lock, Unlock, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { GOOGLE_FONTS } from "@/lib/fonts";

const labelCls  = "text-[10px] font-semibold text-white/25 uppercase tracking-widest";
const inputCls  = "w-full bg-white/[0.05] border border-white/[0.08] hover:border-white/[0.14] focus:border-rose-500/50 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none transition-all duration-150";
const selectCls = "w-full bg-white/[0.05] border border-white/[0.08] hover:border-white/[0.14] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none transition-all duration-150";

export function BrandKitPanel() {
  const { activeBrand, updateActiveBrand } = useBrandStore();
  const [newColor, setNewColor] = useState("#6366f1");

  return (
    <div className="flex flex-col gap-4 p-3 overflow-y-auto h-full">
      <h3 className={labelCls}>Brand Kit</h3>

      {/* Name */}
      <section className="flex flex-col gap-1.5">
        <label className={labelCls}>Marque</label>
        <input
          type="text" value={activeBrand.name}
          onChange={(e) => updateActiveBrand({ name: e.target.value })}
          className={inputCls}
        />
      </section>

      {/* Lock */}
      <section className="flex flex-col gap-1.5">
        <button
          onClick={() => updateActiveBrand({ locked: !activeBrand.locked })}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 border",
            activeBrand.locked
              ? "bg-rose-500/[0.08] border-rose-500/25 text-rose-300"
              : "bg-white/[0.03] border-white/[0.07] text-white/40 hover:text-white/70 hover:border-white/[0.14]"
          )}
        >
          {activeBrand.locked ? <Lock size={11} /> : <Unlock size={11} />}
          <span>{activeBrand.locked ? "Marque verrouillée" : "Verrouiller la marque"}</span>
          <span className={cn("ml-auto text-[10px] font-semibold", activeBrand.locked ? "text-rose-400" : "text-white/20")}>
            {activeBrand.locked ? "ON" : "OFF"}
          </span>
        </button>
        <p className={cn("text-[10px] px-0.5 leading-relaxed", activeBrand.locked ? "text-rose-400/60" : "text-white/20")}>
          {activeBrand.locked
            ? "Claude utilisera exclusivement votre palette et polices."
            : "Claude peut choisir librement couleurs et polices."}
        </p>
      </section>

      {/* Colors */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Palette size={11} className="text-white/25" />
          <label className={labelCls}>Palette ({activeBrand.colors.length}/5)</label>
        </div>
        <div className="flex flex-col gap-1.5">
          {activeBrand.colors.map((color, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="color" value={color}
                onChange={(e) => {
                  const colors = activeBrand.colors.map((c, i) => i === idx ? e.target.value : c);
                  updateActiveBrand({ colors });
                }}
                className="w-7 h-7 rounded-lg border border-white/[0.1] bg-transparent cursor-pointer flex-shrink-0"
              />
              <input
                type="text" value={color}
                onChange={(e) => {
                  const colors = activeBrand.colors.map((c, i) => i === idx ? e.target.value : c);
                  updateActiveBrand({ colors });
                }}
                className={`${inputCls} flex-1 font-mono`}
              />
              <button
                onClick={() => updateActiveBrand({ colors: activeBrand.colors.filter((_, i) => i !== idx) })}
                className="w-6 h-6 flex items-center justify-center rounded text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
        {activeBrand.colors.length < 5 && (
          <div className="flex gap-2">
            <input
              type="color" value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-7 h-7 rounded-lg border border-white/[0.1] bg-transparent cursor-pointer flex-shrink-0"
            />
            <button
              onClick={() => updateActiveBrand({ colors: [...activeBrand.colors, newColor] })}
              className="flex-1 text-xs bg-white/[0.03] hover:bg-white/[0.06] border border-dashed border-white/[0.1] hover:border-white/[0.2] rounded-lg px-2 py-1.5 text-white/35 hover:text-white/70 transition-all duration-150 font-medium"
            >
              + Ajouter
            </button>
          </div>
        )}
      </section>

      {/* Fonts */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Type size={11} className="text-white/25" />
          <label className={labelCls}>Typographies</label>
        </div>
        <div className="flex flex-col gap-2">
          <div>
            <label className="text-[10px] text-white/20 mb-1 block">Titres</label>
            <select value={activeBrand.fonts.heading} onChange={(e) => updateActiveBrand({ fonts: { ...activeBrand.fonts, heading: e.target.value } })} className={selectCls}>
              {GOOGLE_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-white/20 mb-1 block">Corps</label>
            <select value={activeBrand.fonts.body} onChange={(e) => updateActiveBrand({ fonts: { ...activeBrand.fonts, body: e.target.value } })} className={selectCls}>
              {GOOGLE_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* Logo */}
      <section className="flex flex-col gap-2">
        <label className={labelCls}>Logo</label>
        {activeBrand.logoUrl ? (
          <div className="relative bg-white/[0.04] border border-white/[0.08] rounded-xl p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={activeBrand.logoUrl} alt="Logo" className="max-h-14 mx-auto object-contain" />
            <button
              onClick={() => updateActiveBrand({ logoUrl: null })}
              className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <X size={11} />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center gap-2 p-4 bg-white/[0.03] border border-dashed border-white/[0.1] hover:border-rose-500/30 hover:bg-white/[0.05] rounded-xl cursor-pointer transition-all duration-200">
            <Upload size={15} className="text-white/25" />
            <span className="text-[11px] text-white/25 font-medium">PNG · SVG</span>
            <input type="file" accept="image/png,image/svg+xml" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => { const d = ev.target?.result as string; if (d) updateActiveBrand({ logoUrl: d }); };
              reader.readAsDataURL(file);
            }} />
          </label>
        )}
      </section>
    </div>
  );
}

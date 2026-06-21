"use client";

import { useEffect, useState, useCallback } from "react";
import { useCanvasStore } from "@/store/canvasStore";
import { Settings2 } from "lucide-react";
import { GOOGLE_FONTS } from "@/lib/fonts";

type Props = {
  getActiveObject: () => import("fabric").FabricObject | null;
  updateStyle: (styles: Record<string, unknown>) => void;
};

const inputCls = "w-full bg-white/[0.05] border border-white/[0.08] hover:border-white/[0.14] focus:border-rose-500/50 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none transition-all duration-150 placeholder-white/25";
const labelCls = "text-[10px] font-semibold text-white/25 uppercase tracking-widest";

export function PropertiesPanel({ getActiveObject, updateStyle }: Props) {
  const { selectedLayerId } = useCanvasStore();
  const [props, setProps] = useState<Record<string, unknown>>({});

  const refresh = useCallback(() => {
    const obj = getActiveObject();
    if (!obj) { setProps({}); return; }
    setProps({
      fill:       obj.fill || "#ffffff",
      opacity:    obj.opacity ?? 1,
      fontSize:   (obj as import("fabric").Textbox).fontSize   || 32,
      fontFamily: (obj as import("fabric").Textbox).fontFamily || "Inter",
      fontWeight: (obj as import("fabric").Textbox).fontWeight || "normal",
      textAlign:  (obj as import("fabric").Textbox).textAlign  || "left",
      strokeWidth: obj.strokeWidth || 0,
      stroke:     obj.stroke || "#000000",
      left:   Math.round(obj.left || 0),
      top:    Math.round(obj.top  || 0),
      width:  Math.round(obj.getScaledWidth()),
      height: Math.round(obj.getScaledHeight()),
    });
  }, [getActiveObject]);

  useEffect(() => { refresh(); }, [selectedLayerId, refresh]);

  const update = useCallback((key: string, value: unknown) => {
    setProps((prev) => ({ ...prev, [key]: value }));
    updateStyle({ [key]: value });
  }, [updateStyle]);

  if (!selectedLayerId) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 px-4 text-center">
        <Settings2 size={20} className="text-white/10" />
        <p className="text-xs text-white/20 font-medium">Sélectionnez un élément</p>
      </div>
    );
  }

  const obj     = getActiveObject();
  const isText  = obj?.layra?.elementType === "text";
  const isShape = obj?.layra?.elementType === "shape";

  return (
    <div className="p-3 flex flex-col gap-4 overflow-y-auto h-full">
      <h3 className={labelCls}>Propriétés</h3>

      {/* Position */}
      <section className="flex flex-col gap-2">
        <label className={labelCls}>Position</label>
        <div className="grid grid-cols-2 gap-1.5">
          {["left", "top"].map((k) => (
            <div key={k} className="flex flex-col gap-1">
              <span className="text-[10px] text-white/25 font-mono">{k === "left" ? "X" : "Y"}</span>
              <input type="number" value={props[k] as number || 0} onChange={(e) => update(k, parseInt(e.target.value, 10))} className={inputCls} />
            </div>
          ))}
        </div>
      </section>

      {/* Opacity */}
      <section className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <label className={labelCls}>Opacité</label>
          <span className="text-[10px] text-white/30 font-mono">{Math.round((props.opacity as number || 1) * 100)}%</span>
        </div>
        <input
          type="range" min={0} max={1} step={0.01}
          value={props.opacity as number || 1}
          onChange={(e) => update("opacity", parseFloat(e.target.value))}
          className="w-full accent-rose-500 h-1"
        />
      </section>

      {/* Color */}
      {(isText || isShape) && (
        <section className="flex flex-col gap-2">
          <label className={labelCls}>{isText ? "Couleur texte" : "Couleur fond"}</label>
          <div className="flex items-center gap-2">
            <input
              type="color" value={(props.fill as string) || "#ffffff"}
              onChange={(e) => update("fill", e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border border-white/[0.1] bg-transparent"
            />
            <input
              type="text" value={(props.fill as string) || "#ffffff"}
              onChange={(e) => update("fill", e.target.value)}
              className={`${inputCls} flex-1 font-mono`}
            />
          </div>
        </section>
      )}

      {/* Text-specific */}
      {isText && (
        <>
          <section className="flex flex-col gap-2">
            <label className={labelCls}>Police</label>
            <select value={props.fontFamily as string || "Inter"} onChange={(e) => update("fontFamily", e.target.value)} className={inputCls}>
              {GOOGLE_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </section>
          <section className="flex flex-col gap-2">
            <label className={labelCls}>Taille</label>
            <input type="number" min={8} max={400} value={props.fontSize as number || 32} onChange={(e) => update("fontSize", parseInt(e.target.value, 10))} className={inputCls} />
          </section>
          <section className="flex flex-col gap-2">
            <label className={labelCls}>Graisse</label>
            <select value={props.fontWeight as string || "normal"} onChange={(e) => update("fontWeight", e.target.value)} className={inputCls}>
              {["300", "normal", "500", "600", "bold", "800", "900"].map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </section>
          <section className="flex flex-col gap-2">
            <label className={labelCls}>Alignement</label>
            <div className="flex gap-1">
              {(["left", "center", "right"] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => update("textAlign", a)}
                  className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-all duration-150 border ${
                    props.textAlign === a
                      ? "btn-accent border-transparent text-white"
                      : "bg-white/[0.04] border-white/[0.07] text-white/35 hover:text-white/70"
                  }`}
                >
                  {a === "left" ? "G" : a === "center" ? "C" : "D"}
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {/* Shape stroke */}
      {isShape && (
        <section className="flex flex-col gap-2">
          <label className={labelCls}>Bordure</label>
          <div className="flex items-center gap-2">
            <input
              type="color" value={props.stroke as string || "#000000"}
              onChange={(e) => update("stroke", e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border border-white/[0.1] bg-transparent"
            />
            <input
              type="number" min={0} max={20}
              value={props.strokeWidth as number || 0}
              onChange={(e) => update("strokeWidth", parseInt(e.target.value, 10))}
              className={`${inputCls} flex-1`}
              placeholder="Épaisseur"
            />
          </div>
        </section>
      )}
    </div>
  );
}

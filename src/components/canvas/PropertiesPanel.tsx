"use client";

import { useEffect, useState, useCallback } from "react";
import { useCanvasStore } from "@/store/canvasStore";
import { Settings2 } from "lucide-react";

type Props = {
  getActiveObject: () => import("fabric").FabricObject | null;
  updateStyle: (styles: Record<string, unknown>) => void;
};

const GOOGLE_FONTS = [
  "Inter", "Roboto", "Playfair Display", "Montserrat", "Poppins",
  "Open Sans", "Lato", "Raleway", "Oswald", "Merriweather",
  "Source Code Pro", "DM Sans", "Space Grotesk",
];

export function PropertiesPanel({ getActiveObject, updateStyle }: Props) {
  const { selectedLayerId } = useCanvasStore();
  const [props, setProps] = useState<Record<string, unknown>>({});

  const refresh = useCallback(() => {
    const obj = getActiveObject();
    if (!obj) { setProps({}); return; }
    setProps({
      fill: obj.fill || "#ffffff",
      opacity: obj.opacity ?? 1,
      fontSize: (obj as import("fabric").Textbox).fontSize || 32,
      fontFamily: (obj as import("fabric").Textbox).fontFamily || "Inter",
      fontWeight: (obj as import("fabric").Textbox).fontWeight || "normal",
      textAlign: (obj as import("fabric").Textbox).textAlign || "left",
      strokeWidth: obj.strokeWidth || 0,
      stroke: obj.stroke || "#000000",
      left: Math.round(obj.left || 0),
      top: Math.round(obj.top || 0),
      width: Math.round(obj.getScaledWidth()),
      height: Math.round(obj.getScaledHeight()),
    });
  }, [getActiveObject]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [selectedLayerId, refresh]);

  const update = useCallback(
    (key: string, value: unknown) => {
      setProps((prev) => ({ ...prev, [key]: value }));
      updateStyle({ [key]: value });
    },
    [updateStyle]
  );

  if (!selectedLayerId) {
    return (
      <div className="p-4 text-center text-zinc-600 text-sm">
        <Settings2 size={24} className="mx-auto mb-2 opacity-40" />
        Sélectionnez un élément
      </div>
    );
  }

  const obj = getActiveObject();
  const isText = obj?.layra?.elementType === "text";
  const isShape = obj?.layra?.elementType === "shape";

  return (
    <div className="p-3 flex flex-col gap-4 overflow-y-auto h-full">
      <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
        Propriétés
      </h3>

      {/* Position & Size */}
      <section className="flex flex-col gap-2">
        <label className="text-xs text-zinc-500 font-medium">Position</label>
        <div className="grid grid-cols-2 gap-2">
          {["left", "top"].map((k) => (
            <div key={k} className="flex flex-col gap-1">
              <span className="text-xs text-zinc-600">{k === "left" ? "X" : "Y"}</span>
              <input
                type="number"
                value={props[k] as number || 0}
                onChange={(e) => update(k, parseInt(e.target.value))}
                className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-xs text-white w-full"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Opacity */}
      <section className="flex flex-col gap-2">
        <div className="flex justify-between">
          <label className="text-xs text-zinc-500 font-medium">Opacité</label>
          <span className="text-xs text-zinc-400">{Math.round((props.opacity as number || 1) * 100)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={props.opacity as number || 1}
          onChange={(e) => update("opacity", parseFloat(e.target.value))}
          className="w-full accent-rose-500"
        />
      </section>

      {/* Color */}
      {(isText || isShape) && (
        <section className="flex flex-col gap-2">
          <label className="text-xs text-zinc-500 font-medium">
            {isText ? "Couleur du texte" : "Couleur de fond"}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={(props.fill as string) || "#ffffff"}
              onChange={(e) => update("fill", e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border border-zinc-700 bg-zinc-800"
            />
            <input
              type="text"
              value={(props.fill as string) || "#ffffff"}
              onChange={(e) => update("fill", e.target.value)}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-xs text-white font-mono"
            />
          </div>
        </section>
      )}

      {/* Text-specific */}
      {isText && (
        <>
          <section className="flex flex-col gap-2">
            <label className="text-xs text-zinc-500 font-medium">Police</label>
            <select
              value={props.fontFamily as string || "Inter"}
              onChange={(e) => update("fontFamily", e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-xs text-white w-full"
            >
              {GOOGLE_FONTS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </section>
          <section className="flex flex-col gap-2">
            <label className="text-xs text-zinc-500 font-medium">Taille</label>
            <input
              type="number"
              min={8}
              max={400}
              value={props.fontSize as number || 32}
              onChange={(e) => update("fontSize", parseInt(e.target.value))}
              className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-xs text-white w-full"
            />
          </section>
          <section className="flex flex-col gap-2">
            <label className="text-xs text-zinc-500 font-medium">Graisse</label>
            <select
              value={props.fontWeight as string || "normal"}
              onChange={(e) => update("fontWeight", e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-xs text-white w-full"
            >
              {["300", "normal", "500", "600", "bold", "800", "900"].map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </section>
          <section className="flex flex-col gap-2">
            <label className="text-xs text-zinc-500 font-medium">Alignement</label>
            <div className="flex gap-1">
              {(["left", "center", "right"] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => update("textAlign", a)}
                  className={`flex-1 py-1 text-xs rounded-md transition-colors ${
                    props.textAlign === a
                      ? "bg-rose-600 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
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
          <label className="text-xs text-zinc-500 font-medium">Bordure</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={props.stroke as string || "#000000"}
              onChange={(e) => update("stroke", e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border border-zinc-700 bg-zinc-800"
            />
            <input
              type="number"
              min={0}
              max={20}
              value={props.strokeWidth as number || 0}
              onChange={(e) => update("strokeWidth", parseInt(e.target.value))}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-xs text-white"
              placeholder="Épaisseur"
            />
          </div>
        </section>
      )}
    </div>
  );
}

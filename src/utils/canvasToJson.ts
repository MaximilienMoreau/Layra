import type { Canvas as FabricCanvas } from "fabric";
import type { CanvasElement } from "./zodSchemas";

export function canvasToJson(canvas: FabricCanvas): CanvasElement[] {
  const objects = canvas.getObjects();
  return objects
    .filter((obj) => obj.layra && obj.layra.elementType !== "background")
    .map((obj, index): CanvasElement | null => {
      const meta = obj.layra!;
      const base = {
        id: meta.id,
        position: {
          x: obj.left ?? 0,
          y: obj.top ?? 0,
          width: obj.getScaledWidth(),
          height: obj.getScaledHeight(),
        },
        zIndex: index,
        locked: meta.locked,
        visible: meta.visible,
      };

      if (meta.elementType === "text") {
        const textObj = obj as import("fabric").Textbox;
        return {
          ...base,
          type: "text" as const,
          content: textObj.text || "",
          style: {
            fontFamily: textObj.fontFamily,
            fontSize: textObj.fontSize,
            fontWeight: textObj.fontWeight,
            color: textObj.fill as string,
            textAlign: textObj.textAlign as "left" | "center" | "right",
            lineHeight: textObj.lineHeight,
            letterSpacing: textObj.charSpacing ?? 0,
            italic: textObj.fontStyle === "italic",
            underline: textObj.underline,
            opacity: textObj.opacity,
          },
        };
      }

      if (meta.elementType === "shape") {
        return {
          ...base,
          type: "shape" as const,
          shapeType: meta.shapeType ?? "rect",
          style: {
            fill: obj.fill as string,
            stroke: obj.stroke as string | undefined ?? undefined,
            strokeWidth: obj.strokeWidth,
            opacity: obj.opacity,
          },
        };
      }

      if (meta.elementType === "image") {
        const imgObj = obj as import("fabric").FabricImage;
        return {
          ...base,
          type: "image" as const,
          src: imgObj.getSrc?.() || "",
        };
      }

      return null;
    })
    .filter((e): e is CanvasElement => e !== null);
}

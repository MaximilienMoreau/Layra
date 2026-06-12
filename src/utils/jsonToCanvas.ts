import type { Canvas as FabricCanvas, FabricObject, TFiller } from "fabric";
import type { ClaudeLayout, CanvasElement } from "./zodSchemas";

export interface LayraMeta {
  id: string;
  locked: boolean;
  visible: boolean;
  elementType: "text" | "image" | "shape" | "video" | "background";
  name: string;
  shapeType?: "rect" | "circle" | "triangle";
}

declare module "fabric" {
  interface FabricObject {
    layra?: LayraMeta;
  }
}

function gradientCoords(
  direction: string | undefined,
  w: number,
  h: number
): { x1: number; y1: number; x2: number; y2: number } {
  const d = (direction ?? "to bottom").toLowerCase().trim();
  if (d === "to bottom") return { x1: 0, y1: 0, x2: 0, y2: h };
  if (d === "to top") return { x1: 0, y1: h, x2: 0, y2: 0 };
  if (d === "to right") return { x1: 0, y1: 0, x2: w, y2: 0 };
  if (d === "to left") return { x1: w, y1: 0, x2: 0, y2: 0 };
  if (d === "to bottom right") return { x1: 0, y1: 0, x2: w, y2: h };
  if (d === "to bottom left") return { x1: w, y1: 0, x2: 0, y2: h };
  if (d === "to top right") return { x1: 0, y1: h, x2: w, y2: 0 };
  if (d === "to top left") return { x1: w, y1: h, x2: 0, y2: 0 };
  const deg = parseFloat(d);
  if (!isNaN(deg)) {
    const rad = ((deg - 90) * Math.PI) / 180;
    const cx = w / 2;
    const cy = h / 2;
    const len = Math.sqrt(w * w + h * h) / 2;
    return {
      x1: cx - Math.cos(rad) * len,
      y1: cy - Math.sin(rad) * len,
      x2: cx + Math.cos(rad) * len,
      y2: cy + Math.sin(rad) * len,
    };
  }
  return { x1: 0, y1: 0, x2: 0, y2: h };
}

async function createElement(
  element: CanvasElement,
  fabric: typeof import("fabric")
): Promise<FabricObject | null> {
  const { type, position, style, id, content, src, shapeType } = element;
  const { x, y, width, height } = position;
  const meta: LayraMeta = {
    id,
    locked: element.locked ?? false,
    visible: element.visible ?? true,
    elementType: type,
    name: content?.slice(0, 20) || type,
  };

  if (type === "text") {
    const textStyle = style as Record<string, unknown> | undefined;
    const obj = new fabric.Textbox(content || "Text", {
      left: x,
      top: y,
      width,
      fontFamily: (textStyle?.fontFamily as string) || "Inter",
      fontSize: (textStyle?.fontSize as number) || 32,
      fontWeight: (textStyle?.fontWeight as string | number) || "normal",
      fill: (textStyle?.color as string) || "#ffffff",
      textAlign: (textStyle?.textAlign as "left" | "center" | "right") || "left",
      lineHeight: (textStyle?.lineHeight as number) || 1.2,
      charSpacing: (textStyle?.letterSpacing as number) || 0,
      fontStyle: (textStyle?.italic as boolean) ? "italic" : "normal",
      underline: (textStyle?.underline as boolean) || false,
      opacity: (textStyle?.opacity as number) ?? 1,
      selectable: !meta.locked,
      visible: meta.visible,
    });
    obj.layra = meta;
    return obj;
  }

  if (type === "shape") {
    const shapeStyle = style as Record<string, unknown> | undefined;
    const shapeOpts = {
      left: x,
      top: y,
      width,
      height,
      fill: (shapeStyle?.fill as string) || "#4f46e5",
      stroke: (shapeStyle?.stroke as string) || undefined,
      strokeWidth: (shapeStyle?.strokeWidth as number) || 0,
      opacity: (shapeStyle?.opacity as number) ?? 1,
      rx: (shapeStyle?.rx as number) || 0,
      ry: (shapeStyle?.ry as number) || 0,
      selectable: !meta.locked,
      visible: meta.visible,
    };

    let obj: FabricObject;
    if (shapeType === "circle") {
      obj = new fabric.Ellipse({ ...shapeOpts, rx: width / 2, ry: height / 2 });
    } else if (shapeType === "triangle") {
      obj = new fabric.Triangle(shapeOpts);
    } else {
      obj = new fabric.Rect(shapeOpts);
    }
    obj.layra = { ...meta, name: shapeType || "rect", shapeType: shapeType ?? "rect" };
    return obj;
  }

  if (type === "video") {
    // Fabric.js ne supporte pas la lecture vidéo native.
    // On affiche un placeholder avec une icône play pour signaler l'élément.
    const videoStyle = style as Record<string, unknown> | undefined;
    const bg = new fabric.Rect({
      left: x,
      top: y,
      width,
      height,
      fill: (videoStyle?.fill as string) || "#111827",
      rx: 8,
      ry: 8,
      opacity: (videoStyle?.opacity as number) ?? 1,
      selectable: !meta.locked,
      visible: meta.visible,
    });
    bg.layra = { ...meta, name: content?.slice(0, 20) || "Vidéo" };

    // Triangle play dessiné en SVG inline puis chargé comme FabricImage
    const playSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><polygon points="16,8 56,32 16,56" fill="rgba(255,255,255,0.7)"/></svg>`;
    const svgUrl = `data:image/svg+xml;base64,${btoa(playSvg)}`;
    try {
      const playIcon = await fabric.FabricImage.fromURL(svgUrl);
      const iconSize = Math.min(width, height) * 0.25;
      playIcon.scaleToWidth(iconSize);
      playIcon.scaleToHeight(iconSize);
      playIcon.set({
        left: x + width / 2 - iconSize / 2,
        top: y + height / 2 - iconSize / 2,
        selectable: false,
        evented: false,
        visible: meta.visible,
      });
      // Retourne le groupe bg + icon via un Group Fabric
      const group = new fabric.Group([bg, playIcon], {
        left: x,
        top: y,
        selectable: !meta.locked,
        visible: meta.visible,
      });
      group.layra = bg.layra;
      return group;
    } catch {
      return bg;
    }
  }

  if (type === "image" && src) {
    try {
      const img = await fabric.FabricImage.fromURL(src, { crossOrigin: "anonymous" });
      img.set({ left: x, top: y, selectable: !meta.locked, visible: meta.visible });
      img.scaleToWidth(width);
      img.scaleToHeight(height);
      img.layra = meta;
      return img;
    } catch {
      // Fallback to placeholder rect
      const placeholder = new fabric.Rect({
        left: x, top: y, width, height,
        fill: "#374151",
        selectable: !meta.locked,
        visible: meta.visible,
      });
      placeholder.layra = { ...meta, name: "image (failed)" };
      return placeholder;
    }
  }

  return null;
}

export async function jsonToCanvas(
  layout: ClaudeLayout,
  canvas: FabricCanvas,
  fabricModule: typeof import("fabric")
): Promise<void> {
  canvas.clear();

  // Set background
  const { background } = layout;
  if (background.type === "color") {
    canvas.backgroundColor = background.value;
  } else if (background.type === "gradient" && background.gradient) {
    const coords = gradientCoords(background.gradient.direction, canvas.width!, canvas.height!);
    const gradient = new fabricModule.Gradient({
      type: "linear",
      gradientUnits: "pixels",
      coords,
      colorStops: [
        { offset: 0, color: background.gradient.from },
        { offset: 1, color: background.gradient.to },
      ],
    });
    canvas.backgroundColor = gradient as TFiller;
  } else if (background.type === "image" && background.value) {
    try {
      const bgImg = await fabricModule.FabricImage.fromURL(background.value, {
        crossOrigin: "anonymous",
      });
      canvas.backgroundImage = bgImg;
      bgImg.scaleToWidth(canvas.width!);
      bgImg.scaleToHeight(canvas.height!);
    } catch {
      canvas.backgroundColor = "#1a1a2e";
    }
  }

  // Sort by zIndex and add elements
  const sorted = [...layout.elements].sort(
    (a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)
  );
  for (const element of sorted) {
    const obj = await createElement(element, fabricModule);
    if (obj) canvas.add(obj);
  }

  canvas.renderAll();
}

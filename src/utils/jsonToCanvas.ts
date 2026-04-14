import type { Canvas as FabricCanvas, FabricObject } from "fabric";
import type { ClaudeLayout, CanvasElement } from "./zodSchemas";

export interface LayraMeta {
  id: string;
  locked: boolean;
  visible: boolean;
  elementType: "text" | "image" | "shape" | "video" | "background";
  name: string;
}

declare module "fabric" {
  interface FabricObject {
    layra?: LayraMeta;
  }
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
    obj.layra = { ...meta, name: shapeType || "rect" };
    return obj;
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
    const gradient = new fabricModule.Gradient({
      type: "linear",
      gradientUnits: "pixels",
      coords: { x1: 0, y1: 0, x2: canvas.width!, y2: canvas.height! },
      colorStops: [
        { offset: 0, color: background.gradient.from },
        { offset: 1, color: background.gradient.to },
      ],
    });
    canvas.backgroundColor = gradient as unknown as string;
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

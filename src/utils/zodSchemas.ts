import { z } from "zod";

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

export const TextStyleSchema = z.object({
  fontFamily: z.string().optional(),
  fontSize: z.number().optional(),
  fontWeight: z.union([z.string(), z.number()]).optional(),
  color: z.string().optional(),
  textAlign: z.enum(["left", "center", "right"]).optional(),
  lineHeight: z.number().optional(),
  letterSpacing: z.number().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  opacity: z.number().min(0).max(1).optional(),
});

export const ShapeStyleSchema = z.object({
  fill: z.string().optional(),
  stroke: z.string().optional(),
  strokeWidth: z.number().optional(),
  rx: z.number().optional(),
  ry: z.number().optional(),
  opacity: z.number().min(0).max(1).optional(),
});

export const ElementSchema = z.object({
  type: z.enum(["text", "image", "shape", "video"]),
  id: z.string(),
  content: z.string().optional(),
  src: z.string().optional(),
  position: PositionSchema,
  style: z.union([TextStyleSchema, ShapeStyleSchema]).optional(),
  zIndex: z.number().optional(),
  animation: z.string().optional(),
  shapeType: z.enum(["rect", "circle", "triangle"]).optional(),
  locked: z.boolean().optional(),
  visible: z.boolean().optional(),
});

export const BackgroundSchema = z.object({
  type: z.enum(["color", "gradient", "image"]),
  value: z.string(),
  gradient: z
    .object({
      from: z.string(),
      to: z.string(),
      direction: z.string().optional(),
    })
    .optional(),
});

export const CopySchema = z.object({
  headline: z.string().optional(),
  subline: z.string().optional(),
  cta: z.string().optional(),
  body: z.string().optional(),
});

export const ClaudeLayoutSchema = z.object({
  layout: z.enum(["hero", "centered", "split", "grid"]),
  background: BackgroundSchema,
  elements: z.array(ElementSchema),
  colorPalette: z.array(z.string()).optional(),
  suggestedAnimations: z.array(z.string()).optional(),
  copy: CopySchema.optional(),
});

export type ClaudeLayout = z.infer<typeof ClaudeLayoutSchema>;
export type CanvasElement = z.infer<typeof ElementSchema>;
export type Background = z.infer<typeof BackgroundSchema>;

import { z } from "zod";

export const AspectSchema = z.enum(["portrait", "vertical", "square", "landscape"]);

export const ImageJobSchema = z.object({
  type: z.literal("image"),
  subtype: z.enum(["t2i", "i2i"]),
  model_tier: z.enum(["base", "premium"]).default("base"),
  params: z.object({
    prompt: z.string().min(10).max(500),
    negative_prompt: z.string().max(500).optional(),
    width: z.number().int().min(256).max(2048),
    height: z.number().int().min(256).max(2048),
    steps: z.number().int().min(1).max(100),
    guidance: z.number().min(0).max(20),
    seed: z.number().int().optional(),
    reference_image_url: z.string().url().optional(),
    strength: z.number().min(0).max(1).optional(),
  }),
});

export const VideoJobSchema = z.object({
  type: z.literal("video"),
  subtype: z.enum(["t2v", "i2v", "spider"]),
  params: z.object({
    prompt: z.string().min(10).max(500),
    aspect: AspectSchema,
    duration: z.literal(3),
    fps: z.number().int().min(1).max(24),
    seed: z.number().int().optional(),
    reference_image_url: z.string().url().optional(),
  }),
});

export const AnyJobSchema = z.union([ImageJobSchema, VideoJobSchema]);

export const UpscaleRequestSchema = z.object({
  id: z.string().uuid(),
  target: z.enum(["square", "portrait", "vertical"]).optional(),
});



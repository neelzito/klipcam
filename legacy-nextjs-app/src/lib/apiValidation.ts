import { z } from "zod";

// Job creation validation
export const createJobSchema = z.object({
  type: z.literal("image"),
  subtype: z.enum(["t2i", "i2i"]),
  model_tier: z.enum(["base", "premium"]),
  params: z.object({
    prompt: z.string().min(10, "Prompt must be at least 10 characters").max(1000, "Prompt too long"),
    negative_prompt: z.string().optional(),
    width: z.number().int().min(256).max(1024).default(768),
    height: z.number().int().min(256).max(1024).default(768),
    steps: z.number().int().min(1).max(100).default(20),
    guidance: z.number().min(1).max(20).default(7.5),
    seed: z.number().int().optional(),
    reference_image_url: z.string().url().optional(),
    strength: z.number().min(0.1).max(1).optional(),
  }),
});

// Upscale validation
export const upscaleAssetSchema = z.object({
  scale: z.union([z.literal(2), z.literal(4)]).default(2),
  format: z.enum(["jpg", "png", "webp"]).default("jpg"),
});

// Webhook event validation
export const webhookEventSchema = z.object({
  id: z.string(),
  status: z.enum(["starting", "processing", "succeeded", "failed", "canceled"]),
  output: z.array(z.string().url()).optional(),
  error: z.string().optional(),
  metadata: z.object({
    jobId: z.string(),
    userId: z.string(),
    reservationId: z.string(),
  }).optional(),
});

// Rate limiting validation
export const rateLimitConfigSchema = z.object({
  limit: z.number().int().positive().default(20),
  window: z.number().int().positive().default(60000), // 1 minute
});

// Generic validation helper
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): 
  { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join(".")}: ${e.message}`);
      return { success: false, error: messages.join(", ") };
    }
    return { success: false, error: "Invalid input" };
  }
}

// Common response helpers
export function successResponse<T>(data: T, status = 200) {
  return Response.json(data, { status });
}

export function errorResponse(error: string, status = 400) {
  return Response.json({ error }, { status });
}

// Request body parser with validation
export async function parseAndValidate<T>(
  request: Request, 
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; response: Response }> {
  try {
    const body = await request.json();
    const result = validateRequest(schema, body);
    
    if (!result.success) {
      return { 
        success: false, 
        response: errorResponse(result.error, 400) 
      };
    }
    
    return { success: true, data: result.data };
  } catch {
    return { 
      success: false, 
      response: errorResponse("Invalid JSON body", 400) 
    };
  }
}
/**
 * Input Validation & Sanitization
 * 
 * Comprehensive validation schemas and sanitization functions
 * for all API endpoints and user inputs.
 */

import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// =============================================
// COMMON VALIDATION SCHEMAS
// =============================================

// User ID validation (Clerk format)
export const userIdSchema = z.string().min(1, 'User ID is required');

// File validation
export const fileUploadSchema = z.object({
  name: z.string().min(1).max(255),
  size: z.number().min(1).max(10 * 1024 * 1024), // 10MB max
  type: z.string().regex(/^image\/(jpeg|jpg|png|webp)$/i, 'Invalid file type'),
});

// Image generation parameters
export const aspectRatioSchema = z.enum(['1:1', '9:16', '16:9']);
export const modelTierSchema = z.enum(['base', 'premium']);

// Credit amounts
export const creditsSchema = z.number().int().min(1).max(1000);

// =============================================
// API ENDPOINT SCHEMAS
// =============================================

// Image generation request
export const imageGenerationSchema = z.object({
  prompt: z.string()
    .min(1, 'Prompt is required')
    .max(500, 'Prompt must be under 500 characters')
    .refine(val => !containsProhibitedContent(val), 'Prompt contains prohibited content'),
  
  aspectRatio: aspectRatioSchema.default('9:16'),
  modelTier: modelTierSchema.default('base'),
  variations: z.number().int().min(1).max(4).default(1),
  
  // Optional preset
  presetId: z.string().uuid().optional(),
  
  // Style parameters
  style: z.string().max(100).optional(),
  negativePrompt: z.string().max(300).optional(),
});

// Video generation request
export const videoGenerationSchema = z.object({
  prompt: z.string()
    .min(1, 'Prompt is required')
    .max(300, 'Prompt must be under 300 characters')
    .refine(val => !containsProhibitedContent(val), 'Prompt contains prohibited content'),
  
  aspectRatio: aspectRatioSchema.default('9:16'),
  duration: z.number().int().min(1).max(10).default(3),
  
  // Optional reference image for I2V
  referenceImageId: z.string().uuid().optional(),
});

// LoRA training request
export const loraTrainingSchema = z.object({
  name: z.string()
    .min(1, 'Model name is required')
    .max(50, 'Model name must be under 50 characters')
    .regex(/^[a-zA-Z0-9_\-\s]+$/, 'Model name contains invalid characters'),
  
  triggerWord: z.string()
    .min(2, 'Trigger word must be at least 2 characters')
    .max(20, 'Trigger word must be under 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Trigger word can only contain letters, numbers, and underscores')
    .optional(),
  
  images: z.array(z.object({
    file: fileUploadSchema,
    preview: z.string().url(),
  })).min(8, 'At least 8 images required').max(50, 'Maximum 50 images allowed'),
  
  trainingSettings: z.object({
    steps: z.number().int().min(500).max(2000).default(1000),
    learningRate: z.number().min(0.0001).max(0.01).default(0.0001),
    batchSize: z.number().int().min(1).max(8).default(4),
    resolution: z.number().int().min(512).max(1024).default(1024),
    autoCaptioning: z.boolean().default(true),
  }),
});

// Asset upscaling request
export const upscaleRequestSchema = z.object({
  assetId: z.string().uuid(),
  targetFormat: z.enum(['1080x1080', '1080x1920', '1920x1080']),
  quality: z.number().int().min(70).max(100).default(85),
});

// User preference updates
export const userPreferencesSchema = z.object({
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(false),
    generation_complete: z.boolean().default(true),
    credits_low: z.boolean().default(true),
  }).optional(),
  
  defaultSettings: z.object({
    aspectRatio: aspectRatioSchema.optional(),
    modelTier: modelTierSchema.optional(),
    style: z.string().max(50).optional(),
  }).optional(),
});

// =============================================
// WEBHOOK VALIDATION SCHEMAS
// =============================================

// Stripe webhook events
export const stripeWebhookSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.any(),
  }),
  created: z.number(),
  livemode: z.boolean(),
});

// Replicate webhook events
export const replicateWebhookSchema = z.object({
  id: z.string(),
  status: z.enum(['starting', 'processing', 'succeeded', 'failed', 'canceled']),
  output: z.any().optional(),
  error: z.string().optional(),
  logs: z.string().optional(),
});

// Clerk webhook events
export const clerkWebhookSchema = z.object({
  type: z.string(),
  data: z.any(),
  object: z.literal('event'),
});

// =============================================
// SANITIZATION FUNCTIONS
// =============================================

/**
 * Sanitize HTML content to prevent XSS
 */
export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize user-generated text content
 */
export function sanitizeText(input: string): string {
  // Remove any HTML tags
  const sanitized = sanitizeHtml(input);
  
  // Trim whitespace and limit length
  return sanitized.trim().substring(0, 1000);
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove dangerous characters and limit length
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 100)
    .toLowerCase();
}

/**
 * Validate and sanitize image prompt
 */
export function sanitizePrompt(prompt: string): string {
  // Remove HTML tags
  const sanitized = sanitizeHtml(prompt);
  
  // Check for prohibited content
  if (containsProhibitedContent(sanitized)) {
    throw new Error('Prompt contains prohibited content');
  }
  
  return sanitized.trim();
}

// =============================================
// CONTENT FILTERING
// =============================================

// Prohibited content patterns
const prohibitedPatterns = [
  // NSFW content
  /\b(nude|naked|sex|porn|xxx|adult|explicit)\b/i,
  
  // Violence
  /\b(kill|murder|death|blood|violence|weapon|gun|knife)\b/i,
  
  // Hate speech  
  /\b(nazi|hitler|racist|hate|discrimination)\b/i,
  
  // Celebrity names (basic list - extend as needed)
  /\b(celebrity|famous|actor|actress|singer|politician)\b/i,
  
  // Copyright content
  /\b(disney|marvel|pokemon|nintendo|sony|microsoft)\b/i,
];

/**
 * Check if content contains prohibited patterns
 */
export function containsProhibitedContent(content: string): boolean {
  const normalizedContent = content.toLowerCase();
  
  return prohibitedPatterns.some(pattern => 
    pattern.test(normalizedContent)
  );
}

/**
 * Validate file upload
 */
export function validateFileUpload(file: {
  name: string;
  size: number;
  type: string;
}): { valid: boolean; error?: string } {
  try {
    fileUploadSchema.parse(file);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        valid: false, 
        error: error.errors[0].message 
      };
    }
    return { 
      valid: false, 
      error: 'Invalid file upload' 
    };
  }
}

// =============================================
// API REQUEST VALIDATION
// =============================================

/**
 * Create validation middleware for API routes
 */
export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): T => {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.errors
          .map(err => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        throw new Error(`Validation failed: ${message}`);
      }
      throw error;
    }
  };
}

/**
 * Validate request body with schema
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid request body: ${error.errors[0].message}`);
    }
    throw new Error('Invalid request body');
  }
}

/**
 * Validate URL parameters
 */
export function validateParams<T>(
  params: unknown,
  schema: z.ZodSchema<T>
): T {
  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid parameters: ${error.errors[0].message}`);
    }
    throw new Error('Invalid parameters');
  }
}

// =============================================
// EXPORT VALIDATION FUNCTIONS
// =============================================

export const validators = {
  imageGeneration: createValidationMiddleware(imageGenerationSchema),
  videoGeneration: createValidationMiddleware(videoGenerationSchema),
  loraTraining: createValidationMiddleware(loraTrainingSchema),
  upscaleRequest: createValidationMiddleware(upscaleRequestSchema),
  userPreferences: createValidationMiddleware(userPreferencesSchema),
  stripeWebhook: createValidationMiddleware(stripeWebhookSchema),
  replicateWebhook: createValidationMiddleware(replicateWebhookSchema),
  clerkWebhook: createValidationMiddleware(clerkWebhookSchema),
};
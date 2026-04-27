/**
 * Example Secure API Route
 * 
 * This demonstrates how to use the secure API base class
 * with proper authentication, validation, and error handling.
 */

import { NextRequest } from 'next/server';
import { createApiRoute, ApiError, ApiErrorCode } from '@/lib/security/apiBase';
import { imageGenerationSchema } from '@/lib/security/validation';
import { SecurityMonitor } from '@/lib/security/monitoring';

// Example: Secure image generation endpoint
export const { POST } = createApiRoute(
  async (req: NextRequest, authContext, validatedData) => {
    const { userId } = authContext!;
    
    try {
      // Log the generation attempt
      SecurityMonitor.logSuspiciousActivity(
        'image_generation',
        { 
          prompt: validatedData.prompt,
          aspectRatio: validatedData.aspectRatio,
          modelTier: validatedData.modelTier 
        },
        userId,
        req.headers.get('x-forwarded-for') || undefined
      );

      // Business logic would go here
      // Example: Check user credits, call Replicate API, etc.
      
      // Simulate generation
      const result = {
        id: `gen_${Date.now()}`,
        status: 'generating',
        estimatedTime: '30 seconds',
        creditsUsed: validatedData.modelTier === 'premium' ? 4 : 1,
      };

      return result;
    } catch (error) {
      // Log security event for unexpected errors
      SecurityMonitor.logSuspiciousActivity(
        'generation_error',
        { 
          error: error instanceof Error ? error.message : 'Unknown error',
          userId 
        },
        userId,
        req.headers.get('x-forwarded-for') || undefined
      );

      throw new ApiError(
        ApiErrorCode.INTERNAL_ERROR,
        'Generation failed',
        500
      );
    }
  },
  {
    requireAuth: true,
    rateLimitType: 'generation',
    validationSchema: imageGenerationSchema,
    allowDemo: true,
  }
);
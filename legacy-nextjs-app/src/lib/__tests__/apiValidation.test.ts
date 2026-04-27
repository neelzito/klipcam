import { describe, it, expect } from 'vitest';
import { 
  createJobSchema, 
  upscaleAssetSchema, 
  webhookEventSchema,
  validateRequest 
} from '../apiValidation';

describe('API Validation', () => {
  describe('createJobSchema', () => {
    it('should validate valid image job', () => {
      const validJob = {
        type: 'image',
        subtype: 't2i',
        model_tier: 'base',
        params: {
          prompt: 'A beautiful sunset over mountains',
          width: 768,
          height: 1024,
          steps: 20,
          guidance: 7.5,
        },
      };

      const result = createJobSchema.safeParse(validJob);
      expect(result.success).toBe(true);
    });

    it('should reject job with short prompt', () => {
      const invalidJob = {
        type: 'image',
        subtype: 't2i',
        model_tier: 'base',
        params: {
          prompt: 'short', // Less than 10 characters
          width: 768,
          height: 1024,
          steps: 20,
          guidance: 7.5,
        },
      };

      const result = createJobSchema.safeParse(invalidJob);
      expect(result.success).toBe(false);
    });

    it('should validate I2I job with reference image', () => {
      const i2iJob = {
        type: 'image',
        subtype: 'i2i',
        model_tier: 'premium',
        params: {
          prompt: 'Transform this image into a cyberpunk style',
          width: 768,
          height: 1024,
          steps: 22,
          guidance: 3.5,
          reference_image_url: 'https://example.com/image.jpg',
          strength: 0.7,
        },
      };

      const result = createJobSchema.safeParse(i2iJob);
      expect(result.success).toBe(true);
    });

    it('should reject invalid model tier', () => {
      const invalidJob = {
        type: 'image',
        subtype: 't2i',
        model_tier: 'ultra', // Invalid tier
        params: {
          prompt: 'A beautiful sunset',
          width: 768,
          height: 1024,
          steps: 20,
          guidance: 7.5,
        },
      };

      const result = createJobSchema.safeParse(invalidJob);
      expect(result.success).toBe(false);
    });
  });

  describe('upscaleAssetSchema', () => {
    it('should validate valid upscale request', () => {
      const validRequest = {
        scale: 2,
        format: 'jpg',
      };

      const result = upscaleAssetSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should use default values', () => {
      const minimalRequest = {};

      const result = upscaleAssetSchema.safeParse(minimalRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scale).toBe(2);
        expect(result.data.format).toBe('jpg');
      }
    });

    it('should reject invalid scale', () => {
      const invalidRequest = {
        scale: 3, // Only 2 or 4 allowed
        format: 'jpg',
      };

      const result = upscaleAssetSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe('webhookEventSchema', () => {
    it('should validate successful webhook', () => {
      const validWebhook = {
        id: 'pred_123',
        status: 'succeeded',
        output: ['https://example.com/output.jpg'],
        metadata: {
          jobId: 'job_123',
          userId: 'user_123',
          reservationId: 'res_123',
        },
      };

      const result = webhookEventSchema.safeParse(validWebhook);
      expect(result.success).toBe(true);
    });

    it('should validate failed webhook', () => {
      const failedWebhook = {
        id: 'pred_123',
        status: 'failed',
        error: 'Processing failed',
        metadata: {
          jobId: 'job_123',
          userId: 'user_123',
          reservationId: 'res_123',
        },
      };

      const result = webhookEventSchema.safeParse(failedWebhook);
      expect(result.success).toBe(true);
    });
  });

  describe('validateRequest', () => {
    it('should return success for valid data', () => {
      const validData = { name: 'test', value: 42 };
      const schema = createJobSchema;
      
      // Using a simple schema for this test
      const simpleSchema = createJobSchema.pick({ type: true });
      const result = validateRequest(simpleSchema, { type: 'image' });
      
      expect(result.success).toBe(true);
    });

    it('should return error for invalid data', () => {
      const invalidData = { type: 'invalid' };
      const result = validateRequest(createJobSchema, invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
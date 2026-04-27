import Replicate from 'replicate';
import * as fal from "@fal-ai/serverless-client";

// Initialize Replicate client
const replicateApiToken = process.env.REPLICATE_API_TOKEN;

if (!replicateApiToken) {
  throw new Error('Missing REPLICATE_API_TOKEN environment variable');
}

export const replicate = new Replicate({
  auth: replicateApiToken,
});

// Configure FAL client
if (process.env.FAL_API_KEY) {
  fal.config({
    credentials: process.env.FAL_API_KEY,
  });
}

// Model definitions with pinned versions for production stability
export const MODELS = {
  // Base Images: qwen/qwen-image (T2I/I2I, low-res ≤768px) 
  imageBase: {
    owner: 'qwen',
    name: 'qwen-image',
    version: 'latest', // Keep latest for base model as it's frequently updated
    credits: 1,
    maxResolution: 768,
  },
  
  // Premium Images: black-forest-labs/flux-dev (pinned version for stability)
  imagePremium: {
    owner: 'black-forest-labs', 
    name: 'flux-dev',
    version: '6e4a938f85952bdabcc15aa329178c4d681c52bf25a0342403287dc26944661d', // Pinned stable version
    credits: 4,
    maxResolution: 1024,
  },
  
  // Image Upscaling: nightmareai/real-esrgan (2x/4x to IG formats)
  upscale: {
    owner: 'nightmareai',
    name: 'real-esrgan',
    version: 'latest',
    credits: 4,
  },
  
  // Base Video: wan-video/wan-2.2-t2v-fast (3s, ≤480p)
  videoBase: {
    owner: 'wan-video',
    name: 'wan-2-2-t2v-fast',
    version: 'latest',
    credits: 18,
    duration: 3,
    maxResolution: 480,
  },
  
  // Viral Effects: minimax/hailuo-2 (spiders crawling effect)
  viralSpiders: {
    owner: 'minimax',
    name: 'hailuo-2',
    version: 'latest',
    credits: 25,
    duration: 3,
  },

  // Loop Video: fal-ai/wan-flf2v (single image to loop video)
  videoLoop: {
    owner: 'fal-ai',
    name: 'wan-flf2v',
    version: 'latest',
    credits: 20,
    resolution: '480p',
  },

  // First-Last Frame Video: fal-ai/wan-flf2v (two images to transition video)  
  videoFirstLast: {
    owner: 'fal-ai',
    name: 'wan-flf2v',
    version: 'latest',
    credits: 20,
    resolution: '480p',
  },
} as const;

// Universal negative prompt for better quality
export const UNIVERSAL_NEGATIVE_PROMPT = 'blurry, low quality, distorted, deformed, watermark, text, signature, worst quality, low resolution, pixelated, artifacts, noise, grainy, oversaturated, undersaturated, duplicate';

// Aspect ratio configurations - Base tier optimized for 768px max resolution
export const ASPECT_RATIOS = {
  'portrait': { width: 576, height: 768, ratio: '3:4' },  // Fits within 768px limit
  'square': { width: 768, height: 768, ratio: '1:1' },
  'vertical': { width: 432, height: 768, ratio: '9:16' }, // Fits within 768px limit  
  'landscape': { width: 768, height: 576, ratio: '4:3' }, // Fits within 768px limit
} as const;

export type AspectRatio = keyof typeof ASPECT_RATIOS;

// Image generation parameters
export interface ImageGenerationParams {
  prompt: string;
  negative_prompt?: string;
  aspect_ratio?: AspectRatio;
  width?: number;
  height?: number;
  steps?: number;
  guidance?: number;
  seed?: number;
  // I2I parameters
  reference_image_url?: string;
  strength?: number;
}

// Video generation parameters  
export interface VideoGenerationParams {
  prompt: string;
  aspect_ratio?: AspectRatio;
  duration?: number;
  fps?: number;
  seed?: number;
  // I2V parameters
  reference_image_url?: string;
}

// Upscale parameters
export interface UpscaleParams {
  image_url: string;
  scale: 2 | 4;
  target_aspect?: AspectRatio;
}

// Loop video generation parameters
export interface LoopVideoParams {
  prompt: string;
  image_url: string;
  fps?: number;
  resolution?: '480p' | '720p';
  num_inference_steps?: number;
  seed?: number;
}

// First-Last frame video generation parameters
export interface FirstLastFrameParams {
  prompt: string;
  first_frame_image_url: string;
  last_frame_image_url: string;
  fps?: number;
  resolution?: '480p' | '720p';
  num_inference_steps?: number;
  seed?: number;
}

/**
 * Validate if a URL is a valid image URL (supports both relative and absolute URLs)
 */
function isValidImageUrl(url: string): boolean {
  try {
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    
    // Handle relative paths (e.g., /demo-uploads/..., /generated/...)
    if (url.startsWith('/')) {
      const pathname = url.toLowerCase();
      return validExtensions.some(ext => pathname.endsWith(ext)) || 
             pathname.includes('/image/') || 
             pathname.includes('/demo-uploads/') ||
             pathname.includes('/generated/');
    }
    
    // Handle absolute URLs
    const parsedUrl = new URL(url);
    const validProtocols = ['http:', 'https:'];
    
    if (!validProtocols.includes(parsedUrl.protocol)) {
      return false;
    }
    
    const pathname = parsedUrl.pathname.toLowerCase();
    return validExtensions.some(ext => pathname.endsWith(ext)) || 
           pathname.includes('/image/') || 
           parsedUrl.hostname.includes('supabase') ||
           parsedUrl.hostname.includes('replicate') ||
           parsedUrl.hostname.includes('fal.ai');
  } catch {
    return false;
  }
}

/**
 * Generate image using FAL.ai models with comprehensive error handling
 */
export async function generateImage(
  params: ImageGenerationParams,
  tier: 'base' | 'premium' = 'base',
  webhookUrl?: string,
  metadata?: Record<string, any>
) {
  // Use FAL.ai models - prioritize Flux Pro Kontext for image-to-image editing tasks
  let falModel;
  
  if (params.reference_image_url && !params.reference_image_url.includes('localhost')) {
    // Use Flux Pro Kontext for sophisticated image editing with context awareness
    falModel = 'fal-ai/flux-pro/kontext';
  } else {
    // Use text-to-image models for pure text generation
    falModel = tier === 'premium' 
      ? process.env.FAL_PREMIUM_IMAGE_MODEL || 'fal-ai/flux/dev'
      : process.env.FAL_BASE_IMAGE_MODEL || 'fal-ai/flux/schnell';
  }
  
  // Validate prompt
  if (!params.prompt || params.prompt.trim().length < 10) {
    throw new Error('Prompt must be at least 10 characters long');
  }
  
  // Determine dimensions - use higher resolution for premium tier
  const aspectRatio = params.aspect_ratio || 'portrait';
  let { width, height } = ASPECT_RATIOS[aspectRatio];
  
  // Upgrade to higher resolution for premium tier
  if (tier === 'premium') {
    switch (aspectRatio) {
      case 'portrait':
        width = 768 as any; height = 1024 as any; // 3:4 ratio
        break;
      case 'vertical':
        width = 576 as any; height = 1024 as any; // 9:16 ratio
        break;
      case 'landscape':
        width = 1024 as any; height = 768 as any; // 4:3 ratio
        break;
      // square stays the same at 768x768
    }
  }
  
  // Validate dimensions for model
  const finalWidth = params.width || width;
  const finalHeight = params.height || height;

  // Prepare input parameters based on model type
  const input: Record<string, any> = {
    prompt: params.prompt.trim(),
  };
  
  // For Flux Krea LoRA I2I, we don't use image_size parameter
  if (!params.reference_image_url || params.reference_image_url.includes('localhost')) {
    // Map aspect ratios to FAL image_size format for T2I models
    let imageSize = 'square';
    switch (aspectRatio) {
      case 'portrait':
        imageSize = 'portrait_4_3';
        break;
      case 'vertical':
        imageSize = 'portrait_16_9';
        break;
      case 'landscape':
        imageSize = 'landscape_4_3';
        break;
      case 'square':
        imageSize = 'square';
        break;
    }
    input.image_size = imageSize;
  }
  
  // Set model-specific parameters
  if (falModel === 'fal-ai/flux-pro/kontext') {
    // Flux Pro Kontext specific parameters - optimized for image editing
    input.num_inference_steps = params.steps || 28; // Kontext works well with 28 steps
    input.guidance_scale = params.guidance || 3.5; // Standard guidance for precise edits
    input.safety_tolerance = 2; // Standard safety setting
  } else {
    // Standard Flux model parameters
    input.num_inference_steps = params.steps || (tier === 'premium' ? 12 : 8);
    input.guidance_scale = params.guidance || (tier === 'premium' ? 3.5 : 7.5);
    input.enable_safety_checker = true;
  }
  
  // Add seed if provided
  if (params.seed && params.seed > 0) {
    input.seed = params.seed;
  }

  // Add I2I parameters if provided
  if (params.reference_image_url) {
    // Check if it's a localhost URL (not accessible to FAL)
    const isLocalhost = params.reference_image_url.includes('localhost') || 
                       params.reference_image_url.startsWith('/demo-uploads');
    
    if (!isLocalhost) {
      console.log('🔍 Testing direct Supabase URL access');
      console.log('   Supabase URL:', params.reference_image_url);
      
      // Test URL accessibility by trying to fetch it
      try {
        console.log('🌐 Testing URL accessibility...');
        const testResponse = await fetch(params.reference_image_url, { method: 'HEAD' });
        console.log(`   Response status: ${testResponse.status}`);
        console.log(`   Response headers:`, Array.from(testResponse.headers.entries()));
      } catch (testError) {
        console.log('   ❌ URL test failed:', (testError as Error).message);
      }
      
      // Use the actual Supabase URL
      input.image_url = params.reference_image_url;
      
      // Flux Pro Kontext doesn't use strength parameter - it uses the prompt for editing instructions
      // The model understands context and editing instructions naturally
      if (falModel !== 'fal-ai/flux-pro/kontext') {
        // Only set strength for other I2I models
        input.strength = params.strength || 0.7; // Standard I2I default
        
        // Validate strength parameter for non-Kontext models
        if (input.strength < 0.1 || input.strength > 1.0) {
          throw new Error('Strength must be between 0.1 and 1.0');
        }
      }
    } else {
      console.log('⚠️  Localhost reference image detected, using text-to-image instead of image editing');
      // Add a note to the prompt that we're working from a description rather than reference
      input.prompt += ' (generated from text description only in development mode)';
    }
  }

  try {
    console.log(`🎨 Starting ${tier} image generation with FAL model ${falModel}`);
    if (input.image_size) {
      console.log(`   Image Size: ${input.image_size} (aspect: ${aspectRatio})`);
    } else {
      console.log(`   Using source image dimensions (aspect: ${aspectRatio})`);
    }
    console.log(`   Prompt: "${params.prompt.substring(0, 50)}${params.prompt.length > 50 ? '...' : ''}"`);
    console.log(`   Input parameters:`, JSON.stringify(input, null, 2));
    
    const result = await fal.subscribe(falModel, {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS' || update.status === 'COMPLETED') {
          console.log(`FAL Queue Update: ${update.status}`);
        }
      },
    });
    
    console.log(`✅ FAL image generation completed`);
    console.log(`🔍 FAL Result structure:`, JSON.stringify(result, null, 2));
    
    return {
      id: (result as any).request_id || `fal-${Date.now()}`,
      status: 'completed',
      urls: {},
      model: falModel,
      credits: tier === 'premium' ? 4 : 1,
      output: result,
      metadata: {
        tier,
        aspectRatio,
        dimensions: { width: finalWidth, height: finalHeight },
        hasReferenceImage: !!params.reference_image_url,
        modelType: falModel.includes('kontext') ? 'image-editing' : falModel.includes('image-to-image') ? 'style-transfer' : 'text-to-image',
        isContextAware: falModel.includes('kontext'),
      },
    };
  } catch (error: any) {
    console.error(`❌ FAL image generation failed:`, error);
    
    // Log detailed validation errors for debugging
    if (error.status === 422 && error.body?.detail) {
      console.error('FAL Validation Details:', JSON.stringify(error.body.detail, null, 2));
    }
    
    // Enhance error messages
    if (error.message?.includes('rate limit')) {
      throw new Error('Rate limit exceeded. Please wait a moment before generating another image.');
    }
    
    if (error.message?.includes('insufficient')) {
      throw new Error('Insufficient credits for image generation.');
    }
    
    if (error.status === 422) {
      throw new Error('Invalid parameters for image generation. Please check your input.');
    }
    
    // Re-throw with original error for unexpected cases
    throw error;
  }
}

/**
 * Generate video using base model or spider effects with comprehensive error handling
 */
export async function generateVideo(
  params: VideoGenerationParams,
  type: 'base' | 'spider' = 'base',
  webhookUrl?: string,
  metadata?: Record<string, any>
) {
  const model = type === 'spider' ? MODELS.viralSpiders : MODELS.videoBase;
  
  // Validate prompt
  if (!params.prompt || params.prompt.trim().length < 10) {
    throw new Error('Prompt must be at least 10 characters long');
  }
  
  // Determine aspect ratio for video
  const aspectRatio = params.aspect_ratio || 'vertical';
  const { width, height } = ASPECT_RATIOS[aspectRatio];
  
  const input: Record<string, any> = {
    prompt: params.prompt.trim(),
    width,
    height,
    duration: params.duration || 3,
    fps: params.fps || 8,
  };
  
  if (params.seed && params.seed > 0) {
    input.seed = params.seed;
  }

  // Add I2V parameters if provided
  if (params.reference_image_url) {
    if (!isValidImageUrl(params.reference_image_url)) {
      throw new Error('Invalid reference image URL');
    }
    input.image = params.reference_image_url;
  }

  // Spider effects might have different input format
  if (type === 'spider') {
    input.prompt = `${params.prompt}, spiders crawling, creepy crawling effect, dramatic movement`;
  }

  const options: any = {
    version: model.version,
    input,
  };

  if (webhookUrl) {
    options.webhook = webhookUrl;
    options.webhook_events_filter = ['completed'];
  }

  try {
    console.log(`🎥 Starting ${type} video generation with model ${model.owner}/${model.name}`);
    console.log(`   Dimensions: ${width}x${height}, Duration: ${input.duration}s`);
    console.log(`   Prompt: "${params.prompt.substring(0, 50)}${params.prompt.length > 50 ? '...' : ''}"`);
    
    const prediction = await replicate.predictions.create(options);
    
    console.log(`✅ Video generation started: ${prediction.id}`);
    
    return {
      id: prediction.id,
      status: prediction.status,
      urls: prediction.urls,
      model: `${model.owner}/${model.name}`,
      credits: model.credits,
      metadata: {
        type,
        aspectRatio,
        dimensions: { width, height },
        duration: input.duration,
        hasReferenceImage: !!params.reference_image_url,
      },
    };
  } catch (error: any) {
    console.error(`❌ Video generation failed:`, error);
    
    // Enhance error messages
    if (error.message?.includes('Invalid version')) {
      throw new Error(`Model version not found. The ${type} video model may be temporarily unavailable.`);
    }
    
    if (error.message?.includes('rate limit')) {
      throw new Error('Rate limit exceeded. Please wait a moment before generating another video.');
    }
    
    throw error;
  }
}

/**
 * Generate loop video from single image using fal-ai/wan-flf2v
 */
export async function generateLoopVideo(
  params: LoopVideoParams,
  webhookUrl?: string,
  metadata?: Record<string, any>
) {
  const model = MODELS.videoLoop;
  
  // Validate inputs
  if (!params.prompt || params.prompt.trim().length < 10) {
    throw new Error('Prompt must be at least 10 characters long');
  }
  
  if (!isValidImageUrl(params.image_url)) {
    throw new Error('Invalid image URL');
  }
  
  try {
    console.log(`🔄 Starting loop video generation with FAL.ai`);
    console.log(`   Image: ${params.image_url.substring(0, 50)}...`);
    console.log(`   Prompt: "${params.prompt.substring(0, 50)}${params.prompt.length > 50 ? '...' : ''}"`);
    
    const result = await fal.subscribe("fal-ai/wan-flf2v", {
      input: {
        prompt: params.prompt.trim(),
        first_frame_image_url: params.image_url,
        last_frame_image_url: params.image_url, // Same image for loop effect
        fps: params.fps || 8,
        resolution: params.resolution || '480p',
        num_inference_steps: params.num_inference_steps || 25,
        seed: params.seed,
      },
      webhookUrl,
      logs: true,
    });
    
    console.log(`✅ Loop video generation started`);
    
    return {
      id: (result as any).requestId || `fal-${Date.now()}`,
      status: 'processing',
      urls: {},
      model: `${model.owner}/${model.name}`,
      credits: model.credits,
      falResult: result,
    };
  } catch (error: any) {
    console.error('❌ FAL loop video generation error:', error);
    
    if (error.message?.includes('rate limit')) {
      throw new Error('Rate limit exceeded. Please wait before generating another video.');
    }
    
    throw error;
  }
}

/**
 * Generate video transitioning between two images using fal-ai/wan-flf2v
 */
export async function generateFirstLastFrameVideo(
  params: FirstLastFrameParams,
  webhookUrl?: string,
  metadata?: Record<string, any>
) {
  const model = MODELS.videoFirstLast;
  
  // Validate inputs
  if (!params.prompt || params.prompt.trim().length < 10) {
    throw new Error('Prompt must be at least 10 characters long');
  }
  
  if (!isValidImageUrl(params.first_frame_image_url)) {
    throw new Error('Invalid first frame image URL');
  }
  
  if (!isValidImageUrl(params.last_frame_image_url)) {
    throw new Error('Invalid last frame image URL');
  }
  
  try {
    console.log(`🎬 Starting first-last frame video generation with FAL.ai`);
    console.log(`   First: ${params.first_frame_image_url.substring(0, 50)}...`);
    console.log(`   Last: ${params.last_frame_image_url.substring(0, 50)}...`);
    
    const result = await fal.subscribe("fal-ai/wan-flf2v", {
      input: {
        prompt: params.prompt.trim(),
        first_frame_image_url: params.first_frame_image_url,
        last_frame_image_url: params.last_frame_image_url,
        fps: params.fps || 8,
        resolution: params.resolution || '480p',
        num_inference_steps: params.num_inference_steps || 25,
        seed: params.seed,
      },
      webhookUrl,
      logs: true,
    });
    
    console.log(`✅ First-last frame video generation started`);
    
    return {
      id: (result as any).requestId || `fal-${Date.now()}`,
      status: 'processing', 
      urls: {},
      model: `${model.owner}/${model.name}`,
      credits: model.credits,
      falResult: result,
    };
  } catch (error: any) {
    console.error('❌ FAL first-last frame generation error:', error);
    throw error;
  }
}

/**
 * Upscale image to higher resolution
 */
export async function upscaleImage(
  params: UpscaleParams,
  webhookUrl?: string,
  metadata?: Record<string, any>
) {
  const model = MODELS.upscale;
  
  if (!isValidImageUrl(params.image_url)) {
    throw new Error('Invalid image URL');
  }
  
  const input: Record<string, any> = {
    image: params.image_url,
    scale: params.scale,
  };

  const options: any = {
    version: model.version,
    input,
  };

  if (webhookUrl) {
    options.webhook = webhookUrl;
    options.webhook_events_filter = ['completed'];
  }

  try {
    console.log(`🔍 Starting image upscale ${params.scale}x with model ${model.owner}/${model.name}`);
    
    const prediction = await replicate.predictions.create(options);
    
    console.log(`✅ Image upscale started: ${prediction.id}`);
    
    return {
      id: prediction.id,
      status: prediction.status,
      urls: prediction.urls,
      model: `${model.owner}/${model.name}`,
      credits: model.credits,
    };
  } catch (error: any) {
    console.error(`❌ Image upscale failed:`, error);
    throw error;
  }
}

/**
 * Get prediction status
 */
export async function getPrediction(predictionId: string) {
  return await replicate.predictions.get(predictionId);
}

/**
 * Cancel a prediction
 */
export async function cancelPrediction(predictionId: string) {
  return await replicate.predictions.cancel(predictionId);
}

/**
 * Get model details
 */
export async function getModel(owner: string, name: string) {
  return await replicate.models.get(owner, name);
}

/**
 * Validate prediction webhook signature
 */
export function validateWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  // Replicate uses HMAC-SHA256 for webhook signatures
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  return signature === `sha256=${expectedSignature}`;
}

/**
 * Calculate credit cost for generation
 */
export function calculateCreditCost(
  type: 'image' | 'video' | 'upscale',
  tier?: 'base' | 'premium' | 'spider' | 'loop' | 'first-last'
): number {
  switch (type) {
    case 'image':
      return tier === 'premium' ? MODELS.imagePremium.credits : MODELS.imageBase.credits;
    case 'video':
      if (tier === 'spider') return MODELS.viralSpiders.credits;
      if (tier === 'loop') return MODELS.videoLoop.credits;
      if (tier === 'first-last') return MODELS.videoFirstLast.credits;
      return MODELS.videoBase.credits;
    case 'upscale':
      return MODELS.upscale.credits;
    default:
      return 1;
  }
}

/**
 * Get model limitations
 */
export function getModelLimitations(
  type: 'image' | 'video' | 'upscale',
  tier?: 'base' | 'premium' | 'spider' | 'loop' | 'first-last'
) {
  switch (type) {
    case 'image':
      const imageModel = tier === 'premium' ? MODELS.imagePremium : MODELS.imageBase;
      return {
        maxResolution: imageModel.maxResolution,
        credits: imageModel.credits,
        supportsI2I: true,
      };
    case 'video':
      let videoModel;
      if (tier === 'spider') videoModel = MODELS.viralSpiders;
      else if (tier === 'loop') videoModel = MODELS.videoLoop;  
      else if (tier === 'first-last') videoModel = MODELS.videoFirstLast;
      else videoModel = MODELS.videoBase;
      
      return {
        maxResolution: 'maxResolution' in videoModel ? videoModel.maxResolution : 
                      'resolution' in videoModel ? videoModel.resolution : 1024,
        duration: 'duration' in videoModel ? videoModel.duration : 5,
        credits: videoModel.credits,
        supportsI2V: true,
        supportsLoop: tier === 'loop',
        supportsFirstLast: tier === 'first-last',
      };
    case 'upscale':
      return {
        credits: MODELS.upscale.credits,
        scales: [2, 4],
      };
    default:
      return {};
  }
}
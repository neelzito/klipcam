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

// Aspect ratio configurations
export const ASPECT_RATIOS = {
  'portrait': { width: 768, height: 1024, ratio: '3:4' },
  'square': { width: 768, height: 768, ratio: '1:1' },
  'vertical': { width: 576, height: 1024, ratio: '9:16' },
  'landscape': { width: 1024, height: 768, ratio: '4:3' },
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
 * Validate if a URL is a valid image URL
 */
function isValidImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    const validProtocols = ['http:', 'https:'];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    
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
 * Generate image using base or premium model with comprehensive error handling
 */
export async function generateImage(
  params: ImageGenerationParams,
  tier: 'base' | 'premium' = 'base',
  webhookUrl?: string,
  metadata?: Record<string, any>
) {
  const model = tier === 'premium' ? MODELS.imagePremium : MODELS.imageBase;
  
  // Validate prompt
  if (!params.prompt || params.prompt.trim().length < 10) {
    throw new Error('Prompt must be at least 10 characters long');
  }
  
  // Determine dimensions
  const aspectRatio = params.aspect_ratio || 'portrait';
  const { width, height } = ASPECT_RATIOS[aspectRatio];
  
  // Validate dimensions for model
  const finalWidth = params.width || width;
  const finalHeight = params.height || height;
  
  if (tier === 'base' && Math.max(finalWidth, finalHeight) > model.maxResolution) {
    throw new Error(`Base model max resolution is ${model.maxResolution}px. Use premium tier for higher resolution.`);
  }
  
  const input: Record<string, any> = {
    prompt: params.prompt.trim(),
    negative_prompt: params.negative_prompt || UNIVERSAL_NEGATIVE_PROMPT,
    width: finalWidth,
    height: finalHeight,
    steps: params.steps || (tier === 'premium' ? 22 : 24),
    guidance: params.guidance || (tier === 'premium' ? 3.5 : 7.5),
  };
  
  // Add seed if provided
  if (params.seed && params.seed > 0) {
    input.seed = params.seed;
  }

  // Add I2I parameters if provided
  if (params.reference_image_url) {
    // Validate image URL
    if (!isValidImageUrl(params.reference_image_url)) {
      throw new Error('Invalid reference image URL');
    }
    
    input.image = params.reference_image_url;
    input.strength = params.strength || 0.7;
    
    // Validate strength parameter
    if (input.strength < 0.1 || input.strength > 1.0) {
      throw new Error('Strength must be between 0.1 and 1.0');
    }
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
    console.log(`🎨 Starting ${tier} image generation with model ${model.owner}/${model.name}`);
    console.log(`   Dimensions: ${finalWidth}x${finalHeight}`);
    console.log(`   Prompt: "${params.prompt.substring(0, 50)}${params.prompt.length > 50 ? '...' : ''}"`);
    
    const prediction = await replicate.predictions.create(options);
    
    console.log(`✅ Image generation started: ${prediction.id}`);
    
    return {
      id: prediction.id,
      status: prediction.status,
      urls: prediction.urls,
      model: `${model.owner}/${model.name}`,
      credits: model.credits,
      metadata: {
        tier,
        aspectRatio,
        dimensions: { width: finalWidth, height: finalHeight },
        hasReferenceImage: !!params.reference_image_url,
      },
    };
  } catch (error: any) {
    console.error(`❌ Image generation failed:`, error);
    
    // Enhance error messages
    if (error.message?.includes('Invalid version')) {
      throw new Error(`Model version not found. The ${tier} image model may be temporarily unavailable.`);
    }
    
    if (error.message?.includes('rate limit')) {
      throw new Error('Rate limit exceeded. Please wait a moment before generating another image.');
    }
    
    if (error.message?.includes('insufficient credits')) {
      throw new Error('Insufficient credits for image generation.');
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

// ... (rest of functions remain the same)

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
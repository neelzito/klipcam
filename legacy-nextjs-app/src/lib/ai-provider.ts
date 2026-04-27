import { generateImage as replicateGenerateImage, generateVideo as replicateGenerateVideo, upscaleImage as replicateUpscaleImage } from './replicate';
import { generateImage as falGenerateImage } from './falai';
import { ImageGenerationParams, VideoGenerationParams, UpscaleParams } from './replicate';
import { getOptimalParameters, validateParameters, estimateGeneration, autoSelectOptimal, trackPerformance, OptimizationContext, GenerationPerformance } from './optimization-config';

// Provider preference from environment
const PRIMARY_PROVIDER = process.env.AI_PROVIDER || 'replicate'; // replicate, fal, or hybrid
const FALLBACK_PROVIDER = process.env.FALLBACK_PROVIDER || 'fal';
const USE_FALLBACK = process.env.NODE_ENV !== 'production' || process.env.ENABLE_AI_FALLBACK === 'true';

type Provider = 'replicate' | 'fal';
type GenerationType = 'image' | 'video' | 'upscale';

interface ProviderStatus {
  provider: Provider;
  healthy: boolean;
  lastChecked: number;
  errorCount: number;
  lastError?: string;
}

// Provider health tracking
const providerStatus: Record<Provider, ProviderStatus> = {
  replicate: {
    provider: 'replicate',
    healthy: true,
    lastChecked: Date.now(),
    errorCount: 0,
  },
  fal: {
    provider: 'fal',
    healthy: true,
    lastChecked: Date.now(),
    errorCount: 0,
  },
};

const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MAX_ERROR_COUNT = 3; // Mark unhealthy after 3 consecutive errors
const RETRY_DELAY = 60 * 1000; // 1 minute before retrying failed provider

/**
 * Record provider error and update health status
 */
function recordProviderError(provider: Provider, error: string) {
  const status = providerStatus[provider];
  status.errorCount += 1;
  status.lastError = error;
  status.lastChecked = Date.now();
  
  if (status.errorCount >= MAX_ERROR_COUNT) {
    status.healthy = false;
    console.warn(`⚠️  Provider ${provider} marked as unhealthy after ${MAX_ERROR_COUNT} errors`);
    console.warn(`   Last error: ${error}`);
  }
}

/**
 * Record provider success and reset error count
 */
function recordProviderSuccess(provider: Provider) {
  const status = providerStatus[provider];
  status.errorCount = 0;
  status.healthy = true;
  status.lastChecked = Date.now();
  status.lastError = undefined;
}

/**
 * Check if provider should be retried (after cooldown period)
 */
function shouldRetryProvider(provider: Provider): boolean {
  const status = providerStatus[provider];
  return !status.healthy && (Date.now() - status.lastChecked) > RETRY_DELAY;
}

/**
 * Get the best available provider for a generation type
 */
function getBestProvider(type: GenerationType): Provider {
  // For video, prefer FAL.ai as it has better video models
  if (type === 'video') {
    if (providerStatus.fal.healthy || shouldRetryProvider('fal')) {
      return 'fal';
    }
    if (providerStatus.replicate.healthy || shouldRetryProvider('replicate')) {
      return 'replicate';
    }
  }
  
  // For image/upscale, prefer based on configuration
  const preferred = PRIMARY_PROVIDER as Provider;
  if (providerStatus[preferred]?.healthy || shouldRetryProvider(preferred)) {
    return preferred;
  }
  
  // Fallback to secondary provider
  const fallback = FALLBACK_PROVIDER as Provider;
  if (providerStatus[fallback]?.healthy || shouldRetryProvider(fallback)) {
    return fallback;
  }
  
  // Default to Replicate if all else fails
  return 'replicate';
}

/**
 * Get available fallback providers for a generation type
 */
function getFallbackProviders(type: GenerationType, exclude: Provider): Provider[] {
  const allProviders: Provider[] = ['replicate', 'fal'];
  const available = allProviders.filter(p => 
    p !== exclude && (providerStatus[p].healthy || shouldRetryProvider(p))
  );
  
  // For video, prefer FAL.ai
  if (type === 'video') {
    return available.sort((a, b) => (a === 'fal' ? -1 : b === 'fal' ? 1 : 0));
  }
  
  return available;
}

/**
 * Generate image with automatic fallback and optimization
 */
export async function generateImage(
  params: ImageGenerationParams,
  tier: 'base' | 'premium' = 'base',
  webhookUrl?: string,
  metadata?: Record<string, any>,
  optimizationContext?: OptimizationContext
) {
  const startTime = Date.now();
  
  // Apply optimization if context provided
  if (optimizationContext) {
    const modelName = tier === 'premium' ? 'flux-dev' : 'qwen-image';
    const optimalPreset = getOptimalParameters(modelName, optimizationContext, 'image');
    
    // Override parameters with optimized values if not explicitly set
    if (!params.steps) params.steps = optimalPreset.steps;
    if (!params.guidance) params.guidance = optimalPreset.guidance;
    
    // Validate and warn about parameters
    const validation = validateParameters(modelName, {
      steps: params.steps || optimalPreset.steps,
      guidance: params.guidance || optimalPreset.guidance,
      width: params.width,
      height: params.height
    });
    
    if (!validation.valid) {
      console.warn('⚠️ Parameter validation warnings:', validation.warnings);
    }
    
    // Estimate generation time and cost
    const dimensions = {
      width: params.width || 768,
      height: params.height || 1024
    };
    const estimate = estimateGeneration(modelName, optimalPreset, dimensions);
    console.log(`🎯 Optimization: ${optimalPreset.name} preset, estimated ${estimate.timeEstimate}s, ${estimate.creditCost} credits`);
  }
  
  const primaryProvider = getBestProvider('image');
  const fallbackProviders = USE_FALLBACK ? getFallbackProviders('image', primaryProvider) : [];
  
  console.log(`🎨 Image generation strategy: ${primaryProvider} (fallbacks: ${fallbackProviders.join(', ') || 'none'})`);
  
  // Try primary provider
  try {
    const result = await generateWithProvider(primaryProvider, 'image', params, tier, webhookUrl, metadata);
    recordProviderSuccess(primaryProvider);
    
    // Track performance if optimization context provided
    if (optimizationContext) {
      const performance: GenerationPerformance = {
        modelUsed: tier === 'premium' ? 'flux-dev' : 'qwen-image',
        presetUsed: 'auto-optimized',
        actualTime: Math.round((Date.now() - startTime) / 1000),
        errorOccurred: false,
        creditsUsed: result.credits || (tier === 'premium' ? 4 : 1)
      };
      trackPerformance(performance);
    }
    
    return { ...result, provider: primaryProvider };
  } catch (error: any) {
    console.error(`❌ ${primaryProvider} image generation failed:`, error.message);
    recordProviderError(primaryProvider, error.message);
    
    // Try fallback providers
    for (const fallback of fallbackProviders) {
      try {
        console.log(`🔄 Trying fallback provider: ${fallback}`);
        const result = await generateWithProvider(fallback, 'image', params, tier, webhookUrl, metadata);
        recordProviderSuccess(fallback);
        return { ...result, provider: fallback, fallbackUsed: true };
      } catch (fallbackError: any) {
        console.error(`❌ ${fallback} fallback failed:`, fallbackError.message);
        recordProviderError(fallback, fallbackError.message);
      }
    }
    
    // All providers failed
    throw new Error(`All AI providers failed for image generation. Last error: ${error.message}`);
  }
}

/**
 * Generate video with automatic fallback and optimization
 */
export async function generateVideo(
  params: VideoGenerationParams,
  type: 'base' | 'spider' = 'base',
  webhookUrl?: string,
  metadata?: Record<string, any>,
  optimizationContext?: OptimizationContext
) {
  const startTime = Date.now();
  
  // Apply optimization if context provided
  if (optimizationContext) {
    const optimalPreset = getOptimalParameters('video-base', optimizationContext, 'video');
    console.log(`🎯 Video optimization: ${optimalPreset.name} preset for ${type} video`);
  }
  
  const primaryProvider = getBestProvider('video');
  const fallbackProviders = USE_FALLBACK ? getFallbackProviders('video', primaryProvider) : [];
  
  console.log(`🎥 Video generation strategy: ${primaryProvider} (fallbacks: ${fallbackProviders.join(', ') || 'none'})`);
  
  // Try primary provider
  try {
    const result = await generateWithProvider(primaryProvider, 'video', params, type, webhookUrl, metadata);
    recordProviderSuccess(primaryProvider);
    
    // Track performance if optimization context provided
    if (optimizationContext) {
      const performance: GenerationPerformance = {
        modelUsed: type === 'spider' ? 'hailuo-2' : 'wan-video',
        presetUsed: 'auto-optimized',
        actualTime: Math.round((Date.now() - startTime) / 1000),
        errorOccurred: false,
        creditsUsed: result.credits || (type === 'spider' ? 25 : 18)
      };
      trackPerformance(performance);
    }
    
    return { ...result, provider: primaryProvider };
  } catch (error: any) {
    console.error(`❌ ${primaryProvider} video generation failed:`, error.message);
    recordProviderError(primaryProvider, error.message);
    
    // Try fallback providers
    for (const fallback of fallbackProviders) {
      try {
        console.log(`🔄 Trying fallback provider: ${fallback}`);
        const result = await generateWithProvider(fallback, 'video', params, type, webhookUrl, metadata);
        recordProviderSuccess(fallback);
        return { ...result, provider: fallback, fallbackUsed: true };
      } catch (fallbackError: any) {
        console.error(`❌ ${fallback} fallback failed:`, fallbackError.message);
        recordProviderError(fallback, fallbackError.message);
      }
    }
    
    // All providers failed
    throw new Error(`All AI providers failed for video generation. Last error: ${error.message}`);
  }
}

/**
 * Upscale image with automatic fallback
 */
export async function upscaleImage(
  params: UpscaleParams,
  webhookUrl?: string,
  metadata?: Record<string, any>
) {
  const primaryProvider = getBestProvider('upscale');
  const fallbackProviders = USE_FALLBACK ? getFallbackProviders('upscale', primaryProvider) : [];
  
  console.log(`🔍 Upscale strategy: ${primaryProvider} (fallbacks: ${fallbackProviders.join(', ') || 'none'})`);
  
  // Try primary provider
  try {
    const result = await generateWithProvider(primaryProvider, 'upscale', params, undefined, webhookUrl, metadata);
    recordProviderSuccess(primaryProvider);
    return { ...result, provider: primaryProvider };
  } catch (error: any) {
    console.error(`❌ ${primaryProvider} upscale failed:`, error.message);
    recordProviderError(primaryProvider, error.message);
    
    // Try fallback providers
    for (const fallback of fallbackProviders) {
      try {
        console.log(`🔄 Trying fallback provider: ${fallback}`);
        const result = await generateWithProvider(fallback, 'upscale', params, undefined, webhookUrl, metadata);
        recordProviderSuccess(fallback);
        return { ...result, provider: fallback, fallbackUsed: true };
      } catch (fallbackError: any) {
        console.error(`❌ ${fallback} fallback failed:`, fallbackError.message);
        recordProviderError(fallback, fallbackError.message);
      }
    }
    
    // All providers failed
    throw new Error(`All AI providers failed for upscale. Last error: ${error.message}`);
  }
}

/**
 * Generate content with specific provider
 */
async function generateWithProvider(
  provider: Provider,
  type: GenerationType,
  params: any,
  tier?: any,
  webhookUrl?: string,
  metadata?: Record<string, any>
) {
  switch (type) {
    case 'image':
      if (provider === 'replicate') {
        return await replicateGenerateImage(params, tier, webhookUrl, metadata);
      } else {
        // For FAL.ai image generation, we need to adapt parameters
        return await falGenerateImage(params, tier, webhookUrl, metadata);
      }
      
    case 'video':
      if (provider === 'replicate') {
        return await replicateGenerateVideo(params, tier, webhookUrl, metadata);
      } else {
        // For FAL.ai video generation, adapt as needed
        throw new Error('FAL.ai video generation not yet implemented in fallback system');
      }
      
    case 'upscale':
      if (provider === 'replicate') {
        return await replicateUpscaleImage(params, webhookUrl, metadata);
      } else {
        throw new Error('FAL.ai upscaling not yet implemented in fallback system');
      }
      
    default:
      throw new Error(`Unknown generation type: ${type}`);
  }
}

/**
 * Get current provider health status
 */
export function getProviderHealth() {
  return {
    providers: { ...providerStatus },
    primary: PRIMARY_PROVIDER,
    fallback: FALLBACK_PROVIDER,
    fallbackEnabled: USE_FALLBACK,
  };
}

/**
 * Reset provider health status (for testing)
 */
export function resetProviderHealth() {
  Object.values(providerStatus).forEach(status => {
    status.healthy = true;
    status.errorCount = 0;
    status.lastError = undefined;
    status.lastChecked = Date.now();
  });
}

// Export original functions for direct use if needed
export {
  replicateGenerateImage,
  replicateGenerateVideo,
  replicateUpscaleImage,
  falGenerateImage,
};
// AI generation optimization configuration for KlipCam
// Balances quality, speed, and cost for optimal user experience

export interface OptimizationPreset {
  name: string;
  description: string;
  steps: number;
  guidance: number;
  scheduler?: string;
  qualityScore: number;  // 1-10 (10 = highest quality)
  speedScore: number;    // 1-10 (10 = fastest)
  costMultiplier: number; // 1.0 = base cost
}

// Image generation optimization presets
export const IMAGE_OPTIMIZATION_PRESETS: Record<string, OptimizationPreset> = {
  // Ultra-fast for previews and quick tests
  lightning: {
    name: 'Lightning',
    description: 'Fastest generation for previews and testing',
    steps: 4,
    guidance: 1.0,
    scheduler: 'DDPM',
    qualityScore: 6,
    speedScore: 10,
    costMultiplier: 0.5
  },
  
  // Balanced for regular use
  balanced: {
    name: 'Balanced',
    description: 'Optimal balance of quality and speed for most use cases',
    steps: 12,
    guidance: 3.5,
    scheduler: 'DPM++',
    qualityScore: 8,
    speedScore: 7,
    costMultiplier: 1.0
  },
  
  // High quality for premium content
  premium: {
    name: 'Premium',
    description: 'High quality for final content creation',
    steps: 22,
    guidance: 7.5,
    scheduler: 'DDIM',
    qualityScore: 10,
    speedScore: 4,
    costMultiplier: 1.5
  },
  
  // Specialized for social media
  social: {
    name: 'Social',
    description: 'Optimized for social media content',
    steps: 8,
    guidance: 2.5,
    scheduler: 'DPM++',
    qualityScore: 7,
    speedScore: 8,
    costMultiplier: 0.8
  }
};

// Video generation optimization presets
export const VIDEO_OPTIMIZATION_PRESETS: Record<string, OptimizationPreset> = {
  // Quick for previews
  preview: {
    name: 'Preview',
    description: 'Quick generation for video previews',
    steps: 15,
    guidance: 2.0,
    qualityScore: 6,
    speedScore: 9,
    costMultiplier: 0.7
  },
  
  // Standard for regular content
  standard: {
    name: 'Standard',
    description: 'Standard quality for regular video content',
    steps: 25,
    guidance: 3.5,
    qualityScore: 8,
    speedScore: 6,
    costMultiplier: 1.0
  },
  
  // High quality for viral content
  viral: {
    name: 'Viral',
    description: 'High quality for viral and premium video content',
    steps: 35,
    guidance: 5.0,
    qualityScore: 10,
    speedScore: 3,
    costMultiplier: 1.8
  }
};

// Model-specific optimizations
export const MODEL_OPTIMIZATIONS = {
  'flux-dev': {
    optimalSteps: { min: 8, max: 28, recommended: 12 },
    optimalGuidance: { min: 1.0, max: 10.0, recommended: 3.5 },
    supportedSchedulers: ['DDPM', 'DDIM', 'DPM++'],
    maxResolution: 1024,
    aspectRatioOptimal: ['1:1', '3:4', '4:3', '9:16'],
  },
  
  'flux-schnell': {
    optimalSteps: { min: 1, max: 8, recommended: 4 },
    optimalGuidance: { min: 1.0, max: 2.0, recommended: 1.0 },
    supportedSchedulers: ['DDPM'],
    maxResolution: 1024,
    aspectRatioOptimal: ['1:1', '3:4', '9:16'],
  },
  
  'qwen-image': {
    optimalSteps: { min: 20, max: 50, recommended: 24 },
    optimalGuidance: { min: 7.0, max: 12.0, recommended: 7.5 },
    supportedSchedulers: ['DDIM', 'DPM++'],
    maxResolution: 768,
    aspectRatioOptimal: ['1:1', '3:4'],
  }
};

// Dynamic optimization based on user context
export interface OptimizationContext {
  userTier: 'trial' | 'basic' | 'premium';
  contentType: 'preview' | 'draft' | 'final';
  urgency: 'low' | 'normal' | 'high';
  creditBudget?: number;
  qualityPriority: 'speed' | 'balanced' | 'quality';
}

/**
 * Get optimal generation parameters based on context
 */
export function getOptimalParameters(
  model: string,
  context: OptimizationContext,
  generationType: 'image' | 'video' = 'image'
): OptimizationPreset {
  const presets = generationType === 'image' 
    ? IMAGE_OPTIMIZATION_PRESETS 
    : VIDEO_OPTIMIZATION_PRESETS;
  
  // For trial users, always use fastest settings
  if (context.userTier === 'trial') {
    return generationType === 'image' ? presets.lightning : presets.preview;
  }
  
  // For high urgency, prioritize speed
  if (context.urgency === 'high') {
    return generationType === 'image' ? presets.social : presets.preview;
  }
  
  // For preview content, use lighter settings
  if (context.contentType === 'preview') {
    return generationType === 'image' ? presets.lightning : presets.preview;
  }
  
  // For final content with premium users, use best quality
  if (context.contentType === 'final' && context.userTier === 'premium') {
    return generationType === 'image' ? presets.premium : presets.viral;
  }
  
  // Based on quality priority
  switch (context.qualityPriority) {
    case 'speed':
      return generationType === 'image' ? presets.lightning : presets.preview;
    case 'quality':
      return generationType === 'image' ? presets.premium : presets.viral;
    case 'balanced':
    default:
      return generationType === 'image' ? presets.balanced : presets.standard;
  }
}

/**
 * Validate parameters against model capabilities
 */
export function validateParameters(
  model: string, 
  params: { steps: number; guidance: number; width?: number; height?: number }
): { valid: boolean; warnings: string[]; suggestions: Partial<typeof params> } {
  const modelConfig = MODEL_OPTIMIZATIONS[model as keyof typeof MODEL_OPTIMIZATIONS];
  const warnings: string[] = [];
  const suggestions: Partial<typeof params> = {};
  
  if (!modelConfig) {
    return { valid: true, warnings: ['Unknown model - using default validation'], suggestions: {} };
  }
  
  // Validate steps
  if (params.steps < modelConfig.optimalSteps.min) {
    warnings.push(`Steps (${params.steps}) below recommended minimum (${modelConfig.optimalSteps.min})`);
    suggestions.steps = modelConfig.optimalSteps.min;
  } else if (params.steps > modelConfig.optimalSteps.max) {
    warnings.push(`Steps (${params.steps}) above recommended maximum (${modelConfig.optimalSteps.max})`);
    suggestions.steps = modelConfig.optimalSteps.max;
  }
  
  // Validate guidance
  if (params.guidance < modelConfig.optimalGuidance.min) {
    warnings.push(`Guidance (${params.guidance}) below recommended minimum (${modelConfig.optimalGuidance.min})`);
    suggestions.guidance = modelConfig.optimalGuidance.min;
  } else if (params.guidance > modelConfig.optimalGuidance.max) {
    warnings.push(`Guidance (${params.guidance}) above recommended maximum (${modelConfig.optimalGuidance.max})`);
    suggestions.guidance = modelConfig.optimalGuidance.max;
  }
  
  // Validate resolution
  if (params.width && params.height) {
    const maxDimension = Math.max(params.width, params.height);
    if (maxDimension > modelConfig.maxResolution) {
      warnings.push(`Resolution (${maxDimension}px) exceeds model maximum (${modelConfig.maxResolution}px)`);
    }
  }
  
  return {
    valid: warnings.length === 0,
    warnings,
    suggestions
  };
}

/**
 * Calculate estimated generation time and cost
 */
export function estimateGeneration(
  model: string,
  preset: OptimizationPreset,
  dimensions: { width: number; height: number }
): { timeEstimate: number; creditCost: number; qualityScore: number } {
  // Base time estimates (in seconds)
  const baseTimeByModel: Record<string, number> = {
    'flux-dev': 45,
    'flux-schnell': 8,
    'qwen-image': 35,
  };
  
  const baseTime = baseTimeByModel[model] || 30;
  const stepMultiplier = preset.steps / 20; // 20 steps is baseline
  const resolutionMultiplier = (dimensions.width * dimensions.height) / (768 * 768); // 768x768 is baseline
  
  const timeEstimate = Math.round(baseTime * stepMultiplier * resolutionMultiplier);
  const creditCost = Math.ceil(preset.costMultiplier * (model.includes('flux-dev') ? 4 : 1));
  
  return {
    timeEstimate,
    creditCost,
    qualityScore: preset.qualityScore
  };
}

/**
 * Auto-select best model and preset based on requirements
 */
export function autoSelectOptimal(
  requirements: {
    maxTime?: number;      // Max seconds willing to wait
    maxCredits?: number;   // Max credits willing to spend
    minQuality?: number;   // Min quality score required (1-10)
    generationType: 'image' | 'video';
  },
  context: OptimizationContext
): { model: string; preset: OptimizationPreset; reasoning: string[] } {
  const reasoning: string[] = [];
  
  // Start with context-based selection
  let selectedPreset = getOptimalParameters('flux-dev', context, requirements.generationType);
  let selectedModel = 'flux-dev';
  
  // If user has strict time constraints, prefer faster models/presets
  if (requirements.maxTime && requirements.maxTime < 30) {
    selectedModel = 'flux-schnell';
    selectedPreset = requirements.generationType === 'image' 
      ? IMAGE_OPTIMIZATION_PRESETS.lightning 
      : VIDEO_OPTIMIZATION_PRESETS.preview;
    reasoning.push(`Selected fast model (${selectedModel}) due to time constraint (${requirements.maxTime}s)`);
  }
  
  // If user has credit constraints
  if (requirements.maxCredits && requirements.maxCredits < 4) {
    selectedModel = 'qwen-image'; // 1 credit
    selectedPreset = IMAGE_OPTIMIZATION_PRESETS.lightning;
    reasoning.push(`Selected low-cost model due to credit constraint (${requirements.maxCredits} credits)`);
  }
  
  // If user has quality requirements
  if (requirements.minQuality && requirements.minQuality > selectedPreset.qualityScore) {
    if (requirements.generationType === 'image') {
      selectedPreset = IMAGE_OPTIMIZATION_PRESETS.premium;
      selectedModel = 'flux-dev';
    } else {
      selectedPreset = VIDEO_OPTIMIZATION_PRESETS.viral;
    }
    reasoning.push(`Upgraded to ${selectedPreset.name} preset for quality requirement (${requirements.minQuality}/10)`);
  }
  
  if (reasoning.length === 0) {
    reasoning.push(`Selected ${selectedPreset.name} preset based on user context and preferences`);
  }
  
  return {
    model: selectedModel,
    preset: selectedPreset,
    reasoning
  };
}

// Performance tracking for continuous optimization
export interface GenerationPerformance {
  modelUsed: string;
  presetUsed: string;
  actualTime: number;
  userSatisfaction?: number; // 1-5 rating
  errorOccurred: boolean;
  creditsUsed: number;
}

/**
 * Track generation performance for learning and optimization
 */
export function trackPerformance(performance: GenerationPerformance): void {
  // In a real implementation, this would save to analytics/database
  console.log('📊 Performance tracked:', {
    model: performance.modelUsed,
    preset: performance.presetUsed,
    time: performance.actualTime,
    satisfaction: performance.userSatisfaction,
    success: !performance.errorOccurred
  });
}

export default {
  IMAGE_OPTIMIZATION_PRESETS,
  VIDEO_OPTIMIZATION_PRESETS,
  MODEL_OPTIMIZATIONS,
  getOptimalParameters,
  validateParameters,
  estimateGeneration,
  autoSelectOptimal,
  trackPerformance
};
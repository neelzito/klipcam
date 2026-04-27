/**
 * LoRA Workflow Components
 * 
 * Core TypeScript interfaces and utilities for implementing the LoRA user workflow
 * in KlipCam. This module provides the foundation for rapid implementation during
 * the 6-day sprint while maintaining type safety and scalability.
 */

// =============================================
// WORKFLOW STATE MANAGEMENT
// =============================================

export interface LoRAWorkflowState {
  // Training workflow states
  trainingStep: 'discovery' | 'eligibility' | 'upload' | 'review' | 'configure' | 'training' | 'complete';
  
  // Generation workflow states  
  generationStep: 'model-select' | 'preset-select' | 'batch-config' | 'generating' | 'results';
  
  // Management workflow states
  managementView: 'library' | 'analytics' | 'settings';
  
  // Current context
  activeModelId?: string;
  selectedPresets: string[];
  uploadedImages: TrainingImageUpload[];
  validationResults: ImageValidationResult[];
}

export interface TrainingImageUpload {
  id: string;
  file: File;
  preview: string;
  uploadOrder: number;
  status: 'uploading' | 'processing' | 'valid' | 'invalid' | 'error';
  validationResult?: ImageValidationResult;
}

export interface ImageValidationResult {
  isValid: boolean;
  confidence: number;
  issues: ValidationIssue[];
  suggestions: string[];
  faceDetection?: {
    detected: boolean;
    confidence: number;
    boundingBox?: BoundingBox;
  };
  qualityMetrics?: {
    resolution: { width: number; height: number };
    sharpness: number;
    lighting: number;
    diversity: number;
  };
}

export interface ValidationIssue {
  type: 'face_not_detected' | 'low_quality' | 'wrong_aspect' | 'too_similar' | 'nsfw_detected';
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// =============================================
// TRAINING WORKFLOW INTERFACES
// =============================================

export interface LoRATrainingRequest {
  name: string;
  triggerWord?: string; // Auto-generated if not provided
  images: TrainingImageUpload[];
  trainingSettings: TrainingSettings;
  userId: string;
}

export interface TrainingSettings {
  focus: 'balanced' | 'photorealistic' | 'artistic';
  steps: number; // Default: 1000
  learningRate: number; // Default: 0.0001
  batchSize: number; // Default: 1
  resolution: number; // Default: 1024
  autoCaptioning: boolean; // Default: true
}

export interface LoRATrainingJob {
  id: string;
  modelId: string;
  userId: string;
  status: 'queued' | 'preprocessing' | 'training' | 'completed' | 'failed' | 'cancelled';
  progress: TrainingProgress;
  replicateJobId?: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  estimatedCompletionAt?: string;
}

export interface TrainingProgress {
  currentStep: number;
  totalSteps: number;
  percentage: number;
  stage: 'preprocessing' | 'training' | 'finalizing';
  eta: string; // Human readable ETA like "15 minutes"
  milestones: TrainingMilestone[];
}

export interface TrainingMilestone {
  step: number;
  timestamp: string;
  stage: string;
  message: string;
}

// =============================================
// GENERATION WORKFLOW INTERFACES  
// =============================================

export interface LoRAGenerationRequest {
  modelId: string;
  presetId: string;
  params: GenerationParameters;
  batchSettings?: BatchGenerationSettings;
}

export interface GenerationParameters {
  prompt: string;
  aspectRatio: '1:1' | '9:16' | '16:9';
  modelTier: 'base' | 'premium';
  enhancementLevel: number; // 0.5-1.0, controls LoRA influence
  variations: number; // 1-4 variations per generation
}

export interface BatchGenerationSettings {
  presets: string[];
  variationsPerPreset: number;
  totalGenerations: number;
  estimatedCredits: number;
  estimatedTime: string;
}

export interface LoRAGenerationJob {
  id: string;
  userId: string;
  modelId: string;
  batchId?: string; // Groups related generations
  status: 'queued' | 'generating' | 'completed' | 'failed';
  progress: GenerationProgress;
  results: GenerationResult[];
  creditsUsed: number;
  createdAt: string;
  completedAt?: string;
}

export interface GenerationProgress {
  currentJob: number;
  totalJobs: number;
  percentage: number;
  estimatedTimeRemaining: string;
  activeGenerations: ActiveGeneration[];
}

export interface ActiveGeneration {
  presetId: string;
  presetName: string;
  status: 'queued' | 'generating' | 'completed' | 'failed';
  progress: number; // 0-100
  resultUrl?: string;
}

export interface GenerationResult {
  id: string;
  jobId: string;
  presetId: string;
  imageUrl: string;
  thumbnailUrl: string;
  aspectRatio: string;
  creditsUsed: number;
  generatedAt: string;
  userRating?: number; // 1-5 stars for quality feedback
  metadata: {
    prompt: string;
    modelVersion: string;
    enhancementLevel: number;
    seed: number;
  };
}

// =============================================
// MODEL MANAGEMENT INTERFACES
// =============================================

export interface LoRAModelLibrary {
  models: LoRAModelWithStats[];
  totalModels: number;
  activeTrainings: number;
  totalGenerations: number;
  totalCreditsUsed: number;
}

export interface LoRAModelWithStats extends LoRAModel {
  stats: ModelUsageStats;
  recentActivity: ModelActivity[];
  qualityMetrics: ModelQualityMetrics;
}

export interface ModelUsageStats {
  totalGenerations: number;
  creditsUsed: number;
  averageRating: number;
  lastUsedAt?: string;
  popularPresets: PresetUsage[];
  weeklyGenerations: number[];
}

export interface PresetUsage {
  presetId: string;
  presetName: string;
  usageCount: number;
  lastUsed: string;
}

export interface ModelActivity {
  date: string;
  action: 'generated' | 'trained' | 'archived' | 'restored';
  details: string;
  creditsUsed?: number;
}

export interface ModelQualityMetrics {
  successRate: number; // % of generations that completed successfully
  averageRating: number; // User quality ratings 1-5
  consistencyScore: number; // How consistent results are
  promptAdherence: number; // How well it follows prompts
  faceAccuracy: number; // How well it preserves facial features
}

// =============================================
// UI COMPONENT INTERFACES
// =============================================

export interface LoRAUploadComponentProps {
  onImagesUploaded: (images: TrainingImageUpload[]) => void;
  maxImages: number;
  validationRules: ValidationRules;
  isLoading: boolean;
  existingImages?: TrainingImageUpload[];
}

export interface ValidationRules {
  minResolution: { width: number; height: number };
  maxFileSize: number; // bytes
  allowedFormats: string[];
  aspectRatioRange: { min: number; max: number };
  faceDetectionRequired: boolean;
  diversityCheck: boolean;
}

export interface LoRAModelSelectorProps {
  models: LoRAModelWithStats[];
  selectedModelId?: string;
  onModelSelect: (modelId: string) => void;
  showTrainingStatus: boolean;
  showUsageStats: boolean;
}

export interface LoRAPresetGridProps {
  presets: LoRAPreset[];
  selectedModelId: string;
  onPresetSelect: (presetId: string) => void;
  selectedPresets: string[];
  showEnhancementBadge: boolean;
}

export interface LoRAPreset {
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  exampleUrl?: string;
  baseCredits: number;
  loraMultiplier: number; // Credit multiplier for LoRA use
  tags: string[];
  isLoRAOptimized: boolean;
}

export interface TrainingProgressComponentProps {
  job: LoRATrainingJob;
  onCancel: () => void;
  onComplete: (modelId: string) => void;
  showDetailedProgress: boolean;
  enableNotifications: boolean;
}

export interface BatchGenerationComponentProps {
  selectedPresets: string[];
  modelId: string;
  onStart: (request: LoRAGenerationRequest) => void;
  onProgressUpdate: (progress: GenerationProgress) => void;
  creditBalance: number;
}

// =============================================
// WORKFLOW UTILITIES
// =============================================

export class LoRAWorkflowManager {
  private state: LoRAWorkflowState;
  private callbacks: WorkflowCallbacks;

  constructor(initialState: Partial<LoRAWorkflowState>, callbacks: WorkflowCallbacks) {
    this.state = {
      trainingStep: 'discovery',
      generationStep: 'model-select',
      managementView: 'library',
      selectedPresets: [],
      uploadedImages: [],
      validationResults: [],
      ...initialState
    };
    this.callbacks = callbacks;
  }

  // Training workflow methods
  async startTraining(images: TrainingImageUpload[], settings: TrainingSettings): Promise<LoRATrainingJob> {
    this.state.trainingStep = 'training';
    return this.callbacks.onStartTraining(images, settings);
  }

  async validateImages(images: TrainingImageUpload[]): Promise<ImageValidationResult[]> {
    const results = await Promise.all(
      images.map(image => this.callbacks.onValidateImage(image))
    );
    this.state.validationResults = results;
    return results;
  }

  // Generation workflow methods
  async selectModel(modelId: string): Promise<void> {
    this.state.activeModelId = modelId;
    this.state.generationStep = 'preset-select';
    return this.callbacks.onModelSelected(modelId);
  }

  async generateBatch(request: LoRAGenerationRequest): Promise<LoRAGenerationJob> {
    this.state.generationStep = 'generating';
    return this.callbacks.onStartGeneration(request);
  }

  // State management
  getState(): LoRAWorkflowState {
    return { ...this.state };
  }

  updateState(updates: Partial<LoRAWorkflowState>): void {
    this.state = { ...this.state, ...updates };
    this.callbacks.onStateChange(this.state);
  }
}

export interface WorkflowCallbacks {
  onStartTraining: (images: TrainingImageUpload[], settings: TrainingSettings) => Promise<LoRATrainingJob>;
  onValidateImage: (image: TrainingImageUpload) => Promise<ImageValidationResult>;
  onModelSelected: (modelId: string) => Promise<void>;
  onStartGeneration: (request: LoRAGenerationRequest) => Promise<LoRAGenerationJob>;
  onStateChange: (state: LoRAWorkflowState) => void;
}

// =============================================
// VALIDATION UTILITIES
// =============================================

export class LoRAValidator {
  static validateTrainingEligibility(user: any, existingModels: LoRAModel[]): {
    eligible: boolean;
    blockers: ValidationIssue[];
  } {
    const blockers: ValidationIssue[] = [];

    // Check active training limit
    const activeTrainings = existingModels.filter(m => m.status === 'training').length;
    if (activeTrainings >= 1) {
      blockers.push({
        type: 'too_similar', // Reusing type for training limit
        severity: 'error',
        message: 'You already have an active training in progress',
        suggestion: 'Wait for current training to complete or cancel it'
      });
    }

    // Check credit balance
    if (user.credits < 150) {
      blockers.push({
        type: 'low_quality', // Reusing type for credits
        severity: 'error', 
        message: 'Insufficient credits for training (150 required)',
        suggestion: 'Purchase more credits or upgrade subscription'
      });
    }

    return {
      eligible: blockers.filter(b => b.severity === 'error').length === 0,
      blockers
    };
  }

  static validateTrainingImages(images: TrainingImageUpload[]): {
    valid: boolean;
    totalValid: number;
    issues: ValidationIssue[];
  } {
    const issues: ValidationIssue[] = [];
    let validCount = 0;

    images.forEach((image, index) => {
      if (image.validationResult?.isValid) {
        validCount++;
      } else if (image.validationResult?.issues) {
        issues.push(...image.validationResult.issues.map(issue => ({
          ...issue,
          message: `Image ${index + 1}: ${issue.message}`
        })));
      }
    });

    if (validCount < 8) {
      issues.push({
        type: 'low_quality',
        severity: 'error',
        message: `Need at least 8 valid images (currently ${validCount})`,
        suggestion: 'Upload more high-quality selfies with clear face visibility'
      });
    }

    return {
      valid: validCount >= 8,
      totalValid: validCount,
      issues
    };
  }

  static validateGenerationRequest(request: LoRAGenerationRequest, userCredits: number): {
    valid: boolean;
    estimatedCost: number;
    issues: ValidationIssue[];
  } {
    const issues: ValidationIssue[] = [];
    let estimatedCost = 0;

    // Calculate cost based on preset and LoRA multiplier
    const baseCredits = request.params.modelTier === 'premium' ? 4 : 1;
    estimatedCost = baseCredits * 2; // 2x multiplier for LoRA

    if (request.batchSettings) {
      estimatedCost *= request.batchSettings.totalGenerations;
    }

    if (userCredits < estimatedCost) {
      issues.push({
        type: 'low_quality', // Reusing for credits
        severity: 'error',
        message: `Insufficient credits (${estimatedCost} required, ${userCredits} available)`,
        suggestion: 'Reduce variations or upgrade subscription'
      });
    }

    return {
      valid: issues.filter(i => i.severity === 'error').length === 0,
      estimatedCost,
      issues
    };
  }
}

// =============================================
// CREDIT CALCULATION UTILITIES
// =============================================

export class LoRACreditCalculator {
  static calculateTrainingCost(): number {
    return 150; // Fixed training cost
  }

  static calculateGenerationCost(
    baseCredits: number,
    hasLoRA: boolean,
    variations: number = 1
  ): number {
    const multiplier = hasLoRA ? 2 : 1;
    return baseCredits * multiplier * variations;
  }

  static calculateBatchCost(
    presets: LoRAPreset[],
    variationsPerPreset: number
  ): number {
    return presets.reduce((total, preset) => {
      const baseCost = preset.baseCredits * preset.loraMultiplier;
      return total + (baseCost * variationsPerPreset);
    }, 0);
  }

  static estimateMonthlyUsage(
    dailyGenerations: number,
    averageCreditsPerGeneration: number
  ): number {
    return dailyGenerations * averageCreditsPerGeneration * 30;
  }
}

// =============================================
// NOTIFICATION UTILITIES
// =============================================

export interface LoRANotification {
  id: string;
  type: 'training_started' | 'training_progress' | 'training_complete' | 'training_failed' | 
        'generation_complete' | 'credit_low' | 'model_unused';
  title: string;
  message: string;
  actionText?: string;
  actionUrl?: string;
  timestamp: string;
  read: boolean;
}

export class LoRANotificationManager {
  static createTrainingNotification(job: LoRATrainingJob): LoRANotification {
    const notifications: Record<string, Partial<LoRANotification>> = {
      training: {
        type: 'training_progress',
        title: 'AI Model Training In Progress',
        message: `Your model "${job.modelId}" is ${job.progress.percentage}% complete`
      },
      completed: {
        type: 'training_complete',
        title: 'AI Model Ready!',
        message: `Your personal AI model is ready for generation`,
        actionText: 'Start Creating',
        actionUrl: '/generate'
      },
      failed: {
        type: 'training_failed',
        title: 'Training Failed',
        message: 'Your model training encountered an error. Credits have been refunded.',
        actionText: 'Try Again',
        actionUrl: '/lora/train'
      }
    };

    const template = notifications[job.status] || notifications.training;
    
    return {
      id: `training_${job.id}`,
      timestamp: new Date().toISOString(),
      read: false,
      ...template
    } as LoRANotification;
  }

  static createGenerationNotification(job: LoRAGenerationJob): LoRANotification {
    return {
      id: `generation_${job.id}`,
      type: 'generation_complete',
      title: 'Your AI Images Are Ready!',
      message: `Generated ${job.results.length} images using your personal AI model`,
      actionText: 'View Results',
      actionUrl: `/results/${job.id}`,
      timestamp: new Date().toISOString(),
      read: false
    };
  }
}

export default {
  LoRAWorkflowManager,
  LoRAValidator,
  LoRACreditCalculator,
  LoRANotificationManager
};
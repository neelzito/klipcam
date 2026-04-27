/**
 * LoRA API Endpoints Implementation
 * 
 * Next.js API route handlers for LoRA functionality in KlipCam.
 * These endpoints implement the complete LoRA workflow from training
 * to enhanced generation, designed for rapid deployment.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import Replicate from 'replicate';
import { 
  LoRATrainingRequest, 
  LoRAGenerationRequest,
  TrainingImageUpload,
  LoRATrainingJob,
  ValidationIssue
} from '../lora-workflow-components';
import { 
  canStartLoRATraining,
  createLoRAModel,
  chargeLoRATrainingCredits,
  getUserLoRAModels,
  addTrainingImage,
  validateLoRATrainingImages,
  calculateLoRAGenerationCost,
  chargeLoRAGenerationCredits,
  validateLoRAModelName,
  generateTriggerWord
} from '../database/lora-utils';

// =============================================
// LORA TRAINING ENDPOINTS
// =============================================

/**
 * POST /api/lora/train
 * Initiates LoRA model training with uploaded images
 */
export async function trainLoRAModel(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: LoRATrainingRequest = await request.json();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Validate training eligibility
    const eligibilityCheck = await canStartLoRATraining(supabase, userId);
    if (!eligibilityCheck.canStart) {
      return NextResponse.json({ 
        error: eligibilityCheck.reason,
        type: 'eligibility_failed'
      }, { status: 400 });
    }

    // 2. Validate model name
    const nameValidation = validateLoRAModelName(body.name);
    if (!nameValidation.valid) {
      return NextResponse.json({
        error: nameValidation.error,
        type: 'validation_failed'
      }, { status: 400 });
    }

    // 3. Generate trigger word if not provided
    const triggerWord = body.triggerWord || generateTriggerWord(userId, body.name);

    // 4. Create LoRA model record
    const { model, error: createError } = await createLoRAModel(
      supabase,
      userId,
      body.name,
      triggerWord
    );

    if (createError || !model) {
      return NextResponse.json({
        error: createError || 'Failed to create model',
        type: 'database_error'
      }, { status: 500 });
    }

    // 5. Process and validate training images
    const validationResults = await Promise.all(
      body.images.map(async (image, index) => {
        const validation = await validateTrainingImage(image, index);
        
        if (validation.isValid) {
          // Store valid image
          await addTrainingImage(supabase, model.id, {
            original_path: image.preview, // This would be the uploaded S3/Supabase path
            upload_order: index + 1,
            width: validation.metadata?.width || 1024,
            height: validation.metadata?.height || 1024,
            size_bytes: image.file.size,
            face_detection_confidence: validation.faceDetection?.confidence
          });
        }

        return validation;
      })
    );

    // 6. Validate sufficient valid images
    const validImages = validationResults.filter(r => r.isValid);
    if (validImages.length < 8) {
      return NextResponse.json({
        error: `Need at least 8 valid images (got ${validImages.length})`,
        type: 'insufficient_images',
        validationResults
      }, { status: 400 });
    }

    // 7. Charge credits for training
    const { success: creditSuccess, error: creditError } = await chargeLoRATrainingCredits(
      supabase,
      userId,
      model.id
    );

    if (!creditSuccess) {
      return NextResponse.json({
        error: creditError || 'Insufficient credits',
        type: 'payment_failed'
      }, { status: 402 });
    }

    // 8. Start Replicate training job
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN!
    });

    const trainingJob = await replicate.trainings.create(
      "ostris/flux-dev-lora-trainer",
      "4ea33b6e38f6564a48b4a4083b47b2d9c4a5f06b6a5c4d6e7f8a9b0c1d2e3f4a5",
      {
        input: {
          images: validImages.map(img => img.imageUrl).join(','),
          trigger_word: triggerWord,
          steps: body.trainingSettings.steps,
          learning_rate: body.trainingSettings.learningRate,
          batch_size: body.trainingSettings.batchSize,
          resolution: body.trainingSettings.resolution,
          autocaption: body.trainingSettings.autoCaptioning
        },
        webhook: `${process.env.NEXT_PUBLIC_URL}/api/replicate/lora-webhook`
      }
    );

    // 9. Update model with training job ID
    await supabase
      .from('lora_models')
      .update({
        training_job_id: trainingJob.id,
        status: 'training',
        updated_at: new Date().toISOString()
      })
      .eq('id', model.id);

    const response: LoRATrainingJob = {
      id: model.id,
      modelId: model.id,
      userId,
      status: 'training',
      replicateJobId: trainingJob.id,
      startedAt: new Date().toISOString(),
      estimatedCompletionAt: new Date(Date.now() + 45 * 60 * 1000).toISOString(), // 45 min estimate
      progress: {
        currentStep: 0,
        totalSteps: body.trainingSettings.steps,
        percentage: 0,
        stage: 'preprocessing',
        eta: '45 minutes',
        milestones: []
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('LoRA training error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      type: 'server_error'
    }, { status: 500 });
  }
}

/**
 * GET /api/lora/train/status/[jobId]
 * Get training job status and progress
 */
export async function getTrainingStatus(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get model and training job info
    const { data: model, error } = await supabase
      .from('lora_models')
      .select('*, lora_training_progress(*)')
      .eq('id', params.jobId)
      .eq('user_id', userId)
      .single();

    if (error || !model) {
      return NextResponse.json({ error: 'Training job not found' }, { status: 404 });
    }

    // Get Replicate job status if available
    let replicateStatus = null;
    if (model.training_job_id) {
      const replicate = new Replicate({
        auth: process.env.REPLICATE_API_TOKEN!
      });

      try {
        replicateStatus = await replicate.trainings.get(model.training_job_id);
      } catch (replicateError) {
        console.error('Replicate status error:', replicateError);
      }
    }

    const response: LoRATrainingJob = {
      id: model.id,
      modelId: model.id,
      userId: model.user_id,
      status: model.status as any,
      replicateJobId: model.training_job_id,
      startedAt: model.created_at,
      completedAt: model.status === 'ready' ? model.updated_at : undefined,
      progress: {
        currentStep: replicateStatus?.status === 'succeeded' ? 1000 : 
                   replicateStatus?.logs ? parseProgressFromLogs(replicateStatus.logs) : 0,
        totalSteps: 1000,
        percentage: model.status === 'ready' ? 100 : 
                   replicateStatus ? calculateProgressPercentage(replicateStatus) : 0,
        stage: model.status === 'ready' ? 'completed' : 'training',
        eta: estimateTimeRemaining(replicateStatus),
        milestones: model.lora_training_progress?.milestones || []
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Training status error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// =============================================
// ENHANCED GENERATION ENDPOINTS
// =============================================

/**
 * POST /api/lora/generate
 * Generate images using LoRA-enhanced models
 */
export async function generateWithLoRA(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: LoRAGenerationRequest = await request.json();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Validate LoRA model exists and is ready
    const { data: model, error: modelError } = await supabase
      .from('lora_models')
      .select('*')
      .eq('id', body.modelId)
      .eq('user_id', userId)
      .single();

    if (modelError || !model) {
      return NextResponse.json({ 
        error: 'LoRA model not found',
        type: 'model_not_found'
      }, { status: 404 });
    }

    if (model.status !== 'ready') {
      return NextResponse.json({
        error: `LoRA model is ${model.status}, not ready for generation`,
        type: 'model_not_ready'
      }, { status: 400 });
    }

    // 2. Get preset information
    const { data: preset, error: presetError } = await supabase
      .from('presets')
      .select('*')
      .eq('id', body.presetId)
      .single();

    if (presetError || !preset) {
      return NextResponse.json({
        error: 'Preset not found',
        type: 'preset_not_found'
      }, { status: 404 });
    }

    // 3. Calculate generation cost with LoRA multiplier
    const baseCost = body.params.modelTier === 'premium' ? 4 : 1;
    const enhancedCost = await calculateLoRAGenerationCost(
      supabase,
      baseCost,
      true
    );
    
    const totalCost = enhancedCost * (body.params.variations || 1);

    // 4. Charge credits
    const jobId = `lora_gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { success: creditSuccess, error: creditError } = await chargeLoRAGenerationCredits(
      supabase,
      userId,
      jobId,
      totalCost
    );

    if (!creditSuccess) {
      return NextResponse.json({
        error: creditError || 'Insufficient credits',
        type: 'payment_failed',
        requiredCredits: totalCost
      }, { status: 402 });
    }

    // 5. Create generation job record
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        id: jobId,
        user_id: userId,
        type: 'lora_generation',
        status: 'queued',
        params: {
          lora_model_id: body.modelId,
          preset_id: body.presetId,
          ...body.params
        },
        cost_credits: totalCost
      })
      .select()
      .single();

    if (jobError) {
      return NextResponse.json({
        error: 'Failed to create generation job',
        type: 'database_error'
      }, { status: 500 });
    }

    // 6. Start Replicate generation(s)
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN!
    });

    const enhancedPrompt = `${model.trigger_word} ${body.params.prompt}`;
    const generations = [];

    for (let i = 0; i < (body.params.variations || 1); i++) {
      const prediction = await replicate.run(
        `${model.replicate_model_id}:${model.replicate_version_id}`,
        {
          input: {
            prompt: enhancedPrompt,
            width: getWidthForAspectRatio(body.params.aspectRatio),
            height: getHeightForAspectRatio(body.params.aspectRatio),
            guidance_scale: 7.5,
            num_inference_steps: body.params.modelTier === 'premium' ? 50 : 28,
            lora_scale: body.params.enhancementLevel || 0.8,
            seed: Math.floor(Math.random() * 1000000)
          }
        }
      );

      generations.push({
        predictionId: prediction.id,
        variation: i + 1,
        status: 'generating'
      });
    }

    // 7. Update job with prediction IDs
    await supabase
      .from('jobs')
      .update({
        replicate_ids: generations.map(g => g.predictionId),
        status: 'generating',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    // 8. Update LoRA model usage
    await supabase.rpc('update_lora_usage', {
      model_uuid: body.modelId
    });

    return NextResponse.json({
      jobId: jobId,
      modelId: body.modelId,
      status: 'generating',
      generations: generations.length,
      estimatedTime: `${generations.length * 30} seconds`,
      creditsUsed: totalCost
    });

  } catch (error) {
    console.error('LoRA generation error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      type: 'server_error'
    }, { status: 500 });
  }
}

/**
 * POST /api/lora/generate/batch
 * Batch generation with multiple presets
 */
export async function batchGenerateWithLoRA(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { modelId, presets, variationsPerPreset } = body;

    const batchJobs = [];
    
    // Create individual generation jobs for each preset
    for (const presetId of presets) {
      const generationRequest: LoRAGenerationRequest = {
        modelId,
        presetId,
        params: {
          prompt: body.params?.prompt || '',
          aspectRatio: body.params?.aspectRatio || '9:16',
          modelTier: body.params?.modelTier || 'base',
          enhancementLevel: body.params?.enhancementLevel || 0.8,
          variations: variationsPerPreset
        }
      };

      // Use the single generation endpoint
      const response = await generateWithLoRA(
        new NextRequest(request.url, {
          method: 'POST',
          body: JSON.stringify(generationRequest),
          headers: request.headers
        })
      );

      if (response.ok) {
        const jobData = await response.json();
        batchJobs.push(jobData);
      }
    }

    return NextResponse.json({
      batchId: `batch_${Date.now()}`,
      jobs: batchJobs,
      totalGenerations: presets.length * variationsPerPreset,
      estimatedTime: `${batchJobs.length * 2} minutes`
    });

  } catch (error) {
    console.error('Batch generation error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// =============================================
// MODEL MANAGEMENT ENDPOINTS
// =============================================

/**
 * GET /api/lora/models
 * Get user's LoRA models with statistics
 */
export async function getLoRAModels(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { models, error } = await getUserLoRAModels(supabase, userId);
    
    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ models });

  } catch (error) {
    console.error('Get LoRA models error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * PUT /api/lora/models/[modelId]/status
 * Update LoRA model status (archive, restore, etc.)
 */
export async function updateLoRAModelStatus(
  request: NextRequest,
  { params }: { params: { modelId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status } = await request.json();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify ownership
    const { data: model, error: verifyError } = await supabase
      .from('lora_models')
      .select('id')
      .eq('id', params.modelId)
      .eq('user_id', userId)
      .single();

    if (verifyError || !model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    // Update status
    const { error: updateError } = await supabase
      .from('lora_models')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.modelId);

    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to update model status'
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Update LoRA model status error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

async function validateTrainingImage(
  image: TrainingImageUpload, 
  index: number
): Promise<any> {
  // In a real implementation, this would:
  // 1. Check image format and size
  // 2. Run face detection API
  // 3. Check image quality metrics
  // 4. Validate diversity compared to other images
  
  return {
    isValid: true, // Placeholder - implement actual validation
    confidence: 0.95,
    faceDetection: {
      detected: true,
      confidence: 0.95,
      boundingBox: { x: 100, y: 100, width: 300, height: 300 }
    },
    metadata: {
      width: 1024,
      height: 1024
    },
    imageUrl: image.preview // This would be the actual uploaded URL
  };
}

function parseProgressFromLogs(logs: string): number {
  // Parse Replicate training logs to extract current step
  const stepMatch = logs.match(/step (\d+)/gi);
  if (stepMatch && stepMatch.length > 0) {
    const lastStep = stepMatch[stepMatch.length - 1];
    return parseInt(lastStep.match(/\d+/)![0]);
  }
  return 0;
}

function calculateProgressPercentage(replicateJob: any): number {
  if (replicateJob.status === 'succeeded') return 100;
  if (replicateJob.status === 'failed') return 0;
  
  // Parse from logs or use default progression
  const logs = replicateJob.logs || '';
  const currentStep = parseProgressFromLogs(logs);
  return Math.min((currentStep / 1000) * 100, 100);
}

function estimateTimeRemaining(replicateJob: any): string {
  if (!replicateJob) return '45 minutes';
  
  if (replicateJob.status === 'succeeded') return '0 minutes';
  if (replicateJob.status === 'failed') return '0 minutes';
  
  const progress = calculateProgressPercentage(replicateJob);
  const remainingProgress = 100 - progress;
  const estimatedMinutes = Math.ceil((remainingProgress / 100) * 45);
  
  return `${estimatedMinutes} minutes`;
}

function getWidthForAspectRatio(aspectRatio: string): number {
  switch (aspectRatio) {
    case '1:1': return 1024;
    case '9:16': return 768;
    case '16:9': return 1344;
    default: return 1024;
  }
}

function getHeightForAspectRatio(aspectRatio: string): number {
  switch (aspectRatio) {
    case '1:1': return 1024;
    case '9:16': return 1344;
    case '16:9': return 768;
    default: return 1024;
  }
}

export default {
  trainLoRAModel,
  getTrainingStatus,
  generateWithLoRA,
  batchGenerateWithLoRA,
  getLoRAModels,
  updateLoRAModelStatus
};
/**
 * LoRA Database Utility Functions
 * 
 * This module provides comprehensive database utilities for LoRA (Low-Rank Adaptation) 
 * functionality in the KlipCam Creator AI platform. It handles model training lifecycle,
 * image validation, credit management, and generation workflows.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

type SupabaseClient = ReturnType<typeof createClient<Database>>;

// =============================================
// TYPES AND INTERFACES
// =============================================

export interface LoRAModel {
  id: string;
  user_id: string;
  name: string;
  trigger_word: string;
  training_job_id?: string;
  replicate_model_id?: string;
  replicate_version_id?: string;
  status: 'training' | 'ready' | 'failed' | 'archived';
  training_images_count: number;
  generation_count: number;
  training_cost_credits: number;
  last_used_at?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrainingImage {
  id: string;
  lora_model_id: string;
  original_path: string;
  processed_path?: string;
  upload_order: number;
  width: number;
  height: number;
  size_bytes: number;
  face_detection_confidence?: number;
  is_valid: boolean;
  validation_notes?: string;
  created_at: string;
}

export interface LoRATrainingProgress {
  model_id: string;
  user_id: string;
  name: string;
  status: string;
  training_images_count: number;
  uploaded_images: number;
  valid_images: number;
  invalid_image_slots: number[];
  created_at: string;
  job_status?: string;
  job_error?: string;
}

export interface LoRAGenerationOptions {
  model_id: string;
  preset_id: string;
  prompt: string;
  aspect_ratio: '1:1' | '9:16' | '16:9';
  reference_image?: string;
}

// =============================================
// LORA MODEL MANAGEMENT
// =============================================

/**
 * Check if a user can start a new LoRA training (business rule: one training per user)
 */
export async function canStartLoRATraining(
  supabase: SupabaseClient,
  userId: string
): Promise<{ canStart: boolean; reason?: string }> {
  try {
    const { data, error } = await supabase.rpc('can_start_lora_training', {
      user_uuid: userId
    });

    if (error) {
      console.error('Error checking LoRA training eligibility:', error);
      return { canStart: false, reason: 'Database error' };
    }

    if (!data) {
      return { 
        canStart: false, 
        reason: 'You already have an active LoRA training in progress' 
      };
    }

    return { canStart: true };
  } catch (error) {
    console.error('Error checking LoRA training eligibility:', error);
    return { canStart: false, reason: 'Unexpected error' };
  }
}

/**
 * Get all LoRA models for a user with usage statistics
 */
export async function getUserLoRAModels(
  supabase: SupabaseClient,
  userId: string
): Promise<{ models: LoRAModel[]; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_user_lora_models', {
      user_uuid: userId
    });

    if (error) {
      console.error('Error fetching user LoRA models:', error);
      return { models: [], error: 'Failed to fetch LoRA models' };
    }

    return { models: data || [] };
  } catch (error) {
    console.error('Error fetching user LoRA models:', error);
    return { models: [], error: 'Unexpected error' };
  }
}

/**
 * Create a new LoRA model for training
 */
export async function createLoRAModel(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  triggerWord: string
): Promise<{ model?: LoRAModel; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('lora_models')
      .insert({
        user_id: userId,
        name,
        trigger_word: triggerWord,
        status: 'training',
        training_images_count: 0,
        generation_count: 0,
        training_cost_credits: 150
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating LoRA model:', error);
      return { error: 'Failed to create LoRA model' };
    }

    return { model: data };
  } catch (error) {
    console.error('Error creating LoRA model:', error);
    return { error: 'Unexpected error' };
  }
}

/**
 * Update LoRA model status and metadata
 */
export async function updateLoRAModel(
  supabase: SupabaseClient,
  modelId: string,
  updates: Partial<LoRAModel>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('lora_models')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', modelId);

    if (error) {
      console.error('Error updating LoRA model:', error);
      return { success: false, error: 'Failed to update LoRA model' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating LoRA model:', error);
    return { success: false, error: 'Unexpected error' };
  }
}

/**
 * Update LoRA model usage statistics after generation
 */
export async function updateLoRAUsage(
  supabase: SupabaseClient,
  modelId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('update_lora_usage', {
      model_uuid: modelId
    });

    if (error) {
      console.error('Error updating LoRA usage:', error);
      return { success: false, error: 'Failed to update usage statistics' };
    }

    return { success: data };
  } catch (error) {
    console.error('Error updating LoRA usage:', error);
    return { success: false, error: 'Unexpected error' };
  }
}

// =============================================
// TRAINING IMAGES MANAGEMENT
// =============================================

/**
 * Add a training image to a LoRA model
 */
export async function addTrainingImage(
  supabase: SupabaseClient,
  modelId: string,
  imageData: {
    original_path: string;
    upload_order: number;
    width: number;
    height: number;
    size_bytes: number;
    face_detection_confidence?: number;
  }
): Promise<{ image?: TrainingImage; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('lora_training_images')
      .insert({
        lora_model_id: modelId,
        ...imageData,
        is_valid: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding training image:', error);
      return { error: 'Failed to add training image' };
    }

    // Update the model's training images count
    await supabase
      .from('lora_models')
      .update({ 
        training_images_count: imageData.upload_order,
        updated_at: new Date().toISOString()
      })
      .eq('id', modelId);

    return { image: data };
  } catch (error) {
    console.error('Error adding training image:', error);
    return { error: 'Unexpected error' };
  }
}

/**
 * Validate training image (mark as valid/invalid with optional notes)
 */
export async function validateTrainingImage(
  supabase: SupabaseClient,
  imageId: string,
  isValid: boolean,
  validationNotes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('lora_training_images')
      .update({
        is_valid: isValid,
        validation_notes: validationNotes
      })
      .eq('id', imageId);

    if (error) {
      console.error('Error validating training image:', error);
      return { success: false, error: 'Failed to validate image' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error validating training image:', error);
    return { success: false, error: 'Unexpected error' };
  }
}

/**
 * Get training images for a LoRA model
 */
export async function getTrainingImages(
  supabase: SupabaseClient,
  modelId: string
): Promise<{ images: TrainingImage[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('lora_training_images')
      .select('*')
      .eq('lora_model_id', modelId)
      .order('upload_order', { ascending: true });

    if (error) {
      console.error('Error fetching training images:', error);
      return { images: [], error: 'Failed to fetch training images' };
    }

    return { images: data || [] };
  } catch (error) {
    console.error('Error fetching training images:', error);
    return { images: [], error: 'Unexpected error' };
  }
}

/**
 * Validate that a LoRA model has sufficient valid training images
 */
export async function validateLoRATrainingImages(
  supabase: SupabaseClient,
  modelId: string
): Promise<{ isValid: boolean; validCount: number; totalCount: number; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('validate_lora_training_images', {
      model_uuid: modelId
    });

    if (error) {
      console.error('Error validating training images:', error);
      return { isValid: false, validCount: 0, totalCount: 0, error: 'Validation failed' };
    }

    // Also get detailed counts
    const { data: images, error: imagesError } = await supabase
      .from('lora_training_images')
      .select('is_valid')
      .eq('lora_model_id', modelId);

    if (imagesError) {
      console.error('Error getting image counts:', imagesError);
      return { isValid: data, validCount: 0, totalCount: 0 };
    }

    const validCount = images?.filter(img => img.is_valid).length || 0;
    const totalCount = images?.length || 0;

    return { 
      isValid: data, 
      validCount, 
      totalCount 
    };
  } catch (error) {
    console.error('Error validating training images:', error);
    return { isValid: false, validCount: 0, totalCount: 0, error: 'Unexpected error' };
  }
}

// =============================================
// TRAINING PROGRESS AND ANALYTICS
// =============================================

/**
 * Get LoRA training progress for a user
 */
export async function getLoRATrainingProgress(
  supabase: SupabaseClient,
  userId: string
): Promise<{ progress: LoRATrainingProgress[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('lora_training_progress')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching training progress:', error);
      return { progress: [], error: 'Failed to fetch training progress' };
    }

    return { progress: data || [] };
  } catch (error) {
    console.error('Error fetching training progress:', error);
    return { progress: [], error: 'Unexpected error' };
  }
}

/**
 * Get LoRA statistics for a user
 */
export async function getUserLoRAStats(
  supabase: SupabaseClient,
  userId: string
): Promise<{ stats: any; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('user_lora_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is OK
      console.error('Error fetching LoRA stats:', error);
      return { stats: null, error: 'Failed to fetch statistics' };
    }

    return { stats: data };
  } catch (error) {
    console.error('Error fetching LoRA stats:', error);
    return { stats: null, error: 'Unexpected error' };
  }
}

// =============================================
// CREDIT MANAGEMENT FOR LORA
// =============================================

/**
 * Calculate LoRA generation cost with multiplier
 */
export async function calculateLoRAGenerationCost(
  supabase: SupabaseClient,
  baseCost: number,
  hasLoRA: boolean
): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('estimate_lora_generation_cost', {
      base_cost: baseCost,
      has_lora: hasLoRA
    });

    if (error) {
      console.error('Error calculating LoRA generation cost:', error);
      return hasLoRA ? baseCost * 2 : baseCost; // Fallback to 2x multiplier
    }

    return data;
  } catch (error) {
    console.error('Error calculating LoRA generation cost:', error);
    return hasLoRA ? baseCost * 2 : baseCost; // Fallback to 2x multiplier
  }
}

/**
 * Charge credits for LoRA training
 */
export async function chargeLoRATrainingCredits(
  supabase: SupabaseClient,
  userId: string,
  jobId: string,
  trainingCost: number = 150
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('deduct_credits', {
      user_uuid: userId,
      credits_amount: trainingCost,
      job_uuid: jobId,
      transaction_reason: 'lora_training_charge'
    });

    if (error) {
      console.error('Error charging LoRA training credits:', error);
      return { success: false, error: 'Failed to charge credits' };
    }

    if (!data) {
      return { success: false, error: 'Insufficient credits' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error charging LoRA training credits:', error);
    return { success: false, error: 'Unexpected error' };
  }
}

/**
 * Charge credits for LoRA-enhanced generation
 */
export async function chargeLoRAGenerationCredits(
  supabase: SupabaseClient,
  userId: string,
  jobId: string,
  generationCost: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('deduct_credits', {
      user_uuid: userId,
      credits_amount: generationCost,
      job_uuid: jobId,
      transaction_reason: 'lora_generation_charge'
    });

    if (error) {
      console.error('Error charging LoRA generation credits:', error);
      return { success: false, error: 'Failed to charge credits' };
    }

    if (!data) {
      return { success: false, error: 'Insufficient credits' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error charging LoRA generation credits:', error);
    return { success: false, error: 'Unexpected error' };
  }
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Generate a unique trigger word for a LoRA model
 */
export function generateTriggerWord(userName: string, modelName: string): string {
  const sanitized = `${userName}_${modelName}`
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 16);
  
  const timestamp = Date.now().toString(36).slice(-4);
  return `${sanitized}_${timestamp}`;
}

/**
 * Validate LoRA model name
 */
export function validateLoRAModelName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Model name is required' };
  }
  
  if (name.length > 50) {
    return { valid: false, error: 'Model name must be 50 characters or less' };
  }
  
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
    return { valid: false, error: 'Model name can only contain letters, numbers, spaces, hyphens, and underscores' };
  }
  
  return { valid: true };
}

/**
 * Validate training image requirements
 */
export function validateTrainingImageRequirements(
  width: number,
  height: number,
  sizeBytes: number
): { valid: boolean; error?: string } {
  // Minimum resolution requirements
  if (width < 512 || height < 512) {
    return { valid: false, error: 'Image must be at least 512x512 pixels' };
  }
  
  // Maximum file size (10MB)
  if (sizeBytes > 10 * 1024 * 1024) {
    return { valid: false, error: 'Image must be less than 10MB' };
  }
  
  // Aspect ratio should be reasonably square for face training
  const aspectRatio = width / height;
  if (aspectRatio < 0.75 || aspectRatio > 1.33) {
    return { valid: false, error: 'Image should have a roughly square aspect ratio (3:4 to 4:3)' };
  }
  
  return { valid: true };
}

/**
 * Get LoRA-compatible presets
 */
export async function getLoRACompatiblePresets(
  supabase: SupabaseClient
): Promise<{ presets: any[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('presets')
      .select('*')
      .eq('is_active', true)
      .like('id', 'lora-%')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching LoRA presets:', error);
      return { presets: [], error: 'Failed to fetch LoRA presets' };
    }

    return { presets: data || [] };
  } catch (error) {
    console.error('Error fetching LoRA presets:', error);
    return { presets: [], error: 'Unexpected error' };
  }
}

export default {
  // Model management
  canStartLoRATraining,
  getUserLoRAModels,
  createLoRAModel,
  updateLoRAModel,
  updateLoRAUsage,

  // Training images
  addTrainingImage,
  validateTrainingImage,
  getTrainingImages,
  validateLoRATrainingImages,

  // Progress and analytics
  getLoRATrainingProgress,
  getUserLoRAStats,

  // Credit management
  calculateLoRAGenerationCost,
  chargeLoRATrainingCredits,
  chargeLoRAGenerationCredits,

  // Utilities
  generateTriggerWord,
  validateLoRAModelName,
  validateTrainingImageRequirements,
  getLoRACompatiblePresets
};
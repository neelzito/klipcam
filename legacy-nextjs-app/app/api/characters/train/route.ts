import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabaseServer';
import { isDemoMode } from '@/lib/env';
import { FALClient } from '@/lib/falai';

// Credit cost for LoRA training (FAL charges $2, we'll charge equivalent in credits)
const LORA_TRAINING_COST = 50; // 50 credits = ~$2 (assuming $0.04 per credit)

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = requireAuth();

    // Handle demo mode
    if (isDemoMode()) {
      return NextResponse.json({
        success: true,
        message: 'Demo mode - LoRA training simulated',
        jobId: 'demo-lora-training-123',
        estimatedTime: 300 // 5 minutes in demo
      });
    }

    // Parse request body
    const formData = await request.formData();
    const characterName = formData.get('characterName') as string;
    const triggerWord = formData.get('triggerWord') as string;
    const isStyle = formData.get('isStyle') === 'true';
    const steps = parseInt(formData.get('steps') as string) || 1000;

    // Get uploaded files
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('image_') && value instanceof File) {
        files.push(value);
      }
    }

    if (!characterName || !triggerWord) {
      return NextResponse.json({
        error: 'Character name and trigger word are required'
      }, { status: 400 });
    }

    if (files.length < 4) {
      return NextResponse.json({
        error: 'Minimum 4 training images required'
      }, { status: 400 });
    }

    // Get user and check credits
    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .select('credit_balance')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 });
    }

    if (user.credit_balance < LORA_TRAINING_COST) {
      return NextResponse.json({
        error: `Insufficient credits. Need ${LORA_TRAINING_COST} credits for LoRA training.`
      }, { status: 400 });
    }

    // Validate file types and sizes
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({
          error: `Invalid file type: ${file.name}. Only JPEG, PNG, and WebP are allowed.`
        }, { status: 400 });
      }
      if (file.size > maxSize) {
        return NextResponse.json({
          error: `File too large: ${file.name}. Maximum size is 10MB.`
        }, { status: 400 });
      }
    }

    // Deduct credits immediately
    const { error: creditError } = await supabaseServer
      .from('users')
      .update({
        credit_balance: user.credit_balance - LORA_TRAINING_COST,
        total_credits_used: supabaseServer.sql`total_credits_used + ${LORA_TRAINING_COST}`,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_id', userId);

    if (creditError) {
      return NextResponse.json({
        error: 'Failed to deduct credits'
      }, { status: 500 });
    }

    // Record credit transaction
    await supabaseServer
      .from('credits_ledger')
      .insert({
        user_id: userId,
        amount: -LORA_TRAINING_COST,
        type: 'usage',
        description: `LoRA training: ${characterName}`,
        reference_id: `lora_training_${Date.now()}`,
        created_at: new Date().toISOString(),
      });

    try {
      // Upload images to FAL and start training
      const imagesZipUrl = await FALClient.uploadTrainingImages(files);
      
      const trainingRequestId = await FALClient.trainLoRA({
        images_data_url: imagesZipUrl,
        trigger_word: triggerWord,
        is_style: isStyle,
        steps: steps,
        create_masks: true,
      });

      // Create training job record
      const { data: job, error: jobError } = await supabaseServer
        .from('lora_training_jobs')
        .insert({
          user_id: userId,
          character_name: characterName,
          trigger_word: triggerWord,
          is_style: isStyle,
          steps: steps,
          images_count: files.length,
          fal_request_id: trainingRequestId,
          status: 'training',
          credits_cost: LORA_TRAINING_COST,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (jobError) {
        console.error('Failed to create job record:', jobError);
        throw new Error('Failed to create training job record');
      }

      return NextResponse.json({
        success: true,
        jobId: job.id,
        falRequestId: trainingRequestId,
        characterName,
        triggerWord,
        estimatedTime: 600, // 10 minutes estimated
        message: 'LoRA training started successfully'
      });

    } catch (falError) {
      console.error('FAL training error:', falError);
      
      // Refund credits on failure
      await supabaseServer
        .from('users')
        .update({
          credit_balance: user.credit_balance, // Restore original balance
          total_credits_used: supabaseServer.sql`total_credits_used - ${LORA_TRAINING_COST}`,
          updated_at: new Date().toISOString(),
        })
        .eq('clerk_id', userId);

      // Record refund
      await supabaseServer
        .from('credits_ledger')
        .insert({
          user_id: userId,
          amount: LORA_TRAINING_COST,
          type: 'refund',
          description: `LoRA training failed: ${characterName}`,
          reference_id: `lora_training_refund_${Date.now()}`,
          created_at: new Date().toISOString(),
        });

      return NextResponse.json({
        error: 'Failed to start LoRA training. Credits have been refunded.'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('LoRA training API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
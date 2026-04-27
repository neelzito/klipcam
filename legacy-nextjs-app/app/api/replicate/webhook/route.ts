import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSupabaseServiceClient } from '@/lib/supabaseServer';
import { validateWebhookSignature } from '@/lib/replicate';

const webhookSecret = process.env.WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error('Missing WEBHOOK_SECRET environment variable');
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body and signature
    const body = await request.text();
    const headerPayload = headers();
    const signature = headerPayload.get('replicate-signature') || 
                     headerPayload.get('x-replicate-signature') || '';

    // Validate webhook signature
    if (signature && !validateWebhookSignature(body, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const payload = JSON.parse(body);
    const supabase = getSupabaseServiceClient();

    console.log('Received Replicate webhook:', {
      id: payload.id,
      status: payload.status,
      model: payload.model,
    });

    // Extract data from payload
    const predictionId = payload.id;
    const status = payload.status;
    const output = payload.output;
    const error = payload.error;
    const model = payload.model;

    if (!predictionId) {
      console.error('No prediction ID in webhook payload');
      return NextResponse.json(
        { error: 'Missing prediction ID' },
        { status: 400 }
      );
    }

    // Find the job associated with this prediction
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('replicate_prediction_id', predictionId)
      .single();

    if (jobError || !job) {
      console.error('Job not found for prediction:', predictionId);
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Get user information
    const { data: user } = await supabase
      .from('users')
      .select('plan, trial_ends_at')
      .eq('id', job.user_id)
      .single();

    const isTrialUser = user?.plan === 'trial';

    // Handle different prediction statuses
    switch (status) {
      case 'succeeded': {
        await handleSuccessfulPrediction(supabase, job, output, isTrialUser);
        break;
      }

      case 'failed':
      case 'canceled': {
        await handleFailedPrediction(supabase, job, error);
        break;
      }

      case 'starting':
      case 'processing': {
        // Update job status but don't create assets yet
        await supabase
          .from('jobs')
          .update({
            status: status === 'starting' ? 'processing' : 'processing',
            started_at: new Date().toISOString(),
          })
          .eq('id', job.id);
        break;
      }

      default:
        console.log(`Unhandled prediction status: ${status}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Replicate webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleSuccessfulPrediction(
  supabase: any,
  job: any,
  output: any,
  isTrialUser: boolean
) {
  try {
    // Ensure output is an array
    const outputUrls = Array.isArray(output) ? output : [output];
    
    if (!outputUrls.length) {
      throw new Error('No output URLs received');
    }

    // Create asset records for each output
    const assetPromises = outputUrls.map(async (url: string, index: number) => {
      // Generate filename
      const extension = job.type === 'video' ? 'mp4' : 'jpg';
      const filename = `${job.id}-${index + 1}.${extension}`;
      const storagePath = `${job.user_id}/${filename}`;

      // Calculate expiry for trial users
      const expiresAt = isTrialUser 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        : null;

      // Create asset record
      return supabase
        .from('assets')
        .insert({
          user_id: job.user_id,
          job_id: job.id,
          type: job.type === 'video' ? 'video' : 'image',
          filename,
          storage_path: storagePath,
          public_url: url, // Store original Replicate URL
          is_watermarked: isTrialUser,
          expires_at: expiresAt,
          metadata: {
            replicate_url: url,
            model: job.replicate_model,
            generation_params: job.generation_params,
          },
        });
    });

    await Promise.all(assetPromises);

    // Update job as completed
    await supabase
      .from('jobs')
      .update({
        status: 'completed',
        output_urls: outputUrls,
        actual_cost: job.estimated_cost, // For now, actual cost = estimated
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    console.log(`Job ${job.id} completed successfully with ${outputUrls.length} assets`);

    // TODO: Send notification to user (email, push notification, etc.)
    // TODO: Add to processing queue for watermarking if trial user

  } catch (error) {
    console.error('Error handling successful prediction:', error);
    
    // Mark job as failed
    await supabase
      .from('jobs')
      .update({
        status: 'failed',
        error_message: 'Failed to process completed generation',
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id);
  }
}

async function handleFailedPrediction(
  supabase: any,
  job: any,
  error: string
) {
  try {
    // Update job as failed
    await supabase
      .from('jobs')
      .update({
        status: 'failed',
        error_message: error || 'Generation failed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    // Refund credits to user
    await supabase.rpc('add_credits', {
      p_user_id: job.user_id,
      p_amount: job.estimated_cost,
      p_transaction_type: 'refund',
      p_description: `Refund for failed ${job.type} generation (Job: ${job.id})`,
    });

    console.log(`Job ${job.id} failed, refunded ${job.estimated_cost} credits to user ${job.user_id}`);

    // TODO: Send notification to user about failed generation

  } catch (refundError) {
    console.error('Error handling failed prediction:', refundError);
    
    // Even if refund fails, mark job as failed
    await supabase
      .from('jobs')
      .update({
        status: 'failed',
        error_message: error || 'Generation failed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id);
  }
}

// Helper function to determine asset type from job
function getAssetType(jobType: string): 'image' | 'video' {
  return jobType === 'video' ? 'video' : 'image';
}

// Helper function to generate signed download URL
async function generateSignedUrl(supabase: any, storagePath: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('generated')
      .createSignedUrl(storagePath, 3600); // 1 hour expiry

    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error in generateSignedUrl:', error);
    return null;
  }
}
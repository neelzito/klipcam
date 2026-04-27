import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { validateWebhookSignature } from '@/lib/replicate';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-replicate-signature');
    
    // Validate webhook signature (if configured)
    if (signature && process.env.REPLICATE_WEBHOOK_SECRET) {
      const isValid = validateWebhookSignature(
        body, 
        signature, 
        process.env.REPLICATE_WEBHOOK_SECRET
      );
      
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const webhook = JSON.parse(body);
    const { id, status, output, error } = webhook;

    // Find the job with this prediction ID
    const { data: job, error: jobError } = await supabaseServer
      .from('jobs')
      .select('*')
      .eq('replicate_prediction_id', id)
      .single();

    if (jobError || !job) {
      console.error('Job not found:', id, jobError);
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Update job status
    if (status === 'succeeded' && output) {
      // Handle successful generation
      const outputUrls = Array.isArray(output) ? output : [output];
      const actualCost = getActualCost(job.subtype || job.type);

      // Create asset records for generated content
      const assets = [];
      for (let i = 0; i < outputUrls.length; i++) {
        const outputUrl = outputUrls[i];
        const assetId = crypto.randomUUID();
        const filename = `${job.type}_${job.id}_${i + 1}.${getFileExtension(outputUrl)}`;
        
        // Download and store the asset (simplified for demo)
        // In production, you'd download the file and upload to your storage
        const asset = {
          id: assetId,
          user_id: job.user_id,
          job_id: job.id,
          type: job.type,
          filename,
          file_path: outputUrl, // In production, this would be your storage path
          download_url: outputUrl,
          thumbnail_url: job.type === 'video' ? null : outputUrl,
          is_favorite: false,
          is_watermarked: false, // Determine based on user subscription
          download_count: 0,
          created_at: new Date().toISOString()
        };

        assets.push(asset);
      }

      // Insert assets
      if (assets.length > 0) {
        const { error: assetError } = await supabaseServer
          .from('assets')
          .insert(assets);

        if (assetError) {
          console.error('Failed to create assets:', assetError);
        }
      }

      // Update job as completed
      await supabaseServer
        .from('jobs')
        .update({
          status: 'completed',
          output_urls: outputUrls,
          actual_cost: actualCost,
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id);

      // TODO: Deduct credits from user account

    } else if (status === 'failed') {
      // Handle failed generation
      await supabaseServer
        .from('jobs')
        .update({
          status: 'failed',
          error_message: error || 'Generation failed',
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id);

      // TODO: Refund credits to user account
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

function getActualCost(subtype: string): number {
  switch (subtype) {
    case 'spider':
      return 25;
    case 'loop':
    case 'first-last':
      return 20;
    case 'base':
    default:
      return 18;
  }
}

function getFileExtension(url: string): string {
  // Extract file extension from URL
  const parts = url.split('.');
  const lastPart = parts[parts.length - 1];
  const ext = lastPart ? lastPart.split('?')[0] : '';
  return ext || 'mp4';
}
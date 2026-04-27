import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabaseServer';
import { getPrediction } from '@/lib/replicate';

export async function GET(request: NextRequest) {
  try {
    // Verify this is a Vercel Cron request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseServiceClient();
    
    // Find jobs that might be stuck or need status updates
    const { data: stuckJobs, error: fetchError } = await supabase
      .from('jobs')
      .select('id, replicate_prediction_id, status, started_at, created_at')
      .in('status', ['pending', 'processing'])
      .not('replicate_prediction_id', 'is', null)
      .lt('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()); // 30 minutes old

    if (fetchError) {
      console.error('Error fetching stuck jobs:', fetchError);
      throw fetchError;
    }

    let processedCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    if (stuckJobs && stuckJobs.length > 0) {
      for (const job of stuckJobs) {
        try {
          processedCount++;

          if (!job.replicate_prediction_id) {
            continue;
          }

          // Check status with Replicate
          const prediction = await getPrediction(job.replicate_prediction_id);
          
          if (prediction.status !== job.status) {
            // Update job status
            const updates: any = { status: prediction.status };
            
            if (prediction.status === 'processing' && !job.started_at) {
              updates.started_at = new Date().toISOString();
            }
            
            if (['succeeded', 'failed', 'canceled'].includes(prediction.status)) {
              updates.completed_at = new Date().toISOString();
              
              if (prediction.status === 'succeeded' && prediction.output) {
                updates.output_urls = Array.isArray(prediction.output) 
                  ? prediction.output 
                  : [prediction.output];
              }
              
              if (prediction.status === 'failed' && prediction.error) {
                updates.error_message = prediction.error;
                
                // Refund credits for failed jobs
                await supabase.rpc('add_credits', {
                  p_user_id: job.user_id,
                  p_amount: job.estimated_cost,
                  p_transaction_type: 'refund',
                  p_description: `Auto-refund for failed job ${job.id}`,
                });
              }
            }

            const { error: updateError } = await supabase
              .from('jobs')
              .update(updates)
              .eq('id', job.id);

            if (updateError) {
              errors.push(`Failed to update job ${job.id}: ${updateError.message}`);
            } else {
              updatedCount++;
            }
          }

        } catch (error) {
          console.error(`Error processing job ${job.id}:`, error);
          errors.push(`Processing failed for job ${job.id}`);
        }
      }
    }

    // Also check for jobs that are too old and should be marked as failed
    const { data: timeoutJobs, error: timeoutError } = await supabase
      .from('jobs')
      .select('id, user_id, estimated_cost')
      .eq('status', 'processing')
      .lt('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // 1 hour old

    if (!timeoutError && timeoutJobs && timeoutJobs.length > 0) {
      for (const job of timeoutJobs) {
        try {
          // Mark as failed due to timeout
          await supabase
            .from('jobs')
            .update({
              status: 'failed',
              error_message: 'Job timeout - processing took too long',
              completed_at: new Date().toISOString(),
            })
            .eq('id', job.id);

          // Refund credits
          await supabase.rpc('add_credits', {
            p_user_id: job.user_id,
            p_amount: job.estimated_cost,
            p_transaction_type: 'refund',
            p_description: `Timeout refund for job ${job.id}`,
          });

          updatedCount++;
        } catch (error) {
          console.error(`Error timing out job ${job.id}:`, error);
          errors.push(`Timeout processing failed for job ${job.id}`);
        }
      }
    }

    console.log(`Job processing completed: ${processedCount} jobs processed, ${updatedCount} updated`);

    return NextResponse.json({
      success: true,
      processedCount,
      updatedCount,
      timeoutJobsCount: timeoutJobs?.length || 0,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Job processing cron error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Job processing failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Handle POST requests (Vercel crons can be POST)
  return GET(request);
}
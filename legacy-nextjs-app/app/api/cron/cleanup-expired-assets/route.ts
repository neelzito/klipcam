import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    // Verify this is a Vercel Cron request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseServiceClient();
    
    // Find expired trial assets
    const { data: expiredAssets, error: fetchError } = await supabase
      .from('assets')
      .select('id, storage_path, user_id')
      .not('expires_at', 'is', null)
      .lt('expires_at', new Date().toISOString());

    if (fetchError) {
      console.error('Error fetching expired assets:', fetchError);
      throw fetchError;
    }

    let deletedCount = 0;
    const errors: string[] = [];

    // Process each expired asset
    if (expiredAssets && expiredAssets.length > 0) {
      for (const asset of expiredAssets) {
        try {
          // Delete from storage if exists
          if (asset.storage_path) {
            const { error: storageError } = await supabase.storage
              .from('generated')
              .remove([asset.storage_path]);

            if (storageError) {
              console.error(`Storage deletion error for ${asset.id}:`, storageError);
              errors.push(`Storage deletion failed for asset ${asset.id}`);
            }
          }

          // Delete asset record
          const { error: deleteError } = await supabase
            .from('assets')
            .delete()
            .eq('id', asset.id);

          if (deleteError) {
            console.error(`Database deletion error for ${asset.id}:`, deleteError);
            errors.push(`Database deletion failed for asset ${asset.id}`);
          } else {
            deletedCount++;
          }
        } catch (error) {
          console.error(`Error processing asset ${asset.id}:`, error);
          errors.push(`Processing failed for asset ${asset.id}`);
        }
      }
    }

    // Log cleanup results
    console.log(`Asset cleanup completed: ${deletedCount} assets deleted, ${errors.length} errors`);

    return NextResponse.json({
      success: true,
      deletedCount,
      totalProcessed: expiredAssets?.length || 0,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Asset cleanup cron error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Cleanup failed',
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
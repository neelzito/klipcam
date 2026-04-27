import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabaseServer';
import { isDemoMode } from '@/lib/env';
import { 
  generateVideo, 
  generateLoopVideo, 
  generateFirstLastFrameVideo, 
  generateImage, 
  VideoGenerationParams, 
  LoopVideoParams, 
  FirstLastFrameParams, 
  ImageGenerationParams 
} from '@/lib/replicate';
import { storeDevAsset } from '@/lib/devAssetStorage';
import { z } from 'zod';

// Validation schemas
const videoJobSchema = z.object({
  type: z.literal('video'),
  subtype: z.enum(['base', 'spider', 'loop', 'first-last']),
  prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
  aspect_ratio: z.enum(['vertical', 'square', 'landscape']).optional(),
  duration: z.number().optional(),
  fps: z.number().optional(),
  reference_image_url: z.string().optional(),
  image_url: z.string().optional(), // for loop videos
  first_frame_image_url: z.string().optional(), // for first-last videos
  last_frame_image_url: z.string().optional(), // for first-last videos
});

const imageJobSchema = z.object({
  type: z.literal('image'),
  tier: z.enum(['base', 'premium']).optional(),
  prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
  preset_id: z.string().optional(),
  aspect_ratio: z.enum(['portrait', 'square', 'vertical', 'landscape']).optional(),
  reference_image_url: z.string().optional(),
  strength: z.number().min(0).max(1).optional(), // for I2I
  width: z.number().optional(),
  height: z.number().optional(),
  steps: z.number().optional(),
  guidance: z.number().optional(),
  seed: z.number().optional(),
});

const jobSchema = z.union([videoJobSchema, imageJobSchema]);

export async function POST(request: NextRequest) {
  try {
    const { userId } = requireAuth();

    // Handle demo mode
    if (isDemoMode()) {
      return NextResponse.json({
        jobId: 'demo-job-' + Math.random().toString(36).substr(2, 9),
        message: 'Demo mode - job creation simulated',
        status: 'pending'
      });
    }

    const body = await request.json();
    console.log('Jobs API received body:', JSON.stringify(body, null, 2));
    
    const validation = jobSchema.safeParse(body);

    if (!validation.success) {
      console.error('Validation failed:', validation.error.issues);
      return NextResponse.json({
        error: 'Invalid request data',
        details: validation.error.issues
      }, { status: 400 });
    }

    const data = validation.data;

    // Check user credits (simplified for now)
    // TODO: Implement proper credit checking
    const estimatedCost = data.type === 'video' 
      ? getEstimatedVideoCost(data.subtype)
      : getEstimatedImageCost(data.tier || 'base');

    // Skip database insertion for now - just create a mock job for testing
    const mockJobId = `dev-job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('🎯 Skipping database - testing direct FAL generation');

    // Start generation based on type
    let replicateResponse;
    const webhookUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/replicate`;

    try {
      if (data.type === 'video') {
        // Video generation
        if (data.subtype === 'loop' && data.image_url) {
          const params: LoopVideoParams = {
            prompt: data.prompt,
            image_url: data.image_url,
            fps: data.fps || 8,
            resolution: '480p'
          };
          replicateResponse = await generateLoopVideo(params, webhookUrl);
        } else if (data.subtype === 'first-last' && data.first_frame_image_url && data.last_frame_image_url) {
          const params: FirstLastFrameParams = {
            prompt: data.prompt,
            first_frame_image_url: data.first_frame_image_url,
            last_frame_image_url: data.last_frame_image_url,
            fps: data.fps || 8,
            resolution: '480p'
          };
          replicateResponse = await generateFirstLastFrameVideo(params, webhookUrl);
        } else {
          // Traditional video generation (base or spider)
          const params: VideoGenerationParams = {
            prompt: data.prompt,
            aspect_ratio: data.aspect_ratio || 'vertical',
            duration: data.duration || 3,
            fps: data.fps || 10,
            reference_image_url: data.reference_image_url
          };
          replicateResponse = await generateVideo(params, data.subtype === 'spider' ? 'spider' : 'base', webhookUrl);
        }
      } else {
        // Image generation
        let referenceImageUrl = data.reference_image_url;
        
        // Convert relative URLs to full URLs for FAL
        if (referenceImageUrl && referenceImageUrl.startsWith('/')) {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
          referenceImageUrl = `${baseUrl}${referenceImageUrl}`;
        }
        
        const params: ImageGenerationParams = {
          prompt: data.prompt,
          aspect_ratio: data.aspect_ratio || 'portrait',
          reference_image_url: referenceImageUrl,
          strength: data.strength,
          width: data.width,
          height: data.height,
          steps: data.steps,
          guidance: data.guidance,
          seed: data.seed,
        };
        replicateResponse = await generateImage(params, data.tier || 'base', webhookUrl);
      }

      // For testing - return the FAL response directly
      const jobStatus = replicateResponse.status === 'completed' ? 'completed' : 'processing';

      // If generation is completed and we have output, store it in localStorage for library display
      if (jobStatus === 'completed' && replicateResponse.output) {
        try {
          // Extract image URL from FAL response
          let imageUrl = null;
          if (replicateResponse.output.images && replicateResponse.output.images[0]) {
            imageUrl = replicateResponse.output.images[0].url || replicateResponse.output.images[0];
          } else if (replicateResponse.output.url) {
            imageUrl = replicateResponse.output.url;
          } else if (typeof replicateResponse.output === 'string') {
            imageUrl = replicateResponse.output;
          } else if (replicateResponse.output[0]) {
            imageUrl = replicateResponse.output[0].url || replicateResponse.output[0];
          }

          // Create a mock asset for library display
          if (imageUrl) {
            const mockAsset = {
              id: `asset-${mockJobId}`,
              type: data.type,
              filename: `generated-${data.type}-${Date.now()}.${data.type === 'image' ? 'png' : 'mp4'}`,
              download_url: imageUrl,
              thumbnail_url: imageUrl,
              is_favorite: false,
              is_watermarked: false,
              download_count: 0,
              created_at: new Date().toISOString(),
              user_id: userId,
              job: {
                id: mockJobId,
                type: data.type,
                prompt: data.prompt,
                aspect_ratio: data.aspect_ratio,
                estimated_cost: estimatedCost
              }
            };

            // Store the asset for library display
            console.log('🗄️ About to store asset for user:', userId);
            storeDevAsset(userId, mockAsset);
            console.log('🗄️ Asset stored in dev storage for library display');
          }
        } catch (storageError) {
          console.error('Failed to create mock asset:', storageError);
        }
      }

      return NextResponse.json({
        jobId: mockJobId,
        predictionId: replicateResponse.id,
        status: jobStatus,
        estimatedCost,
        output: jobStatus === 'completed' ? replicateResponse.output : undefined,
        message: 'Development mode - database skipped, testing FAL generation'
      });

    } catch (generationError) {
      console.error('Generation error:', generationError);
      
      return NextResponse.json({
        error: 'Failed to start generation: ' + (generationError instanceof Error ? generationError.message : 'Unknown error'),
        jobId: mockJobId
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Job creation error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = requireAuth();

    if (isDemoMode()) {
      return NextResponse.json({
        jobs: [],
        pagination: { page: 1, pages: 1, total: 0 }
      });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    let query = supabaseServer
      .from('jobs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: jobs, error, count } = await query
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({
        error: 'Failed to fetch jobs'
      }, { status: 500 });
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      jobs: jobs || [],
      pagination: {
        page,
        pages: totalPages,
        total: count || 0,
        limit
      }
    });

  } catch (error) {
    console.error('Jobs fetch error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

function getEstimatedVideoCost(subtype: string): number {
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

function getEstimatedImageCost(tier: string): number {
  switch (tier) {
    case 'premium':
      return 4;
    case 'base':
    default:
      return 1;
  }
}
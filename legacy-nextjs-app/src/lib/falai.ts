import * as fal from "@fal-ai/serverless-client";

// Configure FAL client with API key
if (process.env.FAL_API_KEY) {
  fal.config({
    credentials: process.env.FAL_API_KEY,
  });
}

// LoRA Training Types
export interface LoRATrainingInput {
  images_data_url: string; // ZIP file URL with training images
  trigger_word: string; // Unique trigger word for the LoRA
  is_style?: boolean; // Whether this is style training (vs character/object)
  steps?: number; // Training steps (default: 1000, max: 10000)
  create_masks?: boolean; // Whether to create masks (default: true)
}

export interface LoRATrainingResult {
  config_file: {
    url: string;
    content_type: string;
    file_name: string;
    file_size: number;
  };
  diffusers_lora_file: {
    url: string;
    content_type: string;
    file_name: string;
    file_size: number;
  };
  logs: string;
}

export class FALClient {
  /**
   * Start LoRA training with FLUX Fast Training
   */
  static async trainLoRA(input: LoRATrainingInput): Promise<string> {
    try {
      const result = await fal.subscribe("fal-ai/flux-lora-fast-training", {
        input,
        logs: true,
        onQueueUpdate: (update) => {
          console.log("Training queue update:", update);
        },
      });

      return result.requestId;
    } catch (error) {
      console.error("FAL LoRA training error:", error);
      throw error;
    }
  }

  /**
   * Get training status and result
   */
  static async getTrainingStatus(requestId: string): Promise<{
    status: string;
    result?: LoRATrainingResult;
  }> {
    try {
      const status = await fal.queue.status("fal-ai/flux-lora-fast-training", {
        requestId,
      });

      return {
        status: status.status,
        result: status.completed ? status.result : undefined,
      };
    } catch (error) {
      console.error("FAL status check error:", error);
      throw error;
    }
  }

  /**
   * Generate image using trained LoRA
   */
  static async generateWithLoRA(params: {
    prompt: string;
    lora_url: string;
    lora_scale?: number;
    num_inference_steps?: number;
    guidance_scale?: number;
    width?: number;
    height?: number;
    seed?: number;
  }) {
    try {
      const result = await fal.subscribe("fal-ai/flux-lora", {
        input: {
          prompt: params.prompt,
          loras: [
            {
              url: params.lora_url,
              scale: params.lora_scale || 1.0,
            },
          ],
          num_inference_steps: params.num_inference_steps || 28,
          guidance_scale: params.guidance_scale || 3.5,
          width: params.width || 1024,
          height: params.height || 1024,
          seed: params.seed,
        },
      });

      return result;
    } catch (error) {
      console.error("FAL LoRA generation error:", error);
      throw error;
    }
  }

  /**
   * Upload multiple images as ZIP for training
   */
  static async uploadTrainingImages(files: File[]): Promise<string> {
    try {
      // Create ZIP file from images
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Add each image to ZIP
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const arrayBuffer = await file.arrayBuffer();
        const fileName = `training_${i + 1}.${file.name.split('.').pop()}`;
        zip.file(fileName, arrayBuffer);
      }

      // Generate ZIP blob
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipFile = new File([zipBlob], "training_images.zip", {
        type: "application/zip",
      });

      // Upload to FAL storage
      const uploadResult = await fal.storage.upload(zipFile);
      return uploadResult.url;
    } catch (error) {
      console.error("FAL upload error:", error);
      throw error;
    }
  }

  /**
   * Calculate training cost in USD (for credit conversion)
   */
  static calculateTrainingCost(steps: number = 1000): number {
    // Base cost is $2 per training run
    // Steps don't affect pricing according to FAL docs - it's a flat rate
    return 2.0;
  }
}

/**
 * Generate image using FAL.ai FLUX models
 */
export async function generateImage(
  params: {
    prompt: string;
    negative_prompt?: string;
    width?: number;
    height?: number;
    steps?: number;
    guidance?: number;
    seed?: number;
    reference_image_url?: string;
    strength?: number;
  },
  tier: 'base' | 'premium' = 'base',
  webhookUrl?: string,
  metadata?: Record<string, any>
) {
  const model = tier === 'premium' ? 'fal-ai/flux/dev' : 'fal-ai/flux/schnell';
  
  try {
    console.log(`🎨 Starting FAL.ai ${tier} image generation`);
    
    const input: any = {
      prompt: params.prompt,
      image_size: 'landscape_4_3', // Default size, could be made configurable
      num_inference_steps: params.steps || (tier === 'premium' ? 28 : 4),
      guidance_scale: params.guidance || (tier === 'premium' ? 3.5 : 1.0),
      enable_safety_checker: true,
    };
    
    if (params.seed) {
      input.seed = params.seed;
    }
    
    // Add I2I parameters if provided
    if (params.reference_image_url) {
      input.image_url = params.reference_image_url;
      input.strength = params.strength || 0.7;
    }
    
    const result = await fal.subscribe(model, {
      input,
      webhookUrl,
      logs: true,
    });
    
    console.log(`✅ FAL.ai image generation started`);
    
    return {
      id: (result as any).requestId || `fal-${Date.now()}`,
      status: 'processing',
      urls: {},
      model,
      credits: tier === 'premium' ? 4 : 1,
      falResult: result,
    };
  } catch (error: any) {
    console.error('❌ FAL.ai image generation error:', error);
    throw error;
  }
}

export default FALClient;
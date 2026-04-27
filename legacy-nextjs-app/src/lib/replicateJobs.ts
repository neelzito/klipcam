import { getReplicateClient } from "@/lib/replicateClient";
import { env } from "@/lib/env";
import { MODEL_PRIMARY, UNIVERSAL_NEGATIVE_PROMPT } from "@/lib/models/modelAdapter";

type StartImageJobArgs = {
  jobId: string;
  userId: string;
  reservationId: string;
  tier: "base" | "premium";
  params: {
    prompt: string;
    negative_prompt?: string;
    width: number;
    height: number;
    steps: number;
    guidance: number;
    seed?: number;
    reference_image_url?: string;
    strength?: number;
  };
};

export async function startImageJob(args: StartImageJobArgs) {
  const { jobId, userId, reservationId, tier, params } = args;
  const replicate = getReplicateClient();
  const model = tier === "premium" ? MODEL_PRIMARY.imagePremium : MODEL_PRIMARY.imageBase;

  const webhook = `${env.NEXT_PUBLIC_APP_URL}/api/replicate/webhook`;
  const metadata = { jobId, userId, reservationId };

  const input: Record<string, unknown> = {
    prompt: params.prompt,
    negative_prompt: params.negative_prompt ?? UNIVERSAL_NEGATIVE_PROMPT,
    width: params.width,
    height: params.height,
    steps: params.steps,
    guidance: params.guidance,
    seed: params.seed,
  };
  if (params.reference_image_url) {
    input["image"] = params.reference_image_url;
    if (typeof params.strength === "number") input["strength"] = params.strength;
  }

  const prediction = await replicate.predictions.create({
    version: model,
    input,
    webhook,
    webhook_events_filter: ["completed"],
  } as any);

  return prediction;
}

type StartUpscaleJobArgs = {
  jobId: string;
  userId: string;
  reservationId: string;
  imageUrl: string; // source image (signed URL)
  scale: 2 | 4;
};

export async function startUpscaleJob(args: StartUpscaleJobArgs) {
  const { jobId, userId, reservationId, imageUrl, scale } = args;
  const replicate = getReplicateClient();
  const model = MODEL_PRIMARY.upscale;
  const webhook = `${env.NEXT_PUBLIC_APP_URL}/api/replicate/webhook`;

  // real-esrgan parameters
  const input = { image: imageUrl, scale } as Record<string, unknown>;

  const prediction = await replicate.predictions.create({
    version: model,
    input,
    webhook,
    webhook_events_filter: ["completed"],
  } as any);

  return prediction;
}

type StartVideoJobArgs = {
  jobId: string;
  userId: string;
  reservationId: string;
  type: "base" | "spider";
  params: {
    prompt: string;
    aspect_ratio?: string; // "9:16", "16:9", "1:1"
    duration?: number; // seconds
    fps?: number;
    seed?: number;
    reference_image_url?: string; // for I2V
  };
};

export async function startVideoJob(args: StartVideoJobArgs) {
  const { jobId, userId, reservationId, type, params } = args;
  const replicate = getReplicateClient();
  const model = type === "spider" ? MODEL_PRIMARY.viralSpiders : MODEL_PRIMARY.videoBase;

  const webhook = `${env.NEXT_PUBLIC_APP_URL}/api/replicate/webhook`;

  let input: Record<string, unknown>;

  if (type === "spider") {
    // Hailuo-2 spider effect parameters
    input = {
      prompt: params.prompt,
      aspect_ratio: params.aspect_ratio || "9:16",
      seed: params.seed,
    };
    if (params.reference_image_url) {
      input["image"] = params.reference_image_url;
    }
  } else {
    // wan-2.2-t2v-fast parameters
    input = {
      prompt: params.prompt,
      duration_seconds: params.duration || 3,
      aspect_ratio: params.aspect_ratio || "9:16",
      fps: params.fps || 10,
      seed: params.seed,
    };
    if (params.reference_image_url) {
      input["image"] = params.reference_image_url;
    }
  }

  const prediction = await replicate.predictions.create({
    version: model,
    input,
    webhook,
    webhook_events_filter: ["completed"],
  } as any);

  return prediction;
}



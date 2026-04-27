export type CreditOperation =
  | { kind: "image-base"; cost: 1 }
  | { kind: "image-premium"; cost: 4 }
  | { kind: "upscale"; cost: 4 }
  | { kind: "video-base"; cost: 18 }
  | { kind: "spider-effect"; cost: 25 };

export const CREDIT_COSTS = {
  imageBase: 1,
  imagePremium: 4,
  upscale: 4,
  videoBase: 18,
  spider: 25,
} as const;

export function estimateCredits(op: keyof typeof CREDIT_COSTS): number {
  return CREDIT_COSTS[op];
}




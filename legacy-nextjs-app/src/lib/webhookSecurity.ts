import { createHmac, timingSafeEqual } from "crypto";
import { env } from "./env";

/**
 * Verify webhook signature for security
 */
export function verifyWebhookSignature({
  rawBody,
  signature,
  secret,
}: {
  rawBody: string;
  signature: string;
  secret: string;
}): boolean {
  try {
    // Create HMAC signature
    const hmac = createHmac("sha256", secret);
    hmac.update(rawBody);
    const computedSignature = `sha256=${hmac.digest("hex")}`;
    
    // Use crypto.timingSafeEqual for constant-time comparison
    const sigBuffer = Buffer.from(signature);
    const computedBuffer = Buffer.from(computedSignature);
    
    return sigBuffer.length === computedBuffer.length && 
           timingSafeEqual(sigBuffer, computedBuffer);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return false;
  }
}

/**
 * Verify Replicate webhook signature if configured
 */
export function verifyReplicateWebhook(rawBody: string, signature: string): boolean {
  const webhookSecret = process.env.WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn("WEBHOOK_SECRET not configured - skipping signature verification");
    return true; // Allow through if not configured (development)
  }

  if (!signature) {
    console.error("No signature provided in webhook request");
    return false;
  }

  return verifyWebhookSignature({
    rawBody,
    signature,
    secret: webhookSecret,
  });
}

/**
 * Create webhook event deduplication key
 */
export function createEventKey(eventId: string, eventType: string): string {
  return `webhook:${eventType}:${eventId}`;
}
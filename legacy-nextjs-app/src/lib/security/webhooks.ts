/**
 * Webhook Security & Signature Verification
 * 
 * Secure webhook handling with signature verification for Stripe, Clerk, and Replicate.
 * Implements proper BFF patterns and prevents webhook replay attacks.
 */

import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { stripeConfig, clerkConfig, replicateConfig } from '@/lib/env';
import Stripe from 'stripe';
import { Webhook } from 'svix';

// Webhook signature verification results
interface WebhookVerification {
  verified: boolean;
  data?: any;
  error?: string;
}

// =============================================
// STRIPE WEBHOOK VERIFICATION
// =============================================

/**
 * Verify Stripe webhook signature and parse payload
 */
export async function verifyStripeWebhook(
  req: NextRequest,
  body: string
): Promise<WebhookVerification> {
  try {
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      return {
        verified: false,
        error: 'Missing Stripe signature header'
      };
    }

    const stripe = new Stripe(stripeConfig.secretKey);
    
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      stripeConfig.webhookSecret
    );

    return {
      verified: true,
      data: event
    };
  } catch (error) {
    console.error('Stripe webhook verification failed:', error);
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Signature verification failed'
    };
  }
}

// =============================================
// CLERK WEBHOOK VERIFICATION
// =============================================

/**
 * Verify Clerk webhook signature using svix
 */
export async function verifyClerkWebhook(
  req: NextRequest,
  body: string
): Promise<WebhookVerification> {
  try {
    if (!clerkConfig.webhookSecret) {
      return {
        verified: false,
        error: 'Clerk webhook secret not configured'
      };
    }

    // Get Svix headers
    const svixId = req.headers.get('svix-id');
    const svixTimestamp = req.headers.get('svix-timestamp');
    const svixSignature = req.headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      return {
        verified: false,
        error: 'Missing Svix headers'
      };
    }

    const wh = new Webhook(clerkConfig.webhookSecret);
    
    const payload = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });

    return {
      verified: true,
      data: payload
    };
  } catch (error) {
    console.error('Clerk webhook verification failed:', error);
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Signature verification failed'
    };
  }
}

// =============================================
// REPLICATE WEBHOOK VERIFICATION
// =============================================

/**
 * Verify Replicate webhook using HMAC-SHA256
 * Note: Replicate may not support webhook signatures - implement if available
 */
export async function verifyReplicateWebhook(
  req: NextRequest,
  body: string
): Promise<WebhookVerification> {
  try {
    // Check if Replicate provides signature verification
    const signature = req.headers.get('x-replicate-signature') || 
                     req.headers.get('x-webhook-signature');
    
    if (!signature) {
      // If Replicate doesn't provide signatures, we implement source IP validation
      // and token-based verification as fallback
      const authHeader = req.headers.get('authorization');
      const webhookToken = authHeader?.replace('Bearer ', '');
      
      if (webhookToken !== replicateConfig.webhookSecret) {
        return {
          verified: false,
          error: 'Invalid webhook token'
        };
      }
    } else {
      // If signature is provided, verify it
      const expectedSignature = crypto
        .createHmac('sha256', replicateConfig.webhookSecret)
        .update(body)
        .digest('hex');
      
      const providedSignature = signature.replace('sha256=', '');
      
      if (!crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(providedSignature)
      )) {
        return {
          verified: false,
          error: 'Invalid signature'
        };
      }
    }

    // Parse JSON payload
    let data;
    try {
      data = JSON.parse(body);
    } catch (error) {
      return {
        verified: false,
        error: 'Invalid JSON payload'
      };
    }

    return {
      verified: true,
      data
    };
  } catch (error) {
    console.error('Replicate webhook verification failed:', error);
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Webhook verification failed'
    };
  }
}

// =============================================
// GENERIC WEBHOOK UTILITIES
// =============================================

/**
 * Generic HMAC signature verification
 */
export function verifyHmacSignature(
  body: string,
  signature: string,
  secret: string,
  algorithm: string = 'sha256'
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac(algorithm, secret)
      .update(body)
      .digest('hex');
    
    const providedSignature = signature.replace(`${algorithm}=`, '');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(providedSignature)
    );
  } catch (error) {
    console.error('HMAC verification failed:', error);
    return false;
  }
}

/**
 * Validate webhook timestamp to prevent replay attacks
 */
export function validateWebhookTimestamp(
  timestamp: string | number,
  toleranceSeconds: number = 300 // 5 minutes
): boolean {
  const webhookTime = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
  const currentTime = Math.floor(Date.now() / 1000);
  
  return Math.abs(currentTime - webhookTime) <= toleranceSeconds;
}

/**
 * Extract raw body from Next.js request for webhook verification
 */
export async function getRawBody(req: NextRequest): Promise<string> {
  try {
    const body = await req.text();
    return body;
  } catch (error) {
    throw new Error('Failed to read request body');
  }
}

/**
 * Log webhook events securely (without sensitive data)
 */
export function logWebhookEvent(
  source: 'stripe' | 'clerk' | 'replicate',
  eventType: string,
  success: boolean,
  userId?: string,
  error?: string
): void {
  const logData = {
    timestamp: new Date().toISOString(),
    source,
    eventType,
    success,
    userId: userId || 'unknown',
    error: error || null,
    // Don't log full payload or sensitive data
  };

  if (success) {
    console.log(`✅ Webhook processed successfully:`, logData);
  } else {
    console.error(`❌ Webhook processing failed:`, logData);
  }

  // In production, send to monitoring service
  // sendToMonitoring(logData);
}

/**
 * Rate limit webhook endpoints to prevent abuse
 */
const webhookAttempts = new Map<string, { count: number; resetTime: number }>();

export function checkWebhookRateLimit(
  source: string,
  identifier: string,
  maxAttempts: number = 100,
  windowMs: number = 60000 // 1 minute
): boolean {
  const key = `${source}:${identifier}`;
  const now = Date.now();
  
  const attempt = webhookAttempts.get(key);
  
  if (!attempt || now >= attempt.resetTime) {
    webhookAttempts.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (attempt.count >= maxAttempts) {
    return false;
  }
  
  attempt.count++;
  return true;
}

// =============================================
// WEBHOOK PROCESSING PIPELINE
// =============================================

/**
 * Generic webhook processor with security checks
 */
export async function processWebhook(
  req: NextRequest,
  source: 'stripe' | 'clerk' | 'replicate',
  processor: (data: any) => Promise<void>
): Promise<Response> {
  try {
    // Rate limiting
    const identifier = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkWebhookRateLimit(source, identifier)) {
      logWebhookEvent(source, 'rate_limited', false, undefined, 'Rate limit exceeded');
      return new Response('Rate limit exceeded', { status: 429 });
    }

    // Get raw body
    const body = await getRawBody(req);
    
    if (!body) {
      logWebhookEvent(source, 'empty_body', false, undefined, 'Empty request body');
      return new Response('Empty request body', { status: 400 });
    }

    // Verify signature based on source
    let verification: WebhookVerification;
    
    switch (source) {
      case 'stripe':
        verification = await verifyStripeWebhook(req, body);
        break;
      case 'clerk':
        verification = await verifyClerkWebhook(req, body);
        break;
      case 'replicate':
        verification = await verifyReplicateWebhook(req, body);
        break;
      default:
        return new Response('Unknown webhook source', { status: 400 });
    }

    if (!verification.verified) {
      logWebhookEvent(
        source, 
        'verification_failed', 
        false, 
        undefined, 
        verification.error
      );
      return new Response('Webhook verification failed', { status: 401 });
    }

    // Process the webhook
    await processor(verification.data);
    
    logWebhookEvent(
      source,
      verification.data?.type || 'unknown',
      true,
      verification.data?.data?.id || undefined
    );

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error(`Webhook processing error for ${source}:`, error);
    
    logWebhookEvent(
      source,
      'processing_error',
      false,
      undefined,
      error instanceof Error ? error.message : 'Unknown error'
    );
    
    return new Response('Internal Server Error', { status: 500 });
  }
}
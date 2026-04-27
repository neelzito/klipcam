/**
 * Rate Limiting Implementation
 * 
 * Comprehensive rate limiting for API endpoints with different tiers
 * based on user authentication status and subscription plan.
 */

import { NextRequest } from 'next/server';
import { getRateLimitConfig } from '@/lib/env';

// Rate limit storage (in production, use Redis)
interface RateLimitEntry {
  count: number;
  resetTime: number;
  burstCount: number;
  burstResetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configurations for different endpoints
export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  burstMaxRequests?: number;
  keyGenerator?: (req: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// Default rate limit configs by endpoint type
export const rateLimitConfigs = {
  // API endpoints
  'api:generation': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20, // 20 generations per hour
    burstMaxRequests: 5, // 5 in 1 minute burst
  },
  'api:upload': {
    windowMs: 60 * 1000, // 1 minute  
    maxRequests: 10,
    burstMaxRequests: 20,
  },
  'api:auth': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // Login attempts
  },
  'api:webhook': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
  'api:general': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    burstMaxRequests: 100,
  },
  
  // Premium user limits (higher)
  'premium:generation': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 100, // 100 generations per hour
    burstMaxRequests: 10,
  },
  'premium:upload': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    burstMaxRequests: 50,
  },
  'premium:general': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 120,
    burstMaxRequests: 200,
  },
};

/**
 * Generate rate limit key from request
 */
function generateRateLimitKey(
  req: NextRequest, 
  keyType: string,
  customKeyGenerator?: (req: NextRequest) => string
): string {
  if (customKeyGenerator) {
    return `${keyType}:${customKeyGenerator(req)}`;
  }
  
  // Try to get user ID from headers (set by auth middleware)
  const userId = req.headers.get('x-user-id');
  if (userId) {
    return `${keyType}:user:${userId}`;
  }
  
  // Fallback to IP address
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';
  
  return `${keyType}:ip:${ip}`;
}

/**
 * Check and update rate limit for a request
 */
export async function checkRateLimit(
  req: NextRequest,
  configKey: keyof typeof rateLimitConfigs,
  options?: Partial<RateLimitOptions>
): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
}> {
  const config = rateLimitConfigs[configKey];
  const opts: RateLimitOptions = { ...config, ...options };
  
  const key = generateRateLimitKey(req, configKey, opts.keyGenerator);
  const now = Date.now();
  
  // Get or create rate limit entry
  let entry = rateLimitStore.get(key);
  if (!entry) {
    entry = {
      count: 0,
      resetTime: now + opts.windowMs,
      burstCount: 0,
      burstResetTime: now + 60000, // 1 minute burst window
    };
    rateLimitStore.set(key, entry);
  }
  
  // Reset counters if windows have expired
  if (now >= entry.resetTime) {
    entry.count = 0;
    entry.resetTime = now + opts.windowMs;
  }
  
  if (now >= entry.burstResetTime) {
    entry.burstCount = 0;
    entry.burstResetTime = now + 60000;
  }
  
  // Check burst limit first (if configured)
  if (opts.burstMaxRequests && entry.burstCount >= opts.burstMaxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.burstResetTime,
      limit: opts.burstMaxRequests,
    };
  }
  
  // Check main rate limit
  if (entry.count >= opts.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      limit: opts.maxRequests,
    };
  }
  
  // Increment counters
  entry.count++;
  if (opts.burstMaxRequests) {
    entry.burstCount++;
  }
  
  return {
    allowed: true,
    remaining: opts.maxRequests - entry.count,
    resetTime: entry.resetTime,
    limit: opts.maxRequests,
  };
}

/**
 * Create rate limit middleware
 */
export function createRateLimitMiddleware(
  configKey: keyof typeof rateLimitConfigs,
  options?: Partial<RateLimitOptions>
) {
  return async (req: NextRequest) => {
    const result = await checkRateLimit(req, configKey, options);
    
    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
      
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: `Too many requests. Try again in ${retryAfter} seconds.`,
          retryAfter,
          limit: result.limit,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetTime.toString(),
          },
        }
      );
    }
    
    // Add rate limit headers to successful requests
    return null; // Continue to next middleware/handler
  };
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: Response,
  rateLimit: {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    limit: number;
  }
): void {
  response.headers.set('X-RateLimit-Limit', rateLimit.limit.toString());
  response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
  response.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toString());
}

/**
 * Clean up expired rate limit entries (call periodically)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetTime && now >= entry.burstResetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up every 5 minutes
if (typeof process !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}

/**
 * Get user tier for rate limiting
 */
export function getUserRateLimitTier(userPlan?: string): 'premium' | 'basic' {
  return userPlan === 'pro' ? 'premium' : 'basic';
}

/**
 * Get rate limit config key based on endpoint and user tier
 */
export function getRateLimitConfigKey(
  endpoint: 'generation' | 'upload' | 'auth' | 'webhook' | 'general',
  userPlan?: string
): keyof typeof rateLimitConfigs {
  const tier = getUserRateLimitTier(userPlan);
  
  if (tier === 'premium' && endpoint in ['generation', 'upload', 'general']) {
    return `${tier}:${endpoint}` as keyof typeof rateLimitConfigs;
  }
  
  return `api:${endpoint}` as keyof typeof rateLimitConfigs;
}
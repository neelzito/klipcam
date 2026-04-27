// Simple in-memory rate limiter for development
// In production, use Redis or similar for distributed rate limiting

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitStore>();

/**
 * Simple rate limiter
 */
export function rateLimit({
  id,
  limit = 20,
  window = 60 * 1000, // 1 minute in milliseconds
}: {
  id: string;
  limit?: number;
  window?: number;
}): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = `rate_limit:${id}`;
  
  // Clean up expired entries periodically
  if (Math.random() < 0.1) {
    for (const [k, v] of store.entries()) {
      if (now > v.resetTime) {
        store.delete(k);
      }
    }
  }
  
  let record = store.get(key);
  
  if (!record || now > record.resetTime) {
    // Create new record or reset expired one
    record = {
      count: 0,
      resetTime: now + window,
    };
  }
  
  if (record.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }
  
  record.count++;
  store.set(key, record);
  
  return {
    success: true,
    remaining: Math.max(0, limit - record.count),
    resetTime: record.resetTime,
  };
}

/**
 * Rate limit middleware for API routes
 */
export function withRateLimit(
  handler: (req: Request) => Promise<Response>,
  options?: { limit?: number; window?: number }
) {
  return async (req: Request): Promise<Response> => {
    // Extract IP or user ID for rate limiting
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")?.[0]?.trim() || "127.0.0.1" : "127.0.0.1";
    
    const result = rateLimit({
      id: ip,
      limit: options?.limit || 20,
      window: options?.window || 60 * 1000,
    });
    
    if (!result.success) {
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded",
          resetTime: result.resetTime 
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": String(options?.limit || 20),
            "X-RateLimit-Remaining": String(result.remaining),
            "X-RateLimit-Reset": String(Math.ceil(result.resetTime / 1000)),
          },
        }
      );
    }
    
    return handler(req);
  };
}
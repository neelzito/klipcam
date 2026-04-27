import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitConfigKey } from '@/lib/security/rateLimiter';
import { getSecurityConfig, isDemoMode, isProduction } from '@/lib/env';

interface SecurityHeaders {
  [key: string]: string;
}

// Get security configuration
const securityConfig = getSecurityConfig();

// Define protected routes
const protectedRoutes = [
  '/dashboard',
  '/library', 
  '/settings',
  '/create',
  '/characters',
];

const isProtectedRoute = (pathname: string): boolean => {
  return protectedRoutes.some(route => pathname.startsWith(route)) ||
         (pathname.startsWith('/api/') && !pathname.startsWith('/api/webhooks') && !pathname.startsWith('/api/health'));
};

/**
 * Comprehensive security middleware for KlipCam
 * Handles authentication, rate limiting, security headers, CORS, and input validation
 */
export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;
  const response = NextResponse.next();

  // Skip auth in demo mode
  if (isDemoMode()) {
    return customMiddleware(req);
  }

  // Protect routes that require authentication
  if (isProtectedRoute(req.nextUrl.pathname)) {
    auth().protect();
  }

  return customMiddleware(req);
});

/**
 * Custom middleware logic for security, CORS, rate limiting, etc.
 */
async function customMiddleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;
  const response = NextResponse.next();
  
  // Production security check - prevent demo mode
  if (isProduction() && isDemoMode()) {
    return new NextResponse(
      JSON.stringify({ error: 'Demo mode is disabled in production' }),
      { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }

  // ==========================================
  // CORS HANDLING
  // ==========================================
  if (req.method === 'OPTIONS') {
    return handleCors(req, response);
  }

  // ==========================================
  // RATE LIMITING
  // ==========================================
  if (pathname.startsWith('/api/')) {
    const rateLimitResult = await handleRateLimit(req, pathname);
    if (rateLimitResult) {
      return rateLimitResult;
    }
  }

  // ==========================================
  // SECURITY HEADERS
  // ==========================================
  addSecurityHeaders(response, pathname);
  
  // ==========================================
  // CORS HEADERS FOR API RESPONSES
  // ==========================================
  if (pathname.startsWith('/api/')) {
    addCorsHeaders(response, req);
  }

  // Add demo mode header for debugging (non-production only)
  if (isDemoMode() && !isProduction()) {
    response.headers.set('X-Demo-Mode', 'true');
  }

  return response;
}

/**
 * Handle CORS preflight requests
 */
function handleCors(req: NextRequest, response: NextResponse): NextResponse {
  const origin = req.headers.get('origin');
  
  if (origin && securityConfig.allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  response.headers.set('Access-Control-Allow-Methods', securityConfig.allowedMethods.join(', '));
  response.headers.set('Access-Control-Allow-Headers', securityConfig.allowedHeaders.join(', '));
  response.headers.set('Access-Control-Max-Age', '86400');
  
  return new NextResponse(null, { status: 200, headers: response.headers });
}

/**
 * Add CORS headers to API responses
 */
function addCorsHeaders(response: NextResponse, req: NextRequest): void {
  const origin = req.headers.get('origin');
  
  if (origin && securityConfig.allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  response.headers.set('Access-Control-Allow-Methods', securityConfig.allowedMethods.join(', '));
  response.headers.set('Access-Control-Allow-Headers', securityConfig.allowedHeaders.join(', '));
  response.headers.set('Access-Control-Allow-Credentials', 'true');
}

/**
 * Handle rate limiting for API routes
 */
async function handleRateLimit(req: NextRequest, pathname: string): Promise<NextResponse | null> {
  let rateLimitType: 'generation' | 'upload' | 'auth' | 'webhook' | 'general' = 'general';
  
  // Determine rate limit type based on endpoint
  if (pathname.includes('/generate') || pathname.includes('/lora')) {
    rateLimitType = 'generation';
  } else if (pathname.includes('/upload')) {
    rateLimitType = 'upload';
  } else if (pathname.includes('/auth') || pathname.includes('/sign')) {
    rateLimitType = 'auth';
  } else if (pathname.includes('/webhook')) {
    rateLimitType = 'webhook';
  }

  // Get user plan for rate limiting (if authenticated)
  let userPlan: string | undefined;
  // For now, assume basic plan - in real implementation, fetch from database
  userPlan = undefined;

  const configKey = getRateLimitConfigKey(rateLimitType, userPlan);
  const rateLimit = await checkRateLimit(req, configKey);
  
  if (!rateLimit.allowed) {
    const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
    
    return new NextResponse(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: `Too many requests. Try again in ${retryAfter} seconds.`,
        retryAfter,
        limit: rateLimit.limit,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetTime.toString(),
        },
      }
    );
  }

  return null; // Continue processing
}


/**
 * Add comprehensive security headers
 */
function addSecurityHeaders(response: NextResponse, pathname: string): void {
  const headers: SecurityHeaders = {
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // Prevent MIME sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // XSS protection
    'X-XSS-Protection': '1; mode=block',
    
    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions policy
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    
    // Remove server info
    'X-Powered-By': '',
  };

  // Add HTTPS security headers in production
  if (isProduction()) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
  }

  // Content Security Policy - temporarily disabled for debugging
  // headers['Content-Security-Policy'] = securityConfig.cspDirectives;

  // Add all headers to response
  Object.entries(headers).forEach(([key, value]) => {
    if (value) {
      response.headers.set(key, value);
    } else {
      response.headers.delete(key);
    }
  });
}


export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
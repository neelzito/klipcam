/**
 * Secure API Base Class
 * 
 * Base implementation for all API routes with built-in security,
 * authentication, validation, rate limiting, and error handling.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { validateRequestBody, sanitizeText } from './validation';
import { checkRateLimit, getRateLimitConfigKey } from './rateLimiter';
import { isDemoMode } from '@/lib/env';

// API Response wrapper
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  requestId?: string;
  timestamp: string;
}

// API Error types
export enum ApiErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DEMO_LIMITATION = 'DEMO_LIMITATION',
}

// Custom API Error class
export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    public message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// API Route Handler options
interface ApiRouteOptions {
  requireAuth?: boolean;
  rateLimitType?: 'generation' | 'upload' | 'auth' | 'webhook' | 'general';
  validationSchema?: z.ZodSchema;
  allowDemo?: boolean;
}

// Authenticated user context
interface AuthContext {
  userId: string;
  isDemo: boolean;
  userPlan?: string;
}

/**
 * Base API Route Handler Class
 */
export abstract class ApiRouteHandler {
  protected options: ApiRouteOptions;

  constructor(options: ApiRouteOptions = {}) {
    this.options = {
      requireAuth: true,
      rateLimitType: 'general',
      allowDemo: true,
      ...options,
    };
  }

  /**
   * Main request handler with security pipeline
   */
  async handle(req: NextRequest): Promise<NextResponse> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    try {
      // Security pipeline
      await this.checkRateLimit(req);
      const authContext = await this.authenticate(req);
      const validatedData = await this.validateRequest(req);

      // Business logic
      const result = await this.execute(req, authContext, validatedData);

      // Success response
      const response = this.createSuccessResponse(result, requestId);
      this.logRequest(req, authContext, true, Date.now() - startTime);
      
      return response;
    } catch (error) {
      // Error handling
      const errorResponse = this.handleError(error, requestId);
      this.logRequest(req, null, false, Date.now() - startTime, error);
      
      return errorResponse;
    }
  }

  /**
   * Rate limiting check
   */
  private async checkRateLimit(req: NextRequest): Promise<void> {
    if (!this.options.rateLimitType) return;

    const configKey = getRateLimitConfigKey(this.options.rateLimitType);
    const rateLimit = await checkRateLimit(req, configKey);

    if (!rateLimit.allowed) {
      throw new ApiError(
        ApiErrorCode.RATE_LIMITED,
        'Rate limit exceeded',
        429
      );
    }
  }

  /**
   * Authentication and authorization
   */
  private async authenticate(req: NextRequest): Promise<AuthContext | null> {
    if (!this.options.requireAuth) return null;

    // Demo mode handling
    if (isDemoMode()) {
      if (!this.options.allowDemo) {
        throw new ApiError(
          ApiErrorCode.DEMO_LIMITATION,
          'This feature is not available in demo mode',
          403
        );
      }
      return {
        userId: 'demo-user-id',
        isDemo: true,
      };
    }

    // Real authentication
    try {
      const { userId } = auth();
      
      if (!userId) {
        throw new ApiError(
          ApiErrorCode.UNAUTHORIZED,
          'Authentication required',
          401
        );
      }

      return {
        userId,
        isDemo: false,
      };
    } catch (error) {
      throw new ApiError(
        ApiErrorCode.UNAUTHORIZED,
        'Authentication failed',
        401
      );
    }
  }

  /**
   * Request validation
   */
  private async validateRequest(req: NextRequest): Promise<any> {
    if (!this.options.validationSchema) return null;

    try {
      return await validateRequestBody(req, this.options.validationSchema);
    } catch (error) {
      throw new ApiError(
        ApiErrorCode.VALIDATION_ERROR,
        error instanceof Error ? error.message : 'Validation failed',
        400
      );
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create success response
   */
  protected createSuccessResponse<T>(
    data: T,
    requestId: string
  ): NextResponse<ApiResponse<T>> {
    const response: ApiResponse<T> = {
      success: true,
      data,
      requestId,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'X-Request-ID': requestId,
      },
    });
  }

  /**
   * Error handling
   */
  private handleError(error: unknown, requestId: string): NextResponse<ApiResponse> {
    let statusCode = 500;
    let code = ApiErrorCode.INTERNAL_ERROR;
    let message = 'Internal server error';

    if (error instanceof ApiError) {
      statusCode = error.statusCode;
      code = error.code;
      message = error.message;
    } else if (error instanceof z.ZodError) {
      statusCode = 400;
      code = ApiErrorCode.VALIDATION_ERROR;
      message = error.errors[0]?.message || 'Validation error';
    } else if (error instanceof Error) {
      message = error.message;
    }

    // Don't expose internal errors in production
    if (statusCode === 500 && process.env.NODE_ENV === 'production') {
      message = 'Internal server error';
    }

    const response: ApiResponse = {
      success: false,
      error: message,
      code,
      requestId,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { 
      status: statusCode,
      headers: {
        'X-Request-ID': requestId,
      },
    });
  }

  /**
   * Request logging
   */
  private logRequest(
    req: NextRequest,
    authContext: AuthContext | null,
    success: boolean,
    duration: number,
    error?: unknown
  ): void {
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      pathname: new URL(req.url).pathname,
      userId: authContext?.userId || 'anonymous',
      isDemo: authContext?.isDemo || false,
      success,
      duration: `${duration}ms`,
      userAgent: req.headers.get('user-agent'),
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      error: error instanceof Error ? error.message : undefined,
    };

    if (success) {
      console.log('✅ API Request successful:', logData);
    } else {
      console.error('❌ API Request failed:', logData);
    }

    // In production, send to monitoring service
    // this.sendToMonitoring(logData);
  }

  /**
   * Abstract method for business logic implementation
   */
  abstract execute(
    req: NextRequest,
    authContext: AuthContext | null,
    validatedData: any
  ): Promise<any>;
}

/**
 * Utility function to create API route handlers
 */
export function createApiRoute(
  handler: (
    req: NextRequest,
    authContext: AuthContext | null,
    validatedData: any
  ) => Promise<any>,
  options: ApiRouteOptions = {}
) {
  class CustomApiRoute extends ApiRouteHandler {
    async execute(
      req: NextRequest,
      authContext: AuthContext | null,
      validatedData: any
    ) {
      return await handler(req, authContext, validatedData);
    }
  }

  const routeHandler = new CustomApiRoute(options);

  // Return Next.js API route handlers
  return {
    GET: (req: NextRequest) => routeHandler.handle(req),
    POST: (req: NextRequest) => routeHandler.handle(req),
    PUT: (req: NextRequest) => routeHandler.handle(req),
    DELETE: (req: NextRequest) => routeHandler.handle(req),
    PATCH: (req: NextRequest) => routeHandler.handle(req),
  };
}

/**
 * Helper function to create webhook handlers
 */
export function createWebhookRoute(
  handler: (req: NextRequest, data: any) => Promise<any>,
  verifySignature: (req: NextRequest, body: string) => Promise<{ verified: boolean; data?: any; error?: string }>
) {
  return {
    POST: async (req: NextRequest) => {
      try {
        const body = await req.text();
        const verification = await verifySignature(req, body);

        if (!verification.verified) {
          return NextResponse.json(
            { error: 'Webhook verification failed' },
            { status: 401 }
          );
        }

        await handler(req, verification.data);
        return NextResponse.json({ success: true });
      } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }
    },
  };
}

/**
 * Sanitize API response data
 */
export function sanitizeApiResponse<T>(data: T): T {
  if (typeof data === 'string') {
    return sanitizeText(data) as T;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeApiResponse(item)) as T;
  }
  
  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Never expose sensitive fields
      if (['password', 'secret', 'token', 'private_key'].includes(key.toLowerCase())) {
        continue;
      }
      sanitized[key] = sanitizeApiResponse(value);
    }
    return sanitized;
  }
  
  return data;
}
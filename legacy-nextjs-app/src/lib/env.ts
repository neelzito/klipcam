/**
 * Environment Variable Validation & Configuration
 * 
 * Comprehensive validation of all environment variables with runtime checks
 * to prevent production deployments with missing or invalid configuration.
 */

import { z } from 'zod';

// Check if we're in demo mode to make validation less strict
const isInDemoMode = process.env.DEMO_MODE === 'true' || process.env.NEXT_PUBLIC_APP_ENV === 'demo';

// Schema for environment variables with conditional validation based on demo mode
const envSchema = z.object({
  // Application Settings
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_ENV: z.enum(['development', 'staging', 'production', 'demo']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  
  // Security Settings
  NEXTAUTH_SECRET: z.string().min(32).optional(),
  JWT_SECRET: z.string().min(32).optional(),
  
  // Supabase Configuration - More lenient in demo mode
  NEXT_PUBLIC_SUPABASE_URL: isInDemoMode 
    ? z.string().default('https://demo.supabase.co')
    : z.string().url().refine(
        (url) => url.includes('supabase.co') || url.includes('localhost'), 
        { message: 'Invalid Supabase URL format' }
      ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: isInDemoMode 
    ? z.string().default('demo-anon-key-placeholder')
    : z.string().min(100).refine(
        (key) => key.startsWith('eyJ') || key === 'demo-anon-key-placeholder',
        { message: 'Invalid Supabase anon key format' }
      ),
  
  // Supabase Configuration - Server Client (Secret Key)
  SUPABASE_SERVICE_ROLE_KEY: isInDemoMode
    ? z.string().default('demo-service-role-key-placeholder')
    : z.string().min(100).refine(
        (key) => key.startsWith('eyJ') || key === 'demo-service-role-key-placeholder',
        { message: 'Invalid Supabase service role key format' }
      ),
  
  // Clerk Authentication - Optional in demo mode
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: isInDemoMode ? z.string().optional() : z.string().min(20),
  CLERK_SECRET_KEY: isInDemoMode ? z.string().optional() : z.string().min(20),
  CLERK_WEBHOOK_SECRET: z.string().min(20).optional(),
  
  // Stripe Configuration - Optional in demo mode
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: isInDemoMode ? z.string().optional() : z.string().regex(/^pk_(test_|live_)/),
  STRIPE_SECRET_KEY: isInDemoMode ? z.string().optional() : z.string().regex(/^sk_(test_|live_)/),
  STRIPE_WEBHOOK_SECRET: isInDemoMode ? z.string().optional() : z.string().regex(/^whsec_/),
  STRIPE_PRO_PRICE_ID: isInDemoMode ? z.string().optional() : z.string().min(10),
  NEXT_PUBLIC_STRIPE_PRO_PRICE_ID: isInDemoMode ? z.string().optional() : z.string().min(10),
  
  // Replicate AI Services - Optional in demo mode
  REPLICATE_API_TOKEN: isInDemoMode ? z.string().optional() : z.string().regex(/^r8_/),
  WEBHOOK_SECRET: isInDemoMode ? z.string().optional() : z.string().min(32),
  
  // Email Service
  RESEND_API_KEY: z.string().regex(/^re_/).optional(),
  
  // Security Headers
  CSP_DIRECTIVES: z.string().optional(),
  ALLOWED_ORIGINS: z.string().optional(),
  ALLOWED_METHODS: z.string().optional(),
  ALLOWED_HEADERS: z.string().optional(),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(60),
  RATE_LIMIT_BURST_MAX_REQUESTS: z.coerce.number().default(100),
  
  // Demo Mode Control
  DEMO_MODE: z.string().optional(),
  PREVENT_DEMO_MODE: z.string().optional(),
  PRODUCTION_DOMAIN: z.string().optional(),
  
  // Optional Services
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
});

// Type inference from schema
export type Env = z.infer<typeof envSchema>;

// Validate and parse environment variables
function validateEnv(): Env {
  try {
    const env = envSchema.parse(process.env);
    
    // Additional production checks
    if (env.NODE_ENV === 'production') {
      validateProductionSecurity(env);
    }
    
    return env;
  } catch (error) {
    console.error('❌ Invalid environment configuration:');
    
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error(error);
    }
    
    throw new Error('Environment validation failed');
  }
}

// Production security validation
function validateProductionSecurity(env: Env) {
  const errors: string[] = [];
  
  // Prevent demo mode in production
  if (env.PREVENT_DEMO_MODE === 'true' && 
      (env.DEMO_MODE === 'true' || env.NEXT_PUBLIC_APP_ENV === 'demo')) {
    errors.push('Demo mode is not allowed in production');
  }
  
  // Check for development/test keys in production
  if (env.STRIPE_SECRET_KEY.includes('test_')) {
    errors.push('Test Stripe keys detected in production');
  }
  
  if (env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.includes('test_')) {
    errors.push('Test Stripe publishable key detected in production');
  }
  
  if (env.CLERK_SECRET_KEY.includes('test_')) {
    errors.push('Test Clerk keys detected in production');
  }
  
  // Check for placeholder values
  const placeholders = [
    'demo-anon-key-placeholder',
    'demo-service-role-key-placeholder',
    'your-webhook-secret',
    'your-jwt-secret',
    'your-32-character-random-string'
  ];
  
  Object.entries(env).forEach(([key, value]) => {
    if (typeof value === 'string' && placeholders.includes(value)) {
      errors.push(`Placeholder value detected for ${key} in production`);
    }
  });
  
  // Domain validation
  if (env.PRODUCTION_DOMAIN && !env.NEXT_PUBLIC_APP_URL.includes(env.PRODUCTION_DOMAIN)) {
    errors.push('App URL does not match production domain');
  }
  
  if (errors.length > 0) {
    console.error('❌ Production security validation failed:');
    errors.forEach(error => console.error(`  ${error}`));
    throw new Error('Production security validation failed');
  }
}

// Utility functions
export const isDemoMode = () => {
  return process.env.DEMO_MODE === 'true' || process.env.NEXT_PUBLIC_APP_ENV === 'demo';
};

export const isProduction = () => {
  return process.env.NODE_ENV === 'production';
};

export const isDevelopment = () => {
  return process.env.NODE_ENV === 'development';
};

// Get specific environment configs
export const getSecurityConfig = () => ({
  cspDirectives: env.CSP_DIRECTIVES || "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' *.clerk.com *.stripe.com; style-src 'self' 'unsafe-inline' *.googleapis.com; img-src 'self' data: https:; connect-src 'self' *.clerk.com *.supabase.co *.stripe.com *.replicate.com; frame-src 'self' *.stripe.com;",
  allowedOrigins: env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  allowedMethods: env.ALLOWED_METHODS?.split(',') || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: env.ALLOWED_HEADERS?.split(',') || ['Content-Type', 'Authorization', 'X-Requested-With'],
});

export const getRateLimitConfig = () => ({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  burstMaxRequests: env.RATE_LIMIT_BURST_MAX_REQUESTS,
});

// Validate environment on module load
export const env = validateEnv();

// Export individual configs
export const supabaseConfig = {
  url: env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
};

export const clerkConfig = {
  publishableKey: env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'demo-clerk-key',
  secretKey: env.CLERK_SECRET_KEY || 'demo-clerk-secret',
  webhookSecret: env.CLERK_WEBHOOK_SECRET,
};

export const stripeConfig = {
  publishableKey: env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_demo',
  secretKey: env.STRIPE_SECRET_KEY || 'sk_test_demo',
  webhookSecret: env.STRIPE_WEBHOOK_SECRET || 'whsec_demo',
  proPriceId: env.STRIPE_PRO_PRICE_ID || 'price_demo',
};

export const replicateConfig = {
  apiToken: env.REPLICATE_API_TOKEN || 'r8_demo',
  webhookSecret: env.WEBHOOK_SECRET || 'demo-webhook-secret',
};

// Export for startup checks
export { validateEnv };
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  reactStrictMode: true,
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), ambient-light-sensor=()',
          },
        ],
      },
    ];
  },
  
  // Environment variable validation
  env: {
    // Expose only necessary env vars to client
  },
  
  // Disable server info
  poweredByHeader: false,
  
  // Image optimization security
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'replicate.delivery',
        pathname: '/**',
      },
    ],
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Build-time security checks
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add security checks during build
    if (!dev) {
      // Ensure production environment variables are set
      const requiredEnvVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
        'CLERK_SECRET_KEY',
        'STRIPE_SECRET_KEY',
        'REPLICATE_API_TOKEN',
      ];
      
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        throw new Error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
      }
      
      // Check for test keys in production
      if (process.env.NODE_ENV === 'production') {
        if (process.env.STRIPE_SECRET_KEY?.includes('test_')) {
          throw new Error('❌ Test Stripe keys detected in production build');
        }
        
        if (process.env.CLERK_SECRET_KEY?.includes('test_')) {
          throw new Error('❌ Test Clerk keys detected in production build');
        }
      }
    }
    
    return config;
  },
  
  // Redirect configuration
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/health',
        permanent: false,
      },
    ];
  },
  
  // TypeScript configuration
  typescript: {
    // Fail build on TypeScript errors
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    // Fail build on ESLint errors
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;



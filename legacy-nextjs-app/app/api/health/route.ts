import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: 'healthy' | 'unhealthy' | 'unknown';
    replicate: 'healthy' | 'unhealthy' | 'unknown';
  };
  performance: {
    memoryUsage: NodeJS.MemoryUsage;
    responseTime: number;
  };
}

export async function GET(): Promise<NextResponse<HealthCheck>> {
  const startTime = Date.now();
  
  try {
    // Check database connectivity
    let databaseStatus: 'healthy' | 'unhealthy' | 'unknown' = 'unknown';
    try {
      const supabase = getSupabaseServiceClient();
      await supabase.from('users').select('id').limit(1);
      databaseStatus = 'healthy';
    } catch (error) {
      console.error('Database health check failed:', error);
      databaseStatus = 'unhealthy';
    }

    // Check Replicate API (optional - might be slow)
    let replicateStatus: 'healthy' | 'unhealthy' | 'unknown' = 'unknown';
    try {
      // Only check if we have the API token
      if (process.env.REPLICATE_API_TOKEN) {
        replicateStatus = 'healthy'; // Skip actual API call for performance
      }
    } catch (error) {
      console.error('Replicate health check failed:', error);
      replicateStatus = 'unhealthy';
    }

    const responseTime = Date.now() - startTime;
    const overallStatus = databaseStatus === 'healthy' ? 'healthy' : 'unhealthy';

    const healthCheck: HealthCheck = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: databaseStatus,
        replicate: replicateStatus,
      },
      performance: {
        memoryUsage: process.memoryUsage(),
        responseTime,
      },
    };

    const statusCode = overallStatus === 'healthy' ? 200 : 503;
    
    return NextResponse.json(healthCheck, { status: statusCode });

  } catch (error) {
    console.error('Health check error:', error);
    
    const errorHealthCheck: HealthCheck = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'unhealthy',
        replicate: 'unknown',
      },
      performance: {
        memoryUsage: process.memoryUsage(),
        responseTime: Date.now() - startTime,
      },
    };

    return NextResponse.json(errorHealthCheck, { status: 503 });
  }
}
# KlipCam DevOps & Deployment Guide

This document provides comprehensive DevOps practices, deployment strategies, and operational procedures for KlipCam, a Creator AI platform built on Next.js with Supabase, Clerk, Stripe, and Replicate integrations.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Environment Strategy](#environment-strategy)
3. [CI/CD Pipeline](#cicd-pipeline)
4. [Infrastructure as Code](#infrastructure-as-code)
5. [Monitoring & Alerting](#monitoring--alerting)
6. [Security & Secrets Management](#security--secrets-management)
7. [Database Operations](#database-operations)
8. [Disaster Recovery](#disaster-recovery)
9. [Performance Optimization](#performance-optimization)
10. [Operational Procedures](#operational-procedures)

## Architecture Overview

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel CDN    │    │   Clerk Auth    │    │   Stripe API    │
│   (Static)      │    │   (Identity)    │    │   (Payments)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Vercel Edge Runtime                          │
│                  (Next.js App Router)                          │
├─────────────────────────────────────────────────────────────────┤
│  API Routes: /api/jobs, /api/assets, /api/webhooks             │
│  - Credit validation & job queue management                    │
│  - Webhook processing (Replicate, Stripe)                     │
│  - Asset management with signed URLs                          │
└─────────────────────────────────────────────────────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Supabase DB    │    │ Supabase Store  │    │  Replicate AI   │
│  (PostgreSQL)   │    │   (Assets)      │    │   (Models)      │
│  - Users        │    │ - Generated     │    │ - Image Gen     │
│  - Jobs         │    │   Content       │    │ - Video Gen     │
│  - Credits      │    │ - LoRA Models   │    │ - LoRA Training │
│  - Assets       │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Components
- **Frontend**: Next.js 14+ with App Router, Tailwind CSS
- **Authentication**: Clerk with Google/Apple social logins
- **Database**: Supabase PostgreSQL with Row Level Security
- **Storage**: Supabase Storage for assets and LoRA models
- **Payments**: Stripe with webhooks for subscriptions
- **AI Processing**: Replicate for model execution
- **Hosting**: Vercel with global CDN
- **Monitoring**: Built-in Vercel Analytics + Custom metrics

## Environment Strategy

### Environment Separation
We maintain three environments with clear boundaries:

#### 1. Development (Local)
- **Purpose**: Local development and testing
- **Database**: Local Supabase instance or development project
- **Domain**: localhost:3000
- **AI Models**: Replicate development account with quotas
- **Payments**: Stripe test mode only

#### 2. Staging (Preview)
- **Purpose**: Feature validation and QA testing
- **Database**: Staging Supabase project (isolated)
- **Domain**: staging-klipcam.vercel.app
- **AI Models**: Replicate with staging webhook endpoints
- **Payments**: Stripe test mode with realistic scenarios

#### 3. Production
- **Purpose**: Live user-facing environment
- **Database**: Production Supabase with backups
- **Domain**: klipcam.com (custom domain)
- **AI Models**: Production Replicate with monitoring
- **Payments**: Stripe live mode with full compliance

### Environment Configuration Matrix

| Service | Development | Staging | Production |
|---------|-------------|---------|------------|
| **Vercel** | Local dev server | Auto-deploy from PR | Deploy from main branch |
| **Supabase** | dev-klipcam | staging-klipcam | prod-klipcam |
| **Clerk** | Development instance | Test instance | Production instance |
| **Stripe** | Test mode | Test mode | Live mode |
| **Replicate** | Development quota | Staging quota | Production tier |
| **Monitoring** | Console logs | Basic alerts | Full monitoring |

## CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/main.yml
name: KlipCam CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run linting
        run: npm run lint
      
      - name: Run unit tests
        run: npm run test
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.STAGING_SUPABASE_ANON_KEY }}

  build-preview:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
      
      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Build Project Artifacts
        run: vercel build --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Deploy to Preview
        run: vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }}

  deploy-production:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
      
      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Build Project Artifacts
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Deploy to Production
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Run database migrations
        run: npm run migrate:prod
        env:
          DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.PROD_SUPABASE_SERVICE_ROLE_KEY }}
      
      - name: Notify deployment success
        uses: 8398a7/action-slack@v3
        with:
          status: success
          text: "🚀 KlipCam deployed successfully to production"
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run npm audit
        run: npm audit --audit-level high
      
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

### Database Migration Strategy
```bash
# migrations/run-migration.js
const { createClient } = require('@supabase/supabase-js');

async function runMigration(migrationFile) {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: require(`./sql/${migrationFile}`)
  });
  
  if (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
  
  console.log('Migration completed successfully');
}
```

### Deployment Gates
1. **All tests must pass** (unit + integration)
2. **Security scan must pass** (no high-severity vulnerabilities)
3. **Type checking must pass** (TypeScript strict mode)
4. **Manual approval required** for production deployments
5. **Database migration validation** before deployment
6. **Webhook endpoint verification** post-deployment

## Infrastructure as Code

### Vercel Configuration
```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm ci",
  "regions": ["iad1", "sfo1", "fra1"],
  "functions": {
    "app/api/jobs/route.ts": {
      "maxDuration": 30
    },
    "app/api/replicate/webhook/route.ts": {
      "maxDuration": 60
    },
    "app/api/stripe/webhook/route.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-store, max-age=0"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/health",
      "destination": "/api/health"
    }
  ]
}
```

### Environment Variables Configuration
```bash
# .env.production (managed in Vercel dashboard)
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://prod-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...

# Server-side secrets (Vercel environment variables)
DATABASE_URL=postgresql://postgres:...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
CLERK_SECRET_KEY=sk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
REPLICATE_API_TOKEN=r8_...
WEBHOOK_SECRET=your_webhook_secret_key

# Monitoring & alerts
SENTRY_DSN=https://...
SLACK_WEBHOOK_URL=https://hooks.slack.com...
```

### Supabase Configuration (Terraform)
```hcl
# terraform/supabase.tf
resource "supabase_project" "klipcam" {
  organization_id = var.supabase_org_id
  name           = "klipcam-${var.environment}"
  database_password = var.database_password
  region         = "us-east-1"
  
  # Enable required features
  settings = {
    api_keys_enabled = true
    realtime_enabled = true
    storage_enabled  = true
  }
}

resource "supabase_storage_bucket" "generated" {
  project_ref = supabase_project.klipcam.id
  name        = "generated"
  public      = false
  
  cors_rules = [
    {
      allowed_origins  = ["https://klipcam.com"]
      allowed_methods  = ["GET", "PUT", "POST", "DELETE"]
      allowed_headers  = ["*"]
      max_age_seconds  = 3600
    }
  ]
}
```

## Monitoring & Alerting

### Monitoring Stack Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel        │    │   Supabase      │    │   Replicate     │
│   Analytics     │    │   Dashboard     │    │   Monitoring    │
│   - Runtime     │    │   - DB Metrics  │    │   - Job Status  │
│   - Functions   │    │   - Storage     │    │   - Queue Time  │
│   - Edge CDN    │    │   - Auth        │    │   - Error Rate  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DataDog/Custom Dashboard                    │
│  - Application Performance Monitoring (APM)                    │
│  - Business Metrics (credits, jobs, revenue)                   │
│  - System Health (latency, errors, throughput)                 │
│  - Alert Management & Incident Response                        │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Slack       │    │    PagerDuty    │    │     Email       │
│   Notifications │    │   Escalation    │    │    Alerts       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Metrics & Alerts

#### Business Metrics
- **Daily Active Users (DAU)**: Track user engagement
- **Credit Consumption Rate**: Monitor AI usage patterns
- **Revenue Metrics**: Track MRR, churn, LTV
- **Job Success Rate**: AI generation reliability
- **Average Generation Time**: User experience metric

#### Technical Metrics
- **API Response Time**: P95 < 2s, P99 < 5s
- **Error Rate**: < 1% for critical endpoints
- **Database Performance**: Query time P95 < 500ms
- **Storage Usage**: Track asset storage growth
- **Webhook Delivery Rate**: 99%+ success rate

#### Alert Configuration
```yaml
# alerts/config.yml
alerts:
  critical:
    - name: "High Error Rate"
      condition: "error_rate > 5%"
      duration: "5m"
      channels: ["pagerduty", "slack"]
    
    - name: "Database Connection Pool"
      condition: "db_connections > 80%"
      duration: "2m"
      channels: ["pagerduty", "slack"]
    
    - name: "Credit System Failure"
      condition: "credit_errors > 10/hour"
      duration: "1m"
      channels: ["pagerduty", "slack"]
  
  warning:
    - name: "High Response Time"
      condition: "response_time_p95 > 3s"
      duration: "10m"
      channels: ["slack"]
    
    - name: "Queue Backlog"
      condition: "pending_jobs > 100"
      duration: "15m"
      channels: ["slack"]
```

### Custom Monitoring Implementation
```typescript
// lib/monitoring.ts
import { createClient } from '@supabase/supabase-js';

class MetricsCollector {
  private supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  async trackJobMetrics() {
    const { data: metrics } = await this.supabase
      .from('jobs')
      .select('status, created_at, updated_at, type')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString());
    
    const successRate = metrics?.filter(j => j.status === 'completed').length / (metrics?.length || 1);
    const avgProcessingTime = this.calculateAvgProcessingTime(metrics);
    
    await this.sendMetric('job_success_rate', successRate);
    await this.sendMetric('avg_processing_time', avgProcessingTime);
  }
  
  async trackBusinessMetrics() {
    const { data: users } = await this.supabase
      .from('users')
      .select('plan, credit_balance, created_at')
      .gte('created_at', new Date(Date.now() - 86400000).toISOString());
    
    const dau = users?.length || 0;
    const activeSubscribers = users?.filter(u => u.plan === 'pro').length || 0;
    const avgCreditsRemaining = users?.reduce((sum, u) => sum + u.credit_balance, 0) / (users?.length || 1);
    
    await this.sendMetric('daily_active_users', dau);
    await this.sendMetric('active_subscribers', activeSubscribers);
    await this.sendMetric('avg_credits_remaining', avgCreditsRemaining);
  }
  
  private async sendMetric(name: string, value: number) {
    // Send to DataDog, CloudWatch, or custom endpoint
    console.log(`Metric: ${name} = ${value}`);
  }
}
```

### Health Check Endpoints
```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || 'unknown',
    checks: {
      database: await checkDatabase(),
      replicate: await checkReplicate(),
      stripe: await checkStripe(),
      storage: await checkStorage(),
    }
  };
  
  const isHealthy = Object.values(checks.checks).every(check => check.status === 'healthy');
  
  return NextResponse.json(checks, { 
    status: isHealthy ? 200 : 503 
  });
}

async function checkDatabase() {
  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { error } = await supabase.from('users').select('count').limit(1);
    return { status: error ? 'unhealthy' : 'healthy', latency: Date.now() };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}
```

## Security & Secrets Management

### Security Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                        Security Layers                         │
├─────────────────────────────────────────────────────────────────┤
│  1. Edge Security (Vercel)                                     │
│     - DDoS protection, Rate limiting, WAF                      │
├─────────────────────────────────────────────────────────────────┤
│  2. Application Security                                        │
│     - Clerk authentication, CSRF protection                    │
│     - Input validation, SQL injection prevention               │
├─────────────────────────────────────────────────────────────────┤
│  3. API Security                                               │
│     - Webhook signature validation                             │
│     - API rate limiting per user/endpoint                      │
├─────────────────────────────────────────────────────────────────┤
│  4. Database Security                                          │
│     - Row Level Security (RLS)                                 │
│     - Encrypted connections, Backup encryption                 │
├─────────────────────────────────────────────────────────────────┤
│  5. Storage Security                                           │
│     - Signed URLs with expiration                              │
│     - Access policies, Content type validation                 │
└─────────────────────────────────────────────────────────────────┘
```

### Secrets Management Strategy
```typescript
// lib/secrets.ts
interface SecretConfig {
  development: string;
  staging: string;
  production: string;
}

class SecretsManager {
  private secrets = new Map<string, SecretConfig>();
  
  constructor() {
    this.loadSecrets();
  }
  
  get(key: string): string {
    const config = this.secrets.get(key);
    if (!config) throw new Error(`Secret ${key} not found`);
    
    const env = process.env.NODE_ENV || 'development';
    return config[env as keyof SecretConfig];
  }
  
  private loadSecrets() {
    // Secrets are managed in Vercel dashboard
    // Never commit secrets to git
    this.secrets.set('database_url', {
      development: process.env.DEV_DATABASE_URL!,
      staging: process.env.STAGING_DATABASE_URL!,
      production: process.env.PROD_DATABASE_URL!
    });
  }
}
```

### API Security Implementation
```typescript
// lib/auth.ts
import { auth } from '@clerk/nextjs/server';
import rateLimit from 'express-rate-limit';

export async function requireAuth() {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return userId;
}

export function createRateLimit(windowMs: number, max: number) {
  return rateLimit({
    windowMs,
    max,
    message: 'Too many requests',
    standardHeaders: true,
    legacyHeaders: false,
  });
}

// Usage in API routes
export async function POST(request: Request) {
  try {
    await requireAuth();
    // API logic here
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
```

### Webhook Security
```typescript
// lib/webhooks.ts
import crypto from 'crypto';

export function verifyStripeWebhook(payload: string, signature: string) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET!;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
  
  const providedSignature = signature.split('=')[1];
  
  if (!crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(providedSignature, 'hex')
  )) {
    throw new Error('Invalid signature');
  }
}

export function verifyReplicateWebhook(payload: string, signature: string) {
  const secret = process.env.WEBHOOK_SECRET!;
  const expectedSignature = crypto
    .createHmac('sha1', secret)
    .update(payload)
    .digest('hex');
  
  if (signature !== `sha1=${expectedSignature}`) {
    throw new Error('Invalid signature');
  }
}
```

## Database Operations

### Migration Management
```sql
-- migrations/001_add_lora_models.sql
BEGIN;

-- Add LoRA models table
CREATE TABLE lora_models (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    trigger_word TEXT NOT NULL,
    model_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'training' CHECK (status IN ('training', 'completed', 'failed')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE lora_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own LoRA models" ON lora_models
FOR ALL USING (auth.uid() = user_id);

-- Add indexes
CREATE INDEX idx_lora_models_user_id ON lora_models(user_id);
CREATE INDEX idx_lora_models_status ON lora_models(status);

-- Update jobs table for LoRA integration
ALTER TABLE jobs ADD COLUMN lora_model_id UUID REFERENCES lora_models(id);

COMMIT;
```

### Backup Strategy
```bash
#!/bin/bash
# scripts/backup-database.sh

# Production backup (daily)
pg_dump $PROD_DATABASE_URL > "backups/prod-$(date +%Y%m%d).sql"

# Compress and upload to secure storage
gzip "backups/prod-$(date +%Y%m%d).sql"
aws s3 cp "backups/prod-$(date +%Y%m%d).sql.gz" s3://klipcam-backups/database/

# Clean up local backups (keep last 7 days)
find backups/ -name "*.sql.gz" -mtime +7 -delete
```

### Database Performance Monitoring
```sql
-- monitoring/performance-queries.sql

-- Check slow queries
SELECT query, calls, total_time, mean_time, rows
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Monitor connection usage
SELECT 
    count(*) as active_connections,
    max_conn,
    round((count(*) * 100.0 / max_conn), 2) as pct_used
FROM pg_stat_activity, 
     (SELECT setting::int as max_conn FROM pg_settings WHERE name='max_connections') mc;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_relation_size(schemaname||'.'||tablename) DESC;
```

## Disaster Recovery

### Recovery Time Objectives (RTO) & Recovery Point Objectives (RPO)
- **RTO**: 2 hours maximum downtime
- **RPO**: 1 hour maximum data loss
- **Backup Frequency**: Every 6 hours
- **Cross-region replication**: Enabled for critical data

### Disaster Recovery Procedures

#### 1. Database Recovery
```bash
#!/bin/bash
# scripts/disaster-recovery.sh

echo "=== KlipCam Disaster Recovery Procedure ==="

# 1. Assess the situation
echo "1. Assessing database connectivity..."
if pg_isready -h $PROD_DATABASE_HOST; then
    echo "✅ Database is accessible"
else
    echo "❌ Database is not accessible - proceeding with recovery"
    
    # 2. Restore from latest backup
    echo "2. Restoring from latest backup..."
    LATEST_BACKUP=$(aws s3 ls s3://klipcam-backups/database/ | sort | tail -n 1 | awk '{print $4}')
    aws s3 cp "s3://klipcam-backups/database/$LATEST_BACKUP" ./recovery.sql.gz
    gunzip recovery.sql.gz
    
    # 3. Create new database instance
    echo "3. Creating new database instance..."
    # This would involve Supabase API or manual intervention
    
    # 4. Restore data
    psql $NEW_DATABASE_URL < recovery.sql
    
    # 5. Update environment variables
    echo "4. Update Vercel environment variables with new database URL"
    vercel env rm DATABASE_URL --token=$VERCEL_TOKEN
    vercel env add DATABASE_URL --token=$VERCEL_TOKEN
fi

# 6. Verify system health
echo "5. Verifying system health..."
curl -f https://klipcam.com/api/health || echo "❌ Health check failed"

echo "=== Recovery procedure completed ==="
```

#### 2. Vercel Deployment Recovery
```bash
# If Vercel is down, deploy to backup hosting
#!/bin/bash

echo "=== Deploying to backup hosting (Railway/Fly.io) ==="

# 1. Build the application
npm run build

# 2. Deploy to Railway as backup
railway login
railway link
railway up

# 3. Update DNS to point to backup
# This requires manual DNS changes or automated failover

echo "=== Backup deployment completed ==="
```

#### 3. Storage Recovery
```typescript
// scripts/storage-recovery.ts
import { createClient } from '@supabase/supabase-js';
import AWS from 'aws-sdk';

async function recoverStorage() {
  console.log('=== Storage Recovery Procedure ===');
  
  // 1. Check Supabase storage health
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: buckets, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.log('❌ Supabase storage unavailable, switching to S3 backup');
    
    // 2. Switch to S3 for asset storage
    const s3 = new AWS.S3({
      region: 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
    
    // 3. Update asset URLs to point to S3
    // This requires application code changes to use S3 URLs
    
    console.log('✅ Switched to S3 backup storage');
  } else {
    console.log('✅ Supabase storage is healthy');
  }
}
```

### Communication Plan
```markdown
# Incident Communication Template

## Internal Communication (Slack #incidents)
**Status**: 🔴 CRITICAL / 🟡 WARNING / 🟢 RESOLVED
**Started**: [Timestamp]
**Impact**: [Description of user impact]
**Services**: [Affected services]
**Actions**: [Current actions being taken]
**ETA**: [Estimated resolution time]
**Commander**: [Incident commander name]

## External Communication (Status Page)
We are currently experiencing issues with [service]. 
Users may experience [specific impact].
Our team is actively working on a resolution.
Updates will be provided every 30 minutes.

## Customer Support Script
"We are aware of the current issue affecting [service]. 
Our engineering team is working on a resolution. 
We expect normal service to resume within [ETA].
We sincerely apologize for the inconvenience."
```

## Performance Optimization

### Frontend Performance
```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    ppr: true, // Partial Prerendering
  },
  images: {
    domains: ['supabase.co', 'replicate.delivery'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 3600,
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  
  // Bundle analyzer
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks.chunks = 'all';
    }
    return config;
  },
};
```

### API Performance Optimization
```typescript
// lib/cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export class CacheManager {
  async get(key: string) {
    return await redis.get(key);
  }
  
  async set(key: string, value: any, ttl: number = 3600) {
    return await redis.setex(key, ttl, JSON.stringify(value));
  }
  
  async invalidate(pattern: string) {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}

// Usage in API routes
export async function GET(request: Request) {
  const cacheKey = `user:${userId}:jobs`;
  let jobs = await cache.get(cacheKey);
  
  if (!jobs) {
    jobs = await fetchJobsFromDatabase(userId);
    await cache.set(cacheKey, jobs, 300); // 5 minutes
  }
  
  return NextResponse.json(jobs);
}
```

### Database Performance
```sql
-- Database optimization queries

-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_jobs_user_status ON jobs(user_id, status);
CREATE INDEX CONCURRENTLY idx_assets_user_created ON assets(user_id, created_at);
CREATE INDEX CONCURRENTLY idx_credits_ledger_user_timestamp ON credits_ledger(user_id, created_at);

-- Optimize frequently used queries
CREATE MATERIALIZED VIEW user_stats AS
SELECT 
    u.id,
    u.email,
    COUNT(j.id) as total_jobs,
    SUM(CASE WHEN j.status = 'completed' THEN 1 ELSE 0 END) as completed_jobs,
    SUM(cl.delta) as total_credits_used
FROM users u
LEFT JOIN jobs j ON j.user_id = u.id
LEFT JOIN credits_ledger cl ON cl.user_id = u.id AND cl.delta < 0
GROUP BY u.id, u.email;

-- Refresh materialized view (run via cron)
REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats;
```

## Operational Procedures

### Daily Operations Checklist
```markdown
# Daily Operations Checklist

## Morning Check (9:00 AM EST)
- [ ] Review overnight alerts and incidents
- [ ] Check system health dashboard
- [ ] Verify backup completion
- [ ] Monitor credit usage patterns
- [ ] Review Replicate queue status
- [ ] Check Stripe webhook delivery rates

## Business Metrics (Daily)
- [ ] Daily Active Users (DAU)
- [ ] New user registrations
- [ ] Credit consumption rate
- [ ] Job success rate
- [ ] Revenue metrics (MRR tracking)
- [ ] Support ticket volume

## Technical Metrics (Daily)
- [ ] API response times (P95, P99)
- [ ] Error rates by endpoint
- [ ] Database performance
- [ ] Storage usage growth
- [ ] CDN cache hit rates

## Weekly Review (Mondays)
- [ ] Security scan results
- [ ] Dependency updates available
- [ ] Performance trend analysis
- [ ] Capacity planning review
- [ ] Cost optimization opportunities
```

### Incident Response Playbook
```markdown
# Incident Response Playbook

## 1. Detection & Triage (0-5 minutes)
- Alert received via monitoring system
- Initial assessment of impact and severity
- Create incident channel in Slack
- Assign incident commander

## 2. Investigation (5-15 minutes)
- Gather initial data and logs
- Identify affected services and users
- Determine root cause hypothesis
- Engage additional team members if needed

## 3. Mitigation (15-30 minutes)
- Implement immediate workaround if possible
- Communication to affected users
- Escalate to senior engineers if needed
- Document all actions taken

## 4. Resolution (Variable)
- Implement permanent fix
- Verify fix resolves the issue
- Monitor for secondary effects
- Prepare post-mortem if needed

## 5. Recovery & Follow-up (Post-incident)
- Update status page to "Resolved"
- Internal post-mortem meeting
- Update runbooks and documentation
- Implement preventive measures
```

### On-call Procedures
```markdown
# On-call Procedures

## Primary On-call Responsibilities
- Respond to critical alerts within 15 minutes
- Acknowledge incidents in PagerDuty
- Lead incident response and communication
- Escalate to secondary if needed

## Secondary On-call Responsibilities
- Support primary on-call engineer
- Handle escalated incidents
- Provide technical expertise
- Make architecture decisions during incidents

## Alert Priority Levels
- **P0 (Critical)**: System down, revenue impact
  - Response: Immediate (0-15 minutes)
  - Escalation: After 30 minutes
  
- **P1 (High)**: Degraded performance, user impact
  - Response: 1 hour during business hours
  - Escalation: After 2 hours
  
- **P2 (Medium)**: Minor issues, no user impact
  - Response: Next business day
  - Escalation: Manual only
```

### Scaling Procedures
```markdown
# Scaling Procedures

## Traffic Spike Response
1. **Monitor key metrics** (response time, error rate, queue length)
2. **Scale Vercel functions** (automatic, but verify)
3. **Scale database** (Supabase connection pooling)
4. **Scale Replicate usage** (increase concurrent jobs if needed)
5. **Monitor costs** and adjust if necessary

## Database Scaling
1. **Vertical scaling**: Increase Supabase instance size
2. **Connection pooling**: Optimize connection management
3. **Read replicas**: For read-heavy workloads
4. **Query optimization**: Identify and fix slow queries

## Storage Scaling
1. **Monitor storage growth** trends
2. **Implement data lifecycle** policies
3. **Archive old assets** (trial users after 30 days)
4. **Optimize asset compression** and formats
```

---

This comprehensive DevOps guide provides the foundation for reliable, scalable operations of the KlipCam platform. Regular review and updates of these procedures ensure they remain effective as the system evolves.

**Key Success Metrics:**
- 99.9% uptime target
- < 2s API response time (P95)
- < 1% error rate
- 2-hour maximum recovery time
- Zero data loss incidents

**Next Steps:**
1. Implement monitoring and alerting setup
2. Configure CI/CD pipeline
3. Set up disaster recovery procedures
4. Train team on operational procedures
5. Establish regular review cycles for all procedures
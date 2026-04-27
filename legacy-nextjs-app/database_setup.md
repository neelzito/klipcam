# KlipCam Database Setup Guide

This guide provides instructions for setting up the KlipCam database schema in Supabase PostgreSQL.

## Prerequisites

- Supabase project created
- Database access (via Supabase Dashboard or direct PostgreSQL connection)
- Understanding of PostgreSQL and Supabase concepts

## Database Schema Overview

The KlipCam database consists of 7 main tables:

1. **users** - Core user accounts with Clerk integration
2. **subscriptions** - Stripe subscription management
3. **credits_ledger** - Comprehensive credit transaction audit trail
4. **jobs** - AI generation job queue with Replicate integration
5. **assets** - Generated content metadata and storage paths
6. **favorites** - User-favorited assets
7. **presets** - Style presets for content generation

## Setup Instructions

### Method 1: Supabase Dashboard (Recommended)

1. **Login to Supabase Dashboard**
   - Navigate to your KlipCam project
   - Go to "SQL Editor" in the left sidebar

2. **Run Schema Creation**
   - Copy the entire contents of `database_schema.sql`
   - Paste into a new SQL query
   - Click "RUN" to execute

3. **Verify Installation**
   - Check "Table Editor" to confirm all tables are created
   - Verify that Row Level Security (RLS) is enabled on all tables

### Method 2: Direct PostgreSQL Connection

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres"

# Run the schema file
\i database_schema.sql
```

## Post-Setup Configuration

### 1. Storage Bucket Setup

Create a storage bucket for generated assets:

```sql
-- This should be run in Supabase Storage settings or via API
INSERT INTO storage.buckets (id, name, public) 
VALUES ('generated', 'generated', false);
```

### 2. Storage Policies

Set up storage policies for asset access:

```sql
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own assets" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'generated' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own assets
CREATE POLICY "Users can view own assets" ON storage.objects
FOR SELECT USING (
  bucket_id = 'generated' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 3. Webhook Endpoints

Configure webhook endpoints in your environment:

- **Replicate Webhook**: `https://yourdomain.com/api/replicate/webhook`
- **Stripe Webhook**: `https://yourdomain.com/api/stripe/webhook`

## Environment Variables

Set up the following environment variables in your application:

```bash
# Database
DATABASE_URL="postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres"
SUPABASE_URL="https://[PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="[ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[SERVICE-ROLE-KEY]"

# Authentication
CLERK_SECRET_KEY="[CLERK-SECRET]"

# AI Services
REPLICATE_API_TOKEN="[REPLICATE-TOKEN]"

# Payments
STRIPE_SECRET_KEY="[STRIPE-SECRET]"
STRIPE_WEBHOOK_SECRET="[STRIPE-WEBHOOK-SECRET]"
```

## Key Features

### Credit System
- **Atomic transactions** ensure credit consistency
- **Audit trail** tracks all credit changes with detailed metadata
- **Business rules** prevent negative balances and track refunds

### Concurrency Control
- **Maximum 2 running jobs** per user (enforced via triggers)
- **Optimistic locking** for credit deductions
- **Status tracking** for all generation jobs

### Row Level Security (RLS)
- **Users can only access their own data**
- **Presets are globally readable** for authenticated users
- **Automatic policy enforcement** at the database level

### Performance Optimization
- **Comprehensive indexes** on frequently queried columns
- **Efficient foreign key relationships**
- **Utility functions** for common operations

## Common Operations

### Add Credits to User
```sql
SELECT add_credits(
    user_uuid := '123e4567-e89b-12d3-a456-426614174000',
    credits_amount := 900,
    transaction_reason := 'subscription_grant',
    transaction_metadata := '{"subscription_id": "sub_123", "period": "2024-01"}'::jsonb
);
```

### Check Credit Balance
```sql
SELECT get_user_credit_balance('123e4567-e89b-12d3-a456-426614174000');
```

### Deduct Credits for Job
```sql
SELECT deduct_credits(
    user_uuid := '123e4567-e89b-12d3-a456-426614174000',
    credits_amount := 4,
    job_uuid := '456e7890-e89b-12d3-a456-426614174001',
    transaction_reason := 'job_charge'
);
```

## Monitoring Queries

### Check System Health
```sql
-- Active jobs by status
SELECT status, COUNT(*) FROM jobs GROUP BY status;

-- Credit distribution
SELECT 
    plan,
    AVG(credit_balance) as avg_credits,
    COUNT(*) as user_count
FROM users 
GROUP BY plan;

-- Recent activity
SELECT * FROM recent_activity LIMIT 20;
```

### User Analytics
```sql
-- Top users by credit usage
SELECT 
    u.email,
    ujs.total_credits_spent,
    ujs.total_jobs,
    ujs.successful_jobs
FROM user_job_stats ujs
JOIN users u ON u.id = ujs.user_id
ORDER BY total_credits_spent DESC
LIMIT 10;
```

## Backup and Maintenance

### Regular Backups
- Enable Supabase automatic backups
- Consider point-in-time recovery (PITR) for production
- Export schema regularly for version control

### Maintenance Tasks
```sql
-- Clean up old trial assets (run monthly)
DELETE FROM assets 
WHERE created_at < NOW() - INTERVAL '30 days' 
AND user_id IN (
    SELECT id FROM users 
    WHERE plan = 'free' 
    AND (trial_ends_at IS NULL OR trial_ends_at < NOW())
);

-- Archive old credit ledger entries (run quarterly)
-- Consider moving to archive table for historical analysis
```

## Troubleshooting

### Common Issues

1. **Credit Balance Inconsistency**
   - Check `credits_ledger` for missing transactions
   - Run credit consistency validation
   - Investigate concurrent transaction conflicts

2. **Job Stuck in 'running' Status**
   - Check Replicate webhook delivery
   - Verify job timeout handling
   - Manual status update if necessary

3. **RLS Policy Issues**
   - Verify Clerk integration provides correct `auth.uid()`
   - Check policy conditions match your authentication flow
   - Test policies with different user roles

### Debug Queries
```sql
-- Find credit inconsistencies
SELECT 
    u.id,
    u.credit_balance,
    COALESCE(SUM(cl.delta), 0) as calculated_balance
FROM users u
LEFT JOIN credits_ledger cl ON cl.user_id = u.id
GROUP BY u.id, u.credit_balance
HAVING u.credit_balance != COALESCE(SUM(cl.delta), 0);

-- Find long-running jobs
SELECT * FROM jobs 
WHERE status = 'running' 
AND created_at < NOW() - INTERVAL '1 hour';
```

## Migration Strategy

When updating the schema:

1. **Always backup** before schema changes
2. **Test migrations** in development environment
3. **Use transactions** for multi-step changes
4. **Plan downtime** for major structural changes
5. **Have rollback plan** ready

Example migration script structure:
```sql
BEGIN;

-- Migration steps here
ALTER TABLE jobs ADD COLUMN new_field TEXT;

-- Verify changes
SELECT COUNT(*) FROM jobs WHERE new_field IS NULL;

-- Rollback point
-- ROLLBACK; -- Uncomment to rollback

COMMIT;
```
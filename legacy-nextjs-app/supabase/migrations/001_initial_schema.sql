-- KlipCam Database Schema
-- This file contains the complete database schema for KlipCam

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create ENUM types
CREATE TYPE user_plan AS ENUM ('trial', 'pro', 'cancelled');
CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE job_type AS ENUM ('image', 'video', 'upscale', 'spider');
CREATE TYPE asset_type AS ENUM ('image', 'video');
CREATE TYPE transaction_type AS ENUM ('purchase', 'usage', 'refund', 'bonus', 'subscription');

-- Users table (synced with Clerk)
CREATE TABLE users (
  id TEXT PRIMARY KEY, -- Clerk user ID
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  plan user_plan NOT NULL DEFAULT 'trial',
  credit_balance INTEGER NOT NULL DEFAULT 10, -- Trial credits
  total_credits_purchased INTEGER NOT NULL DEFAULT 0,
  total_credits_used INTEGER NOT NULL DEFAULT 0,
  subscription_id TEXT, -- Stripe subscription ID
  customer_id TEXT, -- Stripe customer ID
  trial_ends_at TIMESTAMPTZ,
  subscription_current_period_start TIMESTAMPTZ,
  subscription_current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_sign_in_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Subscriptions table (Stripe integration)
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY, -- Stripe subscription ID
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL, -- Stripe customer ID
  status TEXT NOT NULL, -- active, canceled, past_due, etc.
  plan_id TEXT NOT NULL, -- Stripe price ID
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Credits ledger for tracking all credit transactions
CREATE TABLE credits_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_type transaction_type NOT NULL,
  amount INTEGER NOT NULL, -- Positive for credits added, negative for credits used
  balance_after INTEGER NOT NULL,
  description TEXT NOT NULL,
  job_id UUID, -- Reference to jobs table if applicable
  stripe_payment_intent_id TEXT, -- Reference to Stripe payment if applicable
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Jobs table for tracking AI generation requests
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type job_type NOT NULL,
  status job_status NOT NULL DEFAULT 'pending',
  
  -- Generation parameters
  prompt TEXT,
  negative_prompt TEXT,
  preset_id TEXT,
  aspect_ratio TEXT NOT NULL DEFAULT '1:1',
  reference_image_url TEXT, -- For I2I jobs
  
  -- Replicate integration
  replicate_prediction_id TEXT UNIQUE,
  replicate_model TEXT,
  replicate_version TEXT,
  
  -- Cost tracking
  estimated_cost INTEGER NOT NULL, -- Credits estimated
  actual_cost INTEGER, -- Credits actually charged (after completion)
  
  -- Results
  output_urls TEXT[], -- Array of generated asset URLs
  error_message TEXT,
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Additional data
  generation_params JSONB DEFAULT '{}'::JSONB,
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Assets table for tracking generated content
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  
  -- Asset details
  type asset_type NOT NULL,
  filename TEXT NOT NULL,
  original_filename TEXT,
  file_size BIGINT,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  duration REAL, -- For videos, in seconds
  
  -- Storage
  storage_path TEXT NOT NULL, -- Path in Supabase Storage
  public_url TEXT,
  download_url TEXT, -- Signed URL for downloads
  thumbnail_url TEXT,
  
  -- Metadata
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  is_watermarked BOOLEAN NOT NULL DEFAULT false,
  download_count INTEGER NOT NULL DEFAULT 0,
  
  -- Retention
  expires_at TIMESTAMPTZ, -- For trial assets
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Additional data
  exif_data JSONB DEFAULT '{}'::JSONB,
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Favorites table for user's favorite assets
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, asset_id)
);

-- User settings table
CREATE TABLE user_settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification preferences
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  marketing_emails BOOLEAN NOT NULL DEFAULT true,
  
  -- Generation preferences
  default_aspect_ratio TEXT NOT NULL DEFAULT '1:1',
  auto_upscale BOOLEAN NOT NULL DEFAULT false,
  watermark_preference BOOLEAN NOT NULL DEFAULT false,
  
  -- Privacy settings
  profile_visibility TEXT NOT NULL DEFAULT 'private', -- public, private
  allow_data_training BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  settings JSONB DEFAULT '{}'::JSONB
);

-- API keys table for future API access
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL, -- First few characters for identification
  
  -- Permissions
  scopes TEXT[] NOT NULL DEFAULT ARRAY['read'], -- read, write, admin
  rate_limit INTEGER NOT NULL DEFAULT 100, -- Requests per minute
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_plan ON users(plan);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

CREATE INDEX idx_credits_ledger_user_id ON credits_ledger(user_id);
CREATE INDEX idx_credits_ledger_type ON credits_ledger(transaction_type);
CREATE INDEX idx_credits_ledger_created_at ON credits_ledger(created_at);
CREATE INDEX idx_credits_ledger_job_id ON credits_ledger(job_id);

CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_type ON jobs(type);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
CREATE INDEX idx_jobs_replicate_prediction_id ON jobs(replicate_prediction_id);

CREATE INDEX idx_assets_user_id ON assets(user_id);
CREATE INDEX idx_assets_job_id ON assets(job_id);
CREATE INDEX idx_assets_type ON assets(type);
CREATE INDEX idx_assets_created_at ON assets(created_at);
CREATE INDEX idx_assets_expires_at ON assets(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_asset_id ON favorites(asset_id);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for credit management
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id TEXT,
  p_amount INTEGER,
  p_transaction_type transaction_type,
  p_description TEXT,
  p_stripe_payment_intent_id TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Update user's credit balance
  UPDATE users 
  SET 
    credit_balance = credit_balance + p_amount,
    total_credits_purchased = CASE 
      WHEN p_transaction_type = 'purchase' THEN total_credits_purchased + p_amount
      ELSE total_credits_purchased
    END,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING credit_balance INTO v_new_balance;
  
  -- Record transaction in ledger
  INSERT INTO credits_ledger (
    user_id, 
    transaction_type, 
    amount, 
    balance_after, 
    description,
    stripe_payment_intent_id
  ) VALUES (
    p_user_id, 
    p_transaction_type, 
    p_amount, 
    v_new_balance, 
    p_description,
    p_stripe_payment_intent_id
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION use_credits(
  p_user_id TEXT,
  p_amount INTEGER,
  p_description TEXT,
  p_job_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Check current balance
  SELECT credit_balance INTO v_current_balance 
  FROM users WHERE id = p_user_id;
  
  -- Return false if insufficient credits
  IF v_current_balance < p_amount THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct credits
  UPDATE users 
  SET 
    credit_balance = credit_balance - p_amount,
    total_credits_used = total_credits_used + p_amount,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING credit_balance INTO v_new_balance;
  
  -- Record transaction in ledger
  INSERT INTO credits_ledger (
    user_id, 
    transaction_type, 
    amount, 
    balance_after, 
    description,
    job_id
  ) VALUES (
    p_user_id, 
    'usage', 
    -p_amount, 
    v_new_balance, 
    p_description,
    p_job_id
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired assets
CREATE OR REPLACE FUNCTION cleanup_expired_assets() RETURNS void AS $$
BEGIN
  -- Delete expired trial assets
  DELETE FROM assets 
  WHERE expires_at IS NOT NULL 
  AND expires_at < NOW();
  
  -- Log cleanup
  INSERT INTO credits_ledger (
    user_id, 
    transaction_type, 
    amount, 
    balance_after, 
    description
  )
  SELECT 
    'system',
    'bonus',
    0,
    0,
    'Cleaned up expired assets: ' || ROW_COUNT() || ' assets removed'
  WHERE ROW_COUNT() > 0;
END;
$$ LANGUAGE plpgsql;

-- Initial data - Insert default user settings template
INSERT INTO user_settings (user_id) VALUES ('template') ON CONFLICT DO NOTHING;
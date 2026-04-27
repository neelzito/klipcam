-- KlipCam Database Schema
-- Execute this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_plan AS ENUM ('trial', 'pro', 'enterprise');
CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE job_type AS ENUM ('image', 'video', 'upscale', 'lora_training');
CREATE TYPE asset_type AS ENUM ('image', 'video');
CREATE TYPE subscription_status AS ENUM ('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid');

-- =====================================================================
-- USERS TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    profile_image_url TEXT,
    plan user_plan NOT NULL DEFAULT 'trial',
    credit_balance INTEGER NOT NULL DEFAULT 10,
    total_credits_used INTEGER NOT NULL DEFAULT 0,
    trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    subscription_active BOOLEAN NOT NULL DEFAULT FALSE,
    stripe_customer_id TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT users_credit_balance_non_negative CHECK (credit_balance >= 0),
    CONSTRAINT users_total_credits_used_non_negative CHECK (total_credits_used >= 0)
);

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- =====================================================================
-- SUBSCRIPTIONS TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT NOT NULL,
    stripe_price_id TEXT NOT NULL,
    status subscription_status NOT NULL DEFAULT 'incomplete',
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Subscriptions table indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- =====================================================================
-- CREDITS LEDGER TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS credits_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- Positive for credits earned, negative for credits spent
    balance_after INTEGER NOT NULL, -- User's balance after this transaction
    transaction_type TEXT NOT NULL, -- 'grant', 'spend', 'refund', 'subscription', 'trial'
    description TEXT NOT NULL,
    job_id UUID, -- Reference to job if credit was spent on job
    stripe_payment_intent_id TEXT, -- Reference to Stripe payment if applicable
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT credits_ledger_balance_after_non_negative CHECK (balance_after >= 0)
);

-- Credits ledger indexes
CREATE INDEX IF NOT EXISTS idx_credits_ledger_user_id ON credits_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_ledger_created_at ON credits_ledger(created_at);
CREATE INDEX IF NOT EXISTS idx_credits_ledger_transaction_type ON credits_ledger(transaction_type);
CREATE INDEX IF NOT EXISTS idx_credits_ledger_job_id ON credits_ledger(job_id);

-- =====================================================================
-- JOBS TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type job_type NOT NULL,
    status job_status NOT NULL DEFAULT 'pending',
    prompt TEXT,
    aspect_ratio TEXT,
    
    -- Generation parameters
    generation_params JSONB DEFAULT '{}',
    reference_image_url TEXT,
    strength FLOAT,
    
    -- Model information
    replicate_model TEXT,
    replicate_prediction_id TEXT,
    fal_model TEXT,
    fal_request_id TEXT,
    ai_provider TEXT DEFAULT 'fal', -- 'replicate', 'fal', or 'hybrid'
    
    -- Cost tracking
    estimated_cost INTEGER NOT NULL, -- Credits
    actual_cost INTEGER, -- Credits (filled after completion)
    
    -- Execution tracking
    output_urls TEXT[], -- Array of generated asset URLs
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT jobs_estimated_cost_positive CHECK (estimated_cost > 0),
    CONSTRAINT jobs_actual_cost_positive CHECK (actual_cost IS NULL OR actual_cost > 0)
);

-- Jobs table indexes
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(type);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_replicate_prediction_id ON jobs(replicate_prediction_id);
CREATE INDEX IF NOT EXISTS idx_jobs_fal_request_id ON jobs(fal_request_id);
CREATE INDEX IF NOT EXISTS idx_jobs_ai_provider ON jobs(ai_provider);

-- =====================================================================
-- ASSETS TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    type asset_type NOT NULL,
    filename TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    width INTEGER,
    height INTEGER,
    duration FLOAT, -- For videos
    
    -- Storage information
    storage_path TEXT NOT NULL, -- Path in Supabase Storage
    download_url TEXT NOT NULL,
    thumbnail_url TEXT,
    
    -- User preferences
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    is_watermarked BOOLEAN NOT NULL DEFAULT FALSE,
    download_count INTEGER NOT NULL DEFAULT 0,
    
    -- Retention policy
    expires_at TIMESTAMP WITH TIME ZONE, -- For trial users
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT assets_file_size_positive CHECK (file_size IS NULL OR file_size > 0),
    CONSTRAINT assets_dimensions_positive CHECK (
        (width IS NULL OR width > 0) AND 
        (height IS NULL OR height > 0)
    ),
    CONSTRAINT assets_duration_positive CHECK (duration IS NULL OR duration > 0),
    CONSTRAINT assets_download_count_non_negative CHECK (download_count >= 0)
);

-- Assets table indexes
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_job_id ON assets(job_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);
CREATE INDEX IF NOT EXISTS idx_assets_is_favorite ON assets(is_favorite);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assets_expires_at ON assets(expires_at);
CREATE INDEX IF NOT EXISTS idx_assets_storage_path ON assets(storage_path);

-- =====================================================================
-- FAVORITES TABLE (Many-to-many relationship)
-- =====================================================================
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate favorites
    UNIQUE(user_id, asset_id)
);

-- Favorites table indexes
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_asset_id ON favorites(asset_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at);

-- =====================================================================
-- LORA TRAINING TABLE (Future feature)
-- =====================================================================
CREATE TABLE IF NOT EXISTS lora_training (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    trigger_word TEXT NOT NULL,
    training_images TEXT[] NOT NULL, -- Array of image URLs
    model_id TEXT, -- Replicate/FAL model ID once trained
    status job_status NOT NULL DEFAULT 'pending',
    training_params JSONB DEFAULT '{}',
    cost_credits INTEGER NOT NULL,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- LoRA training indexes
CREATE INDEX IF NOT EXISTS idx_lora_training_user_id ON lora_training(user_id);
CREATE INDEX IF NOT EXISTS idx_lora_training_status ON lora_training(status);
CREATE INDEX IF NOT EXISTS idx_lora_training_created_at ON lora_training(created_at DESC);

-- =====================================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lora_training_updated_at BEFORE UPDATE ON lora_training
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update user credit balance
CREATE OR REPLACE FUNCTION update_user_credit_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the user's credit balance based on the ledger entry
    UPDATE users 
    SET credit_balance = NEW.balance_after,
        updated_at = NOW()
    WHERE id = NEW.user_id;
    
    -- Also update total credits used if it's a spending transaction
    IF NEW.amount < 0 THEN
        UPDATE users 
        SET total_credits_used = total_credits_used + ABS(NEW.amount),
            updated_at = NOW()
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update user balance when credits ledger changes
CREATE TRIGGER update_user_balance_on_credit_change 
    AFTER INSERT ON credits_ledger
    FOR EACH ROW EXECUTE FUNCTION update_user_credit_balance();

-- =====================================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE lora_training ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (clerk_user_id = auth.jwt() ->> 'sub');

-- Subscriptions table policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
    ));

-- Credits ledger policies
CREATE POLICY "Users can view own credit history" ON credits_ledger
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
    ));

-- Jobs table policies
CREATE POLICY "Users can view own jobs" ON jobs
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
    ));

CREATE POLICY "Users can create own jobs" ON jobs
    FOR INSERT WITH CHECK (user_id IN (
        SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
    ));

CREATE POLICY "Users can update own jobs" ON jobs
    FOR UPDATE USING (user_id IN (
        SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
    ));

-- Assets table policies
CREATE POLICY "Users can view own assets" ON assets
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
    ));

CREATE POLICY "Users can update own assets" ON assets
    FOR UPDATE USING (user_id IN (
        SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
    ));

-- Favorites table policies
CREATE POLICY "Users can manage own favorites" ON favorites
    FOR ALL USING (user_id IN (
        SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
    ));

-- LoRA training policies
CREATE POLICY "Users can view own LoRA training" ON lora_training
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
    ));

CREATE POLICY "Users can create own LoRA training" ON lora_training
    FOR INSERT WITH CHECK (user_id IN (
        SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
    ));

-- =====================================================================
-- HELPFUL VIEWS
-- =====================================================================

-- User summary view
CREATE OR REPLACE VIEW user_summary AS
SELECT 
    u.id,
    u.clerk_user_id,
    u.email,
    u.first_name,
    u.last_name,
    u.plan,
    u.credit_balance,
    u.total_credits_used,
    u.subscription_active,
    s.status as subscription_status,
    s.current_period_end as subscription_ends_at,
    COUNT(DISTINCT j.id) as total_jobs,
    COUNT(DISTINCT a.id) as total_assets,
    COUNT(DISTINCT f.id) as total_favorites,
    u.created_at,
    u.updated_at
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
LEFT JOIN jobs j ON u.id = j.user_id
LEFT JOIN assets a ON u.id = a.user_id
LEFT JOIN favorites f ON u.id = f.user_id
GROUP BY u.id, s.status, s.current_period_end;

-- Recent jobs view
CREATE OR REPLACE VIEW recent_jobs AS
SELECT 
    j.*,
    u.first_name,
    u.last_name,
    u.email,
    COUNT(a.id) as asset_count
FROM jobs j
JOIN users u ON j.user_id = u.id
LEFT JOIN assets a ON j.id = a.job_id
WHERE j.created_at >= NOW() - INTERVAL '30 days'
GROUP BY j.id, u.first_name, u.last_name, u.email
ORDER BY j.created_at DESC;

-- =====================================================================
-- INITIAL DATA
-- =====================================================================

-- Insert some example presets (you can customize these)
CREATE TABLE IF NOT EXISTS presets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    prompt_template TEXT NOT NULL,
    thumbnail_url TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    cost_credits INTEGER NOT NULL DEFAULT 1,
    is_premium BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Insert default presets
INSERT INTO presets (name, description, prompt_template, category, cost_credits, is_premium, sort_order) VALUES
('Fashion Editorial', 'High-fashion studio photography with dramatic lighting', 'fashion editorial portrait of {user_prompt}, dramatic lighting, studio photography, high fashion, vogue style, professional modeling', 'fashion', 1, false, 1),
('Gym High-Contrast', 'Fitness photography with bold contrasts and energy', 'fitness photography of {user_prompt}, gym environment, high contrast lighting, athletic, energetic, sports photography style', 'fitness', 1, false, 2),
('Warm Indoor', 'Cozy indoor portrait with warm, natural lighting', 'warm indoor portrait of {user_prompt}, cozy atmosphere, natural window lighting, comfortable setting, lifestyle photography', 'lifestyle', 1, false, 3),
('Neon Night Street', 'Urban cyberpunk style with neon lights and city vibes', 'cyberpunk street portrait of {user_prompt}, neon lights, urban night scene, futuristic city, vibrant colors, street photography', 'urban', 4, true, 4),
('Travel Sunset', 'Golden hour travel photography with scenic backgrounds', 'travel photography of {user_prompt}, golden hour lighting, scenic background, wanderlust, adventure, sunset colors', 'travel', 1, false, 5),
('Studio Color Backdrop', 'Professional studio portrait with colorful backgrounds', 'professional studio portrait of {user_prompt}, colorful backdrop, studio lighting, clean background, portrait photography', 'professional', 1, false, 6);

-- Enable RLS on presets (publicly readable)
ALTER TABLE presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Presets are publicly readable" ON presets
    FOR SELECT USING (is_active = true);

-- =====================================================================
-- STORAGE BUCKETS (Run this after creating the schema)
-- =====================================================================
-- Note: These commands should be run in the Supabase dashboard Storage section
-- or via the Supabase CLI, not in the SQL editor

-- Storage bucket policies will be created separately
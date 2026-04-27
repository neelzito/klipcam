-- KlipCam Database Schema for Supabase PostgreSQL
-- This schema supports the Creator AI platform with credit-based subscriptions
-- and AI-generated content management

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- =============================================
-- CORE USER MANAGEMENT
-- =============================================

-- Users table (integrates with Clerk authentication)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'paid')),
    credit_balance INTEGER NOT NULL DEFAULT 0 CHECK (credit_balance >= 0),
    trial_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SUBSCRIPTION MANAGEMENT (STRIPE INTEGRATION)
-- =============================================

-- Subscriptions table for Stripe integration
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT NOT NULL,
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'incomplete', 'past_due', 'unpaid')),
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Apply updated_at trigger to subscriptions table
CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- CREDIT SYSTEM MANAGEMENT
-- =============================================

-- Credit ledger for all credit transactions with detailed tracking
CREATE TABLE credits_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    delta INTEGER NOT NULL, -- Positive for grants, negative for charges
    reason TEXT NOT NULL CHECK (reason IN ('trial_seed', 'subscription_grant', 'job_charge', 'job_refund', 'manual_adjust', 'lora_training_charge', 'lora_generation_charge')),
    job_id UUID, -- Will reference jobs.id (foreign key added later)
    metadata JSONB DEFAULT '{}', -- Additional context (e.g., subscription details, refund reasons)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- JOB MANAGEMENT (AI GENERATION JOBS)
-- =============================================

-- Jobs table for tracking all AI generation requests
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('image', 'video', 'lora_training')),
    subtype TEXT NOT NULL CHECK (subtype IN ('t2i', 'i2i', 't2v', 'i2v', 'spider', 'upscale', 'lora_train', 'lora_t2i', 'lora_i2i')),
    model TEXT, -- Replicate model identifier (e.g., "black-forest-labs/FLUX.1-dev")
    params JSONB NOT NULL DEFAULT '{}', -- Generation parameters (prompt, dimensions, etc.)
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'succeeded', 'failed')),
    cost_credits INTEGER NOT NULL CHECK (cost_credits > 0),
    replicate_prediction_id TEXT, -- Replicate API prediction ID for tracking
    error TEXT, -- Error message if job failed
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ -- Set when job finishes (success or failure)
);

-- Add foreign key constraint from credits_ledger to jobs
ALTER TABLE credits_ledger 
ADD CONSTRAINT fk_credits_ledger_job_id 
FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL;

-- =============================================
-- ASSET MANAGEMENT (GENERATED CONTENT)
-- =============================================

-- Assets table for storing generated content metadata
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('image', 'video')),
    path TEXT NOT NULL, -- Path in Supabase Storage (e.g., "generated/user_123/image_456.jpg")
    url TEXT, -- Cached signed URL (regenerated periodically)
    width INTEGER CHECK (width > 0),
    height INTEGER CHECK (height > 0),
    size_bytes INTEGER NOT NULL CHECK (size_bytes >= 0),
    is_low_res BOOLEAN NOT NULL DEFAULT FALSE, -- True for trial users or preview images
    is_watermarked BOOLEAN NOT NULL DEFAULT FALSE, -- True for trial user outputs
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- USER FAVORITES SYSTEM
-- =============================================

-- Favorites table for user-favorited assets
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, asset_id) -- Prevent duplicate favorites
);

-- =============================================
-- LORA MODELS MANAGEMENT
-- =============================================

-- LoRA models table for user-trained models
CREATE TABLE lora_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- User-defined name
    trigger_word TEXT NOT NULL UNIQUE, -- Auto-generated unique trigger
    training_job_id UUID REFERENCES jobs(id), -- Reference to training job
    replicate_model_id TEXT, -- Replicate model identifier
    replicate_version_id TEXT, -- Specific version of the model
    status TEXT NOT NULL DEFAULT 'training' CHECK (status IN ('training', 'ready', 'failed', 'archived')),
    training_images_count INTEGER NOT NULL DEFAULT 0 CHECK (training_images_count <= 10),
    generation_count INTEGER NOT NULL DEFAULT 0, -- Track usage for analytics
    training_cost_credits INTEGER NOT NULL DEFAULT 150, -- Cost of training this model
    last_used_at TIMESTAMPTZ, -- Track when model was last used for generation
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Constraints for business rules
    CONSTRAINT check_training_images_minimum CHECK (training_images_count >= 1 OR status != 'ready'),
    CONSTRAINT unique_user_active_training UNIQUE NULLS NOT DISTINCT (user_id, CASE WHEN status = 'training' THEN 'training' ELSE NULL END)
);

-- Apply updated_at trigger to lora_models table
CREATE TRIGGER update_lora_models_updated_at 
    BEFORE UPDATE ON lora_models 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Training images metadata
CREATE TABLE lora_training_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lora_model_id UUID NOT NULL REFERENCES lora_models(id) ON DELETE CASCADE,
    original_path TEXT NOT NULL, -- Path in Supabase Storage
    processed_path TEXT, -- Processed/resized version path
    upload_order INTEGER NOT NULL CHECK (upload_order >= 1 AND upload_order <= 10),
    width INTEGER NOT NULL CHECK (width > 0),
    height INTEGER NOT NULL CHECK (height > 0),
    size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
    face_detection_confidence FLOAT, -- ML confidence score for face detection
    is_valid BOOLEAN NOT NULL DEFAULT TRUE, -- Whether image passed validation
    validation_notes TEXT, -- Optional validation feedback
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Ensure unique upload order per model
    UNIQUE(lora_model_id, upload_order)
);

-- =============================================

-- Presets table for style presets (can be managed via admin interface)
CREATE TABLE presets (
    id TEXT PRIMARY KEY, -- Human-readable ID (e.g., "fashion-editorial", "gym-high-contrast")
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    thumbnail_url TEXT, -- URL to preview image
    type TEXT NOT NULL CHECK (type IN ('image', 'video')),
    model_tier TEXT NOT NULL CHECK (model_tier IN ('base', 'premium')),
    cost_credits INTEGER NOT NULL CHECK (cost_credits > 0),
    params JSONB NOT NULL DEFAULT '{}', -- Default parameters for this preset
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Apply updated_at trigger to presets table
CREATE TRIGGER update_presets_updated_at 
    BEFORE UPDATE ON presets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- PERFORMANCE INDEXES
-- =============================================

-- Users indexes
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_plan ON users(plan);

-- Subscriptions indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_current_period_end ON subscriptions(current_period_end);

-- Credits ledger indexes
CREATE INDEX idx_credits_ledger_user_id ON credits_ledger(user_id);
CREATE INDEX idx_credits_ledger_job_id ON credits_ledger(job_id);
CREATE INDEX idx_credits_ledger_created_at ON credits_ledger(created_at DESC);
CREATE INDEX idx_credits_ledger_reason ON credits_ledger(reason);

-- Jobs indexes
CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_type ON jobs(type);
CREATE INDEX idx_jobs_subtype ON jobs(subtype);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX idx_jobs_replicate_prediction_id ON jobs(replicate_prediction_id);

-- Assets indexes
CREATE INDEX idx_assets_user_id ON assets(user_id);
CREATE INDEX idx_assets_job_id ON assets(job_id);
CREATE INDEX idx_assets_kind ON assets(kind);
CREATE INDEX idx_assets_created_at ON assets(created_at DESC);
CREATE INDEX idx_assets_is_watermarked ON assets(is_watermarked);

-- Favorites indexes
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_asset_id ON favorites(asset_id);
CREATE INDEX idx_favorites_created_at ON favorites(created_at DESC);

-- Presets indexes
CREATE INDEX idx_presets_type ON presets(type);
CREATE INDEX idx_presets_model_tier ON presets(model_tier);
CREATE INDEX idx_presets_is_active ON presets(is_active);
CREATE INDEX idx_presets_sort_order ON presets(sort_order);

-- LoRA models indexes
CREATE INDEX idx_lora_models_user_id ON lora_models(user_id);
CREATE INDEX idx_lora_models_status ON lora_models(status);
CREATE INDEX idx_lora_models_trigger_word ON lora_models(trigger_word);
CREATE INDEX idx_lora_models_created_at ON lora_models(created_at DESC);
CREATE INDEX idx_lora_models_last_used_at ON lora_models(last_used_at DESC NULLS LAST);
CREATE INDEX idx_lora_models_generation_count ON lora_models(generation_count DESC);
CREATE INDEX idx_lora_models_user_status ON lora_models(user_id, status); -- Composite for user's active models
CREATE INDEX idx_lora_models_ready_public ON lora_models(status, is_public) WHERE status = 'ready'; -- For public model discovery

-- Training images indexes
CREATE INDEX idx_lora_training_images_model_id ON lora_training_images(lora_model_id);
CREATE INDEX idx_lora_training_images_created_at ON lora_training_images(created_at DESC);
CREATE INDEX idx_lora_training_images_upload_order ON lora_training_images(lora_model_id, upload_order);
CREATE INDEX idx_lora_training_images_validation ON lora_training_images(lora_model_id, is_valid); -- For counting valid images

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE lora_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE lora_training_images ENABLE ROW LEVEL SECURITY;

-- Users: Users can only see their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = clerk_id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = clerk_id);

-- Subscriptions: Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (
        user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
    );

-- Credits ledger: Users can only see their own credit history
CREATE POLICY "Users can view own credit history" ON credits_ledger
    FOR SELECT USING (
        user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
    );

-- Jobs: Users can only see their own jobs
CREATE POLICY "Users can view own jobs" ON jobs
    FOR SELECT USING (
        user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
    );

CREATE POLICY "Users can create own jobs" ON jobs
    FOR INSERT WITH CHECK (
        user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
    );

-- Assets: Users can only see their own assets
CREATE POLICY "Users can view own assets" ON assets
    FOR SELECT USING (
        user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
    );

-- Favorites: Users can only manage their own favorites
CREATE POLICY "Users can manage own favorites" ON favorites
    FOR ALL USING (
        user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
    );

-- Presets: All authenticated users can view active presets
CREATE POLICY "Authenticated users can view active presets" ON presets
    FOR SELECT USING (is_active = true AND auth.uid() IS NOT NULL);

-- LoRA Models: Users can only manage their own LoRA models
CREATE POLICY "Users can manage own lora models" ON lora_models
    FOR ALL USING (
        user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
    );

-- LoRA Models: Public models viewable by all authenticated users
CREATE POLICY "Authenticated users can view public lora models" ON lora_models
    FOR SELECT USING (is_public = true AND auth.uid() IS NOT NULL);

-- Training Images: Users can only manage images for their own LoRA models
CREATE POLICY "Users can manage own training images" ON lora_training_images
    FOR ALL USING (
        lora_model_id IN (
            SELECT id FROM lora_models 
            WHERE user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
        )
    );

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

-- Function to get user's current credit balance efficiently
CREATE OR REPLACE FUNCTION get_user_credit_balance(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN COALESCE((SELECT credit_balance FROM users WHERE id = user_uuid), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has sufficient credits
CREATE OR REPLACE FUNCTION check_sufficient_credits(user_uuid UUID, required_credits INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_credit_balance(user_uuid) >= required_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deduct credits (used in job creation)
CREATE OR REPLACE FUNCTION deduct_credits(user_uuid UUID, credits_amount INTEGER, job_uuid UUID, transaction_reason TEXT DEFAULT 'job_charge')
RETURNS BOOLEAN AS $$
DECLARE
    current_balance INTEGER;
BEGIN
    -- Get current balance
    SELECT credit_balance INTO current_balance FROM users WHERE id = user_uuid;
    
    -- Check if sufficient credits
    IF current_balance < credits_amount THEN
        RETURN FALSE;
    END IF;
    
    -- Start transaction
    BEGIN
        -- Update user balance
        UPDATE users 
        SET credit_balance = credit_balance - credits_amount,
            updated_at = NOW()
        WHERE id = user_uuid;
        
        -- Record transaction
        INSERT INTO credits_ledger (user_id, delta, reason, job_id)
        VALUES (user_uuid, -credits_amount, transaction_reason, job_uuid);
        
        RETURN TRUE;
    EXCEPTION WHEN OTHERS THEN
        -- Rollback on error
        RETURN FALSE;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to estimate LoRA-enhanced generation cost
CREATE OR REPLACE FUNCTION estimate_lora_generation_cost(base_cost INTEGER, has_lora BOOLEAN)
RETURNS INTEGER AS $$
BEGIN
    IF has_lora THEN
        RETURN base_cost * 2; -- 2x multiplier for LoRA-enhanced generation
    ELSE
        RETURN base_cost;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can start LoRA training (business rule: one training per user at a time)
CREATE OR REPLACE FUNCTION can_start_lora_training(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    active_training_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO active_training_count
    FROM lora_models 
    WHERE user_id = user_uuid AND status = 'training';
    
    RETURN active_training_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate LoRA training images count
CREATE OR REPLACE FUNCTION validate_lora_training_images(model_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    valid_images_count INTEGER;
    total_images_count INTEGER;
BEGIN
    -- Count valid and total images
    SELECT 
        COUNT(CASE WHEN is_valid = true THEN 1 END),
        COUNT(*)
    INTO valid_images_count, total_images_count
    FROM lora_training_images 
    WHERE lora_model_id = model_uuid;
    
    -- Must have at least 5 valid images out of max 10
    RETURN valid_images_count >= 5 AND total_images_count <= 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's LoRA models with usage stats
CREATE OR REPLACE FUNCTION get_user_lora_models(user_uuid UUID)
RETURNS TABLE(
    id UUID,
    name TEXT,
    trigger_word TEXT,
    status TEXT,
    training_images_count INTEGER,
    generation_count INTEGER,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lm.id,
        lm.name,
        lm.trigger_word,
        lm.status,
        lm.training_images_count,
        lm.generation_count,
        lm.last_used_at,
        lm.created_at
    FROM lora_models lm
    WHERE lm.user_id = user_uuid
    ORDER BY 
        CASE 
            WHEN lm.status = 'ready' THEN 1
            WHEN lm.status = 'training' THEN 2
            ELSE 3
        END,
        lm.last_used_at DESC NULLS LAST,
        lm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update LoRA model usage after generation
CREATE OR REPLACE FUNCTION update_lora_usage(model_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE lora_models 
    SET 
        generation_count = generation_count + 1,
        last_used_at = NOW(),
        updated_at = NOW()
    WHERE id = model_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits (used in subscriptions, refunds, etc.)
CREATE OR REPLACE FUNCTION add_credits(user_uuid UUID, credits_amount INTEGER, transaction_reason TEXT, transaction_metadata JSONB DEFAULT '{}')
RETURNS BOOLEAN AS $$
BEGIN
    -- Start transaction
    BEGIN
        -- Update user balance
        UPDATE users 
        SET credit_balance = credit_balance + credits_amount,
            updated_at = NOW()
        WHERE id = user_uuid;
        
        -- Record transaction
        INSERT INTO credits_ledger (user_id, delta, reason, metadata)
        VALUES (user_uuid, credits_amount, transaction_reason, transaction_metadata);
        
        RETURN TRUE;
    EXCEPTION WHEN OTHERS THEN
        -- Rollback on error
        RETURN FALSE;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- INITIAL DATA SETUP
-- =============================================

-- Insert default style presets based on CLAUDE.md specifications
INSERT INTO presets (id, name, description, type, model_tier, cost_credits, params, sort_order) VALUES
('fashion-editorial', 'Fashion Editorial', 'High-fashion editorial style with professional lighting and composition', 'image', 'premium', 4, '{"guidance": 7.5, "steps": 50}', 1),
('gym-high-contrast', 'Gym High-Contrast', 'High-energy gym photography with dramatic contrast and lighting', 'image', 'base', 1, '{"guidance": 7.0, "steps": 30}', 2),
('warm-indoor', 'Warm Indoor', 'Cozy indoor atmosphere with warm, natural lighting', 'image', 'base', 1, '{"guidance": 6.5, "steps": 30}', 3),
('neon-night-street', 'Neon Night Street', 'Urban nightlife with vibrant neon lighting and street atmosphere', 'image', 'premium', 4, '{"guidance": 8.0, "steps": 50}', 4),
('travel-sunset', 'Travel Sunset', 'Golden hour travel photography with scenic backgrounds', 'image', 'base', 1, '{"guidance": 7.0, "steps": 30}', 5),
('studio-color-backdrop', 'Studio Color Backdrop', 'Professional studio setup with colorful backdrops', 'image', 'base', 1, '{"guidance": 6.5, "steps": 30}', 6),
-- LoRA Training preset
('lora-training', 'Personal LoRA Training', 'Train a personalized model from your selfies for consistent face generation', 'lora_training', 'premium', 150, '{"steps": 1000, "learning_rate": 0.0001}', 100),
-- LoRA-Enhanced Style Presets (2x cost multiplier applied)
('lora-fashion-editorial', 'Personal Fashion Editorial', 'Your face in high-fashion editorial style (requires trained LoRA)', 'image', 'premium', 8, '{"guidance": 7.5, "steps": 50, "lora_enabled": true}', 101),
('lora-gym-high-contrast', 'Personal Gym High-Contrast', 'Your face in high-energy gym photography (requires trained LoRA)', 'image', 'base', 2, '{"guidance": 7.0, "steps": 30, "lora_enabled": true}', 102),
('lora-warm-indoor', 'Personal Warm Indoor', 'Your face in cozy indoor atmosphere (requires trained LoRA)', 'image', 'base', 2, '{"guidance": 6.5, "steps": 30, "lora_enabled": true}', 103),
('lora-neon-night-street', 'Personal Neon Night Street', 'Your face in urban nightlife setting (requires trained LoRA)', 'image', 'premium', 8, '{"guidance": 8.0, "steps": 50, "lora_enabled": true}', 104),
('lora-travel-sunset', 'Personal Travel Sunset', 'Your face in golden hour travel photography (requires trained LoRA)', 'image', 'base', 2, '{"guidance": 7.0, "steps": 30, "lora_enabled": true}', 105),
('lora-studio-color-backdrop', 'Personal Studio Color Backdrop', 'Your face in professional studio setup (requires trained LoRA)', 'image', 'base', 2, '{"guidance": 6.5, "steps": 30, "lora_enabled": true}', 106);

-- =============================================
-- CONSTRAINTS AND BUSINESS RULES
-- =============================================

-- Ensure users can't have more than 2 running jobs (concurrency limit)
-- Special handling for LoRA training (only 1 allowed per user)
CREATE OR REPLACE FUNCTION check_job_concurrency_limit()
RETURNS TRIGGER AS $$
DECLARE
    running_jobs_count INTEGER;
    running_lora_training_count INTEGER;
BEGIN
    IF NEW.status = 'running' THEN
        -- General concurrency check (max 2 running jobs)
        SELECT COUNT(*) INTO running_jobs_count
        FROM jobs 
        WHERE user_id = NEW.user_id AND status = 'running' AND id != NEW.id;
        
        IF running_jobs_count >= 2 THEN
            RAISE EXCEPTION 'User cannot have more than 2 running jobs simultaneously';
        END IF;
        
        -- Special check for LoRA training (only 1 per user)
        IF NEW.subtype = 'lora_train' THEN
            SELECT COUNT(*) INTO running_lora_training_count
            FROM jobs 
            WHERE user_id = NEW.user_id 
            AND subtype = 'lora_train' 
            AND status = 'running' 
            AND id != NEW.id;
            
            IF running_lora_training_count >= 1 THEN
                RAISE EXCEPTION 'User cannot have more than 1 LoRA training job running';
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_job_concurrency_limit
    BEFORE INSERT OR UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION check_job_concurrency_limit();

-- Ensure credit balance consistency
CREATE OR REPLACE FUNCTION validate_credit_consistency()
RETURNS TRIGGER AS $$
DECLARE
    calculated_balance INTEGER;
    current_balance INTEGER;
BEGIN
    -- Calculate balance from ledger
    SELECT COALESCE(SUM(delta), 0) INTO calculated_balance
    FROM credits_ledger
    WHERE user_id = NEW.user_id;
    
    -- Get current balance
    SELECT credit_balance INTO current_balance
    FROM users
    WHERE id = NEW.user_id;
    
    -- Validate consistency (allow small discrepancies due to concurrent transactions)
    IF ABS(calculated_balance - current_balance) > 0 THEN
        -- Log inconsistency for investigation
        RAISE WARNING 'Credit balance inconsistency detected for user %. Calculated: %, Current: %', 
            NEW.user_id, calculated_balance, current_balance;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply credit consistency check on ledger inserts
CREATE TRIGGER validate_credit_consistency_trigger
    AFTER INSERT ON credits_ledger
    FOR EACH ROW EXECUTE FUNCTION validate_credit_consistency();

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- View for user profiles with subscription status
CREATE VIEW user_profiles AS
SELECT 
    u.id,
    u.clerk_id,
    u.email,
    u.plan,
    u.credit_balance,
    u.trial_ends_at,
    u.created_at,
    s.status as subscription_status,
    s.current_period_end as subscription_expires_at
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active';

-- View for job statistics per user
CREATE VIEW user_job_stats AS
SELECT 
    user_id,
    COUNT(*) as total_jobs,
    COUNT(CASE WHEN status = 'succeeded' THEN 1 END) as successful_jobs,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_jobs,
    COUNT(CASE WHEN status IN ('queued', 'running') THEN 1 END) as active_jobs,
    SUM(cost_credits) as total_credits_spent
FROM jobs
GROUP BY user_id;

-- View for recent activity (jobs + assets + lora models)
CREATE VIEW recent_activity AS
SELECT 
    'job' as activity_type,
    j.id,
    j.user_id,
    j.type || '_' || j.subtype as activity_subtype,
    j.status,
    j.created_at,
    j.completed_at
FROM jobs j
UNION ALL
SELECT 
    'asset' as activity_type,
    a.id,
    a.user_id,
    a.kind as activity_subtype,
    'completed' as status,
    a.created_at,
    a.created_at as completed_at
FROM assets a
UNION ALL
SELECT 
    'lora_model' as activity_type,
    lm.id,
    lm.user_id,
    'lora_' || lm.status as activity_subtype,
    lm.status,
    lm.created_at,
    CASE WHEN lm.status IN ('ready', 'failed') THEN lm.updated_at ELSE NULL END as completed_at
FROM lora_models lm
ORDER BY created_at DESC;

-- View for LoRA model statistics per user
CREATE VIEW user_lora_stats AS
SELECT 
    user_id,
    COUNT(*) as total_models,
    COUNT(CASE WHEN status = 'ready' THEN 1 END) as ready_models,
    COUNT(CASE WHEN status = 'training' THEN 1 END) as training_models,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_models,
    SUM(generation_count) as total_generations,
    SUM(training_cost_credits) as total_training_cost,
    MAX(last_used_at) as last_used_any_model
FROM lora_models
GROUP BY user_id;

-- View for LoRA training progress
CREATE VIEW lora_training_progress AS
SELECT 
    lm.id as model_id,
    lm.user_id,
    lm.name,
    lm.status,
    lm.training_images_count,
    COUNT(lti.id) as uploaded_images,
    COUNT(CASE WHEN lti.is_valid = true THEN 1 END) as valid_images,
    ARRAY_AGG(
        CASE WHEN lti.is_valid = false THEN lti.upload_order ELSE NULL END 
        ORDER BY lti.upload_order
    ) FILTER (WHERE lti.is_valid = false) as invalid_image_slots,
    lm.created_at,
    j.status as job_status,
    j.error as job_error
FROM lora_models lm
LEFT JOIN lora_training_images lti ON lm.id = lti.lora_model_id
LEFT JOIN jobs j ON lm.training_job_id = j.id
GROUP BY lm.id, lm.user_id, lm.name, lm.status, lm.training_images_count, lm.created_at, j.status, j.error;

-- =============================================
-- COMMENTS AND DOCUMENTATION
-- =============================================

COMMENT ON TABLE users IS 'Core user accounts integrated with Clerk authentication';
COMMENT ON TABLE subscriptions IS 'Stripe subscription management and billing';
COMMENT ON TABLE credits_ledger IS 'Comprehensive audit trail for all credit transactions';
COMMENT ON TABLE jobs IS 'AI generation job queue with Replicate integration';
COMMENT ON TABLE assets IS 'Generated content metadata with Supabase Storage paths';
COMMENT ON TABLE favorites IS 'User-favorited assets for quick access';
COMMENT ON TABLE presets IS 'Style presets for quick content generation';
COMMENT ON TABLE lora_models IS 'User-trained LoRA models for personalized content generation';
COMMENT ON TABLE lora_training_images IS 'Training images (selfies) for LoRA model training with validation metadata';

-- Additional column comments for LoRA tables
COMMENT ON COLUMN lora_models.trigger_word IS 'Unique identifier used in prompts to activate this LoRA model';
COMMENT ON COLUMN lora_models.generation_count IS 'Number of times this model has been used for generation (analytics)';
COMMENT ON COLUMN lora_models.training_cost_credits IS 'Credits charged for training this specific model';
COMMENT ON COLUMN lora_models.unique_user_active_training IS 'Ensures only one LoRA training per user at a time';
COMMENT ON COLUMN lora_training_images.upload_order IS 'Order of image upload (1-10), used for UI display and validation';
COMMENT ON COLUMN lora_training_images.face_detection_confidence IS 'ML confidence score for face detection, used for quality control';
COMMENT ON COLUMN lora_training_images.validation_notes IS 'Human-readable feedback on why an image may be invalid';

COMMENT ON COLUMN users.clerk_id IS 'Unique identifier from Clerk authentication service';
COMMENT ON COLUMN users.trial_ends_at IS 'Trial expiration date, NULL for paid users';
COMMENT ON COLUMN jobs.replicate_prediction_id IS 'External prediction ID from Replicate API';
COMMENT ON COLUMN assets.is_watermarked IS 'TRUE for trial user outputs, FALSE for paid users';
COMMENT ON COLUMN credits_ledger.delta IS 'Credit change: positive for grants, negative for charges';
COMMENT ON COLUMN jobs.subtype IS 'Job subtype including lora_t2i and lora_i2i for LoRA-enhanced generation';
COMMENT ON COLUMN credits_ledger.reason IS 'Transaction reason including lora_training_charge and lora_generation_charge';
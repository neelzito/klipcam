-- =============================================
-- LoRA Functionality Enhancement Migration
-- =============================================
-- This migration enhances the existing KlipCam database schema to support
-- comprehensive LoRA (Low-Rank Adaptation) functionality for personalized content generation

-- =============================================
-- STEP 1: UPDATE EXISTING ENUM VALUES
-- =============================================

-- Add new credit transaction reasons for LoRA operations
ALTER TABLE credits_ledger 
DROP CONSTRAINT credits_ledger_reason_check;

ALTER TABLE credits_ledger 
ADD CONSTRAINT credits_ledger_reason_check 
CHECK (reason IN ('trial_seed', 'subscription_grant', 'job_charge', 'job_refund', 'manual_adjust', 'lora_training_charge', 'lora_generation_charge'));

-- Add new job subtypes for LoRA-enhanced generation
ALTER TABLE jobs 
DROP CONSTRAINT jobs_subtype_check;

ALTER TABLE jobs 
ADD CONSTRAINT jobs_subtype_check 
CHECK (subtype IN ('t2i', 'i2i', 't2v', 'i2v', 'spider', 'upscale', 'lora_train', 'lora_t2i', 'lora_i2i'));

-- =============================================
-- STEP 2: ENHANCE LORA_MODELS TABLE
-- =============================================

-- Add new columns for enhanced LoRA functionality
ALTER TABLE lora_models 
ADD COLUMN generation_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN training_cost_credits INTEGER NOT NULL DEFAULT 150,
ADD COLUMN last_used_at TIMESTAMPTZ;

-- Add enhanced constraints
ALTER TABLE lora_models 
ADD CONSTRAINT check_training_images_minimum 
CHECK (training_images_count >= 1 OR status != 'ready');

-- Add business rule: only one active training per user
ALTER TABLE lora_models 
ADD CONSTRAINT unique_user_active_training 
UNIQUE NULLS NOT DISTINCT (user_id, CASE WHEN status = 'training' THEN 'training' ELSE NULL END);

-- Update existing constraint to include max limit
ALTER TABLE lora_models 
DROP CONSTRAINT IF EXISTS lora_models_training_images_count_check;

ALTER TABLE lora_models 
ADD CONSTRAINT lora_models_training_images_count_check 
CHECK (training_images_count <= 10);

-- =============================================
-- STEP 3: ENHANCE LORA_TRAINING_IMAGES TABLE
-- =============================================

-- Add new columns for better image management
ALTER TABLE lora_training_images 
ADD COLUMN upload_order INTEGER NOT NULL DEFAULT 1,
ADD COLUMN face_detection_confidence FLOAT,
ADD COLUMN is_valid BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN validation_notes TEXT;

-- Add constraints for data integrity
ALTER TABLE lora_training_images 
ADD CONSTRAINT lora_training_images_upload_order_check 
CHECK (upload_order >= 1 AND upload_order <= 10);

ALTER TABLE lora_training_images 
ADD CONSTRAINT unique_upload_order_per_model 
UNIQUE(lora_model_id, upload_order);

-- Update existing constraints to be more robust
ALTER TABLE lora_training_images 
ALTER COLUMN width ADD CONSTRAINT lora_training_images_width_check CHECK (width > 0);

ALTER TABLE lora_training_images 
ALTER COLUMN height ADD CONSTRAINT lora_training_images_height_check CHECK (height > 0);

ALTER TABLE lora_training_images 
ALTER COLUMN size_bytes ADD CONSTRAINT lora_training_images_size_bytes_check CHECK (size_bytes > 0);

-- =============================================
-- STEP 4: CREATE ADDITIONAL INDEXES
-- =============================================

-- Enhanced LoRA models indexes for performance
CREATE INDEX IF NOT EXISTS idx_lora_models_last_used_at ON lora_models(last_used_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_lora_models_generation_count ON lora_models(generation_count DESC);
CREATE INDEX IF NOT EXISTS idx_lora_models_user_status ON lora_models(user_id, status);
CREATE INDEX IF NOT EXISTS idx_lora_models_ready_public ON lora_models(status, is_public) WHERE status = 'ready';

-- Enhanced training images indexes
CREATE INDEX IF NOT EXISTS idx_lora_training_images_upload_order ON lora_training_images(lora_model_id, upload_order);
CREATE INDEX IF NOT EXISTS idx_lora_training_images_validation ON lora_training_images(lora_model_id, is_valid);

-- =============================================
-- STEP 5: CREATE NEW UTILITY FUNCTIONS
-- =============================================

-- Function to check if user can start LoRA training
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
    SELECT 
        COUNT(CASE WHEN is_valid = true THEN 1 END),
        COUNT(*)
    INTO valid_images_count, total_images_count
    FROM lora_training_images 
    WHERE lora_model_id = model_uuid;
    
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

-- =============================================
-- STEP 6: UPDATE EXISTING TRIGGERS
-- =============================================

-- Enhanced job concurrency check to handle LoRA training limits
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

-- =============================================
-- STEP 7: CREATE ENHANCED VIEWS
-- =============================================

-- Enhanced recent activity view including LoRA models
DROP VIEW IF EXISTS recent_activity;
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

-- New view for LoRA model statistics per user
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

-- New view for LoRA training progress tracking
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
-- STEP 8: INSERT LORA-ENHANCED PRESETS
-- =============================================

-- Add LoRA-enhanced versions of existing presets with 2x cost multiplier
INSERT INTO presets (id, name, description, type, model_tier, cost_credits, params, sort_order, is_active) VALUES
('lora-fashion-editorial', 'Personal Fashion Editorial', 'Your face in high-fashion editorial style (requires trained LoRA)', 'image', 'premium', 8, '{"guidance": 7.5, "steps": 50, "lora_enabled": true}', 101, true),
('lora-gym-high-contrast', 'Personal Gym High-Contrast', 'Your face in high-energy gym photography (requires trained LoRA)', 'image', 'base', 2, '{"guidance": 7.0, "steps": 30, "lora_enabled": true}', 102, true),
('lora-warm-indoor', 'Personal Warm Indoor', 'Your face in cozy indoor atmosphere (requires trained LoRA)', 'image', 'base', 2, '{"guidance": 6.5, "steps": 30, "lora_enabled": true}', 103, true),
('lora-neon-night-street', 'Personal Neon Night Street', 'Your face in urban nightlife setting (requires trained LoRA)', 'image', 'premium', 8, '{"guidance": 8.0, "steps": 50, "lora_enabled": true}', 104, true),
('lora-travel-sunset', 'Personal Travel Sunset', 'Your face in golden hour travel photography (requires trained LoRA)', 'image', 'base', 2, '{"guidance": 7.0, "steps": 30, "lora_enabled": true}', 105, true),
('lora-studio-color-backdrop', 'Personal Studio Color Backdrop', 'Your face in professional studio setup (requires trained LoRA)', 'image', 'base', 2, '{"guidance": 6.5, "steps": 30, "lora_enabled": true}', 106, true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STEP 9: UPDATE COMMENTS AND DOCUMENTATION
-- =============================================

COMMENT ON TABLE lora_models IS 'User-trained LoRA models for personalized content generation';
COMMENT ON TABLE lora_training_images IS 'Training images (selfies) for LoRA model training with validation metadata';

COMMENT ON COLUMN lora_models.trigger_word IS 'Unique identifier used in prompts to activate this LoRA model';
COMMENT ON COLUMN lora_models.generation_count IS 'Number of times this model has been used for generation (analytics)';
COMMENT ON COLUMN lora_models.training_cost_credits IS 'Credits charged for training this specific model';
COMMENT ON COLUMN lora_training_images.upload_order IS 'Order of image upload (1-10), used for UI display and validation';
COMMENT ON COLUMN lora_training_images.face_detection_confidence IS 'ML confidence score for face detection, used for quality control';
COMMENT ON COLUMN lora_training_images.validation_notes IS 'Human-readable feedback on why an image may be invalid';

COMMENT ON COLUMN jobs.subtype IS 'Job subtype including lora_t2i and lora_i2i for LoRA-enhanced generation';
COMMENT ON COLUMN credits_ledger.reason IS 'Transaction reason including lora_training_charge and lora_generation_charge';

-- =============================================
-- MIGRATION COMPLETE
-- =============================================

-- Verify the migration by checking key constraints and indexes
SELECT 
    'Migration completed successfully. LoRA enhancements applied.' as status,
    COUNT(*) as lora_enhanced_presets
FROM presets 
WHERE id LIKE 'lora-%';
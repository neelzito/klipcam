# LoRA Database Schema Implementation

## Overview

This document outlines the comprehensive database schema enhancements for LoRA (Low-Rank Adaptation) functionality in the KlipCam Creator AI platform. The schema supports the complete workflow: **upload 10 selfies → train LoRA → generate enhanced content**.

## Key Features Supported

- **LoRA Model Management**: Training status, Replicate model IDs, lifecycle management
- **Training Image Management**: 10 selfie uploads per LoRA with validation
- **Credit System Integration**: 150 credits for training, 2x multiplier for generation
- **Training Queue Management**: One training per user at a time
- **Model Lifecycle**: Active, archived, failed states with analytics

## Database Schema Changes

### 1. Enhanced Existing Tables

#### `credits_ledger` Table Updates
```sql
-- Added new credit transaction reasons
reason TEXT NOT NULL CHECK (reason IN (
    'trial_seed', 'subscription_grant', 'job_charge', 'job_refund', 'manual_adjust',
    'lora_training_charge', 'lora_generation_charge'  -- New LoRA-specific reasons
))
```

#### `jobs` Table Updates  
```sql
-- Added new job subtypes for LoRA operations
subtype TEXT NOT NULL CHECK (subtype IN (
    't2i', 'i2i', 't2v', 'i2v', 'spider', 'upscale', 'lora_train',
    'lora_t2i', 'lora_i2i'  -- New LoRA-enhanced generation subtypes
))
```

### 2. Enhanced LoRA Tables

#### `lora_models` Table
```sql
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
    -- Business rule constraints
    CONSTRAINT check_training_images_minimum CHECK (training_images_count >= 1 OR status != 'ready'),
    CONSTRAINT unique_user_active_training UNIQUE NULLS NOT DISTINCT (user_id, CASE WHEN status = 'training' THEN 'training' ELSE NULL END)
);
```

**Key Features:**
- **Business Rule Enforcement**: Only one training per user at a time
- **Usage Analytics**: Track generation count and last used timestamp  
- **Credit Tracking**: Store training cost for financial analytics
- **Validation**: Ensure minimum images before marking as ready

#### `lora_training_images` Table
```sql
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
```

**Key Features:**
- **Ordered Upload System**: 1-10 slots per model with unique ordering
- **Quality Control**: Face detection confidence and validation flags
- **Storage Management**: Both original and processed image paths
- **Validation Feedback**: Human-readable notes for invalid images

## Business Rules Implementation

### 1. Training Concurrency Limits
```sql
-- Enhanced trigger function
CREATE OR REPLACE FUNCTION check_job_concurrency_limit()
RETURNS TRIGGER AS $$
BEGIN
    -- General: Max 2 running jobs per user
    -- Special: Only 1 LoRA training per user
    IF NEW.subtype = 'lora_train' AND running_lora_training_count >= 1 THEN
        RAISE EXCEPTION 'User cannot have more than 1 LoRA training job running';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 2. Credit System Integration
- **Training Cost**: Fixed 150 credits per LoRA model
- **Generation Cost**: 2x multiplier on base preset costs
- **Automatic Deduction**: Credits charged when training/generation starts
- **Refund System**: Credits refunded if jobs fail

### 3. Image Validation Requirements
- **Minimum Count**: 5 valid images required (out of 10 max)
- **Quality Control**: Face detection confidence scoring
- **Format Validation**: Image dimensions, file size limits
- **Aspect Ratio**: Roughly square images preferred for face training

## Performance Optimizations

### Indexes
```sql
-- Core LoRA model performance indexes
CREATE INDEX idx_lora_models_user_status ON lora_models(user_id, status);
CREATE INDEX idx_lora_models_ready_public ON lora_models(status, is_public) WHERE status = 'ready';
CREATE INDEX idx_lora_models_last_used_at ON lora_models(last_used_at DESC NULLS LAST);
CREATE INDEX idx_lora_models_generation_count ON lora_models(generation_count DESC);

-- Training image performance indexes  
CREATE INDEX idx_lora_training_images_upload_order ON lora_training_images(lora_model_id, upload_order);
CREATE INDEX idx_lora_training_images_validation ON lora_training_images(lora_model_id, is_valid);
```

### Database Functions
```sql
-- High-performance utility functions
CREATE FUNCTION can_start_lora_training(user_uuid UUID) RETURNS BOOLEAN;
CREATE FUNCTION validate_lora_training_images(model_uuid UUID) RETURNS BOOLEAN;
CREATE FUNCTION get_user_lora_models(user_uuid UUID) RETURNS TABLE(...);
CREATE FUNCTION update_lora_usage(model_uuid UUID) RETURNS BOOLEAN;
CREATE FUNCTION estimate_lora_generation_cost(base_cost INTEGER, has_lora BOOLEAN) RETURNS INTEGER;
```

## Analytics and Reporting Views

### 1. User LoRA Statistics
```sql
CREATE VIEW user_lora_stats AS
SELECT 
    user_id,
    COUNT(*) as total_models,
    COUNT(CASE WHEN status = 'ready' THEN 1 END) as ready_models,
    COUNT(CASE WHEN status = 'training' THEN 1 END) as training_models,
    SUM(generation_count) as total_generations,
    SUM(training_cost_credits) as total_training_cost,
    MAX(last_used_at) as last_used_any_model
FROM lora_models
GROUP BY user_id;
```

### 2. Training Progress Tracking
```sql
CREATE VIEW lora_training_progress AS
SELECT 
    lm.id as model_id,
    lm.user_id,
    lm.name,
    lm.status,
    COUNT(lti.id) as uploaded_images,
    COUNT(CASE WHEN lti.is_valid = true THEN 1 END) as valid_images,
    ARRAY_AGG(...) as invalid_image_slots,
    j.status as job_status,
    j.error as job_error
FROM lora_models lm
LEFT JOIN lora_training_images lti ON lm.id = lti.lora_model_id
LEFT JOIN jobs j ON lm.training_job_id = j.id
GROUP BY lm.id, ...;
```

### 3. Enhanced Activity Feed
```sql
CREATE VIEW recent_activity AS
-- Includes LoRA training events alongside jobs and assets
SELECT 'lora_model' as activity_type, ...
FROM lora_models
UNION ALL
-- Existing job and asset activities
...
```

## Preset System Enhancement

### LoRA-Enhanced Presets
The schema includes LoRA-enhanced versions of all existing presets with 2x cost multiplier:

```sql
INSERT INTO presets VALUES
('lora-fashion-editorial', 'Personal Fashion Editorial', ..., 8), -- 4 * 2
('lora-gym-high-contrast', 'Personal Gym High-Contrast', ..., 2), -- 1 * 2
('lora-warm-indoor', 'Personal Warm Indoor', ..., 2), -- 1 * 2
-- ... etc for all 6 base presets
```

**Features:**
- **Automatic Cost Calculation**: 2x multiplier applied to base preset costs
- **LoRA Flag**: `params` include `"lora_enabled": true` for identification
- **UI Grouping**: Sort order 100+ for separate section in UI

## Security Implementation

### Row Level Security (RLS)
```sql
-- LoRA Models: Users can only manage their own models
CREATE POLICY "Users can manage own lora models" ON lora_models
FOR ALL USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text));

-- Public Models: All authenticated users can view public models  
CREATE POLICY "Authenticated users can view public lora models" ON lora_models
FOR SELECT USING (is_public = true AND auth.uid() IS NOT NULL);

-- Training Images: Users can only manage images for their own models
CREATE POLICY "Users can manage own training images" ON lora_training_images
FOR ALL USING (lora_model_id IN (...));
```

## API Integration Points

### Key Utility Functions Available
The `lib/database/lora-utils.ts` provides comprehensive TypeScript utilities:

#### Model Management
- `canStartLoRATraining(userId)` - Check training eligibility
- `getUserLoRAModels(userId)` - Get user's models with stats
- `createLoRAModel(userId, name, triggerWord)` - Create new model
- `updateLoRAUsage(modelId)` - Track generation usage

#### Training Images  
- `addTrainingImage(modelId, imageData)` - Add selfie to training set
- `validateTrainingImage(imageId, isValid, notes)` - Mark image valid/invalid
- `validateLoRATrainingImages(modelId)` - Check minimum requirements

#### Credit Management
- `calculateLoRAGenerationCost(baseCost, hasLoRA)` - Apply 2x multiplier
- `chargeLoRATrainingCredits(userId, jobId)` - Charge 150 credits
- `chargeLoRAGenerationCredits(userId, jobId, cost)` - Charge generation

## Migration Strategy

The schema changes are implemented via `/migrations/001_lora_enhancements.sql`:

1. **Backward Compatible**: Extends existing tables without breaking changes
2. **Incremental Application**: Can be applied to production without downtime  
3. **Rollback Support**: All changes can be reversed if needed
4. **Data Integrity**: Includes validation checks and constraints

## Creator Workflow Support

The schema fully supports the target workflow:

### 1. Upload 10 Selfies
```typescript
// Add images with validation
for (let i = 1; i <= 10; i++) {
  await addTrainingImage(modelId, {
    original_path: `selfies/user_${userId}/image_${i}.jpg`,
    upload_order: i,
    width: 1024,
    height: 1024,
    size_bytes: 2048576,
    face_detection_confidence: 0.95
  });
}
```

### 2. Train LoRA  
```typescript
// Check eligibility and create training job
const { canStart } = await canStartLoRATraining(userId);
if (canStart) {
  const { success } = await chargeLoRATrainingCredits(userId, jobId, 150);
  if (success) {
    // Start Replicate training job
  }
}
```

### 3. Generate Enhanced Content
```typescript
// Use LoRA for personalized generation
const cost = await calculateLoRAGenerationCost(4, true); // 4 * 2 = 8 credits
await chargeLoRAGenerationCredits(userId, jobId, cost);
await updateLoRAUsage(modelId); // Track usage analytics
```

## Conclusion

This LoRA database schema implementation provides:

- ✅ **Complete Workflow Support**: Selfie upload → training → generation
- ✅ **Business Rule Enforcement**: One training per user, minimum image requirements
- ✅ **Credit System Integration**: Transparent pricing with 2x multiplier
- ✅ **Performance Optimization**: Comprehensive indexing strategy
- ✅ **Analytics Foundation**: Usage tracking and reporting views
- ✅ **Security**: Row-level security with user data isolation
- ✅ **Scalability**: Designed for high-volume creator usage

The schema seamlessly integrates with the existing KlipCam infrastructure and supports rapid iteration on LoRA features while maintaining data integrity and performance.
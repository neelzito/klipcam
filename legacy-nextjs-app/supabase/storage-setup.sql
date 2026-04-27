-- KlipCam Storage Buckets Setup
-- Execute this in your Supabase SQL Editor AFTER running the main schema

-- Create storage buckets for KlipCam
-- Note: You may need to create these manually in the Supabase Dashboard > Storage

-- Storage bucket policies for generated content
-- Bucket: 'generated' - for AI-generated images and videos

-- Allow users to read their own generated content
CREATE POLICY "Users can view own generated content" ON storage.objects
FOR SELECT USING (
    bucket_id = 'generated' AND
    (storage.foldername(name))[1] = 'user_' || (
        SELECT id::text FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
    )
);

-- Allow service role to manage all files
CREATE POLICY "Service role can manage all generated content" ON storage.objects
FOR ALL USING (bucket_id = 'generated' AND auth.role() = 'service_role');

-- Allow users to upload profile images
-- Bucket: 'profiles' - for user profile pictures

CREATE POLICY "Users can view all profile images" ON storage.objects
FOR SELECT USING (bucket_id = 'profiles');

CREATE POLICY "Users can upload own profile image" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'profiles' AND
    (storage.foldername(name))[1] = (
        SELECT id::text FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
    )
);

CREATE POLICY "Users can update own profile image" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'profiles' AND
    (storage.foldername(name))[1] = (
        SELECT id::text FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
    )
);

CREATE POLICY "Users can delete own profile image" ON storage.objects
FOR DELETE USING (
    bucket_id = 'profiles' AND
    (storage.foldername(name))[1] = (
        SELECT id::text FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
    )
);

-- Allow users to upload reference images for I2I
-- Bucket: 'references' - for user-uploaded reference images

CREATE POLICY "Users can view own reference images" ON storage.objects
FOR SELECT USING (
    bucket_id = 'references' AND
    (storage.foldername(name))[1] = (
        SELECT id::text FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
    )
);

CREATE POLICY "Users can upload reference images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'references' AND
    (storage.foldername(name))[1] = (
        SELECT id::text FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
    )
);

CREATE POLICY "Users can delete own reference images" ON storage.objects
FOR DELETE USING (
    bucket_id = 'references' AND
    (storage.foldername(name))[1] = (
        SELECT id::text FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
    )
);

-- Bucket: 'lora-training' - for LoRA training images (future feature)

CREATE POLICY "Users can manage own LoRA training images" ON storage.objects
FOR ALL USING (
    bucket_id = 'lora-training' AND
    (storage.foldername(name))[1] = (
        SELECT id::text FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
    )
);

-- =====================================================================
-- STORAGE HELPER FUNCTIONS
-- =====================================================================

-- Function to get user's storage path
CREATE OR REPLACE FUNCTION get_user_storage_path(user_clerk_id TEXT, bucket TEXT DEFAULT 'generated')
RETURNS TEXT AS $$
DECLARE
    user_uuid UUID;
BEGIN
    SELECT id INTO user_uuid FROM users WHERE clerk_user_id = user_clerk_id;
    
    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'User not found for clerk_user_id: %', user_clerk_id;
    END IF;
    
    RETURN bucket || '/user_' || user_uuid::text;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired assets
CREATE OR REPLACE FUNCTION cleanup_expired_assets()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    -- Get count of expired assets
    SELECT COUNT(*) INTO expired_count
    FROM assets
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    -- Delete expired assets from database
    DELETE FROM assets
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    -- Note: You should also delete the actual files from storage
    -- This can be done via a cron job or Edge Function
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate user's storage usage
CREATE OR REPLACE FUNCTION get_user_storage_usage(user_clerk_id TEXT)
RETURNS TABLE(
    total_files INTEGER,
    total_size_bytes BIGINT,
    total_size_mb NUMERIC,
    images_count INTEGER,
    videos_count INTEGER,
    favorites_count INTEGER
) AS $$
DECLARE
    user_uuid UUID;
BEGIN
    SELECT id INTO user_uuid FROM users WHERE clerk_user_id = user_clerk_id;
    
    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'User not found for clerk_user_id: %', user_clerk_id;
    END IF;
    
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_files,
        COALESCE(SUM(file_size), 0) as total_size_bytes,
        ROUND(COALESCE(SUM(file_size), 0) / 1048576.0, 2) as total_size_mb,
        COUNT(*) FILTER (WHERE type = 'image')::INTEGER as images_count,
        COUNT(*) FILTER (WHERE type = 'video')::INTEGER as videos_count,
        COUNT(*) FILTER (WHERE is_favorite = true)::INTEGER as favorites_count
    FROM assets
    WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- STORAGE MAINTENANCE
-- =====================================================================

-- Create a function to be called by cron or Edge Function
-- to clean up orphaned storage files
CREATE OR REPLACE FUNCTION maintenance_cleanup_storage()
RETURNS JSON AS $$
DECLARE
    result JSON;
    expired_assets_count INTEGER;
BEGIN
    -- Clean up expired assets
    SELECT cleanup_expired_assets() INTO expired_assets_count;
    
    -- You can add more cleanup logic here
    -- For example, cleaning up orphaned files, compressing old files, etc.
    
    result := json_build_object(
        'expired_assets_cleaned', expired_assets_count,
        'cleanup_timestamp', NOW(),
        'status', 'completed'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
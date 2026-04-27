-- Row Level Security (RLS) Policies for KlipCam
-- This file sets up security policies to ensure users can only access their own data

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user ID from Clerk
CREATE OR REPLACE FUNCTION get_current_user_id() RETURNS TEXT AS $$
BEGIN
  -- This will be set by the application when making requests
  RETURN current_setting('request.jwt.claims', true)::JSON ->> 'sub';
EXCEPTION
  WHEN others THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (id = get_current_user_id());

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (id = get_current_user_id());

-- System/service role can manage users (for Clerk webhook)
CREATE POLICY "Service role can manage users" ON users
  FOR ALL USING (current_user = 'service_role');

-- Subscriptions table policies
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (user_id = get_current_user_id());

CREATE POLICY "Service role can manage subscriptions" ON subscriptions
  FOR ALL USING (current_user = 'service_role');

-- Credits ledger policies
CREATE POLICY "Users can view their own credit history" ON credits_ledger
  FOR SELECT USING (user_id = get_current_user_id());

CREATE POLICY "Service role can manage credit ledger" ON credits_ledger
  FOR ALL USING (current_user = 'service_role');

-- Jobs table policies
CREATE POLICY "Users can view their own jobs" ON jobs
  FOR SELECT USING (user_id = get_current_user_id());

CREATE POLICY "Users can create their own jobs" ON jobs
  FOR INSERT WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Users can update their own jobs" ON jobs
  FOR UPDATE USING (user_id = get_current_user_id());

CREATE POLICY "Service role can manage jobs" ON jobs
  FOR ALL USING (current_user = 'service_role');

-- Assets table policies
CREATE POLICY "Users can view their own assets" ON assets
  FOR SELECT USING (user_id = get_current_user_id());

CREATE POLICY "Users can update their own assets" ON assets
  FOR UPDATE USING (user_id = get_current_user_id());

CREATE POLICY "Service role can manage assets" ON assets
  FOR ALL USING (current_user = 'service_role');

-- Favorites table policies
CREATE POLICY "Users can manage their own favorites" ON favorites
  FOR ALL USING (user_id = get_current_user_id());

-- User settings policies
CREATE POLICY "Users can manage their own settings" ON user_settings
  FOR ALL USING (user_id = get_current_user_id());

-- API keys policies
CREATE POLICY "Users can manage their own API keys" ON api_keys
  FOR ALL USING (user_id = get_current_user_id());

-- Storage bucket policies (for Supabase Storage)
-- These policies will be created in the Supabase dashboard or via the management API

-- Create storage bucket for generated assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generated',
  'generated',
  false, -- Private bucket
  10485760, -- 10MB limit per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for the 'generated' bucket
CREATE POLICY "Users can upload to their own folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'generated' AND 
  (storage.foldername(name))[1] = get_current_user_id()
);

CREATE POLICY "Users can view their own files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'generated' AND 
  (storage.foldername(name))[1] = get_current_user_id()
);

CREATE POLICY "Users can update their own files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'generated' AND 
  (storage.foldername(name))[1] = get_current_user_id()
);

CREATE POLICY "Users can delete their own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'generated' AND 
  (storage.foldername(name))[1] = get_current_user_id()
);

-- Service role can manage all files (for cleanup, etc.)
CREATE POLICY "Service role can manage all files" ON storage.objects
FOR ALL USING (current_user = 'service_role');

-- Realtime subscriptions (if using Supabase Realtime)
-- Users can only subscribe to their own data
CREATE OR REPLACE FUNCTION can_subscribe_to_table(table_name TEXT, user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Only allow subscriptions to user's own data
  RETURN user_id = get_current_user_id();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant table permissions to authenticated users
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON subscriptions TO authenticated;
GRANT SELECT ON credits_ledger TO authenticated;
GRANT SELECT, INSERT, UPDATE ON jobs TO authenticated;
GRANT SELECT, UPDATE ON assets TO authenticated;
GRANT ALL ON favorites TO authenticated;
GRANT ALL ON user_settings TO authenticated;
GRANT ALL ON api_keys TO authenticated;

-- Grant full permissions to service role for webhooks and background jobs
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Grant storage permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Create indexes for RLS performance
CREATE INDEX IF NOT EXISTS idx_rls_users_id ON users(id);
CREATE INDEX IF NOT EXISTS idx_rls_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_rls_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_rls_credits_ledger_user_id ON credits_ledger(user_id);
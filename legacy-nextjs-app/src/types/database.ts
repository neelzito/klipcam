export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
          plan: 'trial' | 'pro' | 'cancelled';
          credit_balance: number;
          total_credits_purchased: number;
          total_credits_used: number;
          subscription_id: string | null;
          customer_id: string | null;
          trial_ends_at: string | null;
          subscription_current_period_start: string | null;
          subscription_current_period_end: string | null;
          created_at: string;
          updated_at: string;
          last_sign_in_at: string | null;
          metadata: Record<string, any> | null;
        };
        Insert: {
          id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          plan?: 'trial' | 'pro' | 'cancelled';
          credit_balance?: number;
          total_credits_purchased?: number;
          total_credits_used?: number;
          subscription_id?: string | null;
          customer_id?: string | null;
          trial_ends_at?: string | null;
          subscription_current_period_start?: string | null;
          subscription_current_period_end?: string | null;
          last_sign_in_at?: string | null;
          metadata?: Record<string, any> | null;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          plan?: 'trial' | 'pro' | 'cancelled';
          credit_balance?: number;
          total_credits_purchased?: number;
          total_credits_used?: number;
          subscription_id?: string | null;
          customer_id?: string | null;
          trial_ends_at?: string | null;
          subscription_current_period_start?: string | null;
          subscription_current_period_end?: string | null;
          last_sign_in_at?: string | null;
          metadata?: Record<string, any> | null;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          customer_id: string;
          status: string;
          plan_id: string;
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end: boolean;
          canceled_at: string | null;
          created_at: string;
          updated_at: string;
          metadata: Record<string, any> | null;
        };
        Insert: {
          id: string;
          user_id: string;
          customer_id: string;
          status: string;
          plan_id: string;
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          metadata?: Record<string, any> | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          customer_id?: string;
          status?: string;
          plan_id?: string;
          current_period_start?: string;
          current_period_end?: string;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          metadata?: Record<string, any> | null;
        };
      };
      credits_ledger: {
        Row: {
          id: string;
          user_id: string;
          transaction_type: 'purchase' | 'usage' | 'refund' | 'bonus' | 'subscription';
          amount: number;
          balance_after: number;
          description: string;
          job_id: string | null;
          stripe_payment_intent_id: string | null;
          created_at: string;
          metadata: Record<string, any> | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          transaction_type: 'purchase' | 'usage' | 'refund' | 'bonus' | 'subscription';
          amount: number;
          balance_after: number;
          description: string;
          job_id?: string | null;
          stripe_payment_intent_id?: string | null;
          metadata?: Record<string, any> | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          transaction_type?: 'purchase' | 'usage' | 'refund' | 'bonus' | 'subscription';
          amount?: number;
          balance_after?: number;
          description?: string;
          job_id?: string | null;
          stripe_payment_intent_id?: string | null;
          metadata?: Record<string, any> | null;
        };
      };
      jobs: {
        Row: {
          id: string;
          user_id: string;
          type: 'image' | 'video' | 'upscale' | 'spider';
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
          prompt: string | null;
          negative_prompt: string | null;
          preset_id: string | null;
          aspect_ratio: string;
          reference_image_url: string | null;
          replicate_prediction_id: string | null;
          replicate_model: string | null;
          replicate_version: string | null;
          estimated_cost: number;
          actual_cost: number | null;
          output_urls: string[] | null;
          error_message: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
          generation_params: Record<string, any> | null;
          metadata: Record<string, any> | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'image' | 'video' | 'upscale' | 'spider';
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
          prompt?: string | null;
          negative_prompt?: string | null;
          preset_id?: string | null;
          aspect_ratio?: string;
          reference_image_url?: string | null;
          replicate_prediction_id?: string | null;
          replicate_model?: string | null;
          replicate_version?: string | null;
          estimated_cost: number;
          actual_cost?: number | null;
          output_urls?: string[] | null;
          error_message?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          generation_params?: Record<string, any> | null;
          metadata?: Record<string, any> | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'image' | 'video' | 'upscale' | 'spider';
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
          prompt?: string | null;
          negative_prompt?: string | null;
          preset_id?: string | null;
          aspect_ratio?: string;
          reference_image_url?: string | null;
          replicate_prediction_id?: string | null;
          replicate_model?: string | null;
          replicate_version?: string | null;
          estimated_cost?: number;
          actual_cost?: number | null;
          output_urls?: string[] | null;
          error_message?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          generation_params?: Record<string, any> | null;
          metadata?: Record<string, any> | null;
        };
      };
      assets: {
        Row: {
          id: string;
          user_id: string;
          job_id: string;
          type: 'image' | 'video';
          filename: string;
          original_filename: string | null;
          file_size: number | null;
          mime_type: string | null;
          width: number | null;
          height: number | null;
          duration: number | null;
          storage_path: string;
          public_url: string | null;
          download_url: string | null;
          thumbnail_url: string | null;
          is_favorite: boolean;
          is_watermarked: boolean;
          download_count: number;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
          exif_data: Record<string, any> | null;
          metadata: Record<string, any> | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          job_id: string;
          type: 'image' | 'video';
          filename: string;
          original_filename?: string | null;
          file_size?: number | null;
          mime_type?: string | null;
          width?: number | null;
          height?: number | null;
          duration?: number | null;
          storage_path: string;
          public_url?: string | null;
          download_url?: string | null;
          thumbnail_url?: string | null;
          is_favorite?: boolean;
          is_watermarked?: boolean;
          download_count?: number;
          expires_at?: string | null;
          exif_data?: Record<string, any> | null;
          metadata?: Record<string, any> | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          job_id?: string;
          type?: 'image' | 'video';
          filename?: string;
          original_filename?: string | null;
          file_size?: number | null;
          mime_type?: string | null;
          width?: number | null;
          height?: number | null;
          duration?: number | null;
          storage_path?: string;
          public_url?: string | null;
          download_url?: string | null;
          thumbnail_url?: string | null;
          is_favorite?: boolean;
          is_watermarked?: boolean;
          download_count?: number;
          expires_at?: string | null;
          exif_data?: Record<string, any> | null;
          metadata?: Record<string, any> | null;
        };
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          asset_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          asset_id: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          asset_id?: string;
        };
      };
      user_settings: {
        Row: {
          user_id: string;
          email_notifications: boolean;
          marketing_emails: boolean;
          default_aspect_ratio: string;
          auto_upscale: boolean;
          watermark_preference: boolean;
          profile_visibility: string;
          allow_data_training: boolean;
          created_at: string;
          updated_at: string;
          settings: Record<string, any> | null;
        };
        Insert: {
          user_id: string;
          email_notifications?: boolean;
          marketing_emails?: boolean;
          default_aspect_ratio?: string;
          auto_upscale?: boolean;
          watermark_preference?: boolean;
          profile_visibility?: string;
          allow_data_training?: boolean;
          settings?: Record<string, any> | null;
        };
        Update: {
          user_id?: string;
          email_notifications?: boolean;
          marketing_emails?: boolean;
          default_aspect_ratio?: string;
          auto_upscale?: boolean;
          watermark_preference?: boolean;
          profile_visibility?: string;
          allow_data_training?: boolean;
          settings?: Record<string, any> | null;
        };
      };
      api_keys: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          scopes: string[];
          rate_limit: number;
          is_active: boolean;
          last_used_at: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
          metadata: Record<string, any> | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          scopes?: string[];
          rate_limit?: number;
          is_active?: boolean;
          last_used_at?: string | null;
          expires_at?: string | null;
          metadata?: Record<string, any> | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          key_hash?: string;
          key_prefix?: string;
          scopes?: string[];
          rate_limit?: number;
          is_active?: boolean;
          last_used_at?: string | null;
          expires_at?: string | null;
          metadata?: Record<string, any> | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      add_credits: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_transaction_type: 'purchase' | 'usage' | 'refund' | 'bonus' | 'subscription';
          p_description: string;
          p_stripe_payment_intent_id?: string | null;
        };
        Returns: void;
      };
      use_credits: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_description: string;
          p_job_id?: string | null;
        };
        Returns: boolean;
      };
      cleanup_expired_assets: {
        Args: {};
        Returns: void;
      };
      get_current_user_id: {
        Args: {};
        Returns: string | null;
      };
    };
    Enums: {
      user_plan: 'trial' | 'pro' | 'cancelled';
      job_status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
      job_type: 'image' | 'video' | 'upscale' | 'spider';
      asset_type: 'image' | 'video';
      transaction_type: 'purchase' | 'usage' | 'refund' | 'bonus' | 'subscription';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Helper types for easier use
export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert'];
export type SubscriptionUpdate = Database['public']['Tables']['subscriptions']['Update'];

export type CreditTransaction = Database['public']['Tables']['credits_ledger']['Row'];
export type CreditTransactionInsert = Database['public']['Tables']['credits_ledger']['Insert'];
export type CreditTransactionUpdate = Database['public']['Tables']['credits_ledger']['Update'];

export type Job = Database['public']['Tables']['jobs']['Row'];
export type JobInsert = Database['public']['Tables']['jobs']['Insert'];
export type JobUpdate = Database['public']['Tables']['jobs']['Update'];

export type Asset = Database['public']['Tables']['assets']['Row'];
export type AssetInsert = Database['public']['Tables']['assets']['Insert'];
export type AssetUpdate = Database['public']['Tables']['assets']['Update'];

export type Favorite = Database['public']['Tables']['favorites']['Row'];
export type FavoriteInsert = Database['public']['Tables']['favorites']['Insert'];
export type FavoriteUpdate = Database['public']['Tables']['favorites']['Update'];

export type UserSettings = Database['public']['Tables']['user_settings']['Row'];
export type UserSettingsInsert = Database['public']['Tables']['user_settings']['Insert'];
export type UserSettingsUpdate = Database['public']['Tables']['user_settings']['Update'];

export type ApiKey = Database['public']['Tables']['api_keys']['Row'];
export type ApiKeyInsert = Database['public']['Tables']['api_keys']['Insert'];
export type ApiKeyUpdate = Database['public']['Tables']['api_keys']['Update'];
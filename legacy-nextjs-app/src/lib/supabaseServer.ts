import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { supabaseConfig, isDemoMode } from '@/lib/env';

// Use validated configuration from env.ts
const supabaseUrl = supabaseConfig.url;
const supabaseServiceKey = supabaseConfig.serviceRoleKey;

// Environment validation is handled in env.ts
// This ensures we only use validated configuration

// Check for demo placeholder keys
const isPlaceholderKey = supabaseServiceKey === 'demo-service-role-key-placeholder';

// Call isDemoMode function to get the actual boolean value
const isDemoModeActive = isDemoMode();

// Create a flexible mock query builder that supports any chain
const createMockQueryBuilder = () => {
  const queryBuilder: any = {
    eq: () => queryBuilder,
    order: () => queryBuilder,
    range: () => Promise.resolve({ data: [], error: null, count: 0 }),
    single: () => Promise.resolve({ data: null, error: { message: 'Demo mode - no data available' } }),
    select: () => queryBuilder,
    in: () => queryBuilder,
    not: () => queryBuilder,
    lt: () => queryBuilder,
  };
  return queryBuilder;
};

// Mock server client for demo mode
const createMockSupabaseServer = () => ({
  from: (table: string) => ({
    select: (columns?: string, options?: any) => createMockQueryBuilder(),
    insert: (data: any) => ({
      select: (columns?: string) => ({
        single: () => Promise.resolve({ 
          data: { id: 'demo-job-' + Math.random().toString(36).substr(2, 9), ...data[0] }, 
          error: null 
        })
      })
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => Promise.resolve({ data: null, error: null })
    }),
    delete: () => ({
      eq: (column: string, value: any) => Promise.resolve({ data: null, error: null })
    })
  }),
  storage: {
    from: (bucket: string) => ({
      upload: (path: string, file: any, options?: any) => 
        Promise.resolve({ data: { path }, error: null }),
      getPublicUrl: (path: string) => ({ 
        data: { publicUrl: `/demo-uploads/${path}` } 
      }),
      remove: (paths: string[]) => 
        Promise.resolve({ data: null, error: null })
    })
  },
  rpc: (name: string, args?: any) => Promise.resolve({ data: null, error: null })
});

export const supabaseServer = (isDemoModeActive || isPlaceholderKey) 
  ? createMockSupabaseServer() as any
  : createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

export function getSupabaseServiceClient() {
  return supabaseServer;
}





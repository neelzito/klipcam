import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { supabaseConfig } from '@/lib/env';

// Use validated configuration from env.ts
const supabaseUrl = supabaseConfig.url;
const supabaseAnonKey = supabaseConfig.anonKey;

// Environment validation is handled in env.ts
// This ensures we only use validated configuration

// Client-side demo mode detection (compatible with client-side rendering)
const isClientDemoMode = () => {
  // Check client-side environment variable
  if (process.env.NEXT_PUBLIC_APP_ENV === 'demo') {
    return true;
  }
  
  // Check for demo mode meta tag (set by server-side rendering)
  if (typeof document !== 'undefined') {
    const demoMeta = document.querySelector('meta[name="X-Demo-Mode"]');
    if (demoMeta?.getAttribute('content') === 'true') {
      return true;
    }
  }
  
  // Check URL parameter
  if (typeof window !== 'undefined' && window?.location?.search?.includes('demo=true')) {
    return true;
  }
  
  // Check for placeholder keys
  if (supabaseAnonKey === 'demo-anon-key-placeholder') {
    return true;
  }
  
  return false;
};

// Mock Supabase client for demo mode
const createMockClient = () => ({
  from: () => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: { message: 'Demo mode - no data available' } })
      }),
      in: () => ({
        not: () => ({
          lt: () => Promise.resolve({ data: [], error: null })
        })
      })
    }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => ({
      eq: () => Promise.resolve({ data: null, error: null })
    }),
    delete: () => ({
      eq: () => Promise.resolve({ data: null, error: null })
    })
  }),
  rpc: () => Promise.resolve({ data: null, error: null }),
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ data: null, error: { message: 'Demo mode - upload disabled' } }),
      getPublicUrl: () => ({ data: { publicUrl: '/demo-placeholder.jpg' } })
    })
  }
});

// Dynamic client that checks demo mode at runtime
let _supabaseClient: any = null;

const getSupabaseClient = () => {
  if (_supabaseClient) {
    return _supabaseClient;
  }
  
  if (isClientDemoMode()) {
    _supabaseClient = createMockClient();
  } else {
    _supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  
  return _supabaseClient;
};

// Export a proxy that always uses the dynamic client
export const supabase = new Proxy({} as any, {
  get(target, prop) {
    const client = getSupabaseClient();
    return client[prop];
  }
});

export default supabase;
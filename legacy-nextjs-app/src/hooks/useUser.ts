'use client';

import { useEffect, useState } from 'react';
import { useUser as useClerkUser } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types/database';

// Check if we're in demo mode - prioritize client-side detection
const isDemoMode = () => {
  // First check client-side environment variable (NEXT_PUBLIC_ prefix makes it available on client)
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
  
  return false;
};

// Mock user data for demo mode
const createDemoUser = (): User => ({
  id: 'demo-user-id',
  email: 'demo@klipcam.com',
  first_name: 'Demo',
  last_name: 'User',
  avatar_url: null,
  plan: 'pro' as const, // Change to pro to show more features in demo
  credit_balance: 850,
  total_credits_purchased: 900,
  total_credits_used: 50,
  subscription_id: 'sub_demo_12345',
  customer_id: 'cus_demo_12345',
  trial_ends_at: null, // No trial for pro users
  subscription_current_period_start: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  subscription_current_period_end: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
  created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  metadata: null,
});

interface UseUserReturn {
  user: User | null;
  clerkUser: any;
  isLoading: boolean;
  isSignedIn: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUser(): UseUserReturn {
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useClerkUser();
  
  // Always call hooks - this is required by React Rules of Hooks
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  const fetchUser = async (userId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error: supabaseError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (supabaseError) {
        // If user doesn't exist, create them
        if (supabaseError.code === 'PGRST116') {
          const newUser = {
            id: userId,
            email: clerkUser?.emailAddresses[0]?.emailAddress || '',
            first_name: clerkUser?.firstName || '',
            last_name: clerkUser?.lastName || '',
            avatar_url: clerkUser?.imageUrl || null,
            plan: 'trial' as const,
            credit_balance: 10, // Trial credits
            total_credits_purchased: 10,
            total_credits_used: 0,
            trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_sign_in_at: new Date().toISOString(),
          };

          const { data: createdUser, error: createError } = await supabase
            .from('users')
            .insert([newUser])
            .select()
            .single();

          if (createError) {
            throw createError;
          }

          setUser(createdUser);
        } else {
          throw supabaseError;
        }
      } else {
        // Update last sign in
        const { data: updatedUser } = await supabase
          .from('users')
          .update({ 
            last_sign_in_at: new Date().toISOString(),
            // Update profile info from Clerk in case it changed
            first_name: clerkUser?.firstName || data.first_name,
            last_name: clerkUser?.lastName || data.last_name,
            avatar_url: clerkUser?.imageUrl || data.avatar_url,
            email: clerkUser?.emailAddresses[0]?.emailAddress || data.email,
          })
          .eq('id', userId)
          .select()
          .single();

        setUser(updatedUser || data);
      }
    } catch (err) {
      console.error('Error fetching user:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user');
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to detect demo mode
  useEffect(() => {
    const detectDemoMode = () => {
      return isDemoMode();
    };
    
    setDemoMode(detectDemoMode());
  }, []); // Run once on mount

  useEffect(() => {
    if (demoMode) {
      // Demo mode - set up mock data immediately
      setUser(createDemoUser());
      setIsLoading(false);
    } else if (clerkLoaded && isSignedIn && clerkUser) {
      // Production mode - fetch real user data
      fetchUser(clerkUser.id);
    } else if (clerkLoaded && !isSignedIn) {
      // User is not signed in
      setUser(null);
      setIsLoading(false);
    }
  }, [demoMode, clerkLoaded, isSignedIn, clerkUser?.id]);

  const refetch = async () => {
    if (demoMode) {
      // No-op in demo mode
      return;
    }
    if (clerkUser?.id) {
      await fetchUser(clerkUser.id);
    }
  };

  // Create mock clerk user for demo mode
  const mockClerkUser = demoMode ? {
    id: 'demo-user-id',
    firstName: 'Demo',
    lastName: 'User',
    emailAddresses: [{ emailAddress: 'demo@klipcam.com' }],
    imageUrl: null,
  } : clerkUser;

  return {
    user,
    clerkUser: mockClerkUser,
    isLoading: demoMode ? false : isLoading || !clerkLoaded,
    isSignedIn: demoMode ? true : isSignedIn || false,
    error,
    refetch,
  };
}
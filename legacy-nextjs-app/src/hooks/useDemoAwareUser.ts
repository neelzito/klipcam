'use client';

import { useState, useEffect } from 'react';
import { useUser as useClerkUser } from '@clerk/nextjs';
import { useDemoMode } from '@/components/DemoModeProvider';
import type { User } from '@/types/database';

// Mock user data for demo mode
const createDemoUser = (): User => ({
  id: 'demo-user-id',
  email: 'demo@klipcam.com',
  first_name: 'Demo',
  last_name: 'User',
  avatar_url: null,
  plan: 'pro' as const,
  credit_balance: 850,
  total_credits_purchased: 900,
  total_credits_used: 50,
  subscription_id: 'sub_demo_12345',
  customer_id: 'cus_demo_12345',
  trial_ends_at: null,
  subscription_current_period_start: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  subscription_current_period_end: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
  created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  metadata: null,
});

interface UseDemoAwareUserReturn {
  user: User | null;
  clerkUser: any;
  isLoading: boolean;
  isSignedIn: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDemoAwareUser(): UseDemoAwareUserReturn {
  const { isDemoMode, isLoaded: demoModeLoaded } = useDemoMode();
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useClerkUser();
  
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calculate loading state
  const isLoading = !demoModeLoaded || (!isDemoMode && !clerkLoaded);
  
  // Debug logging (remove in production)
  // if (typeof window !== 'undefined') {
  //   console.log('useDemoAwareUser state:', { 
  //     demoModeLoaded, 
  //     isDemoMode, 
  //     clerkLoaded, 
  //     isSignedIn, 
  //     isLoading,
  //     hasClerkUser: !!clerkUser,
  //     hasUser: !!user
  //   });
  // }

  useEffect(() => {
    if (!demoModeLoaded) return;

    if (isDemoMode) {
      // In demo mode, immediately set demo user
      setUser(createDemoUser());
      setError(null);
    } else if (clerkLoaded) {
      if (isSignedIn && clerkUser) {
        // In production mode with signed-in user
        // For now, just create a basic user object
        // In real implementation, you'd fetch from your database
        setUser({
          id: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          first_name: clerkUser.firstName || '',
          last_name: clerkUser.lastName || '',
          avatar_url: clerkUser.imageUrl || null,
          plan: 'trial' as const,
          credit_balance: 10,
          total_credits_purchased: 10,
          total_credits_used: 0,
          subscription_id: null,
          customer_id: null,
          trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          subscription_current_period_start: null,
          subscription_current_period_end: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
          metadata: null,
        });
        setError(null);
      } else {
        // Not signed in
        setUser(null);
        setError(null);
      }
    }
  }, [isDemoMode, demoModeLoaded, clerkLoaded, isSignedIn, clerkUser]);

  const refetch = async () => {
    // No-op for now, but could implement database refetch in production
  };

  return {
    user,
    clerkUser: isDemoMode ? { firstName: 'Demo' } : clerkUser,
    isLoading,
    isSignedIn: isDemoMode || isSignedIn,
    error,
    refetch,
  };
}
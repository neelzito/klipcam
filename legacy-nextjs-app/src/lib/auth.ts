import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceClient } from '@/lib/supabaseServer';
import { isDemoMode } from '@/lib/env';
import { SecurityMonitor } from '@/lib/security/monitoring';
import type { User } from '@/types/database';

// Mock user data for demo mode
const createDemoUser = (): User => ({
  id: 'demo-user-id',
  email: 'demo@klipcam.com',
  first_name: 'Demo',
  last_name: 'User',
  avatar_url: null,
  plan: 'trial' as const,
  credit_balance: 50,
  total_credits_purchased: 100,
  total_credits_used: 50,
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

/**
 * Server-side function to get the current authenticated user
 * from Supabase using Clerk authentication
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    // In demo mode, return mock user
    if (isDemoMode()) {
      return createDemoUser();
    }

    const { userId } = auth();
    
    if (!userId) {
      return null;
    }

    const supabase = getSupabaseServiceClient();
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}

/**
 * Check if user has sufficient credits for an operation
 */
export async function checkCredits(userId: string, requiredCredits: number): Promise<boolean> {
  try {
    // In demo mode, always allow operations
    if (isDemoMode()) {
      return true;
    }

    const supabase = getSupabaseServiceClient();
    
    const { data: user } = await supabase
      .from('users')
      .select('credit_balance')
      .eq('id', userId)
      .single();

    if (!user) {
      return false;
    }

    return user.credit_balance >= requiredCredits;
  } catch (error) {
    console.error('Error checking credits:', error);
    return false;
  }
}

/**
 * Require authentication for API routes with security logging
 * Returns the user ID or throws an error
 */
export function requireAuth(ip?: string): { userId: string } {
  // In demo mode, return demo user ID
  if (isDemoMode()) {
    return { userId: 'demo-user-id' };
  }

  const { userId } = auth();
  
  if (!userId) {
    // Log unauthorized access attempt
    SecurityMonitor.logUnauthorizedAccess('api_endpoint', undefined, ip);
    throw new Error('Authentication required');
  }
  
  return { userId };
}

/**
 * Check if user is on a trial plan
 */
export async function isTrialUser(userId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseServiceClient();
    
    const { data: user } = await supabase
      .from('users')
      .select('plan, trial_ends_at')
      .eq('id', userId)
      .single();

    if (!user) {
      return false;
    }

    // Check if user is on trial and trial hasn't expired
    if (user.plan === 'trial') {
      if (user.trial_ends_at) {
        const trialEnd = new Date(user.trial_ends_at);
        return trialEnd > new Date();
      }
      return true; // No trial end date set, assume active trial
    }

    return false;
  } catch (error) {
    console.error('Error checking trial status:', error);
    return false;
  }
}

/**
 * Get user's subscription status
 */
export async function getSubscriptionStatus(userId: string) {
  try {
    const supabase = getSupabaseServiceClient();
    
    const { data: user } = await supabase
      .from('users')
      .select(`
        plan,
        subscription_id,
        subscription_current_period_start,
        subscription_current_period_end,
        trial_ends_at,
        subscriptions (
          status,
          cancel_at_period_end,
          canceled_at
        )
      `)
      .eq('id', userId)
      .single();

    if (!user) {
      return null;
    }

    return {
      plan: user.plan,
      subscriptionId: user.subscription_id,
      currentPeriodStart: user.subscription_current_period_start,
      currentPeriodEnd: user.subscription_current_period_end,
      trialEndsAt: user.trial_ends_at,
      subscription: user.subscriptions?.[0] || null,
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return null;
  }
}
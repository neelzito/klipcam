/**
 * Secure Stripe Webhook Handler
 * 
 * Handles Stripe webhook events with proper signature verification,
 * rate limiting, and security monitoring.
 */

import { NextRequest } from 'next/server';
import { createWebhookRoute } from '@/lib/security/apiBase';
import { verifyStripeWebhook } from '@/lib/security/webhooks';
import { SecurityMonitor, SecurityEventType } from '@/lib/security/monitoring';
import { getSupabaseServiceClient } from '@/lib/supabaseServer';

// Process Stripe webhook events
async function processStripeWebhook(req: NextRequest, stripeEvent: any) {
  const supabase = getSupabaseServiceClient();
  
  try {
    switch (stripeEvent.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(stripeEvent.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(stripeEvent.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(stripeEvent.data.object);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(stripeEvent.data.object);
        break;
        
      default:
        console.log(`Unhandled Stripe event type: ${stripeEvent.type}`);
    }
    
    // Log successful webhook processing
    console.log(`✅ Stripe webhook processed: ${stripeEvent.type}`);
  } catch (error) {
    // Log security event for webhook processing errors
    SecurityMonitor.logSuspiciousActivity(
      'webhook_processing_error',
      {
        provider: 'stripe',
        eventType: stripeEvent.type,
        eventId: stripeEvent.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      undefined,
      req.headers.get('x-forwarded-for') || undefined
    );
    
    throw error;
  }
}

// Handle subscription creation/updates
async function handleSubscriptionChange(subscription: any) {
  const supabase = getSupabaseServiceClient();
  
  // Update user subscription in database
  const { error } = await supabase
    .from('users')
    .update({
      plan: subscription.status === 'active' ? 'pro' : 'trial',
      subscription_id: subscription.id,
      subscription_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('customer_id', subscription.customer);
    
  if (error) {
    throw new Error(`Failed to update subscription: ${error.message}`);
  }
  
  // Grant credits for new subscription
  if (subscription.status === 'active') {
    await grantSubscriptionCredits(subscription.customer, 900);
  }
}

// Handle subscription cancellation
async function handleSubscriptionCanceled(subscription: any) {
  const supabase = getSupabaseServiceClient();
  
  const { error } = await supabase
    .from('users')
    .update({
      plan: 'trial',
      subscription_id: null,
      subscription_current_period_start: null,
      subscription_current_period_end: null,
      updated_at: new Date().toISOString(),
    })
    .eq('customer_id', subscription.customer);
    
  if (error) {
    throw new Error(`Failed to cancel subscription: ${error.message}`);
  }
}

// Handle successful payment
async function handlePaymentSucceeded(invoice: any) {
  // Grant credits for successful payment
  await grantSubscriptionCredits(invoice.customer, 900);
  
  // Log successful payment
  console.log(`✅ Payment succeeded for customer: ${invoice.customer}`);
}

// Handle failed payment
async function handlePaymentFailed(invoice: any) {
  // Log payment failure for potential fraud detection
  SecurityMonitor.logSuspiciousActivity(
    'payment_failure',
    {
      customerId: invoice.customer,
      amount: invoice.amount_due,
      currency: invoice.currency,
      attemptCount: invoice.attempt_count,
    }
  );
  
  console.log(`❌ Payment failed for customer: ${invoice.customer}`);
}

// Grant subscription credits to user
async function grantSubscriptionCredits(customerId: string, credits: number) {
  const supabase = getSupabaseServiceClient();
  
  // Get user ID from customer ID
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, credit_balance')
    .eq('customer_id', customerId)
    .single();
    
  if (userError || !user) {
    throw new Error(`User not found for customer: ${customerId}`);
  }
  
  // Update credit balance
  const { error: updateError } = await supabase
    .from('users')
    .update({
      credit_balance: user.credit_balance + credits,
      total_credits_purchased: supabase.sql`total_credits_purchased + ${credits}`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);
    
  if (updateError) {
    throw new Error(`Failed to grant credits: ${updateError.message}`);
  }
  
  // Record credit transaction
  await supabase
    .from('credits_ledger')
    .insert({
      user_id: user.id,
      amount: credits,
      type: 'purchase',
      description: 'Monthly subscription credits',
      reference_id: customerId,
      created_at: new Date().toISOString(),
    });
    
  console.log(`✅ Granted ${credits} credits to user ${user.id}`);
}

// Export the webhook route with security
export const { POST } = createWebhookRoute(
  processStripeWebhook,
  verifyStripeWebhook
);
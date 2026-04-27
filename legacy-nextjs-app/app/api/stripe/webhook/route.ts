import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { validateWebhookSignature } from '@/lib/stripe';
import { getSupabaseServiceClient } from '@/lib/supabaseServer';

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!endpointSecret) {
  throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable');
}

export async function POST(request: NextRequest) {
  try {
    // Get the raw body and signature
    const body = await request.text();
    const headerPayload = headers();
    const signature = headerPayload.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe signature' },
        { status: 400 }
      );
    }

    // Validate the webhook signature
    const event = validateWebhookSignature(body, signature, endpointSecret);
    
    console.log(`Received Stripe webhook: ${event.type}`);

    const supabase = getSupabaseServiceClient();

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session, supabase);
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription, supabase);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription, supabase);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription, supabase);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice, supabase);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice, supabase);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  supabase: any
) {
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error('No userId in checkout session metadata');
    return;
  }

  console.log(`Checkout completed for user: ${userId}`);

  try {
    // Update user with customer ID
    await supabase
      .from('users')
      .update({
        customer_id: session.customer as string,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    console.log(`Updated user ${userId} with customer ID: ${session.customer}`);
  } catch (error) {
    console.error('Error handling checkout completed:', error);
  }
}

async function handleSubscriptionCreated(
  subscription: Stripe.Subscription,
  supabase: any
) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  console.log(`Subscription created for user: ${userId}`);

  try {
    // Create subscription record
    await supabase
      .from('subscriptions')
      .insert({
        id: subscription.id,
        user_id: userId,
        customer_id: subscription.customer as string,
        status: subscription.status,
        plan_id: subscription.items.data[0]?.price?.id,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        metadata: subscription.metadata,
      });

    // Update user plan and subscription details
    await supabase
      .from('users')
      .update({
        plan: 'pro',
        subscription_id: subscription.id,
        subscription_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    // Grant monthly credits (900 for pro plan)
    await supabase.rpc('add_credits', {
      p_user_id: userId,
      p_amount: 900,
      p_transaction_type: 'subscription',
      p_description: `Monthly credits for Pro subscription (${subscription.id})`,
    });

    console.log(`Granted 900 credits to user ${userId} for new subscription`);
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  supabase: any
) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  console.log(`Subscription updated for user: ${userId}`);

  try {
    // Update subscription record
    await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at 
          ? new Date(subscription.canceled_at * 1000).toISOString() 
          : null,
        updated_at: new Date().toISOString(),
        metadata: subscription.metadata,
      })
      .eq('id', subscription.id);

    // Update user subscription details
    const userUpdate: any = {
      subscription_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Update plan status based on subscription status
    if (subscription.status === 'canceled') {
      userUpdate.plan = 'cancelled';
    } else if (subscription.status === 'active') {
      userUpdate.plan = 'pro';
    }

    await supabase
      .from('users')
      .update(userUpdate)
      .eq('id', userId);

    console.log(`Updated subscription for user ${userId}`);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: any
) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  console.log(`Subscription deleted for user: ${userId}`);

  try {
    // Update user plan to cancelled
    await supabase
      .from('users')
      .update({
        plan: 'cancelled',
        subscription_id: null,
        subscription_current_period_start: null,
        subscription_current_period_end: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    // Update subscription record
    await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    console.log(`Marked subscription as cancelled for user ${userId}`);
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
  supabase: any
) {
  // This handles recurring payments
  if (!invoice.subscription) {
    return; // Skip non-subscription invoices
  }

  const subscriptionId = invoice.subscription as string;

  try {
    // Get subscription details to find user
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('id', subscriptionId)
      .single();

    if (!subscription) {
      console.error(`Subscription not found: ${subscriptionId}`);
      return;
    }

    const userId = subscription.user_id;

    // Grant monthly credits for recurring payment
    await supabase.rpc('add_credits', {
      p_user_id: userId,
      p_amount: 900,
      p_transaction_type: 'subscription',
      p_description: `Monthly credits renewal (Invoice: ${invoice.id})`,
      p_stripe_payment_intent_id: invoice.payment_intent as string,
    });

    console.log(`Granted 900 credits to user ${userId} for payment: ${invoice.id}`);
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
  }
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: any
) {
  if (!invoice.subscription) {
    return; // Skip non-subscription invoices
  }

  const subscriptionId = invoice.subscription as string;

  try {
    // Get subscription details to find user
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('id', subscriptionId)
      .single();

    if (!subscription) {
      console.error(`Subscription not found: ${subscriptionId}`);
      return;
    }

    const userId = subscription.user_id;

    // Log the failed payment (you might want to send an email here)
    console.log(`Payment failed for user ${userId}, invoice: ${invoice.id}`);
    
    // Optionally, you could add a record to track failed payments
    // or send a notification to the user about the failed payment

  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
  }
}
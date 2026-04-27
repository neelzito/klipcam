import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

// Initialize Stripe with the secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Stripe configuration constants
export const STRIPE_CONFIG = {
  // Subscription plans
  plans: {
    pro: {
      priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_1234567890', // $9/month
      name: 'Pro Plan',
      amount: 900, // $9.00 in cents
      currency: 'usd',
      interval: 'month',
      credits: 900, // Credits per month
    },
  },
  
  // Webhook endpoints
  webhookEndpoint: '/api/stripe/webhook',
  
  // Success/Cancel URLs
  successUrl: process.env.NEXT_PUBLIC_APP_URL + '/dashboard?session_id={CHECKOUT_SESSION_ID}',
  cancelUrl: process.env.NEXT_PUBLIC_APP_URL + '/pricing',
  
  // Customer portal
  portalReturnUrl: process.env.NEXT_PUBLIC_APP_URL + '/dashboard',
} as const;

/**
 * Get or create a Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(params: {
  userId: string;
  email: string;
  name?: string;
}): Promise<Stripe.Customer> {
  const { userId, email, name } = params;

  try {
    // First, try to find existing customer by metadata
    const existingCustomers = await stripe.customers.list({
      limit: 1,
      metadata: {
        userId,
      },
    } as any); // Type assertion for Stripe API compatibility

    if (existingCustomers.data.length > 0) {
      const customer = existingCustomers.data[0];
      if (customer) {
        return customer;
      }
    }

    // Create new customer if not found
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
      },
    });

    return customer;
  } catch (error) {
    console.error('Error getting or creating Stripe customer:', error);
    throw new Error('Failed to get or create Stripe customer');
  }
}

/**
 * Create a Stripe Checkout session for subscription
 */
export async function createSubscriptionCheckoutSession(params: {
  userId: string;
  email: string;
  name?: string;
  priceId?: string;
}) {
  const { userId, email, name, priceId = STRIPE_CONFIG.plans.pro.priceId } = params;

  try {
    // Get or create customer
    const customer = await getOrCreateStripeCustomer({ userId, email, name });

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      billing_address_collection: 'auto',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: STRIPE_CONFIG.successUrl,
      cancel_url: STRIPE_CONFIG.cancelUrl,
      metadata: {
        userId,
      },
      subscription_data: {
        metadata: {
          userId,
        },
      },
      // Enable customer portal
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      // Collect tax automatically
      automatic_tax: {
        enabled: true,
      },
    });

    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new Error('Failed to create checkout session');
  }
}

/**
 * Create a customer portal session
 */
export async function createCustomerPortalSession(customerId: string) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: STRIPE_CONFIG.portalReturnUrl,
    });

    return session;
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    throw new Error('Failed to create customer portal session');
  }
}

/**
 * Get subscription details by subscription ID
 */
export async function getSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['customer', 'items.data.price'],
    });

    return subscription;
  } catch (error) {
    console.error('Error getting subscription:', error);
    throw new Error('Failed to get subscription');
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string, cancelAtPeriodEnd = true) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: cancelAtPeriodEnd,
    });

    return subscription;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw new Error('Failed to cancel subscription');
  }
}

/**
 * Reactivate a subscription that was set to cancel at period end
 */
export async function reactivateSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    return subscription;
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    throw new Error('Failed to reactivate subscription');
  }
}

/**
 * Validate Stripe webhook signature
 */
export function validateWebhookSignature(
  payload: string | Buffer,
  signature: string,
  endpointSecret: string
) {
  try {
    return stripe.webhooks.constructEvent(payload, signature, endpointSecret);
  } catch (error) {
    console.error('Error validating webhook signature:', error);
    throw new Error('Invalid webhook signature');
  }
}

/**
 * Format amount for display (cents to dollars)
 */
export function formatAmount(amount: number, currency = 'usd') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

/**
 * Get plan details by price ID
 */
export function getPlanByPriceId(priceId: string) {
  const planEntry = Object.entries(STRIPE_CONFIG.plans).find(
    ([_, plan]) => plan.priceId === priceId
  );
  
  if (!planEntry) {
    return null;
  }
  
  const [planKey, planData] = planEntry;
  return { key: planKey, ...planData };
}
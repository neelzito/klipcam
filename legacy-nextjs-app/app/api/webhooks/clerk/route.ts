import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { getSupabaseServiceClient } from '@/lib/supabaseServer';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
}

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = req.headers;
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new NextResponse('Error occurred -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(webhookSecret!);

  let evt: any;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as any;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new NextResponse('Error occurred', {
      status: 400,
    });
  }

  // Process the webhook
  const supabase = getSupabaseServiceClient();
  
  try {
    switch (evt.type) {
      case 'user.created':
        await handleUserCreated(evt.data);
        break;
      case 'user.updated':
        await handleUserUpdated(evt.data);
        break;
      case 'user.deleted':
        await handleUserDeleted(evt.data);
        break;
      default:
        console.log(`Unhandled Clerk webhook event: ${evt.type}`);
    }
    
    return new NextResponse('Success', { status: 200 });
  } catch (error) {
    console.error('Error processing Clerk webhook:', error);
    return new NextResponse('Error processing webhook', { status: 500 });
  }
}

// Handle user creation
async function handleUserCreated(userData: any) {
  const supabase = getSupabaseServiceClient();
  
  const user = {
    id: userData.id,
    email: userData.email_addresses?.[0]?.email_address || '',
    first_name: userData.first_name || '',
    last_name: userData.last_name || '',
    avatar_url: userData.image_url || null,
    plan: 'trial' as const,
    credit_balance: 10, // Trial credits
    total_credits_purchased: 10,
    total_credits_used: 0,
    trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(userData.created_at || Date.now()).toISOString(),
    updated_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
  };
  
  const { error } = await supabase
    .from('users')
    .insert([user]);
    
  if (error) {
    console.error('Error creating user:', error);
    throw error;
  }
  
  // Create initial credit transaction
  await supabase
    .from('credits_ledger')
    .insert({
      user_id: user.id,
      amount: 10,
      type: 'grant',
      description: 'Trial signup bonus',
      created_at: new Date().toISOString(),
    });
    
  console.log(`✅ User created: ${user.id}`);
}

// Handle user updates
async function handleUserUpdated(userData: any) {
  const supabase = getSupabaseServiceClient();
  
  const updates = {
    email: userData.email_addresses?.[0]?.email_address || '',
    first_name: userData.first_name || '',
    last_name: userData.last_name || '',
    avatar_url: userData.image_url || null,
    updated_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
  };
  
  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userData.id);
    
  if (error) {
    console.error('Error updating user:', error);
    throw error;
  }
  
  console.log(`✅ User updated: ${userData.id}`);
}

// Handle user deletion
async function handleUserDeleted(userData: any) {
  const supabase = getSupabaseServiceClient();
  
  // We don't actually delete users, just mark them as deleted
  // to preserve data integrity for jobs and assets
  const { error } = await supabase
    .from('users')
    .update({
      email: `deleted_${userData.id}@deleted.local`,
      first_name: 'Deleted',
      last_name: 'User',
      avatar_url: null,
      plan: 'trial',
      subscription_id: null,
      customer_id: null,
      updated_at: new Date().toISOString(),
      metadata: { deleted_at: new Date().toISOString() },
    })
    .eq('id', userData.id);
    
  if (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
  
  console.log(`✅ User deleted: ${userData.id}`);
}
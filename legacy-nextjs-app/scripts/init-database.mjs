#!/usr/bin/env node

/**
 * Database Initialization Script for KlipCam
 * 
 * This script initializes the Supabase database with the required schema,
 * creates storage buckets, and sets up initial data.
 * 
 * Usage: node scripts/init-database.mjs
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase configuration in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🔗 Connecting to Supabase:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function createStorageBuckets() {
  console.log('🗂️  Creating storage buckets...');
  
  const buckets = [
    {
      id: 'generated',
      name: 'generated',
      public: false,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'],
      fileSizeLimit: 52428800, // 50MB
    },
    {
      id: 'profiles',
      name: 'profiles',
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 5242880, // 5MB
    },
    {
      id: 'references',
      name: 'references',
      public: false,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 10485760, // 10MB
    },
    {
      id: 'lora-training',
      name: 'lora-training',
      public: false,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 10485760, // 10MB
    }
  ];

  for (const bucket of buckets) {
    try {
      const { data, error } = await supabase.storage.createBucket(bucket.id, {
        public: bucket.public,
        allowedMimeTypes: bucket.allowedMimeTypes,
        fileSizeLimit: bucket.fileSizeLimit,
      });

      if (error && error.message.includes('already exists')) {
        console.log(`✅ Bucket '${bucket.id}' already exists`);
      } else if (error) {
        console.log(`❌ Failed to create bucket '${bucket.id}': ${error.message}`);
      } else {
        console.log(`✅ Created bucket '${bucket.id}'`);
      }
    } catch (err) {
      console.log(`❌ Error creating bucket '${bucket.id}': ${err.message}`);
    }
  }
}

async function testConnection() {
  console.log('🔗 Testing Supabase connection...');
  
  try {
    // Test a simple query
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error && error.message.includes("doesn't exist")) {
      console.log('📊 Users table does not exist - database schema needs to be created');
      return false;
    } else if (error && error.message.includes('JWT')) {
      console.log('❌ Authentication error - check your service role key');
      return false;
    } else if (error) {
      console.log(`❌ Connection error: ${error.message}`);
      return false;
    } else {
      console.log('✅ Database connection successful');
      return true;
    }
  } catch (err) {
    console.log(`❌ Connection failed: ${err.message}`);
    return false;
  }
}

async function seedInitialData() {
  console.log('🌱 Seeding initial data...');
  
  // Check if presets table exists and has data
  try {
    const { data: existingPresets } = await supabase
      .from('presets')
      .select('id')
      .limit(1);

    if (existingPresets && existingPresets.length > 0) {
      console.log('✅ Presets already exist, skipping seed data');
      return;
    }
  } catch (error) {
    if (error.message.includes("doesn't exist")) {
      console.log('⚠️  Presets table does not exist yet - skipping seed data');
      return;
    }
  }

  // Insert default presets
  const presets = [
    {
      name: 'Fashion Editorial',
      description: 'High-fashion studio photography with dramatic lighting',
      prompt_template: 'fashion editorial portrait of {user_prompt}, dramatic lighting, studio photography, high fashion, vogue style, professional modeling',
      category: 'fashion',
      cost_credits: 1,
      is_premium: false,
      sort_order: 1
    },
    {
      name: 'Gym High-Contrast',
      description: 'Fitness photography with bold contrasts and energy',
      prompt_template: 'fitness photography of {user_prompt}, gym environment, high contrast lighting, athletic, energetic, sports photography style',
      category: 'fitness',
      cost_credits: 1,
      is_premium: false,
      sort_order: 2
    },
    {
      name: 'Warm Indoor',
      description: 'Cozy indoor portrait with warm, natural lighting',
      prompt_template: 'warm indoor portrait of {user_prompt}, cozy atmosphere, natural window lighting, comfortable setting, lifestyle photography',
      category: 'lifestyle',
      cost_credits: 1,
      is_premium: false,
      sort_order: 3
    },
    {
      name: 'Neon Night Street',
      description: 'Urban cyberpunk style with neon lights and city vibes',
      prompt_template: 'cyberpunk street portrait of {user_prompt}, neon lights, urban night scene, futuristic city, vibrant colors, street photography',
      category: 'urban',
      cost_credits: 4,
      is_premium: true,
      sort_order: 4
    },
    {
      name: 'Travel Sunset',
      description: 'Golden hour travel photography with scenic backgrounds',
      prompt_template: 'travel photography of {user_prompt}, golden hour lighting, scenic background, wanderlust, adventure, sunset colors',
      category: 'travel',
      cost_credits: 1,
      is_premium: false,
      sort_order: 5
    },
    {
      name: 'Studio Color Backdrop',
      description: 'Professional studio portrait with colorful backgrounds',
      prompt_template: 'professional studio portrait of {user_prompt}, colorful backdrop, studio lighting, clean background, portrait photography',
      category: 'professional',
      cost_credits: 1,
      is_premium: false,
      sort_order: 6
    }
  ];

  const { error } = await supabase.from('presets').insert(presets);
  
  if (error) {
    console.log(`❌ Failed to seed presets: ${error.message}`);
  } else {
    console.log(`✅ Seeded ${presets.length} presets`);
  }
}

async function main() {
  console.log('🚀 Initializing KlipCam Database...\n');

  // Test connection first
  const isConnected = await testConnection();
  
  if (!isConnected) {
    console.log('\n❌ Database connection failed or schema not created.');
    console.log('📋 Please manually run the SQL schema in Supabase:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Open the SQL Editor');
    console.log('3. Copy and paste the content from supabase/schema.sql');
    console.log('4. Run the SQL script');
    console.log('5. Come back and run this script again\n');
  } else {
    console.log('✅ Database schema appears to be set up correctly');
  }

  // Create storage buckets regardless
  await createStorageBuckets();

  // Seed initial data if possible
  if (isConnected) {
    await seedInitialData();
  }

  console.log('\n🎉 Database initialization process complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Verify the database structure in your Supabase dashboard');
  console.log('2. Check that storage buckets were created');
  console.log('3. If schema creation failed, manually run supabase/schema.sql');
  console.log('4. Test user signup in your application');
  console.log('\n🔗 Supabase Dashboard:', `https://supabase.com/dashboard/project/${supabaseUrl.split('//')[1].split('.')[0]}`);
}

// Run the initialization
main().catch(console.error);
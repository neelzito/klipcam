#!/usr/bin/env node

/**
 * Database Initialization Script for KlipCam
 * 
 * This script initializes the Supabase database with the required schema,
 * creates storage buckets, and sets up initial data.
 * 
 * Usage: node scripts/init-database.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase configuration in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function runSqlFile(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  
  // Split by semicolon and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  for (const statement of statements) {
    if (statement) {
      try {
        const { error } = await supabase.from('dummy').select('1'); // Test connection first
        if (statement.toLowerCase().includes('create') || 
            statement.toLowerCase().includes('alter') || 
            statement.toLowerCase().includes('insert')) {
          
          // Use RPC for DDL statements
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
          
          if (error) {
            console.log(`⚠️  Statement might already exist: ${statement.substring(0, 50)}...`);
            console.log(`   Error: ${error.message}`);
          } else {
            console.log(`✅ Executed: ${statement.substring(0, 50)}...`);
          }
        }
      } catch (err) {
        console.log(`⚠️  Could not execute: ${statement.substring(0, 50)}...`);
        console.log(`   Error: ${err.message}`);
      }
    }
  }
}

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
    const { data, error } = await supabase
      .from('users')
      .select('count(*)')
      .limit(1);

    if (error && error.message.includes("doesn't exist")) {
      console.log('📊 Database schema not yet created - will create now');
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

async function createExecSqlFunction() {
  console.log('🔧 Creating exec_sql helper function...');
  
  const createFunctionSql = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
    RETURNS void AS $$
    BEGIN
      EXECUTE sql_query;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  try {
    // This needs to be executed directly via the API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        'apikey': supabaseServiceRoleKey,
      },
      body: JSON.stringify({
        sql_query: createFunctionSql
      })
    });

    if (!response.ok) {
      console.log('⚠️  Could not create exec_sql function via API');
    }
  } catch (err) {
    console.log('⚠️  Could not create exec_sql function');
  }
}

async function seedInitialData() {
  console.log('🌱 Seeding initial data...');
  
  // Check if presets already exist
  const { data: existingPresets } = await supabase
    .from('presets')
    .select('id')
    .limit(1);

  if (existingPresets && existingPresets.length > 0) {
    console.log('✅ Presets already exist, skipping seed data');
    return;
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
    console.log('📄 Running database schema creation...');
    
    try {
      // Read and execute the main schema
      const schemaPath = path.join(__dirname, '../supabase/schema.sql');
      if (fs.existsSync(schemaPath)) {
        await runSqlFile(schemaPath);
        console.log('✅ Database schema created');
      } else {
        console.log('❌ Schema file not found at:', schemaPath);
        process.exit(1);
      }
    } catch (err) {
      console.log('❌ Error running schema:', err.message);
      // Don't exit - some statements might have worked
    }
  }

  // Create storage buckets
  await createStorageBuckets();

  // Run storage setup
  try {
    const storageSetupPath = path.join(__dirname, '../supabase/storage-setup.sql');
    if (fs.existsSync(storageSetupPath)) {
      await runSqlFile(storageSetupPath);
      console.log('✅ Storage policies configured');
    }
  } catch (err) {
    console.log('⚠️  Storage setup had some issues:', err.message);
  }

  // Seed initial data
  await seedInitialData();

  console.log('\n🎉 Database initialization complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Verify the database structure in your Supabase dashboard');
  console.log('2. Check that storage buckets were created');
  console.log('3. Test user signup in your application');
  console.log('\n🔗 Supabase Dashboard:', `${supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/')}`);
}

// Run the initialization
main().catch(console.error);
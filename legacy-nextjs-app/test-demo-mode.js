#!/usr/bin/env node

// Simple test to verify demo mode configuration
import { config } from 'dotenv';

config({ path: '.env.local' });

console.log('🧪 Testing Demo Mode Configuration\n');

const checks = [
  {
    name: 'NEXT_PUBLIC_APP_ENV',
    value: process.env.NEXT_PUBLIC_APP_ENV,
    expected: 'demo'
  },
  {
    name: 'DEMO_MODE',
    value: process.env.DEMO_MODE,
    expected: 'true'
  }
];

console.log('Environment Variables:');
checks.forEach(({ name, value, expected }) => {
  const status = value === expected ? '✅' : '❌';
  console.log(`  ${status} ${name}: "${value}" (expected: "${expected}")`);
});

console.log('\nDemo Mode Detection Logic:');
const isDemoMode1 = process.env.NEXT_PUBLIC_APP_ENV === 'demo';
const isDemoMode2 = process.env.DEMO_MODE === 'true';
const finalDemoMode = isDemoMode1 || isDemoMode2;

console.log(`  NEXT_PUBLIC_APP_ENV === 'demo': ${isDemoMode1}`);
console.log(`  DEMO_MODE === 'true': ${isDemoMode2}`);
console.log(`  Final Demo Mode: ${finalDemoMode ? '✅ ENABLED' : '❌ DISABLED'}`);

if (finalDemoMode) {
  console.log('\n🎉 Demo Mode is properly configured!');
  console.log('   Pages should now show demo content instead of authentication errors.');
} else {
  console.log('\n⚠️  Demo Mode is NOT configured correctly.');
  console.log('   Pages will require authentication and may show black screens.');
}
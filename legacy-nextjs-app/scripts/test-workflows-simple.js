#!/usr/bin/env node

// Simple workflow test that validates AI configuration and basic functionality
import { config } from 'dotenv';
import https from 'https';

// Load environment variables
config({ path: '.env.local' });

const TEST_RESULTS = {
  tests: [],
  passed: 0,
  failed: 0,
  warnings: 0
};

function log(message, type = 'info') {
  const prefix = {
    info: '💡',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    test: '🧪'
  }[type] || 'ℹ️';
  
  console.log(`${prefix} ${message}`);
}

function recordTest(name, status, details = '') {
  TEST_RESULTS.tests.push({ name, status, details });
  
  if (status === 'passed') {
    TEST_RESULTS.passed++;
    log(`${name} - PASSED ${details}`, 'success');
  } else if (status === 'failed') {
    TEST_RESULTS.failed++;
    log(`${name} - FAILED: ${details}`, 'error');
  } else if (status === 'warning') {
    TEST_RESULTS.warnings++;
    log(`${name} - WARNING: ${details}`, 'warning');
  }
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'KlipCam-WorkflowTest/1.0',
        ...options.headers
      }
    };

    const req = https.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data, raw: true });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function testAPIConnectivity() {
  log('Testing API connectivity...', 'test');
  
  // Test Replicate API
  const replicateToken = process.env.REPLICATE_API_TOKEN;
  if (!replicateToken) {
    recordTest('Replicate API Key', 'failed', 'REPLICATE_API_TOKEN not found');
  } else {
    try {
      const response = await makeRequest('https://api.replicate.com/v1/predictions', {
        headers: { 'Authorization': `Token ${replicateToken}` }
      });
      
      if (response.status === 200 || response.status === 422) { // 422 is expected for GET without data
        recordTest('Replicate API Connection', 'passed', `Status: ${response.status}`);
      } else {
        recordTest('Replicate API Connection', 'failed', `Status: ${response.status}`);
      }
    } catch (error) {
      recordTest('Replicate API Connection', 'failed', error.message);
    }
  }
  
  // Test FAL.ai API (simple check)
  const falToken = process.env.FAL_API_KEY;
  if (!falToken) {
    recordTest('FAL.ai API Key', 'failed', 'FAL_API_KEY not found');
  } else {
    // FAL.ai doesn't have a simple test endpoint, so we'll just validate the key format
    if (falToken.length > 20) {
      recordTest('FAL.ai API Key', 'passed', 'Key format appears valid');
    } else {
      recordTest('FAL.ai API Key', 'warning', 'Key format may be invalid');
    }
  }
}

async function testModelAvailability() {
  log('Testing model availability...', 'test');
  
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    recordTest('Model Availability', 'failed', 'No Replicate token');
    return;
  }
  
  const modelsToTest = [
    'black-forest-labs/flux-dev',
    'qwen/qwen-image',
    'nightmareai/real-esrgan'
  ];
  
  let availableModels = 0;
  
  for (const model of modelsToTest) {
    try {
      const response = await makeRequest(`https://api.replicate.com/v1/models/${model}`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      if (response.status === 200) {
        availableModels++;
        log(`  ✅ ${model} - Available`, 'success');
      } else {
        log(`  ❌ ${model} - Status: ${response.status}`, 'error');
      }
    } catch (error) {
      log(`  ❌ ${model} - Error: ${error.message}`, 'error');
    }
  }
  
  if (availableModels === modelsToTest.length) {
    recordTest('Model Availability', 'passed', `${availableModels}/${modelsToTest.length} models available`);
  } else if (availableModels > 0) {
    recordTest('Model Availability', 'warning', `${availableModels}/${modelsToTest.length} models available`);
  } else {
    recordTest('Model Availability', 'failed', 'No models available');
  }
}

async function testGenerationRequest() {
  log('Testing generation request format...', 'test');
  
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    recordTest('Generation Request Format', 'failed', 'No Replicate token');
    return;
  }
  
  // Test a minimal request to see if the format is correct
  const testPayload = {
    version: '6e4a938f85952bdabcc15aa329178c4d681c52bf25a0342403287dc26944661d', // FLUX-dev pinned version
    input: {
      prompt: 'A simple test image, minimal generation',
      width: 512,
      height: 512,
      num_inference_steps: 4
    }
  };
  
  try {
    const response = await makeRequest('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: { 
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });
    
    if (response.status === 201 && response.data.id) {
      recordTest('Generation Request Format', 'passed', `Prediction ID: ${response.data.id}`);
      
      // Cancel the prediction to avoid unnecessary costs
      try {
        await makeRequest(`https://api.replicate.com/v1/predictions/${response.data.id}/cancel`, {
          method: 'POST',
          headers: { 'Authorization': `Token ${token}` }
        });
        log('  Test prediction cancelled', 'info');
      } catch (e) {
        log('  Could not cancel test prediction', 'warning');
      }
    } else {
      recordTest('Generation Request Format', 'failed', `Status: ${response.status}, Data: ${JSON.stringify(response.data).substring(0, 100)}`);
    }
  } catch (error) {
    recordTest('Generation Request Format', 'failed', error.message);
  }
}

async function testWebhookEndpoint() {
  log('Testing webhook endpoint readiness...', 'test');
  
  // Check if we have a webhook URL configured
  const webhookUrl = process.env.REPLICATE_WEBHOOK_URL;
  
  if (!webhookUrl) {
    recordTest('Webhook Configuration', 'warning', 'No REPLICATE_WEBHOOK_URL configured');
  } else {
    // Simple validation of webhook URL format
    try {
      const url = new URL(webhookUrl);
      if (url.protocol === 'https:') {
        recordTest('Webhook Configuration', 'passed', `URL: ${webhookUrl}`);
      } else {
        recordTest('Webhook Configuration', 'warning', 'Webhook URL should use HTTPS');
      }
    } catch (error) {
      recordTest('Webhook Configuration', 'failed', 'Invalid webhook URL format');
    }
  }
}

async function testEnvironmentConfig() {
  log('Testing environment configuration...', 'test');
  
  const requiredEnvVars = [
    'REPLICATE_API_TOKEN',
    'FAL_API_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length === 0) {
    recordTest('Environment Configuration', 'passed', 'All required variables present');
  } else {
    recordTest('Environment Configuration', 'warning', `Missing: ${missingVars.join(', ')}`);
  }
  
  // Test NODE_ENV
  const nodeEnv = process.env.NODE_ENV || 'development';
  log(`Environment: ${nodeEnv}`, 'info');
}

async function printSummary() {
  const total = TEST_RESULTS.passed + TEST_RESULTS.failed + TEST_RESULTS.warnings;
  const successRate = Math.round((TEST_RESULTS.passed / total) * 100);
  
  console.log('\n' + '='.repeat(60));
  log('🎯 Workflow Test Summary', 'info');
  
  console.log(`
📊 Results:
   Total Tests: ${total}
   ✅ Passed:   ${TEST_RESULTS.passed}
   ❌ Failed:   ${TEST_RESULTS.failed}
   ⚠️  Warnings: ${TEST_RESULTS.warnings}
   
📈 Success Rate: ${successRate}%`);
  
  console.log('\n📋 Test Details:');
  TEST_RESULTS.tests.forEach(({ name, status, details }) => {
    const icon = { passed: '✅', failed: '❌', warning: '⚠️' }[status];
    console.log(`   ${icon} ${name}: ${details}`);
  });
  
  console.log('\n💡 Recommendations:');
  if (TEST_RESULTS.failed === 0) {
    console.log('   ✅ Core AI infrastructure is ready');
    console.log('   ✅ API connections are working');
  } else {
    console.log('   🔧 Fix failed tests before production deployment');
    console.log('   📝 Review API keys and configurations');
  }
  
  if (TEST_RESULTS.warnings > 0) {
    console.log('   📝 Address warnings for optimal setup');
  }
  
  console.log('\n🎉 AI Workflow Testing Complete!');
  
  // Exit with appropriate code
  process.exit(TEST_RESULTS.failed > 0 ? 1 : 0);
}

async function main() {
  log('🚀 Starting AI Workflow Tests...', 'info');
  console.log('='.repeat(60));
  
  await testEnvironmentConfig();
  await testAPIConnectivity();
  await testModelAvailability();
  await testGenerationRequest();
  await testWebhookEndpoint();
  
  await printSummary();
}

main().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  process.exit(1);
});
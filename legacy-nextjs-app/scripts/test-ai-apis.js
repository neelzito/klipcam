#!/usr/bin/env node

// Test script to verify AI API connections
import { config } from 'dotenv';
import https from 'https';
import { URL } from 'url';
import { readFileSync } from 'fs';

// Load environment variables
config({ path: '.env.local' });

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'KlipCam-Test/1.0',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testReplicateAPI() {
  log('blue', '\n🔄 Testing Replicate API...');
  
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    log('red', '❌ REPLICATE_API_TOKEN not found in environment');
    return false;
  }
  
  if (token.length < 10) {
    log('yellow', '⚠️  REPLICATE_API_TOKEN seems too short');
    return false;
  }
  
  try {
    const response = await makeRequest('https://api.replicate.com/v1/models', {
      headers: {
        'Authorization': `Token ${token}`
      }
    });
    
    if (response.status === 200) {
      log('green', '✅ Replicate API connection successful');
      const modelCount = response.data?.results?.length || 0;
      log('green', `   Found ${modelCount} models available`);
      return true;
    } else {
      log('red', `❌ Replicate API error: ${response.status}`);
      log('red', `   Response: ${JSON.stringify(response.data, null, 2)}`);
      return false;
    }
  } catch (error) {
    log('red', `❌ Replicate API request failed: ${error.message}`);
    return false;
  }
}

async function testFalAPI() {
  log('blue', '\n🔄 Testing FAL.ai API...');
  
  const token = process.env.FAL_API_KEY;
  if (!token) {
    log('red', '❌ FAL_API_KEY not found in environment');
    return false;
  }
  
  if (!token.includes(':')) {
    log('yellow', '⚠️  FAL_API_KEY format seems incorrect (should contain ":")');
    return false;
  }
  
  try {
    // Test FAL.ai endpoint
    const response = await makeRequest('https://fal.run/fal-ai/fast-sdxl', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${token}`,
        'Accept': 'application/json'
      },
      body: {
        prompt: 'test connectivity',
        image_size: 'square_hd',
        num_inference_steps: 1,
        enable_safety_checker: false
      }
    });
    
    // For FAL, we expect either a 200 (success) or 422 (validation error with our test params)
    // Both indicate the API is reachable and authenticated
    if (response.status === 200 || response.status === 422) {
      log('green', '✅ FAL.ai API connection successful');
      if (response.status === 422) {
        log('yellow', '   (Test parameters rejected, but authentication worked)');
      }
      return true;
    } else {
      log('red', `❌ FAL.ai API error: ${response.status}`);
      log('red', `   Response: ${JSON.stringify(response.data, null, 2)}`);
      return false;
    }
  } catch (error) {
    log('red', `❌ FAL.ai API request failed: ${error.message}`);
    return false;
  }
}

async function testSpecificModels() {
  log('blue', '\n🔄 Testing specific model availability...');
  
  const modelsToTest = [
    { name: 'black-forest-labs/flux-1-dev', service: 'replicate' },
    { name: 'qwen/qwen-image', service: 'replicate' },
    { name: 'nightmareai/real-esrgan', service: 'replicate' },
    { name: 'fal-ai/flux/dev', service: 'fal' },
    { name: 'fal-ai/wan-flf2v', service: 'fal' }
  ];
  
  const results = [];
  
  for (const model of modelsToTest) {
    try {
      if (model.service === 'replicate') {
        const token = process.env.REPLICATE_API_TOKEN;
        if (!token) continue;
        
        const response = await makeRequest(`https://api.replicate.com/v1/models/${model.name}`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        if (response.status === 200) {
          log('green', `   ✅ ${model.name} - Available`);
          results.push({ model: model.name, status: 'available' });
        } else {
          log('red', `   ❌ ${model.name} - Not found or error`);
          results.push({ model: model.name, status: 'error' });
        }
      } else {
        // For FAL models, we just check if the API key format is correct
        // as testing specific models requires actual generation requests
        const token = process.env.FAL_API_KEY;
        if (token && token.includes(':')) {
          log('yellow', `   ⚠️  ${model.name} - Cannot test without generation (assumed available)`);
          results.push({ model: model.name, status: 'assumed' });
        } else {
          log('red', `   ❌ ${model.name} - FAL API key not configured`);
          results.push({ model: model.name, status: 'no_key' });
        }
      }
    } catch (error) {
      log('red', `   ❌ ${model.name} - Error: ${error.message}`);
      results.push({ model: model.name, status: 'error' });
    }
  }
  
  return results;
}

async function main() {
  log('bold', '🧪 KlipCam AI API Connection Test');
  log('bold', '==================================\n');
  
  const replicateOk = await testReplicateAPI();
  const falOk = await testFalAPI();
  const modelResults = await testSpecificModels();
  
  log('blue', '\n📊 Summary');
  log('blue', '===========');
  
  log(replicateOk ? 'green' : 'red', `Replicate API: ${replicateOk ? 'Connected' : 'Failed'}`);
  log(falOk ? 'green' : 'red', `FAL.ai API: ${falOk ? 'Connected' : 'Failed'}`);
  
  const availableModels = modelResults.filter(r => r.status === 'available' || r.status === 'assumed').length;
  const totalModels = modelResults.length;
  
  log(availableModels === totalModels ? 'green' : 'yellow', 
    `Models: ${availableModels}/${totalModels} available`);
  
  if (replicateOk && falOk && availableModels > 0) {
    log('green', '\n🎉 AI integration is ready for production!');
    process.exit(0);
  } else {
    log('red', '\n❌ AI integration needs configuration before production use');
    process.exit(1);
  }
}

// Run the test
main().catch(error => {
  console.error('Test script error:', error);
  process.exit(1);
});
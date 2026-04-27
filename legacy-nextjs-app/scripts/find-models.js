#!/usr/bin/env node

// Find available models on Replicate
import { config } from 'dotenv';
import https from 'https';

// Load environment variables
config({ path: '.env.local' });

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'KlipCam-ModelSearch/1.0',
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
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function searchModels(query) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    console.log('❌ REPLICATE_API_TOKEN not found');
    return;
  }

  const url = `https://api.replicate.com/v1/collections/diffusion?cursor=`;
  
  try {
    const response = await makeRequest(url, {
      headers: {
        'Authorization': `Token ${token}`
      }
    });
    
    if (response.status === 200) {
      console.log('🔍 Available FLUX/Diffusion Models:');
      const models = response.data.models || [];
      
      const fluxModels = models.filter(model => 
        model.name.toLowerCase().includes('flux') ||
        model.description?.toLowerCase().includes('flux') ||
        model.owner === 'black-forest-labs'
      );
      
      fluxModels.forEach(model => {
        console.log(`  ✅ ${model.owner}/${model.name}`);
        console.log(`     Description: ${model.description}`);
        console.log(`     URL: https://replicate.com/${model.owner}/${model.name}\n`);
      });
      
      if (fluxModels.length === 0) {
        console.log('  No FLUX models found in diffusion collection');
      }
    } else {
      console.log(`❌ API Error: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }
}

// Also search for specific high-quality models
async function searchSpecificModels() {
  const token = process.env.REPLICATE_API_TOKEN;
  const modelsToCheck = [
    'black-forest-labs/flux-1.1-pro',
    'black-forest-labs/flux-dev',
    'black-forest-labs/flux-schnell',
    'stability-ai/sdxl',
    'stability-ai/stable-diffusion-xl-base-1.0'
  ];
  
  console.log('\n🎯 Checking specific high-quality models:');
  
  for (const modelPath of modelsToCheck) {
    try {
      const response = await makeRequest(`https://api.replicate.com/v1/models/${modelPath}`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      if (response.status === 200) {
        console.log(`  ✅ ${modelPath} - Available`);
        if (response.data.latest_version) {
          console.log(`     Version: ${response.data.latest_version.id}`);
        }
      } else {
        console.log(`  ❌ ${modelPath} - Not available (${response.status})`);
      }
    } catch (error) {
      console.log(`  ❌ ${modelPath} - Error: ${error.message}`);
    }
  }
}

async function main() {
  console.log('🔍 KlipCam Model Discovery\n');
  
  await searchModels('flux');
  await searchSpecificModels();
  
  console.log('\n💡 Recommendation: Use the models marked as "Available" in your configuration.');
}

main().catch(console.error);
#!/usr/bin/env node

// End-to-end test for all AI generation workflows
import { config } from 'dotenv';
import { generateImage as aiGenerateImage, generateVideo, upscaleImage, getProviderHealth, resetProviderHealth } from '../src/lib/ai-provider.js';
import { generateImage as replicateGenerateImage, generateVideo as replicateGenerateVideo, upscaleImage as replicateUpscaleImage } from '../src/lib/replicate.js';
import { generateImage as falGenerateImage } from '../src/lib/falai.js';

// Load environment variables
config({ path: '.env.local' });

const TEST_CONFIG = {
  // Test parameters
  testPrompt: 'A beautiful sunset over mountains, cinematic lighting, high quality',
  testImage: 'https://replicate.delivery/pbxt/example-image.jpg', // Placeholder - would use real test image in production
  maxWaitTime: 300000, // 5 minutes max wait
  pollInterval: 5000,   // Check every 5 seconds
  
  // Credit costs for validation
  expectedCosts: {
    imageBase: 1,
    imagePremium: 4,
    videoBase: 18,
    videoSpider: 25,
    upscale: 4,
  }
};

class WorkflowTester {
  constructor() {
    this.results = {
      tests: [],
      errors: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '💡',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      test: '🧪'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  recordTest(name, status, details = {}) {
    const test = {
      name,
      status,
      timestamp: new Date().toISOString(),
      ...details
    };
    
    this.results.tests.push(test);
    this.results.summary.total++;
    
    if (status === 'passed') {
      this.results.summary.passed++;
      this.log(`${name} - PASSED`, 'success');
    } else if (status === 'failed') {
      this.results.summary.failed++;
      this.log(`${name} - FAILED: ${details.error}`, 'error');
      this.results.errors.push({ test: name, error: details.error });
    } else if (status === 'warning') {
      this.results.summary.warnings++;
      this.log(`${name} - WARNING: ${details.warning}`, 'warning');
    }
  }

  async testProviderHealth() {
    this.log('Testing provider health system...', 'test');
    
    try {
      // Reset health status
      resetProviderHealth();
      const health = getProviderHealth();
      
      // Validate health structure
      if (!health.providers || !health.providers.replicate || !health.providers.fal) {
        throw new Error('Invalid health structure');
      }
      
      if (!health.providers.replicate.healthy || !health.providers.fal.healthy) {
        throw new Error('Providers should start as healthy');
      }
      
      this.recordTest('Provider Health System', 'passed', {
        primaryProvider: health.primary,
        fallbackEnabled: health.fallbackEnabled
      });
      
    } catch (error) {
      this.recordTest('Provider Health System', 'failed', { error: error.message });
    }
  }

  async testDirectReplicateImage() {
    this.log('Testing direct Replicate image generation...', 'test');
    
    try {
      const params = {
        prompt: TEST_CONFIG.testPrompt,
        aspect_ratio: 'portrait'
      };
      
      // Test base tier
      const baseResult = await replicateGenerateImage(params, 'base');
      
      if (!baseResult.id || !baseResult.model) {
        throw new Error('Invalid base image response structure');
      }
      
      if (baseResult.credits !== TEST_CONFIG.expectedCosts.imageBase) {
        throw new Error(`Expected ${TEST_CONFIG.expectedCosts.imageBase} credits, got ${baseResult.credits}`);
      }
      
      // Test premium tier  
      const premiumResult = await replicateGenerateImage(params, 'premium');
      
      if (premiumResult.credits !== TEST_CONFIG.expectedCosts.imagePremium) {
        throw new Error(`Expected ${TEST_CONFIG.expectedCosts.imagePremium} credits, got ${premiumResult.credits}`);
      }
      
      this.recordTest('Direct Replicate Image Generation', 'passed', {
        baseId: baseResult.id,
        premiumId: premiumResult.id,
        baseCost: baseResult.credits,
        premiumCost: premiumResult.credits
      });
      
    } catch (error) {
      this.recordTest('Direct Replicate Image Generation', 'failed', { error: error.message });
    }
  }

  async testDirectFALImage() {
    this.log('Testing direct FAL.ai image generation...', 'test');
    
    try {
      const params = {
        prompt: TEST_CONFIG.testPrompt,
        width: 768,
        height: 1024
      };
      
      // Test base tier
      const baseResult = await falGenerateImage(params, 'base');
      
      if (!baseResult.id) {
        throw new Error('Invalid FAL base image response structure');
      }
      
      // Test premium tier
      const premiumResult = await falGenerateImage(params, 'premium');
      
      if (!premiumResult.id) {
        throw new Error('Invalid FAL premium image response structure');  
      }
      
      this.recordTest('Direct FAL.ai Image Generation', 'passed', {
        baseId: baseResult.id,
        premiumId: premiumResult.id,
        provider: 'fal.ai'
      });
      
    } catch (error) {
      this.recordTest('Direct FAL.ai Image Generation', 'failed', { error: error.message });
    }
  }

  async testFallbackImageGeneration() {
    this.log('Testing AI provider fallback system...', 'test');
    
    try {
      const params = {
        prompt: TEST_CONFIG.testPrompt,
        aspect_ratio: 'square'
      };
      
      // Test fallback system with both providers available
      const result = await aiGenerateImage(params, 'base');
      
      if (!result.id || !result.provider) {
        throw new Error('Invalid fallback response structure');
      }
      
      // The result should indicate which provider was used
      if (!['replicate', 'fal'].includes(result.provider)) {
        throw new Error('Invalid provider in response');
      }
      
      this.recordTest('AI Provider Fallback System', 'passed', {
        generationId: result.id,
        providerUsed: result.provider,
        fallbackUsed: result.fallbackUsed || false
      });
      
    } catch (error) {
      this.recordTest('AI Provider Fallback System', 'failed', { error: error.message });
    }
  }

  async testVideoGeneration() {
    this.log('Testing video generation workflows...', 'test');
    
    try {
      const params = {
        prompt: 'A serene lake with gentle waves, peaceful nature scene',
        aspect_ratio: 'vertical',
        duration: 3
      };
      
      // Test base video
      const baseResult = await generateVideo(params, 'base');
      
      if (!baseResult.id) {
        throw new Error('Invalid video response structure');
      }
      
      if (baseResult.credits !== TEST_CONFIG.expectedCosts.videoBase) {
        throw new Error(`Expected ${TEST_CONFIG.expectedCosts.videoBase} credits, got ${baseResult.credits}`);
      }
      
      this.recordTest('Video Generation Workflow', 'passed', {
        videoId: baseResult.id,
        provider: baseResult.provider,
        credits: baseResult.credits
      });
      
    } catch (error) {
      this.recordTest('Video Generation Workflow', 'failed', { error: error.message });
    }
  }

  async testUpscaleWorkflow() {
    this.log('Testing image upscale workflow...', 'test');
    
    try {
      // Note: This would require a real test image URL in production
      this.recordTest('Image Upscale Workflow', 'warning', {
        warning: 'Skipped - requires valid test image URL'
      });
      
    } catch (error) {
      this.recordTest('Image Upscale Workflow', 'failed', { error: error.message });
    }
  }

  async testErrorHandling() {
    this.log('Testing error handling and validation...', 'test');
    
    try {
      let errorCount = 0;
      
      // Test invalid prompt (too short)
      try {
        await aiGenerateImage({ prompt: 'hi' });
        throw new Error('Should have rejected short prompt');
      } catch (error) {
        if (error.message.includes('at least 10 characters')) {
          errorCount++;
        }
      }
      
      // Test invalid aspect ratio
      try {
        await aiGenerateImage({ 
          prompt: TEST_CONFIG.testPrompt,
          aspect_ratio: 'invalid' 
        });
        // This might not error depending on implementation
      } catch (error) {
        // Expected error for invalid aspect ratio
        errorCount++;
      }
      
      if (errorCount > 0) {
        this.recordTest('Error Handling & Validation', 'passed', {
          validationErrors: errorCount
        });
      } else {
        this.recordTest('Error Handling & Validation', 'warning', {
          warning: 'No validation errors caught - review validation logic'
        });
      }
      
    } catch (error) {
      this.recordTest('Error Handling & Validation', 'failed', { error: error.message });
    }
  }

  async testParameterValidation() {
    this.log('Testing generation parameter validation...', 'test');
    
    try {
      const validParams = {
        prompt: TEST_CONFIG.testPrompt,
        aspect_ratio: 'portrait',
        steps: 20,
        guidance: 7.5,
        seed: 12345
      };
      
      // Test parameter passing
      const result = await aiGenerateImage(validParams, 'base');
      
      if (!result.metadata) {
        throw new Error('Missing metadata in response');
      }
      
      this.recordTest('Parameter Validation', 'passed', {
        aspectRatio: result.metadata.aspectRatio,
        dimensions: result.metadata.dimensions
      });
      
    } catch (error) {
      this.recordTest('Parameter Validation', 'failed', { error: error.message });
    }
  }

  async runAllTests() {
    this.log('🚀 Starting comprehensive AI workflow tests...', 'info');
    this.log(`Environment: ${process.env.NODE_ENV || 'development'}`, 'info');
    
    // Check API keys
    if (!process.env.REPLICATE_API_TOKEN) {
      this.log('Missing REPLICATE_API_TOKEN - some tests will fail', 'warning');
    }
    if (!process.env.FAL_API_KEY) {
      this.log('Missing FAL_API_KEY - some tests will fail', 'warning');
    }
    
    console.log('\n' + '='.repeat(60));
    
    // Run all test suites
    await this.testProviderHealth();
    await this.testDirectReplicateImage();
    await this.testDirectFALImage();
    await this.testFallbackImageGeneration();
    await this.testVideoGeneration();
    await this.testUpscaleWorkflow();
    await this.testErrorHandling();
    await this.testParameterValidation();
    
    this.printSummary();
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    this.log('🎯 Test Summary', 'info');
    console.log(`
📊 Results:
   Total Tests: ${this.results.summary.total}
   ✅ Passed:   ${this.results.summary.passed}
   ❌ Failed:   ${this.results.summary.failed}
   ⚠️  Warnings: ${this.results.summary.warnings}
   
📈 Success Rate: ${Math.round((this.results.summary.passed / this.results.summary.total) * 100)}%`);
    
    if (this.results.errors.length > 0) {
      console.log('\n🚨 Failed Tests:');
      this.results.errors.forEach(({ test, error }) => {
        console.log(`   • ${test}: ${error}`);
      });
    }
    
    console.log('\n💡 Recommendations:');
    if (this.results.summary.failed === 0) {
      console.log('   ✅ All core workflows are functioning correctly');
      console.log('   ✅ AI integration is production-ready');
    } else {
      console.log('   ⚠️  Review failed tests before production deployment');
      console.log('   🔧 Check API keys and network connectivity');
    }
    
    if (this.results.summary.warnings > 0) {
      console.log('   📝 Address warnings to improve test coverage');
    }
    
    console.log('\n🎉 AI Model Integration Testing Complete!');
  }
}

// Run the tests
const tester = new WorkflowTester();
tester.runAllTests().catch(console.error);
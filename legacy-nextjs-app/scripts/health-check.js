#!/usr/bin/env node

/**
 * KlipCam Health Check Script
 * 
 * Comprehensive system health monitoring that can be run:
 * - As a standalone script for manual checks
 * - In CI/CD pipelines for deployment validation
 * - As a cron job for continuous monitoring
 * - By external monitoring services
 */

const https = require('https');
const http = require('http');

class HealthChecker {
  constructor(config = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'https://klipcam.com',
      timeout: config.timeout || 10000,
      verbose: config.verbose || false,
      retries: config.retries || 3,
      ...config
    };
    
    this.results = {
      timestamp: new Date().toISOString(),
      overall: 'unknown',
      checks: {},
      errors: [],
      warnings: []
    };
  }

  async runAllChecks() {
    console.log('🔍 Starting KlipCam health check...\n');

    const checks = [
      { name: 'API Health', fn: () => this.checkApiHealth() },
      { name: 'Database', fn: () => this.checkDatabase() },
      { name: 'Authentication', fn: () => this.checkAuthentication() },
      { name: 'Storage', fn: () => this.checkStorage() },
      { name: 'External Services', fn: () => this.checkExternalServices() },
      { name: 'Performance', fn: () => this.checkPerformance() },
      { name: 'Security Headers', fn: () => this.checkSecurityHeaders() }
    ];

    for (const check of checks) {
      try {
        console.log(`Checking ${check.name}...`);
        const result = await check.fn();
        this.results.checks[check.name.toLowerCase().replace(' ', '_')] = result;
        
        if (result.status === 'healthy') {
          console.log(`✅ ${check.name}: ${result.message || 'OK'}`);
        } else if (result.status === 'warning') {
          console.log(`⚠️  ${check.name}: ${result.message}`);
          this.results.warnings.push(`${check.name}: ${result.message}`);
        } else {
          console.log(`❌ ${check.name}: ${result.message}`);
          this.results.errors.push(`${check.name}: ${result.message}`);
        }
      } catch (error) {
        console.log(`❌ ${check.name}: ${error.message}`);
        this.results.errors.push(`${check.name}: ${error.message}`);
        this.results.checks[check.name.toLowerCase().replace(' ', '_')] = {
          status: 'unhealthy',
          message: error.message,
          timestamp: new Date().toISOString()
        };
      }
      console.log('');
    }

    this.determineOverallHealth();
    this.printSummary();
    return this.results;
  }

  async checkApiHealth() {
    const startTime = Date.now();
    const response = await this.makeRequest('/api/health');
    const responseTime = Date.now() - startTime;

    if (response.status !== 200) {
      return {
        status: 'unhealthy',
        message: `Health endpoint returned ${response.status}`,
        response_time: responseTime
      };
    }

    const data = JSON.parse(response.body);
    
    return {
      status: data.status === 'healthy' ? 'healthy' : 'unhealthy',
      message: `API responding in ${responseTime}ms`,
      response_time: responseTime,
      version: data.version,
      checks: data.checks
    };
  }

  async checkDatabase() {
    try {
      const response = await this.makeRequest('/api/health');
      const data = JSON.parse(response.body);
      
      if (data.checks?.database?.status === 'healthy') {
        return {
          status: 'healthy',
          message: `Database connection OK (${data.checks.database.latency}ms)`,
          latency: data.checks.database.latency
        };
      } else {
        return {
          status: 'unhealthy',
          message: 'Database connection failed',
          error: data.checks?.database?.error
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Could not check database status',
        error: error.message
      };
    }
  }

  async checkAuthentication() {
    try {
      // Test unauthenticated request to protected endpoint
      const response = await this.makeRequest('/api/jobs');
      
      if (response.status === 401) {
        return {
          status: 'healthy',
          message: 'Authentication properly protecting endpoints'
        };
      } else {
        return {
          status: 'warning',
          message: `Protected endpoint returned ${response.status} instead of 401`
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Could not test authentication',
        error: error.message
      };
    }
  }

  async checkStorage() {
    try {
      const response = await this.makeRequest('/api/health');
      const data = JSON.parse(response.body);
      
      if (data.checks?.storage?.status === 'healthy') {
        return {
          status: 'healthy',
          message: 'Storage service accessible'
        };
      } else {
        return {
          status: 'unhealthy',
          message: 'Storage service unavailable',
          error: data.checks?.storage?.error
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Could not check storage status',
        error: error.message
      };
    }
  }

  async checkExternalServices() {
    const services = [
      { name: 'Replicate', url: 'https://api.replicate.com' },
      { name: 'Stripe', url: 'https://api.stripe.com' },
      { name: 'Clerk', url: 'https://api.clerk.dev' }
    ];

    const results = [];
    
    for (const service of services) {
      try {
        const startTime = Date.now();
        await this.makeRequest('/', { baseUrl: service.url });
        const responseTime = Date.now() - startTime;
        
        results.push({
          service: service.name,
          status: 'healthy',
          response_time: responseTime
        });
      } catch (error) {
        results.push({
          service: service.name,
          status: 'unhealthy',
          error: error.message
        });
      }
    }

    const unhealthyServices = results.filter(r => r.status === 'unhealthy');
    
    if (unhealthyServices.length === 0) {
      return {
        status: 'healthy',
        message: 'All external services accessible',
        services: results
      };
    } else if (unhealthyServices.length < services.length) {
      return {
        status: 'warning',
        message: `${unhealthyServices.length} services unreachable`,
        services: results
      };
    } else {
      return {
        status: 'unhealthy',
        message: 'All external services unreachable',
        services: results
      };
    }
  }

  async checkPerformance() {
    const endpoints = [
      { path: '/', name: 'Homepage' },
      { path: '/api/health', name: 'Health API' }
    ];

    const results = [];
    
    for (const endpoint of endpoints) {
      const startTime = Date.now();
      try {
        await this.makeRequest(endpoint.path);
        const responseTime = Date.now() - startTime;
        
        results.push({
          endpoint: endpoint.name,
          response_time: responseTime,
          status: responseTime < 2000 ? 'good' : responseTime < 5000 ? 'warning' : 'poor'
        });
      } catch (error) {
        results.push({
          endpoint: endpoint.name,
          response_time: -1,
          status: 'error',
          error: error.message
        });
      }
    }

    const slowEndpoints = results.filter(r => r.status === 'poor' || r.status === 'error');
    const avgResponseTime = results
      .filter(r => r.response_time > 0)
      .reduce((sum, r) => sum + r.response_time, 0) / results.filter(r => r.response_time > 0).length;

    if (slowEndpoints.length === 0) {
      return {
        status: 'healthy',
        message: `Average response time: ${Math.round(avgResponseTime)}ms`,
        endpoints: results,
        average_response_time: avgResponseTime
      };
    } else {
      return {
        status: 'warning',
        message: `${slowEndpoints.length} endpoints performing poorly`,
        endpoints: results,
        average_response_time: avgResponseTime
      };
    }
  }

  async checkSecurityHeaders() {
    try {
      const response = await this.makeRequest('/', { includeHeaders: true });
      const headers = response.headers;
      
      const requiredHeaders = [
        'strict-transport-security',
        'x-content-type-options',
        'x-frame-options'
      ];

      const missingHeaders = requiredHeaders.filter(header => !headers[header]);
      
      if (missingHeaders.length === 0) {
        return {
          status: 'healthy',
          message: 'All required security headers present',
          headers: Object.keys(headers).filter(h => h.startsWith('x-') || h.includes('security'))
        };
      } else {
        return {
          status: 'warning',
          message: `Missing security headers: ${missingHeaders.join(', ')}`,
          missing_headers: missingHeaders
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Could not check security headers',
        error: error.message
      };
    }
  }

  async makeRequest(path, options = {}) {
    const config = { ...this.config, ...options };
    const baseUrl = config.baseUrl || this.config.baseUrl;
    const url = new URL(path, baseUrl);
    
    return new Promise((resolve, reject) => {
      const requestOptions = {
        method: config.method || 'GET',
        timeout: config.timeout,
        headers: {
          'User-Agent': 'KlipCam-HealthCheck/1.0',
          ...config.headers
        }
      };

      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.request(url, requestOptions, (res) => {
        let body = '';
        
        res.on('data', (chunk) => {
          body += chunk;
        });
        
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timeout after ${config.timeout}ms`));
      });

      if (config.body) {
        req.write(config.body);
      }
      
      req.end();
    });
  }

  determineOverallHealth() {
    const checks = Object.values(this.results.checks);
    const healthyCount = checks.filter(c => c.status === 'healthy').length;
    const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length;
    
    if (unhealthyCount === 0) {
      this.results.overall = 'healthy';
    } else if (unhealthyCount <= 2) {
      this.results.overall = 'degraded';
    } else {
      this.results.overall = 'unhealthy';
    }
  }

  printSummary() {
    console.log('\n📊 HEALTH CHECK SUMMARY');
    console.log('========================');
    console.log(`Overall Status: ${this.getStatusEmoji(this.results.overall)} ${this.results.overall.toUpperCase()}`);
    console.log(`Timestamp: ${this.results.timestamp}`);
    console.log(`Total Checks: ${Object.keys(this.results.checks).length}`);
    
    if (this.results.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.results.errors.forEach(error => console.log(`  • ${error}`));
    }
    
    if (this.results.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.results.warnings.forEach(warning => console.log(`  • ${warning}`));
    }

    console.log('\n🔗 Next Steps:');
    if (this.results.overall === 'unhealthy') {
      console.log('  • Investigate critical issues immediately');
      console.log('  • Check logs and monitoring dashboards');
      console.log('  • Consider rolling back recent deployments');
    } else if (this.results.overall === 'degraded') {
      console.log('  • Monitor system closely');
      console.log('  • Address warnings in next maintenance window');
    } else {
      console.log('  • System is healthy - no immediate action required');
      console.log('  • Continue regular monitoring');
    }
    
    console.log('\n');
  }

  getStatusEmoji(status) {
    switch (status) {
      case 'healthy': return '✅';
      case 'degraded': return '⚠️';
      case 'unhealthy': return '❌';
      default: return '❓';
    }
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const config = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    
    if (key === 'verbose') {
      config.verbose = true;
    } else if (key === 'timeout') {
      config.timeout = parseInt(value);
    } else if (key === 'url') {
      config.baseUrl = value;
    } else if (key === 'retries') {
      config.retries = parseInt(value);
    }
  }

  const checker = new HealthChecker(config);
  
  checker.runAllChecks()
    .then((results) => {
      if (results.overall === 'healthy') {
        process.exit(0);
      } else if (results.overall === 'degraded') {
        process.exit(1);
      } else {
        process.exit(2);
      }
    })
    .catch((error) => {
      console.error('❌ Health check failed:', error.message);
      process.exit(3);
    });
}

module.exports = { HealthChecker };
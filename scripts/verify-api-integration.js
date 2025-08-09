#!/usr/bin/env node

/**
 * Shield AI - API Integration Verification Script
 * 
 * This script verifies that all API services are properly integrated and working.
 * Run this script to check the health of all external services and integrations.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class APIVerifier {
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    this.results = {
      timestamp: new Date().toISOString(),
      services: {},
      overall: { healthy: 0, total: 0, percentage: 0 }
    };
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logSuccess(message) {
    this.log(`✅ ${message}`, 'green');
  }

  logError(message) {
    this.log(`❌ ${message}`, 'red');
  }

  logWarning(message) {
    this.log(`⚠️  ${message}`, 'yellow');
  }

  logInfo(message) {
    this.log(`ℹ️  ${message}`, 'blue');
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      };

      const req = client.request(requestOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({
              status: res.statusCode,
              data: jsonData,
              headers: res.headers
            });
          } catch (error) {
            resolve({
              status: res.statusCode,
              data: data,
              headers: res.headers
            });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (options.body) {
        req.write(JSON.stringify(options.body));
      }

      req.end();
    });
  }

  async checkEnvironmentVariables() {
    this.logInfo('Checking environment variables...');
    
    const requiredVars = [
      'OPENAI_API_KEY',
      'PINECONE_API_KEY',
      'PINECONE_ENVIRONMENT',
      'PINECONE_INDEX_NAME',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'STRIPE_SECRET_KEY',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      'BIBLE_API_KEY',
      'NEXT_PUBLIC_GOOGLE_PLACES_API_KEY'
    ];

    const missing = [];
    const present = [];

    for (const envVar of requiredVars) {
      if (process.env[envVar]) {
        present.push(envVar);
      } else {
        missing.push(envVar);
      }
    }

    if (missing.length === 0) {
      this.logSuccess(`All ${present.length} required environment variables are set`);
      this.results.services.environment = { status: 'healthy', present, missing };
    } else {
      this.logError(`${missing.length} environment variables are missing: ${missing.join(', ')}`);
      this.results.services.environment = { status: 'error', present, missing };
    }
  }

  async checkHealthEndpoint() {
    this.logInfo('Checking health endpoint...');
    
    try {
      const response = await this.makeRequest(`${this.baseUrl}/api/health`);
      
      if (response.status === 200) {
        this.logSuccess('Health endpoint is responding');
        this.results.services.health = { status: 'healthy', data: response.data };
      } else {
        this.logError(`Health endpoint returned status ${response.status}`);
        this.results.services.health = { status: 'error', statusCode: response.status };
      }
    } catch (error) {
      this.logError(`Health endpoint failed: ${error.message}`);
      this.results.services.health = { status: 'error', error: error.message };
    }
  }

  async checkAPIIntegration() {
    this.logInfo('Checking API integration test...');
    
    try {
      const response = await this.makeRequest(`${this.baseUrl}/api/test-api-integration`);
      
      if (response.status === 200) {
        this.logSuccess('API integration test completed');
        this.results.services.apiIntegration = { status: 'healthy', data: response.data };
        
        // Log individual service results
        if (response.data.services) {
          Object.entries(response.data.services).forEach(([service, data]) => {
            if (data.status === 'healthy') {
              this.logSuccess(`${service}: ${data.status}`);
            } else {
              this.logError(`${service}: ${data.status} - ${data.error || 'Unknown error'}`);
            }
          });
        }
      } else {
        this.logError(`API integration test returned status ${response.status}`);
        this.results.services.apiIntegration = { status: 'error', statusCode: response.status };
      }
    } catch (error) {
      this.logError(`API integration test failed: ${error.message}`);
      this.results.services.apiIntegration = { status: 'error', error: error.message };
    }
  }

  async checkBibleAPI() {
    this.logInfo('Checking Bible API endpoints...');
    
    const endpoints = [
      '/api/bible/versions',
      '/api/bible/popular',
      '/api/bible/daily-verse'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest(`${this.baseUrl}${endpoint}`);
        
        if (response.status === 200) {
          this.logSuccess(`${endpoint}: OK`);
        } else {
          this.logError(`${endpoint}: Status ${response.status}`);
        }
      } catch (error) {
        this.logError(`${endpoint}: Failed - ${error.message}`);
      }
    }
  }

  async checkSubscriptionAPI() {
    this.logInfo('Checking subscription API endpoints...');
    
    const endpoints = [
      '/api/subscriptions/plans',
      '/api/subscriptions/tiers',
      '/api/subscriptions/status'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest(`${this.baseUrl}${endpoint}`);
        
        if (response.status === 200) {
          this.logSuccess(`${endpoint}: OK`);
        } else {
          this.logError(`${endpoint}: Status ${response.status}`);
        }
      } catch (error) {
        this.logError(`${endpoint}: Failed - ${error.message}`);
      }
    }
  }

  async checkChurchFinderAPI() {
    this.logInfo('Checking church finder API...');
    
    try {
      const response = await this.makeRequest(`${this.baseUrl}/api/churches/search`, {
        method: 'POST',
        body: {
          latitude: 30.2672,
          longitude: -97.7431,
          radius: 5000
        }
      });
      
      if (response.status === 200) {
        this.logSuccess('Church finder API: OK');
      } else {
        this.logError(`Church finder API: Status ${response.status}`);
      }
    } catch (error) {
      this.logError(`Church finder API: Failed - ${error.message}`);
    }
  }

  async checkDatabaseConnection() {
    this.logInfo('Checking database connection...');
    
    try {
      // This would require a database connection test endpoint
      // For now, we'll check if the app can start
      this.logWarning('Database connection test requires app to be running');
      this.results.services.database = { status: 'unknown', message: 'Requires app to be running' };
    } catch (error) {
      this.logError(`Database connection failed: ${error.message}`);
      this.results.services.database = { status: 'error', error: error.message };
    }
  }

  async checkExternalServices() {
    this.logInfo('Checking external service connectivity...');
    
    const services = [
      { name: 'OpenAI API', url: 'https://api.openai.com/v1/models' },
      { name: 'Pinecone API', url: 'https://controller.us-east-1-aws.pinecone.io/databases' },
      { name: 'Stripe API', url: 'https://api.stripe.com/v1/account' },
      { name: 'Google Places API', url: 'https://maps.googleapis.com/maps/api/place/details/json' }
    ];

    for (const service of services) {
      try {
        const response = await this.makeRequest(service.url);
        
        if (response.status === 200 || response.status === 401) {
          // 401 means the service is reachable but needs authentication
          this.logSuccess(`${service.name}: Reachable`);
        } else {
          this.logError(`${service.name}: Status ${response.status}`);
        }
      } catch (error) {
        this.logError(`${service.name}: Unreachable - ${error.message}`);
      }
    }
  }

  calculateOverallHealth() {
    const services = Object.values(this.results.services);
    const healthy = services.filter(service => service.status === 'healthy').length;
    const total = services.length;
    
    this.results.overall = {
      healthy,
      total,
      percentage: Math.round((healthy / total) * 100)
    };

    this.log('\n' + '='.repeat(50), 'bright');
    this.log(`Overall Health: ${this.results.overall.percentage}% (${healthy}/${total} services)`, 'bright');
    this.log('='.repeat(50), 'bright');

    if (this.results.overall.percentage === 100) {
      this.log('🎉 All services are healthy!', 'green');
    } else if (this.results.overall.percentage >= 80) {
      this.log('⚠️  Most services are healthy, some issues detected', 'yellow');
    } else {
      this.log('❌ Multiple service issues detected', 'red');
    }
  }

  async saveResults() {
    const resultsPath = path.join(__dirname, '../logs/api-integration-results.json');
    const resultsDir = path.dirname(resultsPath);
    
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));
    this.logInfo(`Results saved to ${resultsPath}`);
  }

  async run() {
    this.log('🚀 Starting Shield AI API Integration Verification', 'bright');
    this.log(`Base URL: ${this.baseUrl}`, 'cyan');
    this.log('');

    await this.checkEnvironmentVariables();
    await this.checkHealthEndpoint();
    await this.checkAPIIntegration();
    await this.checkBibleAPI();
    await this.checkSubscriptionAPI();
    await this.checkChurchFinderAPI();
    await this.checkDatabaseConnection();
    await this.checkExternalServices();

    this.calculateOverallHealth();
    await this.saveResults();

    this.log('\n📋 Verification complete!', 'bright');
  }
}

// Run the verification
async function main() {
  const verifier = new APIVerifier();
  
  try {
    await verifier.run();
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = APIVerifier;


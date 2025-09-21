const { exec } = require('child_process');
const { promisify } = require('util');
require('dotenv').config({ path: '.env.local' });

const execAsync = promisify(exec);

async function testPineconeCurl() {
  console.log('🧪 Pinecone API Test with cURL Commands\n');
  
  try {
    const apiKey = process.env.PINECONE_API_KEY;
    
    if (!apiKey) {
      console.error('❌ PINECONE_API_KEY not found in .env.local');
      return;
    }
    
    console.log('Using API key from .env.local:', `${apiKey.substring(0, 8)}...${apiKey.slice(-4)}`);
    console.log('');
    
    // Test 1: List all indexes
    console.log('🔍 Test 1: Listing all indexes...');
    try {
      const { stdout, stderr } = await execAsync(
        `curl -s -X GET "https://api.pinecone.io/indexes" \
        -H "Api-Key: ${apiKey}" \
        -H "Content-Type: application/json"`
      );
      
      if (stderr) {
        console.log('  Error:', stderr);
      } else {
        console.log('  Response:', stdout);
        
        // Try to parse the response
        try {
          const response = JSON.parse(stdout);
          if (response.indexes && response.indexes.length > 0) {
            console.log(`  ✅ Found ${response.indexes.length} indexes:`);
            response.indexes.forEach(idx => {
              console.log(`    - ${idx.name} (${idx.dimension}d, ${idx.metric})`);
            });
          } else {
            console.log('  ℹ️  No indexes found or empty response');
          }
        } catch (parseError) {
          console.log('  ℹ️  Response (not JSON):', stdout);
        }
      }
    } catch (error) {
      console.log('  ❌ Failed:', error.message);
    }
    
    console.log('');
    
    // Test 2: Get specific index info
    console.log('🔍 Test 2: Getting shieldai index info...');
    try {
      const { stdout, stderr } = await execAsync(
        `curl -s -X GET "https://api.pinecone.io/indexes/shieldai" \
        -H "Api-Key: ${apiKey}" \
        -H "Content-Type: application/json"`
      );
      
      if (stderr) {
        console.log('  Error:', stderr);
      } else {
        console.log('  Response:', stdout);
        
        try {
          const response = JSON.parse(stdout);
          if (response.name) {
            console.log(`  ✅ Index found: ${response.name}`);
            console.log(`     Status: ${response.status}`);
            console.log(`     Dimensions: ${response.dimension}`);
            console.log(`     Metric: ${response.metric}`);
          } else if (response.error) {
            console.log(`  ❌ Error: ${response.error}`);
          }
        } catch (parseError) {
          console.log('  ℹ️  Response (not JSON):', stdout);
        }
      }
    } catch (error) {
      console.log('  ❌ Failed:', error.message);
    }
    
    console.log('');
    
    // Test 3: Test controller endpoints
    console.log('🔍 Test 3: Testing controller endpoints...');
    
    const controllers = [
      'https://controller.us-east-1-aws.pinecone.io',
      'https://controller.us-east-1.pinecone.io',
      'https://controller.us-west1-gcp.pinecone.io'
    ];
    
    for (const controller of controllers) {
      console.log(`  Testing ${controller}...`);
      try {
        const { stdout, stderr } = await execAsync(
          `curl -s -X GET "${controller}/actions/whoami" \
          -H "Api-Key: ${apiKey}" \
          -H "Content-Type: application/json"`
        );
        
        if (stderr) {
          console.log(`    Error: ${stderr}`);
        } else {
          try {
            const response = JSON.parse(stdout);
            if (response.user) {
              console.log(`    ✅ Connected! User: ${response.user}`);
            } else if (response.error) {
              console.log(`    ❌ Error: ${response.error}`);
            } else {
              console.log(`    ℹ️  Response: ${stdout}`);
            }
          } catch (parseError) {
            console.log(`    ℹ️  Response (not JSON): ${stdout}`);
          }
        }
      } catch (error) {
        console.log(`    ❌ Failed: ${error.message}`);
      }
    }
    
    console.log('');
    console.log('🎯 Summary:');
    console.log('1. Check the responses above for any working endpoints');
    console.log('2. Look for error messages that might indicate the issue');
    console.log('3. If you see "unauthorized" errors, the API key is wrong');
    console.log('4. If you see "not found" errors, the endpoint is wrong');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPineconeCurl();

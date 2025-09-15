/**
 * Simple test script for the brief processing API
 * Run with: node test-api.js
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing ProdBay Backend API...\n');

  // Test 1: Health check
  console.log('1. Testing health check...');
  try {
    const healthResponse = await fetch(`${API_BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.message);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }

  // Test 2: Process brief
  console.log('\n2. Testing brief processing...');
  const testBrief = {
    projectId: '123e4567-e89b-12d3-a456-426614174000',
    briefDescription: 'We need a corporate event with stage setup, audio system, lighting, and catering for 200 people at the convention center.'
  };

  try {
    const briefResponse = await fetch(`${API_BASE_URL}/api/process-brief`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testBrief)
    });

    const briefData = await briefResponse.json();
    
    if (briefData.success) {
      console.log('✅ Brief processing successful!');
      console.log(`   Identified assets: ${briefData.data.identifiedAssets.join(', ')}`);
      console.log(`   Created ${briefData.data.createdAssets.length} assets`);
      console.log(`   Processing time: ${briefData.data.processingTime}ms`);
    } else {
      console.log('❌ Brief processing failed:', briefData.error.message);
    }
  } catch (error) {
    console.log('❌ Brief processing request failed:', error.message);
  }

  // Test 3: Invalid request
  console.log('\n3. Testing invalid request...');
  try {
    const invalidResponse = await fetch(`${API_BASE_URL}/api/process-brief`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ projectId: 'invalid' })
    });

    const invalidData = await invalidResponse.json();
    
    if (!invalidData.success) {
      console.log('✅ Invalid request properly rejected:', invalidData.error.message);
    } else {
      console.log('❌ Invalid request should have been rejected');
    }
  } catch (error) {
    console.log('❌ Invalid request test failed:', error.message);
  }

  console.log('\n🏁 API testing completed!');
}

// Run tests
testAPI().catch(console.error);

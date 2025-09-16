/**
 * AI Allocation API Test Script
 * Tests the AI-powered allocation endpoints
 */

require('dotenv').config();
const fetch = require('node-fetch');

const RAILWAY_API_URL = process.env.RAILWAY_API_URL || 'http://localhost:3000';

// Test data
const testBrief = `
Corporate Product Launch Event
We're organizing a major product launch event for our new smartphone. The event will be held at the Grand Convention Center on March 15th, 2024, from 6:00 PM to 10:00 PM. We expect 500 attendees including media, influencers, and key stakeholders.

Requirements:
- Professional stage setup with backdrop and lighting
- High-quality audio system for presentations and music
- Video recording capabilities for social media content
- Catering for 500 people with cocktail reception
- Branded materials including banners, flyers, and promotional items
- Photography services for the event
- Security and crowd management
- Transportation for VIP guests
- Event coordination and logistics support

Budget: $50,000
Timeline: Event is in 6 weeks, so we need everything coordinated quickly.
`;

const testProjectContext = {
  financial_parameters: 50000,
  timeline_deadline: '2024-03-15',
  physical_parameters: 'Grand Convention Center, 500 attendees, 6PM-10PM'
};

async function testAIHealth() {
  console.log('🔍 Testing AI Health Check...');
  try {
    const response = await fetch(`${RAILWAY_API_URL}/api/ai-health`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ AI service is healthy');
      console.log('   Model:', data.data?.model || 'Unknown');
      return true;
    } else {
      console.log('❌ AI service is unhealthy:', data.error?.message);
      return false;
    }
  } catch (error) {
    console.log('❌ AI health check failed:', error.message);
    return false;
  }
}

async function testAssetAnalysis() {
  console.log('\n🧠 Testing AI Asset Analysis...');
  try {
    const response = await fetch(`${RAILWAY_API_URL}/api/ai-allocate-assets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        briefDescription: testBrief,
        projectContext: testProjectContext
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Asset analysis successful');
      console.log('   Assets identified:', data.data.assets.length);
      console.log('   Confidence:', Math.round(data.data.confidence * 100) + '%');
      console.log('   Processing time:', data.data.processingTime + 'ms');
      console.log('   Reasoning:', data.data.reasoning.substring(0, 100) + '...');
      
      // Display first few assets
      console.log('\n   Sample assets:');
      data.data.assets.slice(0, 3).forEach((asset, index) => {
        console.log(`   ${index + 1}. ${asset.asset_name} (${asset.priority} priority, ${asset.estimated_cost_range} cost)`);
      });
      
      return data.data.assets;
    } else {
      console.log('❌ Asset analysis failed:', data.error?.message);
      if (data.error?.fallbackData) {
        console.log('   Fallback data available:', data.error.fallbackData.length, 'assets');
      }
      return null;
    }
  } catch (error) {
    console.log('❌ Asset analysis request failed:', error.message);
    return null;
  }
}



async function testAssetCreation(assets) {
  console.log('\n📝 Testing AI Asset Creation...');
  try {
    const response = await fetch(`${RAILWAY_API_URL}/api/ai-create-assets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId: 'test-project-id',
        assets: assets.slice(0, 2) // Test with first 2 assets
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Asset creation successful');
      console.log('   Created assets:', data.data.count);
      return true;
    } else {
      console.log('❌ Asset creation failed:', data.error?.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Asset creation request failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Starting AI Allocation API Tests');
  console.log('=====================================');
  console.log('API URL:', RAILWAY_API_URL);
  console.log('OpenAI API Key:', process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('');

  const results = {
    health: false,
    assetAnalysis: false,
    assetCreation: false
  };

  // Test 1: Health Check
  results.health = await testAIHealth();
  
  if (!results.health) {
    console.log('\n❌ AI service is not healthy. Skipping other tests.');
    return results;
  }

  // Test 2: Asset Analysis
  const assets = await testAssetAnalysis();
  results.assetAnalysis = assets !== null;

  // Test 3: Asset Creation (if assets available)
  if (assets && assets.length > 0) {
    results.assetCreation = await testAssetCreation(assets);
  }

  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('========================');
  console.log('Health Check:', results.health ? '✅ PASS' : '❌ FAIL');
  console.log('Asset Analysis:', results.assetAnalysis ? '✅ PASS' : '❌ FAIL');
  console.log('Asset Creation:', results.assetCreation ? '✅ PASS' : '❌ FAIL');

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! AI allocation system is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above for details.');
  }

  return results;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testAIHealth,
  testAssetAnalysis,
  testAssetCreation
};

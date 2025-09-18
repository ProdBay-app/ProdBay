#!/usr/bin/env node

/**
 * Test script for Quote Comparison Feature
 * This script tests the Railway API endpoints for quote comparison
 */

const RAILWAY_API_URL = process.env.RAILWAY_API_URL || 'http://localhost:3000';

async function testQuoteComparisonAPI() {
  console.log('🧪 Testing Quote Comparison API...\n');

  try {
    // Test 1: Get quote summary for an asset
    console.log('📊 Test 1: Getting quote summary...');
    const summaryResponse = await fetch(`${RAILWAY_API_URL}/api/quotes/compare/test-asset-id/summary`);
    
    if (summaryResponse.ok) {
      const summaryData = await summaryResponse.json();
      console.log('✅ Quote summary endpoint working');
      console.log('   Response:', JSON.stringify(summaryData, null, 2));
    } else {
      console.log('⚠️  Quote summary endpoint returned:', summaryResponse.status);
    }

    // Test 2: Get detailed quote comparison
    console.log('\n📈 Test 2: Getting detailed quote comparison...');
    const comparisonResponse = await fetch(`${RAILWAY_API_URL}/api/quotes/compare/test-asset-id`);
    
    if (comparisonResponse.ok) {
      const comparisonData = await comparisonResponse.json();
      console.log('✅ Quote comparison endpoint working');
      console.log('   Response:', JSON.stringify(comparisonData, null, 2));
    } else {
      console.log('⚠️  Quote comparison endpoint returned:', comparisonResponse.status);
    }

    // Test 3: Test with invalid asset ID
    console.log('\n❌ Test 3: Testing with invalid asset ID...');
    const invalidResponse = await fetch(`${RAILWAY_API_URL}/api/quotes/compare/invalid-id`);
    
    if (invalidResponse.status === 400) {
      console.log('✅ Invalid asset ID properly rejected');
    } else {
      console.log('⚠️  Invalid asset ID handling unexpected:', invalidResponse.status);
    }

  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

async function testDatabaseConnection() {
  console.log('\n🗄️  Testing database connection...');
  
  try {
    const response = await fetch(`${RAILWAY_API_URL}/api/health`);
    if (response.ok) {
      console.log('✅ Database connection working');
    } else {
      console.log('⚠️  Database connection issue:', response.status);
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

async function main() {
  console.log('🚀 Quote Comparison Feature Test Suite\n');
  console.log(`🔗 Testing against: ${RAILWAY_API_URL}\n`);
  
  await testDatabaseConnection();
  await testQuoteComparisonAPI();
  
  console.log('\n✨ Test suite completed!');
  console.log('\n📝 Next steps:');
  console.log('   1. Run the database migration: npm run db:reset');
  console.log('   2. The comparison data will be seeded automatically with db:reset');
  console.log('   3. Start the development server: npm run dev');
  console.log('   4. Test the feature in the Producer Dashboard');
}

main().catch(console.error);

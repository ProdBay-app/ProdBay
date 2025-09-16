/**
 * Test script for the new supplier API endpoints
 * Run with: node test-supplier-api.js
 */

const fetch = require('node-fetch');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function testSupplierAPI() {
  console.log('🧪 Testing Supplier API Endpoints\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await fetch(`${BASE_URL}/api/suppliers/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.message);

    // Test 2: Get supplier suggestions (you'll need a real asset ID)
    console.log('\n2. Testing supplier suggestions...');
    console.log('⚠️  Note: You need to provide a real asset ID for this test');
    console.log('   Example: GET /api/suppliers/suggestions/YOUR_ASSET_ID_HERE');

    // Test 3: Send quote requests (you'll need real IDs)
    console.log('\n3. Testing send quote requests...');
    console.log('⚠️  Note: You need to provide real asset and supplier IDs for this test');
    console.log('   Example: POST /api/suppliers/send-quote-requests');
    console.log('   Body: {');
    console.log('     "assetId": "YOUR_ASSET_ID_HERE",');
    console.log('     "supplierIds": ["SUPPLIER_ID_1", "SUPPLIER_ID_2"],');
    console.log('     "from": {');
    console.log('       "name": "Test Producer",');
    console.log('       "email": "test@example.com"');
    console.log('     }');
    console.log('   }');

    console.log('\n🎉 API endpoints are ready for testing!');
    console.log('\n📋 Available endpoints:');
    console.log('   GET  /api/suppliers/health');
    console.log('   GET  /api/suppliers/suggestions/:assetId');
    console.log('   POST /api/suppliers/send-quote-requests');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testSupplierAPI();

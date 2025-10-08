import React, { useState } from 'react';
import { SupplierApiService } from '@/services/supplierApiService';

/**
 * Test component for the new Supplier API integration
 * This can be temporarily added to test the API endpoints
 */
const SupplierApiTest: React.FC = () => {
  const [testAssetId, setTestAssetId] = useState('');
  const [testResults, setTestResults] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testHealthCheck = async () => {
    setLoading(true);
    try {
      const isHealthy = await SupplierApiService.healthCheck();
      setTestResults(`Health Check: ${isHealthy ? '✅ PASSED' : '❌ FAILED'}\n`);
    } catch (error) {
      setTestResults(`Health Check: ❌ ERROR - ${error}\n`);
    } finally {
      setLoading(false);
    }
  };

  const testGetSuggestions = async () => {
    if (!testAssetId.trim()) {
      setTestResults('Please enter an asset ID to test suggestions\n');
      return;
    }

    setLoading(true);
    try {
      const response = await SupplierApiService.getSuggestedSuppliers(testAssetId);
      setTestResults(prev => prev + `\nSuggestions Test: ✅ PASSED\nFound ${response.suggestedSuppliers.length} suppliers for asset "${response.asset.asset_name}"\n`);
    } catch (error) {
      setTestResults(prev => prev + `\nSuggestions Test: ❌ ERROR - ${error}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Supplier API Test</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Test Asset ID (optional):
          </label>
          <input
            type="text"
            value={testAssetId}
            onChange={(e) => setTestAssetId(e.target.value)}
            placeholder="Enter asset ID to test suggestions"
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>

        <div className="flex space-x-2">
          <button
            onClick={testHealthCheck}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Test Health Check
          </button>
          <button
            onClick={testGetSuggestions}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            Test Get Suggestions
          </button>
        </div>

        {testResults && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h4 className="font-medium mb-2">Test Results:</h4>
            <pre className="text-sm whitespace-pre-wrap">{testResults}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierApiTest;

/**
 * Quotable Assets Test Panel
 * 
 * A development-only component for testing the quotable assets filtering
 * system. This component provides interactive tests to verify that the
 * SupplierSubmitQuote component is working correctly with the new API.
 */

import React, { useState } from 'react';
import { useSupplierImpersonation } from '../../contexts/SupplierImpersonationContext';
import { useNotification } from '../../hooks/useNotification';
import { AlertCircle, CheckCircle, Package, User, Shield, Loader2 } from 'lucide-react';

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  details?: string;
}

const QuotableAssetsTestPanel: React.FC = () => {
  const { isImpersonating, impersonatedSupplier, availableSuppliers } = useSupplierImpersonation();
  const { showError, showSuccess } = useNotification();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);

  /**
   * Test 1: Verify supplier impersonation context
   */
  const testSupplierContext = (): TestResult => {
    if (!isImpersonating || !impersonatedSupplier) {
      return {
        testName: 'Supplier Context',
        passed: false,
        message: 'No supplier selected for impersonation',
        details: 'Please select a supplier using the impersonation panel'
      };
    }

    return {
      testName: 'Supplier Context',
      passed: true,
      message: `Successfully impersonating: ${impersonatedSupplier.supplier_name}`,
      details: `Supplier ID: ${impersonatedSupplier.id}`
    };
  };

  /**
   * Test 2: Verify API endpoint accessibility
   */
  const testApiEndpoint = async (): Promise<TestResult> => {
    if (!impersonatedSupplier) {
      return {
        testName: 'API Endpoint',
        passed: false,
        message: 'Cannot test API without supplier context',
        details: 'Supplier impersonation required for API testing'
      };
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_RAILWAY_API_URL}/api/suppliers/${impersonatedSupplier.id}/quotable-assets`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      setApiResponse(data);

      if (response.ok && data.success) {
        return {
          testName: 'API Endpoint',
          passed: true,
          message: `API call successful (${response.status})`,
          details: `Found ${data.data.assets.length} quotable assets`
        };
      } else {
        return {
          testName: 'API Endpoint',
          passed: false,
          message: `API call failed (${response.status})`,
          details: data.error?.message || 'Unknown error'
        };
      }
    } catch (error) {
      return {
        testName: 'API Endpoint',
        passed: false,
        message: 'API call failed',
        details: error instanceof Error ? error.message : 'Network error'
      };
    }
  };

  /**
   * Test 3: Verify response data structure
   */
  const testResponseStructure = (): TestResult => {
    if (!apiResponse || !apiResponse.success) {
      return {
        testName: 'Response Structure',
        passed: false,
        message: 'Cannot validate response structure',
        details: 'API call must succeed first'
      };
    }

    const { data } = apiResponse;
    const hasSupplier = data.supplier && data.supplier.id && data.supplier.supplier_name;
    const hasAssets = Array.isArray(data.assets);
    const hasTotalCount = typeof data.total_count === 'number';
    const hasMessage = typeof data.message === 'string';

    const allValid = hasSupplier && hasAssets && hasTotalCount && hasMessage;

    return {
      testName: 'Response Structure',
      passed: allValid,
      message: allValid ? 'Response structure is valid' : 'Response structure is invalid',
      details: `Supplier: ${hasSupplier ? '✅' : '❌'}, Assets: ${hasAssets ? '✅' : '❌'}, Count: ${hasTotalCount ? '✅' : '❌'}, Message: ${hasMessage ? '✅' : '❌'}`
    };
  };

  /**
   * Test 4: Verify asset data integrity
   */
  const testAssetDataIntegrity = (): TestResult => {
    if (!apiResponse || !apiResponse.success || !apiResponse.data.assets.length) {
      return {
        testName: 'Asset Data Integrity',
        passed: true,
        message: 'No assets to validate (this is normal if no quote requests exist)',
        details: 'Asset validation skipped due to empty assets array'
      };
    }

    const assets = apiResponse.data.assets;
    const validAssets = assets.filter((asset: any) => 
      asset.id && 
      asset.asset_name && 
      asset.project && 
      asset.project.client_name &&
      asset.quote_request_id
    );

    const allValid = validAssets.length === assets.length;

    return {
      testName: 'Asset Data Integrity',
      passed: allValid,
      message: allValid ? 'All assets have valid data' : 'Some assets have missing data',
      details: `${validAssets.length}/${assets.length} assets have complete data`
    };
  };

  /**
   * Test 5: Verify security filtering
   */
  const testSecurityFiltering = (): TestResult => {
    if (!apiResponse || !apiResponse.success) {
      return {
        testName: 'Security Filtering',
        passed: false,
        message: 'Cannot validate security filtering',
        details: 'API call must succeed first'
      };
    }

    // Check if the response contains the correct supplier ID
    const responseSupplierId = apiResponse.data.supplier?.id;
    const expectedSupplierId = impersonatedSupplier?.id;

    if (responseSupplierId === expectedSupplierId) {
      return {
        testName: 'Security Filtering',
        passed: true,
        message: 'Security filtering is working correctly',
        details: `Response contains correct supplier ID: ${responseSupplierId}`
      };
    } else {
      return {
        testName: 'Security Filtering',
        passed: false,
        message: 'Security filtering may be compromised',
        details: `Expected: ${expectedSupplierId}, Got: ${responseSupplierId}`
      };
    }
  };

  /**
   * Run all tests
   */
  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    setApiResponse(null);

    const tests = [
      testSupplierContext(),
      await testApiEndpoint(),
      testResponseStructure(),
      testAssetDataIntegrity(),
      testSecurityFiltering()
    ];

    setTestResults(tests);
    setIsRunningTests(false);

    // Show notification
    const passedTests = tests.filter(t => t.passed).length;
    const totalTests = tests.length;
    
    if (passedTests === totalTests) {
      showSuccess(`All quotable assets tests passed! (${passedTests}/${totalTests})`);
    } else {
      showError(`Some quotable assets tests failed (${passedTests}/${totalTests})`);
    }
  };

  /**
   * Clear test results
   */
  const clearResults = () => {
    setTestResults([]);
    setApiResponse(null);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center space-x-2 mb-4">
        <Shield className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">Quotable Assets Test Panel</h3>
      </div>

      <div className="space-y-4">
        {/* Current Status */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Current Status</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <span>
                Impersonating: {isImpersonating ? impersonatedSupplier?.supplier_name : 'None'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-gray-500" />
              <span>
                Available Suppliers: {availableSuppliers.length}
              </span>
            </div>
            {apiResponse && (
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-gray-500" />
                <span>
                  API Response: {apiResponse.success ? 'Success' : 'Failed'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Test Controls */}
        <div className="flex space-x-3">
          <button
            onClick={runAllTests}
            disabled={isRunningTests}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunningTests ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Running Tests...
              </>
            ) : (
              'Run All Tests'
            )}
          </button>
          <button
            onClick={clearResults}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Clear Results
          </button>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Test Results</h4>
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  result.passed 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  {result.passed ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`font-medium ${
                    result.passed ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.testName}
                  </span>
                </div>
                <p className={`text-sm ${
                  result.passed ? 'text-green-700' : 'text-red-700'
                }`}>
                  {result.message}
                </p>
                {result.details && (
                  <p className="text-xs text-gray-600 mt-1">
                    {result.details}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* API Response Details */}
        {apiResponse && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">API Response Details</h4>
            <pre className="text-xs text-blue-800 overflow-auto max-h-40">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Testing Instructions</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Select a supplier using the impersonation panel above</li>
            <li>• Run the quotable assets tests to verify the system</li>
            <li>• Check that the API returns only authorized assets</li>
            <li>• Verify that the response structure is correct</li>
            <li>• Test with different suppliers to verify filtering</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QuotableAssetsTestPanel;

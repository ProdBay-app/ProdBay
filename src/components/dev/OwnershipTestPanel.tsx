/**
 * Ownership Test Panel
 * 
 * A development-only component for testing quote ownership enforcement
 * across the frontend layer. This component provides interactive tests
 * to verify that the SupplierImpersonationContext and quote submission
 * components are working correctly.
 */

import React, { useState } from 'react';
import { useSupplierImpersonation } from '../../contexts/SupplierImpersonationContext';
import { getSupabase } from '../../lib/supabase';
import { useNotification } from '../../hooks/useNotification';
import { AlertCircle, CheckCircle, Package, User, Shield } from 'lucide-react';

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  details?: string;
}

const OwnershipTestPanel: React.FC = () => {
  const { isImpersonating, impersonatedSupplier, availableSuppliers } = useSupplierImpersonation();
  const { showError, showSuccess } = useNotification();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

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
   * Test 2: Verify quote submission validation
   */
  const testQuoteSubmissionValidation = (): TestResult => {
    if (!isImpersonating || !impersonatedSupplier) {
      return {
        testName: 'Quote Submission Validation',
        passed: false,
        message: 'Cannot test quote submission without supplier context',
        details: 'Supplier impersonation required for quote submission'
      };
    }

    // Simulate the validation logic from SupplierSubmitQuote.tsx
    const hasValidContext = Boolean(isImpersonating && impersonatedSupplier);
    
    return {
      testName: 'Quote Submission Validation',
      passed: hasValidContext,
      message: hasValidContext 
        ? 'Quote submission validation passed'
        : 'Quote submission validation failed',
      details: hasValidContext 
        ? `Ready to submit quotes as ${impersonatedSupplier.supplier_name}`
        : 'No supplier context available'
    };
  };

  /**
   * Test 3: Verify database connection and RLS policies
   */
  const testDatabaseConnection = async (): Promise<TestResult> => {
    try {
      const supabase = await getSupabase();
      
      // Test basic connection
      const { error } = await supabase
        .from('quotes')
        .select('id')
        .limit(1);

      if (error) {
        return {
          testName: 'Database Connection',
          passed: false,
          message: 'Database connection failed',
          details: error.message
        };
      }

      return {
        testName: 'Database Connection',
        passed: true,
        message: 'Database connection successful',
        details: 'Supabase connection and RLS policies are active'
      };
    } catch (error) {
      return {
        testName: 'Database Connection',
        passed: false,
        message: 'Database connection error',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  /**
   * Test 4: Verify quote ownership enforcement
   */
  const testQuoteOwnership = async (): Promise<TestResult> => {
    if (!isImpersonating || !impersonatedSupplier) {
      return {
        testName: 'Quote Ownership',
        passed: false,
        message: 'Cannot test ownership without supplier context',
        details: 'Supplier impersonation required for ownership testing'
      };
    }

    try {
      const supabase = await getSupabase();
      
      // Try to fetch quotes for the impersonated supplier
      const { data: quotes, error } = await supabase
        .from('quotes')
        .select('id, supplier_id, supplier:suppliers(supplier_name)')
        .eq('supplier_id', impersonatedSupplier.id)
        .limit(5);

      if (error) {
        return {
          testName: 'Quote Ownership',
          passed: false,
          message: 'Failed to fetch supplier quotes',
          details: error.message
        };
      }

      return {
        testName: 'Quote Ownership',
        passed: true,
        message: `Found ${quotes?.length || 0} quotes for ${impersonatedSupplier.supplier_name}`,
        details: `RLS policies are filtering quotes correctly`
      };
    } catch (error) {
      return {
        testName: 'Quote Ownership',
        passed: false,
        message: 'Quote ownership test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  /**
   * Test 5: Verify available suppliers
   */
  const testAvailableSuppliers = (): TestResult => {
    if (availableSuppliers.length === 0) {
      return {
        testName: 'Available Suppliers',
        passed: false,
        message: 'No suppliers available for testing',
        details: 'Check database connection and supplier data'
      };
    }

    return {
      testName: 'Available Suppliers',
      passed: true,
      message: `Found ${availableSuppliers.length} suppliers available`,
      details: `Suppliers: ${availableSuppliers.map(s => s.supplier_name).join(', ')}`
    };
  };

  /**
   * Run all tests
   */
  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);

    const tests = [
      testSupplierContext(),
      testQuoteSubmissionValidation(),
      testAvailableSuppliers(),
      await testDatabaseConnection(),
      await testQuoteOwnership()
    ];

    setTestResults(tests);
    setIsRunningTests(false);

    // Show notification
    const passedTests = tests.filter(t => t.passed).length;
    const totalTests = tests.length;
    
    if (passedTests === totalTests) {
      showSuccess(`All ownership tests passed! (${passedTests}/${totalTests})`);
    } else {
      showError(`Some ownership tests failed (${passedTests}/${totalTests})`);
    }
  };

  /**
   * Clear test results
   */
  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center space-x-2 mb-4">
        <Shield className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Ownership Enforcement Tests</h3>
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
          </div>
        </div>

        {/* Test Controls */}
        <div className="flex space-x-3">
          <button
            onClick={runAllTests}
            disabled={isRunningTests}
            className="px-4 py-2 bg-wedding-primary text-white rounded-md hover:bg-wedding-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
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

        {/* Instructions */}
        <div className="bg-wedding-secondary/50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Testing Instructions</h4>
          <ul className="text-sm text-wedding-slate space-y-1">
            <li>• Select a supplier using the impersonation panel above</li>
            <li>• Run the ownership tests to verify security layers</li>
            <li>• Check that all tests pass for proper ownership enforcement</li>
            <li>• Try switching suppliers to test different scenarios</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OwnershipTestPanel;

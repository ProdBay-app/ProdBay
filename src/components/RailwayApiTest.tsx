import React, { useState } from 'react';
import { RailwayApiService } from '../services/railwayApiService';

const RailwayApiTest: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<string>('');
  const [testResult, setTestResult] = useState<string>('');

  const testHealth = async () => {
    setHealthStatus('Checking...');
    const result = await RailwayApiService.checkHealth();
    setHealthStatus(result.success ? '✅ Healthy' : `❌ Error: ${result.message}`);
  };

  const testBriefProcessing = async () => {
    setTestResult('Testing...');
    const result = await RailwayApiService.processBrief(
      '550e8400-e29b-41d4-a716-446655440000', // Test UUID
      'Test brief for corporate event with staging and audio'
    );
    
    if (result.success) {
      setTestResult(`✅ Success: ${result.data?.createdAssets.length} assets created`);
    } else {
      setTestResult(`❌ Error: ${result.error?.message}`);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Railway API Test</h3>
      
      <div className="space-y-4">
        <div>
          <button 
            onClick={testHealth}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Health Check
          </button>
          <p className="mt-2 text-sm">{healthStatus}</p>
        </div>

        <div>
          <button 
            onClick={testBriefProcessing}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test Brief Processing
          </button>
          <p className="mt-2 text-sm">{testResult}</p>
        </div>
      </div>
    </div>
  );
};

export default RailwayApiTest;

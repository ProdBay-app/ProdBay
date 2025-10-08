import React from 'react';

/**
 * Loading fallback component for lazy-loaded routes
 * Provides a better UX than a simple text message
 */
const LoadingFallback: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingFallback;


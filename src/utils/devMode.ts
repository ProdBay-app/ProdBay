/**
 * Development Mode Detection Utilities
 * 
 * This module provides utilities to detect if the application is running
 * in development mode, allowing us to conditionally show development-only features.
 */

/**
 * Check if the application is running in development mode
 * 
 * Development mode is detected by:
 * 1. NODE_ENV being 'development' (Vite sets this automatically)
 * 2. Running on localhost (for local development)
 * 3. Having a specific development flag in the environment
 * 
 * @returns {boolean} True if running in development mode
 */
export const isDevelopmentMode = (): boolean => {
  // Check NODE_ENV
  if (import.meta.env.MODE === 'development') {
    return true;
  }

  // Check if running on localhost (common development setup)
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return true;
  }

  // Check for explicit development flag
  if (import.meta.env.VITE_DEV_MODE === 'true') {
    return true;
  }

  return false;
};

/**
 * Check if supplier impersonation should be enabled
 * 
 * This is a more specific check for the impersonation feature,
 * which should only be available in development environments.
 * 
 * @returns {boolean} True if supplier impersonation should be enabled
 */
export const isSupplierImpersonationEnabled = (): boolean => {
  return isDevelopmentMode();
};

/**
 * Get development environment information
 * 
 * @returns {object} Development environment details
 */
export const getDevEnvironmentInfo = () => {
  return {
    mode: import.meta.env.MODE,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
    isDev: isDevelopmentMode(),
    isImpersonationEnabled: isSupplierImpersonationEnabled(),
  };
};

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
 * 3. Running on Vercel preview/staging domains
 * 4. Having a specific development flag in the environment
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

  // Check for Vercel preview/staging environments
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Vercel preview URLs: *.vercel.app, *.vercel-staging.com
    if (hostname.includes('.vercel.app') || hostname.includes('.vercel-staging.com')) {
      return true;
    }
    // Custom staging domains (you can add your specific staging domain here)
    if (hostname.includes('staging') || hostname.includes('dev') || hostname.includes('test')) {
      return true;
    }
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
 * which should be available in development and staging environments.
 * 
 * @returns {boolean} True if supplier impersonation should be enabled
 */
export const isSupplierImpersonationEnabled = (): boolean => {
  return isDevelopmentMode();
};

/**
 * Check if we're running on a staging environment
 * 
 * @returns {boolean} True if running on staging
 */
export const isStagingEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  
  // Vercel staging domains
  if (hostname.includes('.vercel.app') || hostname.includes('.vercel-staging.com')) {
    return true;
  }
  
  // Custom staging domains
  if (hostname.includes('staging') || hostname.includes('dev') || hostname.includes('test')) {
    return true;
  }
  
  return false;
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
    isStaging: isStagingEnvironment(),
    isImpersonationEnabled: isSupplierImpersonationEnabled(),
  };
};

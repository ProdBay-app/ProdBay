// Environment validation utilities

interface RequiredEnvVars {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
}

interface OptionalEnvVars {
  VITE_EMAIL_FUNCTION_URL?: string;
  VITE_EMAIL_FUNCTION_KEY?: string;
  VITE_BUILD_ID?: string;
}

export type EnvVars = RequiredEnvVars & OptionalEnvVars;

/**
 * Validates required environment variables
 * @throws Error if any required variables are missing
 */
export const validateRequiredEnvVars = (): RequiredEnvVars => {
  const missingVars: string[] = [];
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl) missingVars.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKey) missingVars.push('VITE_SUPABASE_ANON_KEY');
  
  if (missingVars.length > 0) {
    const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}. ` +
      'Set them in your .env.local or .env.production before building.';
    throw new Error(errorMessage);
  }
  
  return {
    VITE_SUPABASE_URL: supabaseUrl,
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey
  };
};

/**
 * Gets all environment variables with validation
 */
export const getEnvVars = (): EnvVars => {
  const required = validateRequiredEnvVars();
  
  return {
    ...required,
    VITE_EMAIL_FUNCTION_URL: import.meta.env.VITE_EMAIL_FUNCTION_URL,
    VITE_EMAIL_FUNCTION_KEY: import.meta.env.VITE_EMAIL_FUNCTION_KEY,
    VITE_BUILD_ID: import.meta.env.VITE_BUILD_ID
  };
};

/**
 * Checks if we're in development mode
 */
export const isDevelopment = (): boolean => {
  return import.meta.env.DEV;
};

/**
 * Checks if we're in production mode
 */
export const isProduction = (): boolean => {
  return import.meta.env.PROD;
};

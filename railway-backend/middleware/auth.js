const { supabase } = require('../config/database');

/**
 * JWT Authentication Middleware
 * Verifies Supabase JWT tokens for producer endpoints
 * 
 * Extracts token from Authorization header and verifies it using Supabase service role
 * Attaches user object to req.user if valid
 */
const authenticateJWT = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_AUTH_TOKEN',
          message: 'Authorization header with Bearer token is required'
        }
      });
    }

    // Extract token (remove 'Bearer ' prefix)
    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_AUTH_TOKEN',
          message: 'Token is missing from Authorization header'
        }
      });
    }

    // Verify token using Supabase service role
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_AUTH_TOKEN',
          message: 'Invalid or expired authentication token'
        }
      });
    }

    // Fetch user profile to get role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    // Handle edge case: If no profile exists (rare due to trigger, but possible)
    if (profileError || !profile) {
      console.warn(`User ${user.id} does not have a profile. This should not happen due to auto-creation trigger.`);
      return res.status(401).json({
        success: false,
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'User profile not found. Please contact support.'
        }
      });
    }

    // Attach user to request object with role from profile
    req.user = {
      ...user,
      role: profile.role,
      full_name: profile.full_name
    };
    next();

  } catch (error) {
    console.error('JWT authentication error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'An error occurred during authentication'
      }
    });
  }
};

module.exports = {
  authenticateJWT
};


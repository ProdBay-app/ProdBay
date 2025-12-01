const { supabase } = require('../config/database');

/**
 * JWT Authentication Middleware
 * Verifies Supabase JWT tokens and fetches user role from user_profiles table
 * 
 * Process:
 * 1. Extracts and validates JWT token from Authorization header
 * 2. Verifies token using Supabase service role
 * 3. Queries user_profiles table to get user's role
 * 4. Attaches user object with role to req.user
 * 
 * The service role client bypasses RLS, allowing us to query user_profiles directly.
 * This ensures we always get fresh role data from the database.
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

    // Query user_profiles table to get user's role
    // Using service role client bypasses RLS, ensuring we can always fetch the role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Handle case where profile doesn't exist (shouldn't happen with trigger, but defensive)
    if (profileError || !profile) {
      console.warn(`User profile not found for user ${user.id}. This may indicate the trigger was not set up correctly.`);
      // Set role to null - requireRole middleware will reject this
      req.user = {
        ...user,
        role: null
      };
    } else {
      // Attach user with role to request object
      req.user = {
        ...user,
        role: profile.role // 'producer' | 'admin' | null
      };
    }

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

/**
 * Role-Based Access Control (RBAC) Middleware
 * Ensures the authenticated user has the required role(s)
 * 
 * Usage:
 *   router.post('/endpoint', authenticateJWT, requireRole('producer'), handler);
 *   router.post('/admin', authenticateJWT, requireRole(['producer', 'admin']), handler);
 * 
 * @param {string|string[]} requiredRole - Single role string or array of allowed roles
 * @returns {Function} Express middleware function
 */
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    // Check if user is authenticated (should be set by authenticateJWT)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required. Please provide a valid JWT token.'
        }
      });
    }

    // Check if user has a role
    if (!req.user.role) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'NO_ROLE_ASSIGNED',
          message: 'User does not have an assigned role. Please contact support.'
        }
      });
    }

    // Normalize requiredRole to array for easier checking
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const userRole = req.user.role;

    // Check if user's role is in the allowed roles list
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `This endpoint requires one of the following roles: ${allowedRoles.join(', ')}. Your role: ${userRole || 'none'}`
        }
      });
    }

    // User has required role, proceed to next middleware/handler
    next();
  };
};

/**
 * Project Ownership Verification Middleware
 * Ensures the authenticated user owns the project they're trying to access/modify
 * 
 * This middleware extracts the projectId from req.params or req.body and verifies
 * that the project's producer_id matches the authenticated user's ID.
 * 
 * Usage:
 *   router.post('/:projectId/action', authenticateJWT, requireRole('producer'), verifyProjectOwnership, handler);
 *   router.post('/action', authenticateJWT, requireRole('producer'), verifyProjectOwnership('body.projectId'), handler);
 * 
 * @param {string} projectIdSource - Optional. Where to find projectId: 'params.projectId' (default) or 'body.projectId'
 * @returns {Function} Express middleware function
 */
const verifyProjectOwnership = (projectIdSource = 'params.projectId') => {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated (should be set by authenticateJWT)
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
      }

      // Extract projectId from the specified source
      let projectId;
      if (projectIdSource === 'body.projectId') {
        projectId = req.body?.projectId;
      } else if (projectIdSource === 'params.projectId') {
        projectId = req.params?.projectId;
      } else {
        // Support custom paths like 'body.data.projectId'
        const parts = projectIdSource.split('.');
        let value = req;
        for (const part of parts) {
          value = value?.[part];
        }
        projectId = value;
      }

      // Validate projectId exists
      if (!projectId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PROJECT_ID',
            message: 'Project ID is required but was not found in the request'
          }
        });
      }

      // Validate projectId format (UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(projectId)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PROJECT_ID',
            message: 'Project ID must be a valid UUID'
          }
        });
      }

      // Query projects table to verify ownership
      // Using service role client bypasses RLS, allowing us to check ownership directly
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('producer_id')
        .eq('id', projectId)
        .single();

      // Handle database errors
      if (projectError) {
        console.error('Error verifying project ownership:', projectError);
        return res.status(500).json({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to verify project ownership'
          }
        });
      }

      // Check if project exists
      if (!project) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'PROJECT_NOT_FOUND',
            message: 'Project not found'
          }
        });
      }

      // Check if project has an owner (producer_id is not null)
      if (!project.producer_id) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'PROJECT_UNOWNED',
            message: 'This project does not have an assigned owner. Please contact support.'
          }
        });
      }

      // Verify ownership: producer_id must match authenticated user's ID
      if (project.producer_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access this project. You can only access projects you own.'
          }
        });
      }

      // Ownership verified, attach project to request for use in route handler
      req.project = project;
      next();

    } catch (error) {
      console.error('Project ownership verification error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'VERIFICATION_ERROR',
          message: 'An error occurred while verifying project ownership'
        }
      });
    }
  };
};

/**
 * Verify Project Ownership via Milestone ID
 * Looks up the milestone to get the project_id, then verifies ownership
 * 
 * Usage:
 *   router.patch('/milestones/:milestoneId', authenticateJWT, requireRole('producer'), verifyProjectOwnershipViaMilestone, handler);
 */
const verifyProjectOwnershipViaMilestone = async (req, res, next) => {
  try {
    const { milestoneId } = req.params;

    if (!milestoneId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_MILESTONE_ID',
          message: 'Milestone ID is required'
        }
      });
    }

    // Look up milestone to get project_id
    const { data: milestone, error: milestoneError } = await supabase
      .from('project_milestones')
      .select('project_id')
      .eq('id', milestoneId)
      .single();

    if (milestoneError || !milestone) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MILESTONE_NOT_FOUND',
          message: 'Milestone not found'
        }
      });
    }

    // Now verify project ownership using the project_id from milestone
    const ownershipResult = await verifyProjectOwnershipHelper(milestone.project_id, req.user.id);
    
    if (!ownershipResult.isOwner) {
      return res.status(403).json({
        success: false,
        error: ownershipResult.error || {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this milestone'
        }
      });
    }

    // Attach project info for use in route handler
    req.project = ownershipResult.project;
    req.milestone = milestone;
    next();

  } catch (error) {
    console.error('Milestone ownership verification error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'VERIFICATION_ERROR',
        message: 'An error occurred while verifying milestone ownership'
      }
    });
  }
};

/**
 * Verify Project Ownership via Action Item ID
 * Looks up the action item to get the project_id, then verifies ownership
 * 
 * Usage:
 *   router.patch('/actions/:actionId/complete', authenticateJWT, requireRole('producer'), verifyProjectOwnershipViaAction, handler);
 */
const verifyProjectOwnershipViaAction = async (req, res, next) => {
  try {
    const { actionId } = req.params;

    if (!actionId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_ACTION_ID',
          message: 'Action ID is required'
        }
      });
    }

    // Look up action item to get project_id
    const { data: actionItem, error: actionError } = await supabase
      .from('action_items')
      .select('project_id')
      .eq('id', actionId)
      .single();

    if (actionError || !actionItem) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ACTION_NOT_FOUND',
          message: 'Action item not found'
        }
      });
    }

    // Now verify project ownership using the project_id from action item
    const ownershipResult = await verifyProjectOwnershipHelper(actionItem.project_id, req.user.id);
    
    if (!ownershipResult.isOwner) {
      return res.status(403).json({
        success: false,
        error: ownershipResult.error || {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this action item'
        }
      });
    }

    // Attach project info for use in route handler
    req.project = ownershipResult.project;
    req.actionItem = actionItem;
    next();

  } catch (error) {
    console.error('Action item ownership verification error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'VERIFICATION_ERROR',
        message: 'An error occurred while verifying action item ownership'
      }
    });
  }
};

/**
 * Helper function to verify project ownership (for use in route handlers)
 * This is an alternative to the middleware approach, useful when you need more flexibility
 * 
 * @param {string} projectId - The project ID to verify
 * @param {string} userId - The user ID to verify ownership against
 * @returns {Promise<{isOwner: boolean, project: object|null, error: object|null}>}
 */
const verifyProjectOwnershipHelper = async (projectId, userId) => {
  try {
    // Validate inputs
    if (!projectId || !userId) {
      return {
        isOwner: false,
        project: null,
        error: { code: 'MISSING_PARAMETERS', message: 'Project ID and User ID are required' }
      };
    }

    // Query projects table
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('producer_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return {
        isOwner: false,
        project: null,
        error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' }
      };
    }

    // Check ownership
    const isOwner = project.producer_id === userId;
    return {
      isOwner,
      project,
      error: isOwner ? null : { code: 'FORBIDDEN', message: 'User does not own this project' }
    };

  } catch (error) {
    console.error('Project ownership verification helper error:', error);
    return {
      isOwner: false,
      project: null,
      error: { code: 'VERIFICATION_ERROR', message: 'An error occurred while verifying ownership' }
    };
  }
};

module.exports = {
  authenticateJWT,
  requireRole,
  verifyProjectOwnership,
  verifyProjectOwnershipViaMilestone,
  verifyProjectOwnershipViaAction,
  verifyProjectOwnershipHelper
};


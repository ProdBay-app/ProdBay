const express = require('express');
const BriefProcessor = require('../services/briefProcessor');
const router = express.Router();

/**
 * POST /api/process-brief
 * Process a project brief and create corresponding assets
 */
router.post('/process-brief', async (req, res) => {
  try {
    const { projectId, briefDescription, useAI, allocationMethod, projectContext } = req.body;

    // Validate request body
    if (!projectId || !briefDescription) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Missing required fields: projectId and briefDescription are required'
        }
      });
    }

    // Validate data types
    if (typeof projectId !== 'string' || typeof briefDescription !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'projectId and briefDescription must be strings'
        }
      });
    }

    // Validate projectId format (basic UUID check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'projectId must be a valid UUID'
        }
      });
    }

    // Validate brief description length
    if (briefDescription.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'briefDescription cannot be empty'
        }
      });
    }

    if (briefDescription.length > 10000) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'briefDescription is too long (maximum 10,000 characters)'
        }
      });
    }

    // Determine allocation method with backward compatibility
    let finalUseAI = false;
    if (allocationMethod) {
      // New enum-based approach
      if (allocationMethod === 'ai') {
        finalUseAI = true;
      } else if (allocationMethod === 'static') {
        finalUseAI = false;
      } else {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'allocationMethod must be either "static" or "ai"'
          }
        });
      }
    } else {
      // Backward compatibility with useAI parameter
      finalUseAI = useAI || false;
    }

    // Process the brief
    const result = await BriefProcessor.processBrief(projectId, briefDescription, {
      useAI: finalUseAI,
      allocationMethod: allocationMethod || (finalUseAI ? 'ai' : 'static'),
      projectContext: projectContext || {}
    });

    // Update project with AI allocation status
    const { supabase } = require('../config/database');
    
    // Prepare update data
    const updateData = { 
      use_ai_allocation: finalUseAI 
    };
    
    // If AI allocation was used and successful, set completion timestamp
    if (finalUseAI && result.aiData && result.createdAssets.length > 0) {
      updateData.ai_allocation_completed_at = new Date().toISOString();
    }
    
    const { error: updateError } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId);

    if (updateError) {
      console.warn('Failed to update project allocation method:', updateError);
      // Don't fail the request, just log the warning
    }

    // Return success response
    const message = result.aiData 
      ? `AI-powered brief processing completed. ${result.createdAssets.length} assets created with ${Math.round(result.aiData.confidence * 100)}% confidence. AI allocation is now complete.`
      : `Brief processed successfully. ${result.createdAssets.length} assets created.`;
    
    res.status(200).json({
      success: true,
      data: result,
      message
    });

  } catch (error) {
    console.error('Brief processing endpoint error:', error);

    // Handle specific error types
    if (error.message.includes('Failed to create asset')) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create assets in database',
          details: error.message
        }
      });
    }

    if (error.message.includes('Project ID and brief description')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message
        }
      });
    }

    // Generic server error
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while processing the brief',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Brief processing service is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

const express = require('express');
const BriefProcessor = require('../services/briefProcessor');
const router = express.Router();

/**
 * POST /api/process-brief
 * Process a project brief and create corresponding assets
 */
router.post('/process-brief', async (req, res) => {
  try {
    const { projectId, briefDescription, useAI, projectContext } = req.body;

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

    // Process the brief
    const result = await BriefProcessor.processBrief(projectId, briefDescription, {
      useAI: useAI || false,
      projectContext: projectContext || {}
    });

    // Return success response
    const message = result.aiData 
      ? `AI-powered brief processing completed. ${result.createdAssets.length} assets created with ${Math.round(result.aiData.confidence * 100)}% confidence.`
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

const express = require('express');
const AIAllocationService = require('../services/aiAllocationService');
const BriefHighlightService = require('../services/briefHighlightService');
const { supabase } = require('../config/database');
const router = express.Router();

//  Initialize AI services
const aiService = new AIAllocationService();
const highlightService = new BriefHighlightService();

/**
 * POST /api/ai-allocate-assets
 * Analyze brief and suggest assets using AI
 */
router.post('/ai-allocate-assets', async (req, res) => {
  try {
    const { briefDescription, projectContext } = req.body;

    // Validate request
    if (!briefDescription || typeof briefDescription !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'briefDescription is required and must be a string'
        }
      });
    }

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

    // Perform AI asset analysis
    const result = await aiService.analyzeBriefForAssets(briefDescription, projectContext);

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result,
        message: `AI analysis completed. ${result.assets.length} assets identified with ${Math.round(result.confidence * 100)}% confidence.`
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: 'AI_ANALYSIS_FAILED',
          message: result.error,
          fallbackData: result.fallbackAssets
        }
      });
    }

  } catch (error) {
    console.error('AI asset allocation endpoint error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred during AI asset analysis',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});



/**
 * POST /api/ai-create-assets
 * Create assets in database based on AI analysis
 */
router.post('/ai-create-assets', async (req, res) => {
  try {
    const { projectId, assets } = req.body;

    // Validate request
    if (!projectId || !assets || !Array.isArray(assets)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'projectId and assets array are required'
        }
      });
    }

    // Validate projectId format
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

    // Check if AI allocation has already been completed for this project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('ai_allocation_completed_at')
      .eq('id', projectId)
      .single();

    if (projectError) {
      console.error('Error checking project AI allocation status:', projectError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to check project AI allocation status'
        }
      });
    }

    if (project && project.ai_allocation_completed_at) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'AI_ALLOCATION_ALREADY_COMPLETED',
          message: 'AI allocation has already been completed for this project',
          details: `Completed at: ${project.ai_allocation_completed_at}`
        }
      });
    }

    const createdAssets = [];

    // Create each asset
    for (const assetData of assets) {
      try {
        const { data: asset, error } = await supabase
          .from('assets')
          .insert({
            project_id: projectId,
            asset_name: assetData.asset_name,
            specifications: assetData.specifications || `AI-generated requirements for ${assetData.asset_name}`,
            source_text: assetData.source_text || null,
            tags: assetData.tags || [],
            status: 'Pending'
          })
          .select()
          .single();

        if (error) {
          console.error(`Failed to create asset ${assetData.asset_name}:`, error);
          throw new Error(`Failed to create asset: ${error.message}`);
        }

        if (asset) {
          createdAssets.push(asset);
        }
      } catch (error) {
        console.error(`Error creating asset ${assetData.asset_name}:`, error);
        throw error;
      }
    }

    // Update project with AI allocation completion timestamp
    const completionTimestamp = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('projects')
      .update({ 
        ai_allocation_completed_at: completionTimestamp 
      })
      .eq('id', projectId);

    if (updateError) {
      console.warn('Failed to update project AI allocation completion timestamp:', updateError);
      // Don't fail the request, just log the warning - assets were created successfully
    }

    res.status(200).json({
      success: true,
      data: {
        projectId,
        createdAssets,
        count: createdAssets.length,
        ai_allocation_completed_at: completionTimestamp
      },
      message: `Successfully created ${createdAssets.length} assets using AI analysis. AI allocation completed.`
    });

  } catch (error) {
    console.error('AI asset creation endpoint error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ASSET_CREATION_FAILED',
        message: 'Failed to create assets in database',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

/**
 * GET /api/ai-health
 * Check AI service health
 */
router.get('/ai-health', async (req, res) => {
  try {
    const healthCheck = await aiService.checkHealth();
    
    if (healthCheck.healthy) {
      res.status(200).json({
        success: true,
        data: healthCheck,
        message: 'AI service is healthy'
      });
    } else {
      res.status(503).json({
        success: false,
        error: {
          code: 'AI_SERVICE_UNHEALTHY',
          message: healthCheck.error
        }
      });
    }
  } catch (error) {
    console.error('AI health check error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'AI health check failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

/**
 * POST /api/ai/extract-highlights
 * Extract key project information from a brief using AI
 */
router.post('/ai/extract-highlights', async (req, res) => {
  try {
    const { briefText } = req.body;

    // Validate request
    if (!briefText || typeof briefText !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'briefText is required and must be a string'
        }
      });
    }

    if (briefText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'briefText cannot be empty'
        }
      });
    }

    if (briefText.length > 10000) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'briefText is too long (maximum 10,000 characters)'
        }
      });
    }

    // Extract highlights using AI
    const result = await highlightService.extractHighlights(briefText);

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        processingTime: result.processingTime,
        message: 'Brief highlights extracted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: 'AI_EXTRACTION_FAILED',
          message: result.error.message
        }
      });
    }

  } catch (error) {
    console.error('AI highlight extraction endpoint error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred during highlight extraction',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

module.exports = router;

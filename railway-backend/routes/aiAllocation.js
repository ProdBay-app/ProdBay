const express = require('express');
const AIAllocationService = require('../services/aiAllocationService');
const { supabase } = require('../config/database');
const router = express.Router();

// Initialize AI service
const aiService = new AIAllocationService();

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
 * POST /api/ai-suggest-suppliers
 * Suggest optimal suppliers for given assets
 */
router.post('/ai-suggest-suppliers', async (req, res) => {
  try {
    const { assets, projectId } = req.body;

    // Validate request
    if (!assets || !Array.isArray(assets) || assets.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'assets array is required and cannot be empty'
        }
      });
    }

    // Get available suppliers
    const { data: suppliers, error: supplierError } = await supabase
      .from('suppliers')
      .select('*');

    if (supplierError) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch suppliers',
          details: supplierError.message
        }
      });
    }

    if (!suppliers || suppliers.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_SUPPLIERS',
          message: 'No suppliers available for allocation'
        }
      });
    }

    // Perform AI supplier suggestion
    const result = await aiService.suggestSuppliersForAssets(assets, suppliers);

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result,
        message: `AI supplier suggestions completed with ${Math.round(result.confidence * 100)}% confidence.`
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: 'AI_SUGGESTION_FAILED',
          message: result.error,
          fallbackData: result.fallbackAllocations
        }
      });
    }

  } catch (error) {
    console.error('AI supplier suggestion endpoint error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred during AI supplier suggestion',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

/**
 * POST /api/ai-allocate-project
 * Complete AI allocation for a project
 */
router.post('/ai-allocate-project', async (req, res) => {
  try {
    const { projectId, briefDescription, projectContext } = req.body;

    // Validate request
    if (!projectId || !briefDescription) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'projectId and briefDescription are required'
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

    // Verify project exists
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, project_name')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'Project not found'
        }
      });
    }

    // Perform complete AI allocation
    const result = await aiService.performCompleteAllocation(projectId, briefDescription, projectContext);

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result,
        message: `Complete AI allocation completed for project "${project.project_name}" with ${Math.round(result.confidence * 100)}% confidence.`
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: 'AI_ALLOCATION_FAILED',
          message: result.error
        }
      });
    }

  } catch (error) {
    console.error('AI project allocation endpoint error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred during AI project allocation',
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

    res.status(200).json({
      success: true,
      data: {
        projectId,
        createdAssets,
        count: createdAssets.length
      },
      message: `Successfully created ${createdAssets.length} assets using AI analysis.`
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

module.exports = router;

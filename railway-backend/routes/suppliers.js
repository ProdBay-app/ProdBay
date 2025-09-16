const express = require('express');
const SupplierService = require('../services/supplierService');
const router = express.Router();

/**
 * GET /api/suppliers/suggestions/:assetId
 * Get suggested suppliers for an asset
 */
router.get('/suggestions/:assetId', async (req, res) => {
  try {
    const { assetId } = req.params;

    // Validate assetId parameter
    if (!assetId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETER',
          message: 'Asset ID is required'
        }
      });
    }

    // Get suggested suppliers
    const result = await SupplierService.getSuggestedSuppliers(assetId);

    res.status(200).json({
      success: true,
      data: result,
      message: `Found ${result.suggestedSuppliers.length} relevant suppliers for asset "${result.asset.asset_name}"`
    });

  } catch (error) {
    console.error('Supplier suggestions endpoint error:', error);

    // Handle specific error types
    if (error.message.includes('Asset not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ASSET_NOT_FOUND',
          message: error.message
        }
      });
    }

    if (error.message.includes('Invalid asset ID format')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ASSET_ID',
          message: error.message
        }
      });
    }

    // Generic server error
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while fetching supplier suggestions',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

/**
 * POST /api/suppliers/send-quote-requests
 * Send quote requests to selected suppliers
 */
router.post('/send-quote-requests', async (req, res) => {
  try {
    const { assetId, supplierIds, from } = req.body;

    // Validate request body
    if (!assetId || !supplierIds) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'assetId and supplierIds are required'
        }
      });
    }

    // Validate data types
    if (typeof assetId !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATA_TYPE',
          message: 'assetId must be a string'
        }
      });
    }

    if (!Array.isArray(supplierIds) || supplierIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATA_TYPE',
          message: 'supplierIds must be a non-empty array'
        }
      });
    }

    // Validate supplier IDs are strings
    for (const supplierId of supplierIds) {
      if (typeof supplierId !== 'string') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_DATA_TYPE',
            message: 'All supplier IDs must be strings'
          }
        });
      }
    }

    // Validate from object if provided
    if (from && (typeof from !== 'object' || !from.name || !from.email)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FROM_OBJECT',
          message: 'from object must contain name and email properties'
        }
      });
    }

    // Send quote requests
    const result = await SupplierService.sendQuoteRequests(assetId, supplierIds, from);

    res.status(200).json({
      success: true,
      data: result,
      message: `Quote requests sent to ${result.successful_requests} out of ${result.total_requests} suppliers`
    });

  } catch (error) {
    console.error('Send quote requests endpoint error:', error);

    // Handle specific error types
    if (error.message.includes('Asset not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ASSET_NOT_FOUND',
          message: error.message
        }
      });
    }

    if (error.message.includes('Invalid asset ID format') || error.message.includes('Invalid supplier ID format')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID_FORMAT',
          message: error.message
        }
      });
    }

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: error.message
        }
      });
    }

    // Generic server error
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while sending quote requests',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

/**
 * GET /api/suppliers/health
 * Health check endpoint for supplier service
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Supplier service is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

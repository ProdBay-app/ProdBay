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
 * POST /api/suppliers/preview-quote-requests
 * Generate email previews for quote requests
 */
router.post('/preview-quote-requests', async (req, res) => {
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

    // Generate email previews
    const result = await SupplierService.generateEmailPreviews(assetId, supplierIds, from);

    res.status(200).json({
      success: true,
      data: result,
      message: `Generated email previews for ${result.suppliers.length} suppliers`
    });

  } catch (error) {
    console.error('Preview quote requests endpoint error:', error);

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
        message: 'An unexpected error occurred while generating email previews',
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
    const { assetId, supplierIds, from, customizedEmails } = req.body;

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
    const result = await SupplierService.sendQuoteRequests(assetId, supplierIds, from, customizedEmails);

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
 * POST /api/suppliers/submit-quote
 * Submit a quote with ownership validation
 */
router.post('/submit-quote', async (req, res) => {
  try {
    const { supplier_id, asset_id, cost, notes_capacity } = req.body;
    const impersonatedSupplierId = req.headers['x-impersonated-supplier-id'];

    // Validate request body
    if (!supplier_id || !asset_id || cost === undefined) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'supplier_id, asset_id, and cost are required'
        }
      });
    }

    // Validate data types
    if (typeof supplier_id !== 'string' || typeof asset_id !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATA_TYPE',
          message: 'supplier_id and asset_id must be strings'
        }
      });
    }

    if (typeof cost !== 'number' || cost < 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_COST',
          message: 'cost must be a non-negative number'
        }
      });
    }

    // Validate ownership - check if impersonated supplier matches the quote's supplier
    if (impersonatedSupplierId && impersonatedSupplierId !== supplier_id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'OWNERSHIP_VIOLATION',
          message: 'You are not authorized to submit quotes for this supplier. The supplier_id in the request does not match your impersonated supplier.'
        }
      });
    }

    // If no impersonation header is provided, reject the request
    if (!impersonatedSupplierId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_AUTHENTICATION',
          message: 'Supplier impersonation is required. Please provide x-impersonated-supplier-id header.'
        }
      });
    }

    // Submit the quote using the supplier service
    const result = await SupplierService.submitQuote({
      supplier_id,
      asset_id,
      cost,
      notes_capacity: notes_capacity || '',
      status: 'Submitted'
    });

    res.status(200).json({
      success: true,
      data: result,
      message: 'Quote submitted successfully'
    });

  } catch (error) {
    console.error('Submit quote endpoint error:', error);

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

    if (error.message.includes('Supplier not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SUPPLIER_NOT_FOUND',
          message: error.message
        }
      });
    }

    if (error.message.includes('Invalid ID format')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID_FORMAT',
          message: error.message
        }
      });
    }

    // Generic server error
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while submitting the quote',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

/**
 * GET /api/suppliers/:supplierId/quotable-assets
 * Get assets for which the supplier has received quote requests (Pending status)
 */
router.get('/:supplierId/quotable-assets', async (req, res) => {
  try {
    const { supplierId } = req.params;

    // Validate supplierId parameter
    if (!supplierId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETER',
          message: 'Supplier ID is required'
        }
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(supplierId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SUPPLIER_ID',
          message: 'Supplier ID must be a valid UUID'
        }
      });
    }

    // Get quotable assets for the supplier
    const result = await SupplierService.getQuotableAssets(supplierId);

    res.status(200).json({
      success: true,
      data: result,
      message: `Found ${result.assets.length} quotable assets for supplier`
    });

  } catch (error) {
    console.error('Quotable assets endpoint error:', error);

    // Handle specific error types
    if (error.message.includes('Supplier not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SUPPLIER_NOT_FOUND',
          message: error.message
        }
      });
    }

    if (error.message.includes('Database connection failed')) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to connect to database'
        }
      });
    }

    // Generic error handler
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while fetching quotable assets'
      }
    });
  }
});

/**
 * PUT /api/suppliers/update-quote
 * Update a quote with ownership validation
 */
router.put('/update-quote', async (req, res) => {
  try {
    const { quote_id, cost, notes_capacity } = req.body;
    const impersonatedSupplierId = req.headers['x-impersonated-supplier-id'];

    // Validate request body
    if (!quote_id || cost === undefined) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'quote_id and cost are required'
        }
      });
    }

    // Validate data types
    if (typeof quote_id !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATA_TYPE',
          message: 'quote_id must be a string'
        }
      });
    }

    if (typeof cost !== 'number' || cost < 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_COST',
          message: 'cost must be a non-negative number'
        }
      });
    }

    // Validate ownership - check if the quote belongs to the impersonated supplier
    if (!impersonatedSupplierId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_AUTHENTICATION',
          message: 'Supplier impersonation is required. Please provide x-impersonated-supplier-id header.'
        }
      });
    }

    // Update the quote using the supplier service
    const result = await SupplierService.updateQuote(quote_id, {
      cost,
      notes_capacity: notes_capacity || '',
      status: 'Submitted'
    }, impersonatedSupplierId);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Quote updated successfully'
    });

  } catch (error) {
    console.error('Update quote endpoint error:', error);

    // Handle specific error types
    if (error.message.includes('Quote not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'QUOTE_NOT_FOUND',
          message: error.message
        }
      });
    }

    if (error.message.includes('Ownership violation') || error.message.includes('not authorized')) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'OWNERSHIP_VIOLATION',
          message: 'You are not authorized to update this quote. It does not belong to your supplier.'
        }
      });
    }

    if (error.message.includes('Invalid ID format')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID_FORMAT',
          message: error.message
        }
      });
    }

    // Generic server error
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while updating the quote',
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

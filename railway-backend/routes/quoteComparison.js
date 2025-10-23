const express = require('express');
const { supabase } = require('../config/database');
const SupplierService = require('../services/supplierService');
const router = express.Router();

/**
 * GET /api/quotes/compare/:assetId
 * Get all quotes for an asset with comparison data
 */
router.get('/compare/:assetId', async (req, res) => {
  try {
    const { assetId } = req.params;

    // Validate assetId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(assetId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ASSET_ID',
          message: 'Asset ID must be a valid UUID'
        }
      });
    }

    // Fetch asset details
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .select(`
        id,
        asset_name,
        specifications,
        timeline,
        status,
        project:projects(
          id,
          project_name,
          client_name
        )
      `)
      .eq('id', assetId)
      .single();

    if (assetError || !asset) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ASSET_NOT_FOUND',
          message: 'Asset not found'
        }
      });
    }

    // Fetch all quotes for this asset with supplier details
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select(`
        id,
        cost,
        cost_breakdown,
        notes_capacity,
        status,
        valid_until,
        response_time_hours,
        created_at,
        supplier:suppliers(
          id,
          supplier_name,
          contact_email,
          service_categories
        )
      `)
      .eq('asset_id', assetId)
      .order('cost', { ascending: true });

    if (quotesError) {
      console.error('Error fetching quotes:', quotesError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch quotes'
        }
      });
    }

    // Calculate comparison metrics
    const costs = quotes.map(quote => quote.cost);
    const comparisonMetrics = {
      lowest_cost: costs.length > 0 ? Math.min(...costs) : 0,
      highest_cost: costs.length > 0 ? Math.max(...costs) : 0,
      average_cost: costs.length > 0 ? costs.reduce((a, b) => a + b, 0) / costs.length : 0,
      quote_count: quotes.length,
      cost_range: costs.length > 0 ? Math.max(...costs) - Math.min(...costs) : 0
    };

    // Add cost ranking to each quote
    const quotesWithRanking = quotes.map((quote, index) => ({
      ...quote,
      cost_rank: index + 1,
      cost_percentage_of_lowest: comparisonMetrics.lowest_cost > 0 
        ? Math.round((quote.cost / comparisonMetrics.lowest_cost) * 100) 
        : 100
    }));

    res.status(200).json({
      success: true,
      data: {
        asset: {
          id: asset.id,
          name: asset.asset_name,
          specifications: asset.specifications,
          timeline: asset.timeline,
          status: asset.status,
          project: asset.project
        },
        quotes: quotesWithRanking,
        comparison_metrics: comparisonMetrics
      },
      message: `Found ${quotes.length} quotes for comparison`
    });

  } catch (error) {
    console.error('Quote comparison endpoint error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred during quote comparison',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

/**
 * GET /api/quotes/compare/:assetId/summary
 * Get a quick summary of quotes for an asset (for dashboard display)
 */
router.get('/compare/:assetId/summary', async (req, res) => {
  try {
    const { assetId } = req.params;

    // Validate assetId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(assetId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ASSET_ID',
          message: 'Asset ID must be a valid UUID'
        }
      });
    }

    // Fetch quote summary
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select('cost, status')
      .eq('asset_id', assetId);

    if (quotesError) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch quote summary'
        }
      });
    }

    const costs = quotes.map(quote => quote.cost);
    const statusCounts = quotes.reduce((acc, quote) => {
      acc[quote.status] = (acc[quote.status] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        quote_count: quotes.length,
        lowest_cost: costs.length > 0 ? Math.min(...costs) : 0,
        highest_cost: costs.length > 0 ? Math.max(...costs) : 0,
        average_cost: costs.length > 0 ? costs.reduce((a, b) => a + b, 0) / costs.length : 0,
        status_counts: statusCounts,
        has_multiple_quotes: quotes.length > 1
      }
    });

  } catch (error) {
    console.error('Quote summary endpoint error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

/**
 * GET /api/quotes/test-history-table
 * Test endpoint to check if quote_status_history table exists
 */
router.get('/test-history-table', async (req, res) => {
  try {
    console.log('[TEST] Testing quote_status_history table access...');
    
    // Try to query the table
    const { data, error } = await supabase
      .from('quote_status_history')
      .select('*')
      .limit(1);

    if (error) {
      console.error('[TEST] Error accessing quote_status_history table:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'TABLE_ACCESS_ERROR',
          message: `Failed to access quote_status_history table: ${error.message}`
        }
      });
    }

    console.log('[TEST] Successfully accessed quote_status_history table');
    res.status(200).json({
      success: true,
      message: 'quote_status_history table is accessible',
      table_exists: true,
      record_count: data ? data.length : 0
    });

  } catch (error) {
    console.error('[TEST] Unexpected error testing history table:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * GET /api/quotes/:quoteId/history
 * Get quote status history for a specific quote
 */
router.get('/:quoteId/history', async (req, res) => {
  try {
    const { quoteId } = req.params;

    // Validate quoteId parameter
    if (!quoteId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETER',
          message: 'Quote ID is required'
        }
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(quoteId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUOTE_ID',
          message: 'Quote ID must be a valid UUID'
        }
      });
    }

    // Get quote history
    const result = await SupplierService.getQuoteHistory(quoteId);

    res.status(200).json({
      success: true,
      data: result,
      message: result.message
    });

  } catch (error) {
    console.error('Quote history endpoint error:', error);

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
        message: 'An unexpected error occurred while fetching quote history'
      }
    });
  }
});

module.exports = router;

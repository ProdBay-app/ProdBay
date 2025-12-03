const express = require('express');
const PortalService = require('../services/portalService');
const QuoteService = require('../services/quoteService');
const { authenticateJWT } = require('../middleware/auth');

const quoteRouter = express.Router();

/**
 * GET /api/quotes/:id/messages
 * Get all messages for a specific quote
 * Protected endpoint - requires JWT authentication
 */
quoteRouter.get('/:id/messages', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user; // From JWT middleware

    // Validate quote ID parameter
    if (!id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_QUOTE_ID',
          message: 'Quote ID is required'
        }
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUOTE_ID_FORMAT',
          message: 'Invalid quote ID format'
        }
      });
    }

    // Get messages for quote
    const result = await PortalService.getQuoteMessages(id);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Messages retrieved successfully'
    });

  } catch (error) {
    console.error('Get quote messages endpoint error:', error);

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

    // Generic server error
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while fetching messages',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

/**
 * POST /api/quotes/:id/accept
 * Accept a quote and enforce exclusivity
 * Protected endpoint - requires JWT authentication
 */
quoteRouter.post('/:id/accept', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate quote ID parameter
    if (!id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_QUOTE_ID',
          message: 'Quote ID is required'
        }
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUOTE_ID_FORMAT',
          message: 'Invalid quote ID format. Quote IDs must be valid UUIDs.'
        }
      });
    }

    // Accept the quote
    const result = await QuoteService.acceptQuote(id);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Quote accepted successfully'
    });

  } catch (error) {
    console.error('Accept quote endpoint error:', error);

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

    if (error.message.includes('cannot be accepted') || error.message.includes('Current status')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUOTE_STATUS',
          message: error.message
        }
      });
    }

    if (error.message.includes('missing') || error.message.includes('Missing')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUOTE_DATA',
          message: error.message
        }
      });
    }

    // Generic server error
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while accepting quote',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

module.exports = quoteRouter;


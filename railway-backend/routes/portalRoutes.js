const express = require('express');
const PortalService = require('../services/portalService');
const { authenticateJWT } = require('../middleware/auth');

// Portal routes (public endpoints using access_token)
const portalRouter = express.Router();

// Producer message route (protected endpoint using JWT)
const producerMessageRouter = express.Router();

/**
 * GET /api/portal/session/:token
 * Get portal session data (quote, asset, project, supplier, messages)
 * Public endpoint - validates access_token
 */
portalRouter.get('/session/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Validate token parameter
    if (!token) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Access token is required'
        }
      });
    }

    // Get portal session
    const sessionData = await PortalService.getPortalSession(token);

    res.status(200).json({
      success: true,
      data: sessionData,
      message: 'Portal session loaded successfully'
    });

  } catch (error) {
    console.error('Portal session endpoint error:', error);

    // Handle specific error types
    if (error.message.includes('Invalid access token format')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          message: error.message
        }
      });
    }

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
        message: 'An unexpected error occurred while loading portal session',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

/**
 * POST /api/portal/messages
 * Send message from supplier via portal
 * Public endpoint - validates access_token
 * 
 * Request body:
 * {
 *   "token": "uuid-access-token",
 *   "content": "Message content"
 * }
 */
portalRouter.post('/messages', async (req, res) => {
  try {
    const { token, content } = req.body;

    // Validate request body
    if (!token || !content) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'token and content are required'
        }
      });
    }

    // Validate data types
    if (typeof token !== 'string' || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATA_TYPE',
          message: 'token and content must be strings'
        }
      });
    }

    // Send supplier message
    const message = await PortalService.sendSupplierMessage(token, content);

    res.status(201).json({
      success: true,
      data: message,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Send supplier message endpoint error:', error);

    // Handle specific error types
    if (error.message.includes('Invalid access token format') || error.message.includes('Quote not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'QUOTE_NOT_FOUND',
          message: error.message
        }
      });
    }

    if (error.message.includes('Message content is required') || error.message.includes('cannot exceed')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MESSAGE_CONTENT',
          message: error.message
        }
      });
    }

    // Generic server error
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while sending message',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

/**
 * POST /api/messages
 * Send message from producer (authenticated)
 * Protected endpoint - requires JWT authentication
 * 
 * Request body:
 * {
 *   "quoteId": "uuid-quote-id",
 *   "content": "Message content"
 * }
 */
producerMessageRouter.post('/', authenticateJWT, async (req, res) => {
  try {
    const { quoteId, content } = req.body;
    const user = req.user; // From JWT middleware

    // Validate request body
    if (!quoteId || !content) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'quoteId and content are required'
        }
      });
    }

    // Validate data types
    if (typeof quoteId !== 'string' || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATA_TYPE',
          message: 'quoteId and content must be strings'
        }
      });
    }

    // Send producer message
    const message = await PortalService.sendProducerMessage(quoteId, content, user);

    res.status(201).json({
      success: true,
      data: message,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Send producer message endpoint error:', error);

    // Handle specific error types
    if (error.message.includes('Quote not found') || error.message.includes('Invalid quote ID format')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'QUOTE_NOT_FOUND',
          message: error.message
        }
      });
    }

    if (error.message.includes('Message content is required') || error.message.includes('cannot exceed')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MESSAGE_CONTENT',
          message: error.message
        }
      });
    }

    // Generic server error
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while sending message',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

module.exports = {
  portalRoutes: portalRouter,
  producerMessageRoute: producerMessageRouter
};

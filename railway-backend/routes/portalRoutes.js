const express = require('express');
const multer = require('multer');
const PortalService = require('../services/portalService');
const { authenticateJWT } = require('../middleware/auth');

// Portal routes (public endpoints using access_token)
const portalRouter = express.Router();

// Producer message route (protected endpoint using JWT)
const producerMessageRouter = express.Router();

// Configure multer for in-memory storage (no disk writes)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size per attachment
    files: 10
  }
});

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
 * GET /api/portal/message-attachments
 * Get message attachments for a quote via portal token
 *
 * Query params:
 *   - token: access token (UUID)
 */
portalRouter.get('/message-attachments', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Access token is required'
        }
      });
    }

    const attachments = await PortalService.getMessageAttachmentsByToken(token);

    res.status(200).json({
      success: true,
      data: attachments,
      message: 'Message attachments retrieved successfully'
    });
  } catch (error) {
    console.error('Portal attachments endpoint error:', error);

    if (error.message.includes('Invalid access token format') || error.message.includes('Quote not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'QUOTE_NOT_FOUND',
          message: error.message
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while fetching message attachments',
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
portalRouter.post('/messages', upload.array('files', 10), async (req, res) => {
  try {
    const { token, content } = req.body;
    const files = req.files || [];
    const hasContent = typeof content === 'string' && content.trim().length > 0;

    // Validate request body
    if (!token || (!hasContent && files.length === 0)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'token and content or files are required'
        }
      });
    }

    // Validate data types
    if (typeof token !== 'string' || (content !== undefined && typeof content !== 'string')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATA_TYPE',
          message: 'token must be a string and content must be a string when provided'
        }
      });
    }

    // Send supplier message
    const message = await PortalService.sendSupplierMessage(token, content || '', files);

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
 * POST /api/portal/submit-quote
 * Submit quote via portal (public endpoint using access_token)
 * 
 * Request body:
 * {
 *   "token": "uuid-access-token",
 *   "cost": 1234.56,
 *   "notes": "Optional notes and capacity details",
 *   "fileUrl": "optional-file-url" (for future file upload support)
 * }
 */
portalRouter.post('/submit-quote', async (req, res) => {
  try {
    const { token, cost, notes, fileUrl } = req.body;

    // Validate request body
    if (!token || cost === undefined || cost === null) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'token and cost are required'
        }
      });
    }

    // Validate data types
    if (typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATA_TYPE',
          message: 'token must be a string'
        }
      });
    }

    if (typeof cost !== 'number') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATA_TYPE',
          message: 'cost must be a number'
        }
      });
    }

    if (cost < 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_COST',
          message: 'cost cannot be negative'
        }
      });
    }

    // Submit quote
    const updatedQuote = await PortalService.submitQuoteViaPortal(
      token,
      cost,
      notes || '',
      fileUrl || null
    );

    res.status(200).json({
      success: true,
      data: updatedQuote,
      message: 'Quote submitted successfully'
    });

  } catch (error) {
    console.error('Submit quote endpoint error:', error);

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

    if (error.message.includes('already been submitted')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'QUOTE_ALREADY_SUBMITTED',
          message: error.message
        }
      });
    }

    if (error.message.includes('required') || error.message.includes('must be') || error.message.includes('cannot be negative')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: error.message
        }
      });
    }

    // Generic server error
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while submitting quote',
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
producerMessageRouter.post('/', authenticateJWT, upload.array('files', 10), async (req, res) => {
  try {
    const { quoteId, content } = req.body;
    const user = req.user; // From JWT middleware
    const files = req.files || [];
    const hasContent = typeof content === 'string' && content.trim().length > 0;

    // Validate request body
    if (!quoteId || (!hasContent && files.length === 0)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'quoteId and content or files are required'
        }
      });
    }

    // Validate data types
    if (typeof quoteId !== 'string' || (content !== undefined && typeof content !== 'string')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATA_TYPE',
          message: 'quoteId must be a string and content must be a string when provided'
        }
      });
    }

    // Send producer message
    const message = await PortalService.sendProducerMessage(quoteId, content || '', user, files);

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

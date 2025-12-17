require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const briefRoutes = require('./routes/brief');
const supplierRoutes = require('./routes/suppliers');
const aiAllocationRoutes = require('./routes/aiAllocation');
const quoteComparisonRoutes = require('./routes/quoteComparison');
const pdfExtractionRoutes = require('./routes/pdfExtraction');
const projectSummaryRoutes = require('./routes/projectSummary');
const { portalRoutes, producerMessageRoute } = require('./routes/portalRoutes');
const quoteRoutes = require('./routes/quoteRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const { testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Get the regex pattern from environment variable
    const allowedOriginsPattern = process.env.ALLOWED_ORIGINS;
    
    if (allowedOriginsPattern) {
      try {
        // Create RegExp from the environment variable
        const originRegex = new RegExp(allowedOriginsPattern);
        
        if (originRegex.test(origin)) {
          callback(null, true);
        } else {
          console.warn(`CORS blocked request from origin: ${origin} (does not match pattern: ${allowedOriginsPattern})`);
          callback(new Error('Not allowed by CORS'));
        }
      } catch (error) {
        console.error(`Invalid regex pattern in ALLOWED_ORIGINS: ${allowedOriginsPattern}`, error);
        // Fall back to default origins if regex is invalid
        const defaultOrigins = [
          'http://localhost:5173', 
          'http://localhost:3000',
          'https://prodbay-9i262gg61-clive-arias-projects.vercel.app',
          'https://prodbay.vercel.app'
        ];
        
        if (defaultOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.warn(`CORS blocked request from origin: ${origin} (fallback to default origins)`);
          callback(new Error('Not allowed by CORS'));
        }
      }
    } else {
      // Fallback to default origins if no environment variable is set
      const defaultOrigins = [
        'http://localhost:5173', 
        'http://localhost:3000',
        'https://prodbay-9i262gg61-clive-arias-projects.vercel.app',
        'https://prodbay.vercel.app'
      ];
      
      if (defaultOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked request from origin: ${origin} (no ALLOWED_ORIGINS pattern set)`);
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Body parsing middleware
// Increased limit to 50mb to handle Base64-encoded file attachments
// (5MB file becomes ~6.67MB in Base64, multiple files need headroom)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Routes
app.use('/api', briefRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api', aiAllocationRoutes);
app.use('/api/quotes', quoteComparisonRoutes);
app.use('/api', pdfExtractionRoutes);
app.use('/api/project-summary', projectSummaryRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/messages', producerMessageRoute);
app.use('/api/quotes', quoteRoutes);
app.use('/api/webhooks', webhookRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ProdBay Backend Service',
    version: '1.0.0',
    endpoints: {
      'POST /api/process-brief': 'Process project brief and create assets',
      'GET /api/health': 'Health check endpoint',
      'GET /api/suppliers/suggestions/:assetId': 'Get suggested suppliers for an asset',
      'POST /api/suppliers/send-quote-requests': 'Send quote requests to selected suppliers',
      'POST /api/suppliers/submit-quote': 'Submit a quote with ownership validation (requires x-impersonated-supplier-id header)',
      'PUT /api/suppliers/update-quote': 'Update a quote with ownership validation (requires x-impersonated-supplier-id header)',
      'GET /api/suppliers/:supplierId/quotable-assets': 'Get assets for which the supplier has received quote requests (Pending status)',
      'GET /api/suppliers/health': 'Supplier service health check',
      'POST /api/ai-allocate-assets': 'AI-powered asset analysis from brief',
      'POST /api/ai-create-assets': 'Create assets based on AI analysis',
      'POST /api/ai/extract-highlights': 'AI-powered extraction of key project information from brief',
      'GET /api/ai-health': 'AI service health check',
      'GET /api/quotes/compare/:assetId': 'Get quotes for comparison',
      'GET /api/quotes/compare/:assetId/summary': 'Get quote summary for asset',
      'POST /api/extract-text-from-pdf': 'Extract text from uploaded PDF file',
      'GET /api/project-summary/:projectId': 'Get comprehensive project tracking summary',
      'GET /api/project-summary/:projectId/milestones': 'Get project milestones',
      'POST /api/project-summary/:projectId/milestones': 'Create a new milestone',
      'PATCH /api/project-summary/milestones/:milestoneId': 'Update a milestone',
      'GET /api/project-summary/:projectId/actions': 'Get action items for a project',
      'POST /api/project-summary/actions': 'Create a new action item',
      'PATCH /api/project-summary/actions/:actionId/complete': 'Complete an action item',
      'GET /api/portal/session/:token': 'Get portal session data (quote, asset, messages)',
      'POST /api/portal/messages': 'Send message from supplier via portal (requires token in body)',
      'POST /api/messages': 'Send message from producer (requires JWT authentication)',
      'GET /api/quotes/:id/messages': 'Get all messages for a quote (requires JWT authentication)',
      'POST /api/webhooks/new-message': 'Webhook endpoint for new message notifications (requires X-Webhook-Secret header)'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`
    }
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // CORS error
  if (error.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'CORS_ERROR',
        message: 'Request blocked by CORS policy'
      }
    });
  }

  // JSON parsing error
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON in request body'
      }
    });
  }

  // Generic server error
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    }
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    console.log('Testing database connection...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 ProdBay Backend Service running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📝 Process brief: POST http://localhost:${PORT}/api/process-brief`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

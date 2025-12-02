const express = require('express');
const { supabase } = require('../config/database');
const emailService = require('../services/emailService');

const router = express.Router();

/**
 * Middleware to validate webhook secret
 * Ensures requests actually came from Supabase
 */
const validateWebhookSecret = (req, res, next) => {
  const webhookSecret = process.env.WEBHOOK_SECRET;
  const providedSecret = req.headers['x-webhook-secret'] || req.body.secret;

  // If no secret is configured, skip validation (development mode)
  if (!webhookSecret) {
    console.warn('[Webhook] WEBHOOK_SECRET not configured. Skipping validation (development mode).');
    return next();
  }

  // Validate secret
  if (!providedSecret || providedSecret !== webhookSecret) {
    console.error('[Webhook] Invalid webhook secret provided');
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid webhook secret'
      }
    });
  }

  next();
};

/**
 * Normalize FRONTEND_URL by removing trailing slash
 * @param {string} url - URL to normalize
 * @returns {string} Normalized URL
 */
const normalizeFrontendUrl = (url) => {
  if (!url) return 'http://localhost:5173';
  return url.replace(/\/$/, '');
};

/**
 * POST /api/webhooks/new-message
 * Handle new message webhook from Supabase
 * Sends email notification to the recipient (opposite of sender)
 */
router.post('/new-message', validateWebhookSecret, async (req, res) => {
  try {
    // Extract message data from Supabase webhook payload
    const messageRecord = req.body.record || req.body;

    // Validate required fields
    if (!messageRecord) {
      console.error('[Webhook] Missing record in payload');
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'Missing record in webhook payload'
        }
      });
    }

    const { quote_id, sender_type, content, id: messageId } = messageRecord;

    if (!quote_id || !sender_type || !content) {
      console.error('[Webhook] Missing required fields:', { quote_id, sender_type, content: !!content });
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'Missing required fields: quote_id, sender_type, and content are required'
        }
      });
    }

    // Validate sender_type
    if (!['PRODUCER', 'SUPPLIER'].includes(sender_type)) {
      console.error('[Webhook] Invalid sender_type:', sender_type);
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SENDER_TYPE',
          message: 'sender_type must be either PRODUCER or SUPPLIER'
        }
      });
    }

    console.log(`[Webhook] Processing new message notification: message_id=${messageId}, quote_id=${quote_id}, sender_type=${sender_type}`);

    // ============================================
    // QUERY 1: Fetch quote with supplier, asset, and project (2 levels max)
    // ============================================
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select(`
        id,
        access_token,
        supplier:suppliers(
          id,
          supplier_name,
          contact_email,
          contact_persons
        ),
        asset:assets(
          id,
          asset_name,
          project:projects(
            id,
            project_name,
            producer_id
          )
        )
      `)
      .eq('id', quote_id)
      .single();

    if (quoteError || !quote) {
      console.error('[Webhook] ❌ Quote not found:', quoteError);
      // Return 200 OK to prevent Supabase retry loop
      return res.status(200).json({
        success: false,
        error: {
          code: 'QUOTE_NOT_FOUND',
          message: 'Quote not found. Email notification skipped.'
        }
      });
    }

    console.log('[Webhook] ✅ Quote fetched:', { 
      quote_id: quote.id, 
      has_supplier: !!quote.supplier,
      has_asset: !!quote.asset 
    });

    // ============================================
    // Validate chain: Quote → Asset → Project
    // ============================================
    if (!quote.asset) {
      console.error(`[Webhook] ❌ Broken Chain: Quote ${quote_id} has no Asset linked.`);
      return res.status(200).json({
        success: false,
        error: {
          code: 'ASSET_NOT_FOUND',
          message: 'Asset not found for quote. Email notification skipped.'
        }
      });
    }

    console.log('[Webhook] ✅ Asset found:', { 
      asset_id: quote.asset.id, 
      asset_name: quote.asset.asset_name,
      has_project: !!quote.asset.project 
    });

    if (!quote.asset.project) {
      console.error(`[Webhook] ❌ Broken Chain: Quote ${quote_id} → Asset ${quote.asset.id} has no Project linked.`);
      return res.status(200).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'Project not found for asset. Email notification skipped.'
        }
      });
    }

    console.log('[Webhook] ✅ Project found:', { 
      project_id: quote.asset.project.id, 
      project_name: quote.asset.project.project_name,
      producer_id: quote.asset.project.producer_id 
    });

    // ============================================
    // QUERY 2: Fetch producer separately (if needed)
    // ============================================
    let producer = null;
    const producerId = quote.asset.project.producer_id;

    if (producerId) {
      const { data: producerData, error: producerError } = await supabase
        .from('producers')
        .select('id, email, full_name, company_name')
        .eq('id', producerId)
        .single();

      if (producerError) {
        console.error('[Webhook] ❌ Producer fetch failed:', {
          producer_id: producerId,
          error: producerError.message
        });
      } else if (producerData) {
        producer = producerData;
        console.log('[Webhook] ✅ Producer found:', { 
          producer_id: producer.id, 
          email: producer.email,
          name: producer.full_name || producer.company_name 
        });
      } else {
        console.error(`[Webhook] ❌ Broken Chain: Project ${quote.asset.project.id} has producer_id ${producerId} but Producer not found in database.`);
      }
    } else {
      console.error(`[Webhook] ❌ Broken Chain: Project ${quote.asset.project.id} has no producer_id set.`);
    }

    // ============================================
    // Determine recipient based on sender_type
    // ============================================
    let recipientEmail = null;
    let recipientName = null;
    let senderEmail = null;
    let senderName = null;
    let portalLink = null;
    let quoteName = quote.asset.asset_name || 'Quote';

    if (sender_type === 'PRODUCER') {
      // Producer sent message → Notify Supplier
      const supplier = quote.supplier;
      if (!supplier) {
        console.error('[Webhook] ❌ Supplier not found for quote');
        return res.status(200).json({
          success: false,
          error: {
            code: 'SUPPLIER_NOT_FOUND',
            message: 'Supplier not found. Email notification skipped.'
          }
        });
      }

      // Get supplier email (prefer primary contact, fallback to contact_email)
      const primaryContact = supplier.contact_persons?.find(cp => cp.is_primary) || 
                            (supplier.contact_persons?.length > 0 ? supplier.contact_persons[0] : null);
      recipientEmail = primaryContact?.email || supplier.contact_email;
      recipientName = primaryContact?.name || supplier.supplier_name;

      // Get producer info for sender (use fetched producer or fallback)
      senderEmail = producer?.email || 'noreply@prodbay.com';
      senderName = producer?.full_name || producer?.company_name || 'Producer';

      // Build portal link for supplier
      const frontendUrl = normalizeFrontendUrl(process.env.FRONTEND_URL || 'http://localhost:5173');
      portalLink = `${frontendUrl}/portal/quote/${quote.access_token}`;

    } else if (sender_type === 'SUPPLIER') {
      // Supplier sent message → Notify Producer
      if (!producer || !producer.email) {
        console.error('[Webhook] ❌ Producer not found or missing email:', {
          quote_id: quote_id,
          asset_id: quote.asset.id,
          project_id: quote.asset.project.id,
          producer_id: producerId,
          producer_data: producer
        });
        return res.status(200).json({
          success: false,
          error: {
            code: 'PRODUCER_NOT_FOUND',
            message: 'Producer not found or missing email. Email notification skipped.',
            details: process.env.NODE_ENV === 'development' ? {
              producer_id: producerId,
              has_asset: !!quote.asset,
              has_project: !!quote.asset.project
            } : undefined
          }
        });
      }

      recipientEmail = producer.email;
      recipientName = producer.full_name || producer.company_name || 'Producer';
      console.log(`[Webhook] ✅ Found Producer: Email ${producer.email}`);

      // Get supplier info for sender
      const supplier = quote.supplier;
      const primaryContact = supplier?.contact_persons?.find(cp => cp.is_primary) || 
                            (supplier?.contact_persons?.length > 0 ? supplier.contact_persons[0] : null);
      senderEmail = primaryContact?.email || supplier?.contact_email || 'noreply@prodbay.com';
      senderName = primaryContact?.name || supplier?.supplier_name || 'Supplier';

      // Build dashboard link for producer (link to quote chat page)
      const frontendUrl = normalizeFrontendUrl(process.env.FRONTEND_URL || 'http://localhost:5173');
      portalLink = `${frontendUrl}/dashboard/quotes/${quote.id}/chat`;
    }

    // Validate recipient email exists
    if (!recipientEmail) {
      console.error('[Webhook] Recipient email not found');
      return res.status(200).json({
        success: false,
        error: {
          code: 'RECIPIENT_EMAIL_NOT_FOUND',
          message: 'Recipient email not found. Email notification skipped.'
        }
      });
    }

    // Validate recipient email exists
    if (!recipientEmail) {
      console.error('[Webhook] ❌ Recipient email not found');
      return res.status(200).json({
        success: false,
        error: {
          code: 'RECIPIENT_EMAIL_NOT_FOUND',
          message: 'Recipient email not found. Email notification skipped.'
        }
      });
    }

    // Generate message preview (first 100 characters)
    const messagePreview = content.length > 100 ? content.substring(0, 100) : content;

    // Send email notification
    console.log(`[Webhook] 📧 Sending email notification to ${recipientEmail} (${sender_type} → ${sender_type === 'PRODUCER' ? 'SUPPLIER' : 'PRODUCER'})`);
    
    const emailResult = await emailService.sendNewMessageNotification({
      to: recipientEmail,
      replyTo: senderEmail,
      senderName: senderName,
      quoteName: quoteName,
      portalLink: portalLink,
      messagePreview: messagePreview
    });

    if (!emailResult.success) {
      console.error('[Webhook] Failed to send email notification:', emailResult.error);
      // Still return 200 OK to prevent retry loop
      return res.status(200).json({
        success: false,
        error: {
          code: 'EMAIL_SEND_FAILED',
          message: emailResult.error || 'Failed to send email notification'
        }
      });
    }

    console.log(`[Webhook] ✅ Email notification sent successfully to ${recipientEmail} (Message ID: ${emailResult.messageId})`);

    // Return success
    return res.status(200).json({
      success: true,
      message: 'Email notification sent successfully',
      data: {
        messageId: messageId,
        recipientEmail: recipientEmail,
        emailMessageId: emailResult.messageId
      }
    });

  } catch (error) {
    console.error('[Webhook] Unexpected error processing webhook:', error);
    
    // Return 200 OK even on error to prevent Supabase retry loop
    // Log the error for monitoring
    return res.status(200).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while processing webhook',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

module.exports = router;


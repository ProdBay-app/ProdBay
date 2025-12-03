const { Resend } = require('resend');

/**
 * Email Service
 * Handles email sending via Resend with Reply-To pattern
 */
class EmailService {
  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️  RESEND_API_KEY not configured. Email sending will be disabled.');
      this.resend = null;
    } else {
      this.resend = new Resend(apiKey);
    }
    
    // Configure from email address
    // Require explicit configuration - no hardcoded fallback
    const fromEmailEnv = process.env.RESEND_FROM_EMAIL;
    if (!fromEmailEnv) {
      console.warn('⚠️  RESEND_FROM_EMAIL not configured. Email sending may fail.');
      this.fromEmail = 'ProdBay <noreply@prodbay.com>'; // Generic fallback only
    } else {
      this.fromEmail = fromEmailEnv;
    }
  }

  /**
   * Send quote request email to supplier
   * @param {Object} params - Email parameters
   * @param {string} params.to - Supplier email address
   * @param {string} params.replyTo - User's email address (for Reply-To header)
   * @param {string} params.assetName - Name of the asset
   * @param {string} params.message - Email message body
   * @param {string} params.quoteLink - Link to submit quote
   * @param {string} [params.subject] - Optional custom subject
   * @returns {Promise<Object>} Result with success status and messageId or error
   */
  async sendQuoteRequest({ to, replyTo, assetName, message, quoteLink, subject = null }) {
    try {
      // Log entry point and parameters
      console.log('[EmailService] Attempting to send quote request email');
      console.log('[EmailService] To:', to);
      console.log('[EmailService] Reply-To:', replyTo);
      console.log('[EmailService] From:', this.fromEmail);
      
      // Validate required parameters
      if (!to || !replyTo || !assetName) {
        throw new Error('Missing required parameters: to, replyTo, and assetName are required');
      }

      // Check if Resend is configured
      if (!this.resend) {
        console.error('[EmailService] RESEND_API_KEY not configured. Email sending disabled.');
        return {
          success: false,
          error: 'Email service not configured. RESEND_API_KEY is missing.'
        };
      }

      // Generate email subject if not provided
      const emailSubject = subject || `Quote Request: ${assetName}`;
      console.log('[EmailService] Subject:', emailSubject);

      // Build email body
      // Note: The message parameter already contains the quote link (added by supplierService)
      // We only add it here if message is not provided (fallback case)
      let emailBody = message;
      
      if (!emailBody) {
        // Fallback: Generate default email body if message not provided
        emailBody = `Dear Supplier,\n\nWe would like to request a quote for the following asset:\n\nAsset: ${assetName}\n\n`;
        
        if (quoteLink) {
          emailBody += `Please provide your quote by visiting: ${quoteLink}\n\n`;
        }
        
        emailBody += `Thank you for your time and we look forward to working with you.\n\nBest regards,\nProdBay Team`;
      }

      // Send email via Resend
      console.log('[EmailService] Calling Resend API...');
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        reply_to: [replyTo],
        subject: emailSubject,
        text: emailBody
      });

      // Log Resend API response
      console.log('[EmailService] Resend API call completed');
      console.log('[EmailService] Success:', !error);
      if (data) {
        console.log('[EmailService] Message ID:', data.id);
      }
      if (error) {
        console.error('[EmailService] Resend API error:', JSON.stringify(error, null, 2));
      }

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to send email via Resend'
        };
      }

      console.log(`✅ Quote request email sent to ${to} (Message ID: ${data?.id || 'N/A'})`);
      
      return {
        success: true,
        messageId: data?.id,
        error: null
      };

    } catch (error) {
      console.error('Error in sendQuoteRequest:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred while sending email'
      };
    }
  }

  /**
   * Send quote received notification to producer
   * @param {Object} params - Email parameters
   * @param {string} params.to - Producer email address
   * @param {string} params.replyTo - Supplier email (for Reply-To header)
   * @param {string} params.assetName - Name of the asset
   * @param {string} params.supplierName - Name of the supplier
   * @param {number} params.cost - Quote cost
   * @param {string} [params.notes] - Optional notes/capacity details
   * @param {string} [params.documentUrl] - Optional PDF document URL
   * @param {string} [params.projectName] - Optional project name
   * @param {string} params.dashboardLink - Link to producer dashboard
   * @returns {Promise<Object>} Result with success status and messageId or error
   */
  async sendQuoteReceivedNotification({ to, replyTo, assetName, supplierName, cost, notes, documentUrl, projectName, dashboardLink }) {
    try {
      // Log entry point and parameters
      console.log('[EmailService] Attempting to send quote received notification');
      console.log('[EmailService] To:', to);
      console.log('[EmailService] Reply-To:', replyTo);
      console.log('[EmailService] From:', this.fromEmail);
      
      // Validate required parameters
      if (!to || !replyTo || !assetName || !supplierName || cost === undefined || !dashboardLink) {
        throw new Error('Missing required parameters: to, replyTo, assetName, supplierName, cost, and dashboardLink are required');
      }

      // Check if Resend is configured
      if (!this.resend) {
        console.error('[EmailService] RESEND_API_KEY not configured. Email sending disabled.');
        return {
          success: false,
          error: 'Email service not configured. RESEND_API_KEY is missing.'
        };
      }

      // Generate email subject
      const emailSubject = `New Quote Received: ${assetName}`;
      console.log('[EmailService] Subject:', emailSubject);

      // Format cost as currency
      const formattedCost = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(cost);

      // Build email body
      let emailBody = `Hello,\n\n`;
      emailBody += `You have received a new quote submission from ${supplierName}.\n\n`;
      
      if (projectName) {
        emailBody += `Project: ${projectName}\n`;
      }
      emailBody += `Asset: ${assetName}\n`;
      emailBody += `Supplier: ${supplierName}\n`;
      emailBody += `Quote Amount: ${formattedCost}\n\n`;
      
      if (notes && notes.trim()) {
        emailBody += `Notes:\n${notes}\n\n`;
      }
      
      if (documentUrl) {
        emailBody += `Quote Document: ${documentUrl}\n\n`;
      }
      
      emailBody += `View and manage this quote in your dashboard:\n${dashboardLink}\n\n`;
      emailBody += `Best regards,\nProdBay Team`;

      // Send email via Resend
      console.log('[EmailService] Calling Resend API...');
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        reply_to: [replyTo],
        subject: emailSubject,
        text: emailBody
      });

      // Log Resend API response
      console.log('[EmailService] Resend API call completed');
      console.log('[EmailService] Success:', !error);
      if (data) {
        console.log('[EmailService] Message ID:', data.id);
      }
      if (error) {
        console.error('[EmailService] Resend API error:', JSON.stringify(error, null, 2));
      }

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to send email via Resend'
        };
      }

      console.log(`✅ Quote received notification sent to ${to} (Message ID: ${data?.id || 'N/A'})`);
      
      return {
        success: true,
        messageId: data?.id,
        error: null
      };

    } catch (error) {
      console.error('Error in sendQuoteReceivedNotification:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred while sending email'
      };
    }
  }

  /**
   * Send new message notification email
   * @param {Object} params - Email parameters
   * @param {string} params.to - Recipient email address
   * @param {string} params.replyTo - Sender email address (for Reply-To header)
   * @param {string} params.senderName - Name of message sender
   * @param {string} params.quoteName - Asset/quote name for context
   * @param {string} params.portalLink - Link to portal (for supplier) or dashboard (for producer)
   * @param {string} [params.messagePreview] - First 100 chars of message (optional)
   * @returns {Promise<Object>} Result with success status and messageId or error
   */
  async sendNewMessageNotification({ to, replyTo, senderName, quoteName, portalLink, messagePreview = null }) {
    try {
      // Log entry point and parameters
      console.log('[EmailService] Attempting to send new message notification');
      console.log('[EmailService] To:', to);
      console.log('[EmailService] Reply-To:', replyTo);
      console.log('[EmailService] From:', this.fromEmail);
      
      // Validate required parameters
      if (!to || !replyTo || !senderName || !quoteName || !portalLink) {
        throw new Error('Missing required parameters: to, replyTo, senderName, quoteName, and portalLink are required');
      }

      // Check if Resend is configured
      if (!this.resend) {
        console.error('[EmailService] RESEND_API_KEY not configured. Email sending disabled.');
        return {
          success: false,
          error: 'Email service not configured. RESEND_API_KEY is missing.'
        };
      }

      // Generate email subject
      const emailSubject = `New message about ${quoteName}`;
      console.log('[EmailService] Subject:', emailSubject);

      // Build email body
      let emailBody = `Hello,\n\n`;
      emailBody += `You have received a new message from ${senderName} regarding "${quoteName}".\n\n`;
      
      if (messagePreview) {
        emailBody += `Message preview:\n"${messagePreview}${messagePreview.length >= 100 ? '...' : ''}"\n\n`;
      }
      
      emailBody += `View the full conversation and reply here:\n${portalLink}\n\n`;
      emailBody += `Best regards,\nProdBay Team`;

      // Send email via Resend
      console.log('[EmailService] Calling Resend API...');
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        reply_to: [replyTo],
        subject: emailSubject,
        text: emailBody
      });

      // Log Resend API response
      console.log('[EmailService] Resend API call completed');
      console.log('[EmailService] Success:', !error);
      if (data) {
        console.log('[EmailService] Message ID:', data.id);
      }
      if (error) {
        console.error('[EmailService] Resend API error:', JSON.stringify(error, null, 2));
      }

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to send email via Resend'
        };
      }

      console.log(`✅ New message notification sent to ${to} (Message ID: ${data?.id || 'N/A'})`);
      
      return {
        success: true,
        messageId: data?.id,
        error: null
      };

    } catch (error) {
      console.error('Error in sendNewMessageNotification:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred while sending email'
      };
    }
  }
}

// Export singleton instance
module.exports = new EmailService();


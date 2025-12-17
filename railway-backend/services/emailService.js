const { Resend } = require('resend');
const { generateEmailHtml } = require('../utils/emailGenerator');

/**
 * Email Service
 * Handles email sending via Resend with Reply-To pattern
 * Uses branded HTML email templates
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
   * @param {Array} [params.attachments] - Optional array of attachments with {filename, content (Base64), contentType} (fallback)
   * @param {Array} [params.attachmentUrls] - Optional array of {url, filename} from Storage (preferred)
   * @returns {Promise<Object>} Result with success status and messageId or error
   */
  async sendQuoteRequest({ to, replyTo, assetName, message, quoteLink, subject = null, attachments = null, attachmentUrls = null }) {
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

      // Build email body (plain text for fallback)
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

      // Build HTML body
      // Convert plain text message to HTML, preserving line breaks
      let htmlBodyContent = '';
      if (message) {
        // Convert plain text to HTML paragraphs
        const paragraphs = message.split('\n\n').filter(p => p.trim());
        htmlBodyContent = paragraphs.map(para => {
          // Replace single newlines with <br> within paragraphs
          const formatted = para.split('\n').map(line => line.trim()).filter(line => line).join('<br>');
          return `<p style="margin: 0 0 12px 0; color: #333333; font-size: 16px; line-height: 1.6;">${escapeHtml(formatted)}</p>`;
        }).join('');
        
        // Ensure quote link is clickable if present
        if (quoteLink && htmlBodyContent.includes(quoteLink)) {
          htmlBodyContent = htmlBodyContent.replace(
            new RegExp(escapeHtml(quoteLink), 'g'),
            `<a href="${quoteLink}" style="color: #7c3aed; text-decoration: underline;">${quoteLink}</a>`
          );
        }
      } else {
        // Fallback HTML
        htmlBodyContent = `<p style="margin: 0 0 12px 0; color: #333333; font-size: 16px; line-height: 1.6;">Dear Supplier,</p>`;
        htmlBodyContent += `<p style="margin: 0 0 12px 0; color: #333333; font-size: 16px; line-height: 1.6;">We would like to request a quote for the following asset:</p>`;
        htmlBodyContent += `<p style="margin: 0 0 12px 0; color: #333333; font-size: 16px; line-height: 1.6;"><strong>Asset:</strong> ${escapeHtml(assetName)}</p>`;
        if (quoteLink) {
          htmlBodyContent += `<p style="margin: 0 0 12px 0; color: #333333; font-size: 16px; line-height: 1.6;">Please provide your quote by visiting the link below.</p>`;
        }
        htmlBodyContent += `<p style="margin: 0 0 12px 0; color: #333333; font-size: 16px; line-height: 1.6;">Thank you for your time and we look forward to working with you.</p>`;
        htmlBodyContent += `<p style="margin: 0; color: #333333; font-size: 16px; line-height: 1.6;">Best regards,<br>ProdBay Team</p>`;
      }

      // Generate HTML email
      const htmlBody = generateEmailHtml({
        title: `Quote Request: ${assetName}`,
        body: htmlBodyContent,
        ctaLink: quoteLink,
        ctaText: 'Submit Quote',
        footerText: 'ProdBay - Production Management Platform'
      });

      // Process attachments: Combine Storage URLs and Base64 attachments
      // Both can be present if some uploads succeeded and others failed
      let resendAttachments = [];
      
      // Add Storage URL attachments (successful uploads)
      if (attachmentUrls && Array.isArray(attachmentUrls) && attachmentUrls.length > 0) {
        console.log(`[EmailService] Using ${attachmentUrls.length} Storage URL attachment(s)...`);
        const urlAttachments = attachmentUrls.map(att => {
          // Extract filename from URL or use provided filename
          const filename = att.filename || att.url.split('/').pop() || 'attachment';
          return {
            filename: filename,
            path: att.url  // Resend will fetch file from this URL
          };
        });
        resendAttachments.push(...urlAttachments);
        console.log(`[EmailService] Storage URL attachments: ${urlAttachments.map(a => a.filename).join(', ')}`);
      }
      
      // Add Base64 attachments (failed uploads - fallback)
      if (attachments && Array.isArray(attachments) && attachments.length > 0) {
        console.log(`[EmailService] Processing ${attachments.length} Base64 attachment(s) (fallback for failed uploads)...`);
        const base64Attachments = attachments.map(att => {
          // Convert Base64 string to Buffer
          const buffer = Buffer.from(att.content, 'base64');
          return {
            filename: att.filename,
            content: buffer,
            // contentType is optional in Resend, but we include it if provided
            ...(att.contentType && { contentType: att.contentType })
          };
        });
        resendAttachments.push(...base64Attachments);
        console.log(`[EmailService] Base64 attachments: ${base64Attachments.map(a => a.filename).join(', ')}`);
      }
      
      // Only set resendAttachments if we have any attachments
      if (resendAttachments.length === 0) {
        resendAttachments = undefined;
      } else {
        console.log(`[EmailService] Total attachments prepared: ${resendAttachments.length} (${attachmentUrls?.length || 0} from Storage, ${attachments?.length || 0} from Base64)`);
      }

      // Send email via Resend
      console.log('[EmailService] Calling Resend API...');
      const emailPayload = {
        from: this.fromEmail,
        to: [to],
        reply_to: [replyTo],
        subject: emailSubject,
        text: emailBody,
        html: htmlBody
      };

      // Add attachments if present
      if (resendAttachments) {
        emailPayload.attachments = resendAttachments;
      }

      const { data, error } = await this.resend.emails.send(emailPayload);

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

      // Build email body (plain text for fallback)
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

      // Build HTML body with key-value pairs
      const bodyData = [
        { label: 'Project', value: projectName || 'N/A' },
        { label: 'Asset', value: assetName },
        { label: 'Supplier', value: supplierName },
        { label: 'Quote Amount', value: formattedCost }
      ];

      if (notes && notes.trim()) {
        bodyData.push({ label: 'Notes', value: notes });
      }

      if (documentUrl) {
        bodyData.push({ 
          label: 'Quote Document', 
          value: `<a href="${documentUrl}" style="color: #7c3aed; text-decoration: underline;">View Document</a>` 
        });
      }

      // Generate HTML email
      const htmlBody = generateEmailHtml({
        title: `New Quote Received: ${assetName}`,
        body: bodyData,
        ctaLink: dashboardLink,
        ctaText: 'View in Dashboard',
        footerText: 'ProdBay - Production Management Platform'
      });

      // Send email via Resend
      console.log('[EmailService] Calling Resend API...');
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        reply_to: [replyTo],
        subject: emailSubject,
        text: emailBody,
        html: htmlBody
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

      // Build email body (plain text for fallback)
      let emailBody = `Hello,\n\n`;
      emailBody += `You have received a new message from ${senderName} regarding "${quoteName}".\n\n`;
      
      if (messagePreview) {
        emailBody += `Message preview:\n"${messagePreview}${messagePreview.length >= 100 ? '...' : ''}"\n\n`;
      }
      
      emailBody += `View the full conversation and reply here:\n${portalLink}\n\n`;
      emailBody += `Best regards,\nProdBay Team`;

      // Build HTML body
      let htmlBodyContent = `<p style="margin: 0 0 12px 0; color: #333333; font-size: 16px; line-height: 1.6;">You have received a new message from <strong>${senderName}</strong> regarding <strong>"${quoteName}"</strong>.</p>`;
      
      if (messagePreview) {
        const previewText = messagePreview.length >= 100 ? messagePreview.substring(0, 100) + '...' : messagePreview;
        htmlBodyContent += `<div style="background-color: #f5f5f5; border-left: 3px solid #7c3aed; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">`;
        htmlBodyContent += `<p style="margin: 0; color: #666666; font-size: 14px; font-style: italic; line-height: 1.6;">"${previewText}"</p>`;
        htmlBodyContent += `</div>`;
      }

      // Generate HTML email
      const htmlBody = generateEmailHtml({
        title: `New message about ${quoteName}`,
        body: htmlBodyContent,
        ctaLink: portalLink,
        ctaText: 'View Conversation',
        footerText: 'ProdBay - Production Management Platform'
      });

      // Send email via Resend
      console.log('[EmailService] Calling Resend API...');
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        reply_to: [replyTo],
        subject: emailSubject,
        text: emailBody,
        html: htmlBody
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

/**
 * Escape HTML special characters (helper function)
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  if (typeof text !== 'string') {
    return String(text);
  }
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Export singleton instance
module.exports = new EmailService();


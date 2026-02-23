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

    // Promise-chain queue for outbound email sends.
    // Each send request is appended to this chain so network calls are
    // serialized and spaced out, preventing Resend rate-limit bursts.
    this.sendQueue = Promise.resolve();
    this.minSendIntervalMs = 600;
    this.maxRetryAttempts = 3;
  }

  /**
   * Delay helper used by throttling and retry logic
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Extract HTTP status code from various error shapes
   * @param {Object|Error} error
   * @returns {number|null}
   */
  getErrorStatusCode(error) {
    const candidates = [
      error?.statusCode,
      error?.status,
      error?.response?.status,
      error?.originalError?.statusCode,
      error?.originalError?.status
    ];

    for (const value of candidates) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return null;
  }

  /**
   * Parse Retry-After header into milliseconds if present
   * Supports integer-seconds and HTTP-date formats
   * @param {Object|Error} error
   * @returns {number|null}
   */
  getRetryAfterMs(error) {
    const headers =
      error?.headers ||
      error?.response?.headers ||
      error?.originalError?.headers ||
      error?.originalError?.response?.headers;

    if (!headers) return null;

    const retryAfterRaw =
      headers['retry-after'] ||
      headers['Retry-After'] ||
      (typeof headers.get === 'function' ? headers.get('retry-after') : null);

    if (!retryAfterRaw) return null;

    const retryAfterValue = Array.isArray(retryAfterRaw) ? retryAfterRaw[0] : retryAfterRaw;

    const asSeconds = Number(retryAfterValue);
    if (Number.isFinite(asSeconds)) {
      return Math.max(0, Math.round(asSeconds * 1000));
    }

    const asDateMs = new Date(retryAfterValue).getTime();
    if (Number.isFinite(asDateMs)) {
      return Math.max(0, asDateMs - Date.now());
    }

    return null;
  }

  /**
   * Determine whether an error should be retried
   * Retries only on 429 and 5xx responses
   * @param {Object|Error} error
   * @returns {boolean}
   */
  isRetriableError(error) {
    const statusCode = this.getErrorStatusCode(error);
    return statusCode === 429 || (statusCode >= 500 && statusCode <= 599);
  }

  /**
   * Normalize Resend error object into an Error with status metadata
   * @param {Object} resendError
   * @param {string} context
   * @returns {Error}
   */
  createSendError(resendError, context) {
    const wrappedError = new Error(resendError?.message || `Failed to ${context}`);
    wrappedError.statusCode = this.getErrorStatusCode(resendError);
    wrappedError.headers = resendError?.headers || resendError?.response?.headers;
    wrappedError.originalError = resendError;
    return wrappedError;
  }

  /**
   * Generic retry helper with exponential backoff
   * Retry policy: 429 and 5xx only, max 3 attempts.
   * If Retry-After exists, it is honored for the next wait.
   * @param {Function} operation - async send operation
   * @param {string} context - logging context
   * @returns {Promise<any>}
   */
  async retryWithBackoff(operation, context = 'send email') {
    let attempt = 0;
    let backoffMs = 1000;

    while (attempt < this.maxRetryAttempts) {
      attempt += 1;

      try {
        return await operation();
      } catch (error) {
        const retriable = this.isRetriableError(error);
        const isLastAttempt = attempt >= this.maxRetryAttempts;
        const statusCode = this.getErrorStatusCode(error);

        if (!retriable || isLastAttempt) {
          throw error;
        }

        const retryAfterMs = this.getRetryAfterMs(error);
        const waitMs = retryAfterMs !== null ? retryAfterMs : backoffMs;

        console.warn(
          `[EmailService] ${context} failed (status ${statusCode ?? 'unknown'}) on attempt ${attempt}/${this.maxRetryAttempts}. Retrying in ${waitMs}ms...`
        );

        await this.delay(waitMs);
        backoffMs *= 2;
      }
    }
  }

  /**
   * Queue and throttle email send operations via a promise chain.
   * Every request appends to sendQueue:
   *   sendQueue -> delay(600ms) -> performSend -> return result
   * A catch on the queue tail prevents one failure from breaking the chain.
   * @param {Function} performSend - async function that performs the network call
   * @param {string} context - logging context
   * @returns {Promise<any>}
   */
  enqueueSend(performSend, context = 'send email') {
    const queuedSend = this.sendQueue
      .then(() => this.delay(this.minSendIntervalMs))
      .then(() => this.retryWithBackoff(performSend, context));

    this.sendQueue = queuedSend.catch((error) => {
      console.error(`[EmailService] Queue error during ${context}:`, error?.message || error);
    });

    return queuedSend;
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
   * @param {string} [params.cc] - Optional comma-separated CC email addresses
   * @param {string} [params.bcc] - Optional comma-separated BCC email addresses
   * @returns {Promise<Object>} Result with success status and messageId or error
   */
  async sendQuoteRequest({ to, replyTo, assetName, message, quoteLink, subject = null, attachments = null, attachmentUrls = null, cc = null, bcc = null }) {
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
      // Convert plain text message to HTML, preserving line breaks.
      // IMPORTANT: Escape each line before joining with <br> so that <br> tags
      // render as HTML, not as literal &lt;br&gt; text.
      let htmlBodyContent = '';
      if (message) {
        const paragraphs = message.split('\n\n').filter(p => p.trim());
        htmlBodyContent = paragraphs.map(para => {
          const lines = para.split('\n').map(line => line.trim()).filter(Boolean);
          const safeContent = lines.map(line => escapeHtml(line)).join('<br>');
          return `<p style="margin: 0 0 12px 0; color: #333333; font-size: 16px; line-height: 1.6;">${safeContent}</p>`;
        }).join('');

        // Make quote link clickable if present. Use escaped URL for search (to match
        // rendered content) and escape regex special chars to avoid RegExp errors.
        if (quoteLink && typeof quoteLink === 'string' && quoteLink.trim()) {
          const escapedLink = escapeHtml(quoteLink);
          const regexSafe = escapedLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const linkHtml = `<a href="${escapeHtml(quoteLink)}" style="color: #7c3aed; text-decoration: underline;">${escapedLink}</a>`;
          htmlBodyContent = htmlBodyContent.replace(new RegExp(regexSafe, 'g'), linkHtml);
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

      // Parse CC and BCC emails (comma-separated strings to arrays)
      let ccArray = null;
      let bccArray = null;
      
      if (cc && typeof cc === 'string' && cc.trim()) {
        ccArray = cc.split(',').map(e => e.trim()).filter(Boolean);
        if (ccArray.length === 0) {
          ccArray = null;
        } else {
          console.log(`[EmailService] CC recipients: ${ccArray.join(', ')}`);
        }
      }
      
      if (bcc && typeof bcc === 'string' && bcc.trim()) {
        bccArray = bcc.split(',').map(e => e.trim()).filter(Boolean);
        if (bccArray.length === 0) {
          bccArray = null;
        } else {
          console.log(`[EmailService] BCC recipients: ${bccArray.length} recipient(s)`); // Don't log BCC emails for privacy
        }
      }

      // Send email via Resend
      console.log('[EmailService] Calling Resend API...');
      const emailPayload = {
        from: this.fromEmail,
        to: [to],
        reply_to: [replyTo],
        subject: emailSubject,
        text: emailBody,
        html: htmlBody,
        ...(ccArray && { cc: ccArray }),
        ...(bccArray && { bcc: bccArray })
      };

      // Add attachments if present
      if (resendAttachments) {
        emailPayload.attachments = resendAttachments;
      }

      const { data } = await this.enqueueSend(async () => {
        const { data: sendData, error: sendError } = await this.resend.emails.send(emailPayload);
        if (sendError) {
          throw this.createSendError(sendError, 'send quote request email');
        }
        return { data: sendData };
      }, 'send quote request email');

      // Log Resend API response
      console.log('[EmailService] Resend API call completed');
      console.log('[EmailService] Success:', true);
      if (data) {
        console.log('[EmailService] Message ID:', data.id);
      }

      console.log(`✅ Quote request email sent to ${to} (Message ID: ${data?.id || 'N/A'})`);
      
      return {
        success: true,
        messageId: data?.id,
        error: null
      };

    } catch (error) {
      console.error('Error in sendQuoteRequest:', error);
      if (error?.originalError) {
        console.error('[EmailService] Resend API error:', JSON.stringify(error.originalError, null, 2));
      }
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
      const { data } = await this.enqueueSend(async () => {
        const { data: sendData, error: sendError } = await this.resend.emails.send({
          from: this.fromEmail,
          to: [to],
          reply_to: [replyTo],
          subject: emailSubject,
          text: emailBody,
          html: htmlBody
        });

        if (sendError) {
          throw this.createSendError(sendError, 'send quote received notification');
        }

        return { data: sendData };
      }, 'send quote received notification');

      // Log Resend API response
      console.log('[EmailService] Resend API call completed');
      console.log('[EmailService] Success:', true);
      if (data) {
        console.log('[EmailService] Message ID:', data.id);
      }

      console.log(`✅ Quote received notification sent to ${to} (Message ID: ${data?.id || 'N/A'})`);
      
      return {
        success: true,
        messageId: data?.id,
        error: null
      };

    } catch (error) {
      console.error('Error in sendQuoteReceivedNotification:', error);
      if (error?.originalError) {
        console.error('[EmailService] Resend API error:', JSON.stringify(error.originalError, null, 2));
      }
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
      const emailSubject = `New Message from ${senderName} - ${quoteName}`;
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
      const { data } = await this.enqueueSend(async () => {
        const { data: sendData, error: sendError } = await this.resend.emails.send({
          from: this.fromEmail,
          to: [to],
          reply_to: [replyTo],
          subject: emailSubject,
          text: emailBody,
          html: htmlBody
        });

        if (sendError) {
          throw this.createSendError(sendError, 'send new message notification');
        }

        return { data: sendData };
      }, 'send new message notification');

      // Log Resend API response
      console.log('[EmailService] Resend API call completed');
      console.log('[EmailService] Success:', true);
      if (data) {
        console.log('[EmailService] Message ID:', data.id);
      }

      console.log(`✅ New message notification sent to ${to} (Message ID: ${data?.id || 'N/A'})`);
      
      return {
        success: true,
        messageId: data?.id,
        error: null
      };

    } catch (error) {
      console.error('Error in sendNewMessageNotification:', error);
      if (error?.originalError) {
        console.error('[EmailService] Resend API error:', JSON.stringify(error.originalError, null, 2));
      }
      return {
        success: false,
        error: error.message || 'Unknown error occurred while sending email'
      };
    }
  }

  /**
   * Send quote accepted notification to supplier
   * NOTE: projectName is accepted in the signature for compatibility, but intentionally
   * not included in subject/body to avoid exposing project identifiers.
   *
   * @param {string} toEmail - Supplier email
   * @param {string} supplierName - Supplier name/contact name
   * @param {string|null} projectName - Optional project name (not used in content)
   * @param {string} quoteTitle - Quote/asset title
   * @returns {Promise<Object>} Result with success status and messageId or error
   */
  async sendQuoteAcceptedEmail(toEmail, supplierName, projectName, quoteTitle) {
    try {
      if (!toEmail || !supplierName || !quoteTitle) {
        throw new Error('Missing required parameters: toEmail, supplierName, and quoteTitle are required');
      }

      if (!this.resend) {
        return {
          success: false,
          error: 'Email service not configured. RESEND_API_KEY is missing.'
        };
      }

      const safeSupplierName = escapeHtml(supplierName);
      const safeQuoteTitle = escapeHtml(quoteTitle);
      // Intentionally omitting projectName from subject/body per privacy requirement.
      const emailSubject = 'Your Quote was Accepted';
      const plainBody =
        `Good news, ${safeSupplierName}!\n\n` +
        `Your quote "${safeQuoteTitle}" has been accepted.\n` +
        `The producer will be in touch shortly.\n\n` +
        `Best regards,\nProdBay Team`;

      const htmlBodyContent =
        `<p style="margin: 0 0 12px 0; color: #333333; font-size: 16px; line-height: 1.6;">` +
        `Good news, <strong>${safeSupplierName}</strong>!</p>` +
        `<p style="margin: 0 0 12px 0; color: #333333; font-size: 16px; line-height: 1.6;">` +
        `Your quote "<strong>${safeQuoteTitle}</strong>" has been accepted.</p>` +
        `<p style="margin: 0; color: #333333; font-size: 16px; line-height: 1.6;">` +
        `The producer will be in touch shortly.</p>`;

      const htmlBody = generateEmailHtml({
        title: 'Quote Accepted',
        body: htmlBodyContent,
        ctaLink: null,
        ctaText: null,
        footerText: 'ProdBay - Production Management Platform'
      });

      const { data } = await this.enqueueSend(async () => {
        const { data: sendData, error: sendError } = await this.resend.emails.send({
          from: this.fromEmail,
          to: [toEmail],
          subject: emailSubject,
          text: plainBody,
          html: htmlBody
        });

        if (sendError) {
          throw this.createSendError(sendError, 'send quote accepted email');
        }

        return { data: sendData };
      }, 'send quote accepted email');

      return {
        success: true,
        messageId: data?.id,
        error: null
      };
    } catch (error) {
      console.error('Error in sendQuoteAcceptedEmail:', error);
      if (error?.originalError) {
        console.error('[EmailService] Resend API error:', JSON.stringify(error.originalError, null, 2));
      }
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


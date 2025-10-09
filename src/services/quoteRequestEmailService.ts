import type { Quote } from '@/lib/supabase';

/**
 * Email configuration for quote requests
 */
interface QuoteRequestEmail {
  quote: Quote;
  to: string;
  toName: string;
  subject: string;
  body: string;
  ccEmails?: string;
  bccEmails?: string;
  attachments?: File[];
}

/**
 * QuoteRequestEmailService - Handles sending customized quote request emails
 * 
 * Features:
 * - Sends emails via configured email function
 * - Supports CC and BCC
 * - Supports file attachments (future: upload to storage and include links)
 * - Includes unique quote token for supplier response
 * - Fallback to console logging if email service not configured
 */
export class QuoteRequestEmailService {
  /**
   * Send a quote request email to a supplier
   */
  static async sendQuoteRequestEmail(config: QuoteRequestEmail): Promise<void> {
    const fnUrl = import.meta.env.VITE_EMAIL_FUNCTION_URL || '';
    const fnKey = import.meta.env.VITE_EMAIL_FUNCTION_KEY || '';
    const appUrl = window.location.origin;

    // Parse CC and BCC emails (comma-separated strings to arrays)
    const ccArray = config.ccEmails
      ? config.ccEmails.split(',').map(e => e.trim()).filter(Boolean)
      : [];
    
    const bccArray = config.bccEmails
      ? config.bccEmails.split(',').map(e => e.trim()).filter(Boolean)
      : [];

    // Build the complete email body with quote submission link
    const quoteToken = config.quote.quote_token;
    const submissionLink = `${appUrl}/quote/${quoteToken}`;
    
    const fullBody = `${config.body}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 SUBMIT YOUR QUOTE

Please click the link below to access the quote submission form:
${submissionLink}

This link is unique to your company and this quote request.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    // Handle attachments (for future implementation)
    // Currently, we'll log attachment info but not send them
    // Future: Upload attachments to Supabase storage and include download links
    if (config.attachments && config.attachments.length > 0) {
      console.log('Attachments to include (future enhancement):', config.attachments.map(f => f.name));
      // TODO: Implement attachment upload to Supabase storage
      // TODO: Include download links in email body
    }

    if (fnUrl && fnKey) {
      try {
        // Send email via configured email function
        const response = await fetch(fnUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${fnKey}`
          },
          body: JSON.stringify({
            to: config.to,
            cc: ccArray.length > 0 ? ccArray : undefined,
            bcc: bccArray.length > 0 ? bccArray : undefined,
            subject: config.subject,
            text: fullBody,
            // Future: Add HTML version with better formatting
            // html: generateHtmlEmail(config, submissionLink)
          })
        });

        if (!response.ok) {
          throw new Error(`Email service responded with status ${response.status}`);
        }

        console.log('Quote request email sent successfully:', {
          to: config.to,
          cc: ccArray,
          bcc: bccArray,
          subject: config.subject,
          quoteId: config.quote.id
        });
      } catch (error) {
        console.error('Failed to send email:', error);
        throw new Error(`Email sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      // Fallback: Log to console if email service not configured
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 QUOTE REQUEST EMAIL (SIMULATED - Email service not configured)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('To:', config.to, `(${config.toName})`);
      if (ccArray.length > 0) console.log('CC:', ccArray.join(', '));
      if (bccArray.length > 0) console.log('BCC:', bccArray.join(', '));
      console.log('Subject:', config.subject);
      console.log('');
      console.log(fullBody);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Note: In development, this will allow testing without email service
      console.warn('⚠️  To enable actual email sending, configure VITE_EMAIL_FUNCTION_URL and VITE_EMAIL_FUNCTION_KEY');
    }
  }

  /**
   * Send multiple quote request emails in batch
   */
  static async sendBatchQuoteRequestEmails(configs: QuoteRequestEmail[]): Promise<{
    sent: number;
    failed: number;
    errors: string[];
  }> {
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Send emails sequentially to avoid rate limiting
    for (const config of configs) {
      try {
        await this.sendQuoteRequestEmail(config);
        results.sent++;
      } catch (error) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Failed to send to ${config.to}: ${errorMessage}`);
        console.error(`Failed to send quote request to ${config.to}:`, error);
      }
    }

    return results;
  }
}


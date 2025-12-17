import type { Message } from '@/services/quoteService';
import type { QuoteRequestAttachment } from '@/services/quoteService';

/**
 * Create a synthesized message from quote request data
 * This message represents the original quote request and appears as the first message in chat
 * @param quote - Quote object with request_email_body and request_attachments
 * @param quoteId - Quote ID to associate the message with
 * @returns Message object or null if no request data exists
 */
export function createInitialRequestMessage(
  quote: {
    request_email_body?: string;
    request_attachments?: QuoteRequestAttachment[];
    created_at: string;
  },
  quoteId: string
): Message | null {
  if (!quote.request_email_body) {
    return null;
  }

  // Build message content with email body
  let content = quote.request_email_body;

  // Add attachments as clickable links
  if (quote.request_attachments && quote.request_attachments.length > 0) {
    content += '\n\n📎 Attachments:\n';
    quote.request_attachments.forEach((att) => {
      const sizeMB = (att.file_size_bytes / (1024 * 1024)).toFixed(2);
      content += `• ${att.filename} (${sizeMB} MB)\n`;
      content += `  ${att.storage_url}\n`;
    });
  }

  // Create synthesized message object
  // Note: This message doesn't exist in the messages table
  // It's created client-side from quote data
  return {
    id: `initial-request-${quote.created_at}`, // Synthetic ID based on quote creation date
    quote_id: quoteId,
    sender_type: 'PRODUCER',
    content: content,
    created_at: quote.created_at, // Use quote creation date for chronological ordering
    is_read: false
  };
}

/**
 * Check if a message is the synthesized initial request message
 * @param messageId - Message ID to check
 * @returns true if this is a synthesized initial request message
 */
export function isInitialRequestMessage(messageId: string): boolean {
  return messageId.startsWith('initial-request-');
}


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

  // Only include email body in content (attachments will be rendered separately)
  const content = quote.request_email_body;

  // Create synthesized message object
  // Note: This message doesn't exist in the messages table
  // It's created client-side from quote data
  return {
    id: `initial-request-${quote.created_at}`, // Synthetic ID based on quote creation date
    quote_id: quoteId,
    sender_type: 'PRODUCER',
    content: content,
    created_at: quote.created_at, // Use quote creation date for chronological ordering
    is_read: false,
    // Include attachments as structured data for rendering
    attachments: quote.request_attachments || []
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


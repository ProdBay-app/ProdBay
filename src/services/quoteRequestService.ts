import { RailwayApiService } from './railwayApiService';
import type { Asset } from '@/lib/supabase';

export interface CustomizedEmail {
  supplierId: string;
  subject: string;
  body: string;
  ccEmails?: string; // Comma-separated string
  bccEmails?: string; // Comma-separated string
  attachments?: Array<{
    filename: string;
    content: string; // Base64 encoded
    contentType: string;
  }>;
}

export interface EmailPreviewResponse {
  success: boolean;
  data: {
    asset: Asset;
    suppliers: Array<{
      id: string;
      supplier_name: string;
      contact_email: string;
      contact_persons: Array<{
        name: string;
        email: string;
        role: string;
        phone?: string;
        is_primary: boolean;
      }>;
      preview_email: {
        to: string;
        subject: string;
        body: string;
      };
    }>;
  };
  message: string;
}

export interface SendQuoteRequestsResponse {
  success: boolean;
  data: {
    asset_id: string;
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    results: Array<{
      supplier_id: string;
      supplier_name: string;
      quote_id: string;
      email_sent: boolean;
      email_error?: string;
    }>;
    errors: Array<{
      supplier_id: string;
      supplier_name: string;
      error: string;
    }>;
  };
  message: string;
}

export class QuoteRequestService {
  /**
   * Generate email previews for quote requests
   */
  static async generateEmailPreviews(
    assetId: string,
    supplierIds: string[],
    from?: { name: string; email: string }
  ): Promise<EmailPreviewResponse> {
    const response = await RailwayApiService.post('/api/suppliers/preview-quote-requests', {
      assetId,
      supplierIds,
      from
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to generate email previews');
    }

    return response as EmailPreviewResponse;
  }

  /**
   * Send quote requests with customized emails
   */
  static async sendQuoteRequests(
    assetId: string,
    supplierIds: string[],
    customizedEmails: CustomizedEmail[],
    from?: { name: string; email: string }
  ): Promise<SendQuoteRequestsResponse> {
    const response = await RailwayApiService.post('/api/suppliers/send-quote-requests', {
      assetId,
      supplierIds,
      from,
      customizedEmails
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to send quote requests');
    }

    return response as SendQuoteRequestsResponse;
  }
}

import type { Asset, Supplier } from '@/lib/supabase';

export interface SuggestedSupplier extends Supplier {
  already_contacted: boolean;
}

export interface SupplierSuggestionsResponse {
  asset: Asset;
  suggestedSuppliers: SuggestedSupplier[];
}

export interface SendQuoteRequestsResponse {
  success: boolean;
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
}

export class SupplierApiService {
  private static getBaseUrl(): string {
    const baseUrl = import.meta.env.VITE_RAILWAY_API_URL || 'http://localhost:3000';
    return baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Get suggested suppliers for an asset
   */
  static async getSuggestedSuppliers(assetId: string): Promise<SupplierSuggestionsResponse> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/suppliers/suggestions/${assetId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch supplier suggestions');
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching supplier suggestions:', error);
      throw error;
    }
  }

  /**
   * Send quote requests to selected suppliers
   */
  static async sendQuoteRequests(
    assetId: string,
    supplierIds: string[],
    from?: { name: string; email: string }
  ): Promise<SendQuoteRequestsResponse> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/suppliers/send-quote-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assetId,
          supplierIds,
          from,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to send quote requests');
      }

      return data.data;
    } catch (error) {
      console.error('Error sending quote requests:', error);
      throw error;
    }
  }

  /**
   * Health check for the supplier API
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/suppliers/health`, {
        method: 'GET',
      });

      return response.ok;
    } catch (error) {
      console.error('Supplier API health check failed:', error);
      return false;
    }
  }
}

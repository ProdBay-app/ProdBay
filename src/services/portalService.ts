/**
 * Portal Service
 * Handles communication with the Railway backend for supplier portal
 * Token-based authentication (no Supabase Auth required)
 */

const RAILWAY_API_URL = import.meta.env.VITE_RAILWAY_API_URL || '';

export interface Message {
  id: string;
  quote_id: string;
  sender_type: 'PRODUCER' | 'SUPPLIER';
  content: string;
  created_at: string;
  is_read: boolean;
}

export interface QuoteRequestAttachment {
  id: string;
  quote_id: string;
  filename: string;
  storage_path: string;
  storage_url: string;
  file_size_bytes: number;
  content_type: string;
  created_at: string;
}

export interface Quote {
  id: string;
  supplier_id: string;
  asset_id: string;
  cost: number;
  notes_capacity: string;
  status: 'Pending' | 'Submitted' | 'Accepted' | 'Rejected';
  access_token: string;
  quote_document_url?: string;
  request_email_body?: string;
  request_attachments?: QuoteRequestAttachment[];
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  project_id: string;
  asset_name: string;
  specifications?: string;
  timeline?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  project_name: string;
  client_name: string;
  brief_description: string;
  physical_parameters?: string;
  timeline_deadline?: string;  // Date string
  project_status: string;
  // financial_parameters is NOT included (intentionally excluded)
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  supplier_name: string;
  contact_email: string;
  service_categories: string[];
  created_at: string;
}

export interface PortalSession {
  quote: Quote;
  asset: Asset;
  project: Project;
  supplier: Supplier;
  messages: Message[];
}

export interface PortalSessionResponse {
  success: boolean;
  data?: PortalSession;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

export interface SendMessageResponse {
  success: boolean;
  data?: Message;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

export interface SubmitQuoteResponse {
  success: boolean;
  data?: Quote;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

export class PortalService {
  /**
   * Get portal session data (quote, asset, project, supplier, messages)
   * @param token - Access token (UUID) from URL
   * @returns Promise with portal session data
   */
  static async getSession(token: string): Promise<PortalSessionResponse> {
    if (!RAILWAY_API_URL) {
      return {
        success: false,
        error: {
          code: 'CONFIG_ERROR',
          message: 'Railway API URL not configured. Please set VITE_RAILWAY_API_URL environment variable.'
        }
      };
    }

    if (!token) {
      return {
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Access token is required'
        }
      };
    }

    try {
      const response = await fetch(`${RAILWAY_API_URL.replace(/\/$/, '')}/api/portal/session/${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data: PortalSessionResponse = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.error?.code || 'API_ERROR',
            message: data.error?.message || `HTTP ${response.status}: ${response.statusText}`,
            details: data.error?.details
          }
        };
      }

      return data;
    } catch (error) {
      console.error('Portal service error:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error instanceof Error ? error.stack : undefined
        }
      };
    }
  }

  /**
   * Send a message from supplier via portal
   * @param token - Access token (UUID)
   * @param content - Message content
   * @returns Promise with created message
   */
  static async sendMessage(token: string, content: string): Promise<SendMessageResponse> {
    if (!RAILWAY_API_URL) {
      return {
        success: false,
        error: {
          code: 'CONFIG_ERROR',
          message: 'Railway API URL not configured. Please set VITE_RAILWAY_API_URL environment variable.'
        }
      };
    }

    if (!token || !content) {
      return {
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'Token and content are required'
        }
      };
    }

    try {
      const response = await fetch(`${RAILWAY_API_URL.replace(/\/$/, '')}/api/portal/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          content: content.trim()
        })
      });

      const data: SendMessageResponse = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.error?.code || 'API_ERROR',
            message: data.error?.message || `HTTP ${response.status}: ${response.statusText}`,
            details: data.error?.details
          }
        };
      }

      return data;
    } catch (error) {
      console.error('Portal service error:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error instanceof Error ? error.stack : undefined
        }
      };
    }
  }

  /**
   * Submit quote via portal
   * @param token - Access token (UUID) from URL
   * @param cost - Quote price
   * @param notes - Optional notes/capacity details
   * @param fileUrl - Optional file URL (for future file upload support)
   * @returns Promise with updated quote data
   */
  static async submitQuote(
    token: string,
    cost: number,
    notes: string = '',
    fileUrl?: string
  ): Promise<SubmitQuoteResponse> {
    if (!RAILWAY_API_URL) {
      return {
        success: false,
        error: {
          code: 'CONFIG_ERROR',
          message: 'Railway API URL not configured. Please set VITE_RAILWAY_API_URL environment variable.'
        }
      };
    }

    if (!token || cost === undefined || cost === null) {
      return {
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'Token and cost are required'
        }
      };
    }

    if (typeof cost !== 'number' || cost < 0) {
      return {
        success: false,
        error: {
          code: 'INVALID_COST',
          message: 'Cost must be a non-negative number'
        }
      };
    }

    try {
      const response = await fetch(`${RAILWAY_API_URL.replace(/\/$/, '')}/api/portal/submit-quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          cost,
          notes: notes || '',
          fileUrl: fileUrl || null
        })
      });

      const data: SubmitQuoteResponse = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.error?.code || 'API_ERROR',
            message: data.error?.message || `HTTP ${response.status}: ${response.statusText}`,
            details: data.error?.details
          }
        };
      }

      return data;
    } catch (error) {
      console.error('Portal service error:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error instanceof Error ? error.stack : undefined
        }
      };
    }
  }
}

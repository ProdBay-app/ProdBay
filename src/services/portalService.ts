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
  message_attachments?: MessageAttachment[];
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

export interface MessageAttachment {
  id: string;
  message_id: string;
  quote_id: string;
  sender_type: 'PRODUCER' | 'SUPPLIER';
  filename: string;
  storage_path: string;
  storage_url?: string;
  public_url?: string;
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
  event_date: string | null;
  location: string | null;
  timeline_deadline: string | null;
}

export interface Supplier {
  id: string;
  supplier_name: string;
  service_categories: string[];
  contact_persons: Array<{
    name: string;
    email: string;
    role: string;
    phone?: string;
    is_primary?: boolean;
    isPrimary?: boolean;
  }>;
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

export interface MessageAttachmentsResponse {
  success: boolean;
  data?: MessageAttachment[];
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
  static async sendMessage(
    token: string,
    content: string,
    files: File[] = []
  ): Promise<SendMessageResponse> {
    if (!RAILWAY_API_URL) {
      return {
        success: false,
        error: {
          code: 'CONFIG_ERROR',
          message: 'Railway API URL not configured. Please set VITE_RAILWAY_API_URL environment variable.'
        }
      };
    }

    if (!token || (!content && files.length === 0)) {
      return {
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'Token and content or files are required'
        }
      };
    }

    try {
      const formData = new FormData();
      formData.append('token', token);
      formData.append('sender_type', 'SUPPLIER');
      formData.append('content', content.trim());
      files.forEach((file) => formData.append('files', file));

      const response = await fetch(`${RAILWAY_API_URL.replace(/\/$/, '')}/api/portal/messages`, {
        method: 'POST',
        body: formData
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
   * Get message attachments for portal session
   * @param token - Access token (UUID)
   * @returns Promise with attachments
   */
  static async getMessageAttachments(token: string): Promise<MessageAttachmentsResponse> {
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
      const response = await fetch(
        `${RAILWAY_API_URL.replace(/\/$/, '')}/api/portal/message-attachments?token=${encodeURIComponent(token)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const data: MessageAttachmentsResponse = await response.json();

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

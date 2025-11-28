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

export interface Quote {
  id: string;
  supplier_id: string;
  asset_id: string;
  cost: number;
  notes_capacity: string;
  status: 'Pending' | 'Submitted' | 'Accepted' | 'Rejected';
  access_token: string;
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
  financial_parameters?: number;
  timeline_deadline?: string;
  project_status: string;
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
}

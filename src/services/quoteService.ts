/**
 * Quote Service
 * Handles communication with the Railway backend for quote-related operations
 * Includes message fetching and sending for producer chat interface
 */

import { getSyncSupabase } from '@/lib/supabase';

const RAILWAY_API_URL = import.meta.env.VITE_RAILWAY_API_URL || '';

export interface Message {
  id: string;
  quote_id: string;
  sender_type: 'PRODUCER' | 'SUPPLIER';
  content: string;
  created_at: string;
  is_read: boolean;
  // Optional: For synthetic "initial request" messages only
  attachments?: QuoteRequestAttachment[];
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

export interface Supplier {
  id: string;
  supplier_name: string;
  contact_email: string;
  service_categories: string[];
  created_at: string;
}

export interface QuoteMessagesResponse {
  success: boolean;
  data?: {
    quote: Quote;
    asset: Asset;
    project?: any;
    supplier: Supplier;
    messages: Message[];
  };
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

/**
 * Get JWT token from Supabase session
 * Uses the synchronous client for immediate access to the session
 */
async function getAuthToken(): Promise<string | null> {
  try {
    // Use synchronous client for immediate access
    const supabase = getSyncSupabase();
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      return null;
    }
    
    if (session?.access_token) {
      return session.access_token;
    }
    
    // If no session, the user might not be authenticated
    console.warn('No active session found. User may need to log in.');
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

export class QuoteService {
  /**
   * Get all messages for a specific quote
   * @param quoteId - Quote ID
   * @returns Promise with quote data and messages
   */
  static async getQuoteMessages(quoteId: string): Promise<QuoteMessagesResponse> {
    if (!RAILWAY_API_URL) {
      return {
        success: false,
        error: {
          code: 'CONFIG_ERROR',
          message: 'Railway API URL not configured. Please set VITE_RAILWAY_API_URL environment variable.'
        }
      };
    }

    if (!quoteId) {
      return {
        success: false,
        error: {
          code: 'MISSING_QUOTE_ID',
          message: 'Quote ID is required'
        }
      };
    }

    try {
      const token = await getAuthToken();
      if (!token) {
        return {
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: 'Authentication required. Please log in.'
          }
        };
      }

      const response = await fetch(`${RAILWAY_API_URL.replace(/\/$/, '')}/api/quotes/${quoteId}/messages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data: QuoteMessagesResponse = await response.json();

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
      console.error('Quote service error:', error);
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
   * Send a message from producer
   * @param quoteId - Quote ID
   * @param content - Message content
   * @returns Promise with created message
   */
  static async sendProducerMessage(quoteId: string, content: string): Promise<SendMessageResponse> {
    if (!RAILWAY_API_URL) {
      return {
        success: false,
        error: {
          code: 'CONFIG_ERROR',
          message: 'Railway API URL not configured. Please set VITE_RAILWAY_API_URL environment variable.'
        }
      };
    }

    if (!quoteId || !content) {
      return {
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'Quote ID and content are required'
        }
      };
    }

    try {
      const token = await getAuthToken();
      if (!token) {
        return {
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: 'Authentication required. Please log in.'
          }
        };
      }

      const response = await fetch(`${RAILWAY_API_URL.replace(/\/$/, '')}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          quoteId,
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
      console.error('Quote service error:', error);
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


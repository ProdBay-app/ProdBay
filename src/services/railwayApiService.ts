/**
 * Railway API Service
 * Handles communication with the Railway backend for brief processing
 */

import type { Asset } from '@/lib/supabase';

const RAILWAY_API_URL = import.meta.env.VITE_RAILWAY_API_URL || '';

export interface ProjectContext {
  financial_parameters?: number;
  timeline_deadline?: string;
  physical_parameters?: string;
}

export interface ProcessBriefRequest {
  projectId: string;
  briefDescription: string;
  useAI?: boolean; // Legacy parameter for backward compatibility
  allocationMethod?: 'static' | 'ai'; // New enum-based parameter
  projectContext?: ProjectContext;
}

export interface ProcessBriefResponse {
  success: boolean;
  data?: {
    projectId: string;
    identifiedAssets: string[];
    createdAssets: Asset[];
    processingTime: number;
    allocationMethod?: 'static' | 'ai';
    aiData?: {
      reasoning: string;
      confidence: number;
      aiAssets: Asset[];
    };
  };
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

export class RailwayApiService {
  /**
   * Process a project brief using the Railway backend
   * @param projectId - UUID of the project
   * @param briefDescription - The project brief text
   * @param options - Processing options including AI settings
   * @returns Promise with the processing result
   */
  static async processBrief(
    projectId: string, 
    briefDescription: string, 
    options: { useAI?: boolean; allocationMethod?: 'static' | 'ai'; projectContext?: ProjectContext } = {}
  ): Promise<ProcessBriefResponse> {
    if (!RAILWAY_API_URL) {
      throw new Error('Railway API URL not configured. Please set VITE_RAILWAY_API_URL environment variable.');
    }

    try {
      const response = await fetch(`${RAILWAY_API_URL.replace(/\/$/, '')}/api/process-brief`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          briefDescription,
          useAI: options.useAI || false, // Legacy parameter
          allocationMethod: options.allocationMethod, // New parameter
          projectContext: options.projectContext || {}
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('Railway API error:', error);
      
      // Return a structured error response
      return {
        success: false,
        error: {
          code: 'API_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error instanceof Error ? error.stack : undefined
        }
      };
    }
  }

  /**
   * Check if the Railway API is healthy
   * @returns Promise with health status
   */
  static async checkHealth(): Promise<{ success: boolean; message?: string }> {
    if (!RAILWAY_API_URL) {
      return {
        success: false,
        message: 'Railway API URL not configured'
      };
    }

    try {
      const response = await fetch(`${RAILWAY_API_URL.replace(/\/$/, '')}/api/health`);
      const data = await response.json();
      
      return {
        success: response.ok && data.success,
        message: data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Health check failed'
      };
    }
  }

  /**
   * Generic POST method for Railway API endpoints
   * @param endpoint - API endpoint path (e.g., '/api/suppliers/send-quote-requests')
   * @param body - Request body to send
   * @returns Promise with success status, data, message, or error (matches backend response format)
   */
  static async post<T = any>(
    endpoint: string,
    body?: any
  ): Promise<{ success: boolean; data?: T; message?: string; error?: { code: string; message: string } }> {
    if (!RAILWAY_API_URL) {
      return {
        success: false,
        error: {
          code: 'CONFIG_ERROR',
          message: 'Railway API URL not configured. Please set VITE_RAILWAY_API_URL environment variable.'
        }
      };
    }

    try {
      const response = await fetch(`${RAILWAY_API_URL.replace(/\/$/, '')}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        // Backend returns error in format: { success: false, error: { code, message } }
        return {
          success: false,
          error: data.error || {
            code: 'API_ERROR',
            message: data.error?.message || `HTTP ${response.status}: ${response.statusText}`
          }
        };
      }

      // Backend returns success in format: { success: true, data: {...}, message: "..." }
      // Return the full response object to match expected interface
      return data;
    } catch (error) {
      console.error('Railway API POST error:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      };
    }
  }
}

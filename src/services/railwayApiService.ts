/**
 * Railway API Service
 * Handles communication with the Railway backend for brief processing
 */

const RAILWAY_API_URL = import.meta.env.VITE_RAILWAY_API_URL || '';

export interface ProcessBriefRequest {
  projectId: string;
  briefDescription: string;
}

export interface ProcessBriefResponse {
  success: boolean;
  data?: {
    projectId: string;
    identifiedAssets: string[];
    createdAssets: any[];
    processingTime: number;
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
   * @returns Promise with the processing result
   */
  static async processBrief(projectId: string, briefDescription: string): Promise<ProcessBriefResponse> {
    if (!RAILWAY_API_URL) {
      throw new Error('Railway API URL not configured. Please set VITE_RAILWAY_API_URL environment variable.');
    }

    try {
      const response = await fetch(`${RAILWAY_API_URL}/api/process-brief`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          briefDescription
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
      const response = await fetch(`${RAILWAY_API_URL}/api/health`);
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
}

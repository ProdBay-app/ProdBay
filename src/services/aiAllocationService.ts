/**
 * AI Allocation Service
 * Handles communication with Railway backend for AI-powered allocation features
 */

const RAILWAY_API_URL = import.meta.env.VITE_RAILWAY_API_URL || '';

export interface AIAssetSuggestion {
  asset_name: string;
  specifications: string;
  priority: 'high' | 'medium' | 'low';
  estimated_cost_range: 'low' | 'medium' | 'high';
}

export interface AISupplierAllocation {
  asset_name: string;
  recommended_supplier_id: string;
  recommended_supplier_name: string;
  confidence: number;
  reasoning: string;
}

export interface AIAllocationResponse {
  success: boolean;
  data?: {
    assets?: AIAssetSuggestion[];
    allocations?: AISupplierAllocation[];
    reasoning?: string;
    confidence?: number;
    processingTime?: number;
  };
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: string;
    fallbackData?: any;
  };
}

export interface ProjectContext {
  financial_parameters?: number;
  timeline_deadline?: string;
  physical_parameters?: string;
}

export class AIAllocationService {
  /**
   * Analyze brief and suggest assets using AI
   * @param briefDescription - The project brief text
   * @param projectContext - Additional project context
   * @returns Promise with AI asset suggestions
   */
  static async analyzeBriefForAssets(
    briefDescription: string, 
    projectContext: ProjectContext = {}
  ): Promise<AIAllocationResponse> {
    if (!RAILWAY_API_URL) {
      throw new Error('Railway API URL not configured. Please set VITE_RAILWAY_API_URL environment variable.');
    }

    try {
      const response = await fetch(`${RAILWAY_API_URL}/api/ai-allocate-assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          briefDescription,
          projectContext
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('AI asset analysis error:', error);
      
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
   * Suggest suppliers for assets using AI
   * @param assets - Array of asset objects
   * @param projectId - Project ID for context
   * @returns Promise with AI supplier suggestions
   */
  static async suggestSuppliersForAssets(
    assets: any[], 
    projectId: string
  ): Promise<AIAllocationResponse> {
    if (!RAILWAY_API_URL) {
      throw new Error('Railway API URL not configured. Please set VITE_RAILWAY_API_URL environment variable.');
    }

    try {
      const response = await fetch(`${RAILWAY_API_URL}/api/ai-suggest-suppliers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assets,
          projectId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('AI supplier suggestion error:', error);
      
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
   * Perform complete AI allocation for a project
   * @param projectId - Project ID
   * @param briefDescription - Project brief
   * @param projectContext - Additional context
   * @returns Promise with complete AI allocation result
   */
  static async performCompleteAllocation(
    projectId: string,
    briefDescription: string,
    projectContext: ProjectContext = {}
  ): Promise<AIAllocationResponse> {
    if (!RAILWAY_API_URL) {
      throw new Error('Railway API URL not configured. Please set VITE_RAILWAY_API_URL environment variable.');
    }

    try {
      const response = await fetch(`${RAILWAY_API_URL}/api/ai-allocate-project`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          briefDescription,
          projectContext
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('AI complete allocation error:', error);
      
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
   * Create assets in database based on AI analysis
   * @param projectId - Project ID
   * @param assets - Array of AI-suggested assets
   * @returns Promise with creation result
   */
  static async createAssetsFromAI(
    projectId: string,
    assets: AIAssetSuggestion[]
  ): Promise<AIAllocationResponse> {
    if (!RAILWAY_API_URL) {
      throw new Error('Railway API URL not configured. Please set VITE_RAILWAY_API_URL environment variable.');
    }

    try {
      const response = await fetch(`${RAILWAY_API_URL}/api/ai-create-assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          assets
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('AI asset creation error:', error);
      
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
   * Check if AI service is healthy
   * @returns Promise with health status
   */
  static async checkAIHealth(): Promise<{ success: boolean; message?: string; data?: any }> {
    if (!RAILWAY_API_URL) {
      return {
        success: false,
        message: 'Railway API URL not configured'
      };
    }

    try {
      const response = await fetch(`${RAILWAY_API_URL}/api/ai-health`);
      const data = await response.json();
      
      return {
        success: response.ok && data.success,
        message: data.message,
        data: data.data
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'AI health check failed'
      };
    }
  }
}

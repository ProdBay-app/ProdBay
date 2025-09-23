/**
 * Quote Comparison Service
 * Handles communication with Railway backend for quote comparison features
 */

const RAILWAY_API_URL = import.meta.env.VITE_RAILWAY_API_URL || '';

export interface CostBreakdown {
  labor: number;
  materials: number;
  equipment: number;
  other: number;
}

export interface Supplier {
  id: string;
  supplier_name: string;
  contact_email: string;
  service_categories: string[];
}

export interface Quote {
  id: string;
  cost: number;
  cost_breakdown: CostBreakdown;
  notes_capacity: string;
  status: 'Submitted' | 'Accepted' | 'Rejected';
  valid_until: string;
  response_time_hours: number;
  created_at: string;
  cost_rank: number;
  cost_percentage_of_lowest: number;
  supplier: Supplier;
}

export interface Asset {
  id: string;
  name: string;
  specifications: string;
  timeline: string;
  status: string;
  project: {
    id: string;
    project_name: string;
    client_name: string;
  };
}

export interface ComparisonMetrics {
  lowest_cost: number;
  highest_cost: number;
  average_cost: number;
  quote_count: number;
  cost_range: number;
}

export interface QuoteComparisonResponse {
  success: boolean;
  data?: {
    asset: Asset;
    quotes: Quote[];
    comparison_metrics: ComparisonMetrics;
  };
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

export interface QuoteSummaryResponse {
  success: boolean;
  data?: {
    quote_count: number;
    lowest_cost: number;
    highest_cost: number;
    average_cost: number;
    status_counts: Record<string, number>;
    has_multiple_quotes: boolean;
  };
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

export class QuoteComparisonService {
  /**
   * Get detailed quote comparison data for an asset
   * @param assetId - The asset ID to get quotes for
   * @returns Promise with quote comparison data
   */
  static async getQuoteComparison(assetId: string): Promise<QuoteComparisonResponse> {
    if (!RAILWAY_API_URL) {
      throw new Error('Railway API URL not configured. Please set VITE_RAILWAY_API_URL environment variable.');
    }

    try {
      const response = await fetch(`${RAILWAY_API_URL.replace(/\/$/, '')}/api/quotes/compare/${assetId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('Quote comparison error:', error);
      
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
   * Get quick quote summary for an asset (for dashboard display)
   * @param assetId - The asset ID to get summary for
   * @returns Promise with quote summary data
   */
  static async getQuoteSummary(assetId: string): Promise<QuoteSummaryResponse> {
    if (!RAILWAY_API_URL) {
      throw new Error('Railway API URL not configured. Please set VITE_RAILWAY_API_URL environment variable.');
    }

    try {
      const response = await fetch(`${RAILWAY_API_URL.replace(/\/$/, '')}/api/quotes/compare/${assetId}/summary`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('Quote summary error:', error);
      
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
   * Format cost breakdown for display
   * @param breakdown - Cost breakdown object
   * @returns Formatted breakdown string
   */
  static formatCostBreakdown(breakdown: CostBreakdown): string {
    const parts = [];
    if (breakdown.labor > 0) parts.push(`Labor: $${breakdown.labor.toFixed(2)}`);
    if (breakdown.materials > 0) parts.push(`Materials: $${breakdown.materials.toFixed(2)}`);
    if (breakdown.equipment > 0) parts.push(`Equipment: $${breakdown.equipment.toFixed(2)}`);
    if (breakdown.other > 0) parts.push(`Other: $${breakdown.other.toFixed(2)}`);
    return parts.join(' • ');
  }

  /**
   * Format response time for display
   * @param hours - Response time in hours
   * @returns Formatted time string
   */
  static formatResponseTime(hours: number): string {
    if (hours < 24) {
      return `${hours}h`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    }
  }

  /**
   * Format validity period for display
   * @param validUntil - Valid until date string
   * @returns Formatted validity string
   */
  static formatValidityPeriod(validUntil: string): string {
    const validDate = new Date(validUntil);
    const now = new Date();
    const diffTime = validDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'Expired';
    } else if (diffDays === 0) {
      return 'Expires today';
    } else if (diffDays === 1) {
      return 'Expires tomorrow';
    } else {
      return `${diffDays} days left`;
    }
  }

  /**
   * Get status color for quote status
   * @param status - Quote status
   * @returns Tailwind color class
   */
  static getStatusColor(status: string): string {
    switch (status) {
      case 'Accepted':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'Submitted':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}

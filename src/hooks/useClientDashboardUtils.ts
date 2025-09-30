import type { Quote } from '../lib/supabase';
import { 
  getStatusIconProps, 
  getStatusColor, 
  calculateTotalCost, 
  getProgressPercentage, 
  getAcceptedQuoteForAsset 
} from '../utils';

/**
 * Utility functions for client dashboard components
 * This hook provides only the utility functions without data fetching
 */
export const useClientDashboardUtils = () => {

  return {
    getStatusIconProps,
    getStatusColor,
    getAcceptedQuoteForAsset,
    calculateTotalCost,
    getProgressPercentage
  };
};

import type { Quote } from '../lib/supabase';

/**
 * Utility functions for client dashboard components
 * This hook provides only the utility functions without data fetching
 */
export const useClientDashboardUtils = () => {
  // Status utility functions
  const getStatusIconProps = (status: string): { icon: string; className: string } => {
    switch (status) {
      case 'Completed':
      case 'Delivered':
      case 'Approved':
        return { icon: 'CheckCircle', className: 'h-5 w-5 text-green-500' };
      case 'In Progress':
      case 'In Production':
      case 'Quoting':
        return { icon: 'Clock', className: 'h-5 w-5 text-yellow-500' };
      case 'Cancelled':
        return { icon: 'XCircle', className: 'h-5 w-5 text-red-500' };
      default:
        return { icon: 'AlertCircle', className: 'h-5 w-5 text-gray-500' };
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Completed':
      case 'Delivered':
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
      case 'In Production':
      case 'Quoting':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to get accepted quote for a specific asset
  const getAcceptedQuoteForAsset = (quotes: Quote[], assetId: string): Quote | undefined => {
    return quotes.find(q => q.asset_id === assetId && q.status === 'Accepted');
  };

  // Business calculations
  const calculateTotalCost = (quotes: Quote[]): number => {
    return quotes
      .filter(quote => quote.status === 'Accepted')
      .reduce((total, quote) => total + (quote.cost || 0), 0);
  };

  const getProgressPercentage = (assets: any[]): number => {
    if (assets.length === 0) return 0;
    const completedAssets = assets.filter(asset => asset.status === 'Delivered').length;
    return Math.round((completedAssets / assets.length) * 100);
  };

  return {
    getStatusIconProps,
    getStatusColor,
    getAcceptedQuoteForAsset,
    calculateTotalCost,
    getProgressPercentage
  };
};

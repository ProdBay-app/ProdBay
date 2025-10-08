import type { Quote, Asset } from '@/lib/supabase';

/**
 * Centralized business calculation utilities
 * Provides consistent calculation logic across the application
 */

/**
 * Calculate total cost from accepted quotes
 */
export const calculateTotalCost = (quotes: Quote[]): number => {
  return quotes
    .filter(quote => quote.status === 'Accepted')
    .reduce((total, quote) => total + (quote.cost || 0), 0);
};

/**
 * Calculate progress percentage based on completed assets
 */
export const getProgressPercentage = (assets: Asset[]): number => {
  if (assets.length === 0) return 0;
  const completedAssets = assets.filter(asset => asset.status === 'Delivered').length;
  return Math.round((completedAssets / assets.length) * 100);
};

/**
 * Get accepted quote for a specific asset
 */
export const getAcceptedQuoteForAsset = (quotes: Quote[], assetId: string): Quote | undefined => {
  return quotes.find(q => q.asset_id === assetId && q.status === 'Accepted');
};

/**
 * Calculate project statistics
 */
export const calculateProjectStats = (assets: Asset[], quotes: Quote[]) => {
  const totalAssets = assets.length;
  const completedAssets = assets.filter(asset => asset.status === 'Delivered').length;
  const inProgressAssets = assets.filter(asset => 
    asset.status === 'In Production' || asset.status === 'Approved'
  ).length;
  const pendingAssets = assets.filter(asset => 
    asset.status === 'Pending' || asset.status === 'Quoting'
  ).length;

  const totalCost = calculateTotalCost(quotes);
  const progressPercentage = getProgressPercentage(assets);

  return {
    totalAssets,
    completedAssets,
    inProgressAssets,
    pendingAssets,
    totalCost,
    progressPercentage
  };
};

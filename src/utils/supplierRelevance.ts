/**
 * Supplier Relevance Sorting Utility
 * 
 * Maps granular asset tags to broad supplier service categories
 * and provides functions to calculate relevance scores for supplier sorting.
 * 
 * This enables relevance-based sorting in the RFQ workflow, where suppliers
 * with matching service categories appear first in the selection list.
 */

import type { Supplier } from '@/lib/supabase';

/**
 * Maps granular asset tags to broad supplier service categories
 * 
 * Many-to-many relationship: one asset tag can map to multiple categories
 * Empty arrays indicate tags that don't directly map to supplier categories
 * (e.g., staffing tags that don't have corresponding supplier categories)
 * 
 * Supplier Categories Available:
 * 'Printing', 'Graphics', 'Banners', 'Staging', 'Audio', 'Lighting',
 * 'Catering', 'Food', 'Beverages', 'Design', 'Branding', 'Marketing',
 * 'Transport', 'Logistics', 'Delivery', 'Photography', 'Video', 'Security'
 */
export const ASSET_TAG_TO_SUPPLIER_CATEGORY_MAP: Record<string, string[]> = {
  // AUDIO & SOUND (7 tags)
  'Audio Equipment': ['Audio'],
  'Microphones': ['Audio'],
  'Sound Reinforcement': ['Audio'],
  'Audio Recording': ['Audio'],
  'Wireless Systems': ['Audio'],
  'Audio Visual': ['Audio', 'Video'], // Multi-category: both audio and video
  'Backstage Audio': ['Audio'],

  // VISUAL & DISPLAYS (8 tags)
  'LED Screens': ['Graphics', 'Video'], // Multi-category: graphics and video
  'Projection': ['Graphics', 'Video'], // Multi-category: graphics and video
  'Video Production': ['Video'],
  'Photography': ['Photography'],
  'Graphics & Banners': ['Graphics', 'Banners'], // Multi-category: graphics and banners
  'Signage': ['Graphics', 'Banners'], // Multi-category: graphics and banners
  'Digital Displays': ['Graphics', 'Video'], // Multi-category: graphics and video
  'Exhibition Displays': ['Graphics', 'Banners'], // Multi-category: graphics and banners

  // LIGHTING (6 tags)
  'Stage Lighting': ['Lighting'],
  'Atmospheric Lighting': ['Lighting'],
  'LED Lighting': ['Lighting'],
  'Special Effects': ['Lighting'],
  'Power & Distribution': ['Lighting'],
  'Lighting Design': ['Lighting', 'Design'], // Multi-category: lighting and design

  // STAGING & STRUCTURES (5 tags)
  'Stages': ['Staging'],
  'Rigging': ['Staging'],
  'Scenic Elements': ['Staging', 'Design'], // Multi-category: staging and design
  'Platforms & Risers': ['Staging'],
  'Tents & Structures': ['Staging'],

  // CATERING & FOOD SERVICE (4 tags)
  'Catering': ['Catering', 'Food'], // Multi-category: catering and food
  'Beverages': ['Beverages'],
  'Tableware': ['Food', 'Catering'], // Multi-category: food and catering
  'Food Stations': ['Food', 'Catering'], // Multi-category: food and catering

  // STAFFING & SERVICES (5 tags)
  // Note: Most staffing tags don't map to supplier categories
  // as suppliers typically don't provide staffing services directly
  'Event Staff': [], // No direct supplier category
  'Security': ['Security'],
  'Hospitality': [], // No direct supplier category
  'Technical Staff': [], // No direct supplier category
  'Medical Services': [], // No direct supplier category

  // LOGISTICS & OPERATIONS (5 tags)
  'Transportation': ['Transport', 'Logistics'], // Multi-category: transport and logistics
  'Loading & Setup': ['Logistics', 'Delivery'], // Multi-category: logistics and delivery
  'Storage': ['Logistics'],
  'Permits & Licenses': [], // No direct supplier category (legal/administrative)
  'Waste Management': ['Logistics'],

  // BRANDING & MARKETING (4 tags)
  'Branding': ['Branding', 'Design'], // Multi-category: branding and design
  'Print Materials': ['Printing', 'Graphics'], // Multi-category: printing and graphics
  'Promotional Items': ['Marketing', 'Branding'], // Multi-category: marketing and branding
  'Social Media': ['Marketing'],

  // DECOR & FLORAL (4 tags)
  'Floral': [], // No direct supplier category (could add 'Floral' category later)
  'Decor': ['Design'],
  'Furniture': [], // No direct supplier category (could add 'Furniture' category later)
  'Linens & Draping': ['Design'],

  // DIGITAL & TECHNOLOGY (2 tags)
  'Digital Assets': ['Design', 'Marketing'], // Multi-category: design and marketing
  'Technology Infrastructure': [] // No direct supplier category (IT services)
};

/**
 * Maps asset tags to relevant supplier categories
 * 
 * @param assetTags - Array of asset tag names
 * @returns Set of supplier categories that match the asset tags
 */
export const mapAssetTagsToSupplierCategories = (assetTags: string[]): Set<string> => {
  const relevantCategories = new Set<string>();
  
  assetTags.forEach(tag => {
    const categories = ASSET_TAG_TO_SUPPLIER_CATEGORY_MAP[tag] || [];
    categories.forEach(category => relevantCategories.add(category));
  });
  
  return relevantCategories;
};

/**
 * Calculates relevance score for a supplier based on matching categories
 * 
 * @param supplier - Supplier to score
 * @param relevantCategories - Set of supplier categories that are relevant to the asset
 * @returns Relevance score (number of matching categories, 0 if no matches)
 */
export const calculateSupplierRelevanceScore = (
  supplier: Supplier,
  relevantCategories: Set<string>
): number => {
  if (!supplier.service_categories || supplier.service_categories.length === 0) {
    return 0;
  }
  
  let score = 0;
  supplier.service_categories.forEach(category => {
    if (relevantCategories.has(category)) {
      score += 1; // +1 point per matching category
    }
  });
  
  return score;
};

/**
 * Gets the specific categories that matched for a supplier
 * 
 * @param supplier - Supplier to check
 * @param assetTags - Asset tags to match against
 * @returns Array of matching category names (empty if no matches)
 */
export const getMatchingCategories = (
  supplier: Supplier,
  assetTags: string[]
): string[] => {
  // Handle edge cases
  if (!supplier || !assetTags || assetTags.length === 0) {
    return [];
  }
  
  if (!supplier.service_categories || supplier.service_categories.length === 0) {
    return [];
  }
  
  // Map asset tags to relevant supplier categories
  const relevantCategories = mapAssetTagsToSupplierCategories(assetTags);
  
  // If no relevant categories found, return empty array
  if (relevantCategories.size === 0) {
    return [];
  }
  
  // Filter supplier's categories to only include matching ones
  return supplier.service_categories.filter(category => 
    relevantCategories.has(category)
  );
};

/**
 * Gets relevance metadata for a supplier
 * 
 * @param supplier - Supplier to analyze
 * @param assetTags - Asset tags to match against
 * @returns Object with score and matching categories
 */
export const getSupplierRelevanceMetadata = (
  supplier: Supplier,
  assetTags: string[]
): { score: number; matchingCategories: string[] } => {
  // Handle edge cases
  if (!supplier || !assetTags || assetTags.length === 0) {
    return { score: 0, matchingCategories: [] };
  }
  
  // Map asset tags to relevant supplier categories
  const relevantCategories = mapAssetTagsToSupplierCategories(assetTags);
  
  // If no relevant categories found, return zero score
  if (relevantCategories.size === 0) {
    return { score: 0, matchingCategories: [] };
  }
  
  // Calculate score
  const score = calculateSupplierRelevanceScore(supplier, relevantCategories);
  
  // Get matching categories
  const matchingCategories = getMatchingCategories(supplier, assetTags);
  
  return { score, matchingCategories };
};

/**
 * Sorts suppliers by relevance to asset tags
 * 
 * Primary sort: High relevance score → Low relevance score
 * Secondary sort: Alphabetical by supplier_name (for ties)
 * 
 * @param suppliers - Array of suppliers to sort
 * @param assetTags - Array of asset tag names
 * @returns Sorted array of suppliers (most relevant first)
 */
export const sortSuppliersByRelevance = (
  suppliers: Supplier[],
  assetTags: string[]
): Supplier[] => {
  // If no asset tags, return suppliers sorted alphabetically (fallback)
  if (!assetTags || assetTags.length === 0) {
    return [...suppliers].sort((a, b) => 
      a.supplier_name.localeCompare(b.supplier_name)
    );
  }
  
  // Map asset tags to relevant supplier categories
  const relevantCategories = mapAssetTagsToSupplierCategories(assetTags);
  
  // If no relevant categories found, return alphabetical sort
  if (relevantCategories.size === 0) {
    return [...suppliers].sort((a, b) => 
      a.supplier_name.localeCompare(b.supplier_name)
    );
  }
  
  // Create a copy to avoid mutating the original array
  const sortedSuppliers = [...suppliers];
  
  // Sort by relevance score (high → low), then alphabetically
  sortedSuppliers.sort((a, b) => {
    const scoreA = calculateSupplierRelevanceScore(a, relevantCategories);
    const scoreB = calculateSupplierRelevanceScore(b, relevantCategories);
    
    // Primary sort: High score → Low score
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    
    // Secondary sort: Alphabetical (for ties)
    return a.supplier_name.localeCompare(b.supplier_name);
  });
  
  return sortedSuppliers;
};

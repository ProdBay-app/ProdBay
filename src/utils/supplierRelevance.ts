/**
 * Supplier Relevance Sorting Utility
 * 
 * Maps granular asset tags to broad supplier service categories
 * and provides functions to calculate relevance scores for supplier sorting.
 * 
 * This enables relevance-based sorting in the RFQ workflow, where suppliers
 * with matching service categories appear first in the selection list.
 * 
 * Asset tag names: single source of truth in config/assetTagNames.json
 * Map keys below must match tag names from that config.
 */

import type { Supplier } from '@/lib/supabase';
import { ASSET_TAG_NAMES } from './assetTags';

/**
 * Maps asset tags (from config/assetTagNames.json) to broad supplier service categories
 * Keys must match tag names in config. When adding a new tag to config, add its mapping here.
 *
 * Supplier Categories: 'Printing', 'Graphics', 'Banners', 'Staging', 'Audio', 'Lighting',
 * 'Catering', 'Food', 'Beverages', 'Design', 'Branding', 'Marketing', 'Transport',
 * 'Logistics', 'Delivery', 'Photography', 'Video', 'Security', 'Staffing', 'Hospitality',
 * 'Technical Services', 'Medical', 'Floral', 'Furniture', 'IT Services'
 */
export const ASSET_TAG_TO_SUPPLIER_CATEGORY_MAP: Record<string, string[]> = {
  'Audio': ['Audio'],
  'Video & Display': ['Graphics', 'Video'],
  'Photography': ['Photography'],
  'Graphics & Signage': ['Printing', 'Graphics', 'Banners'],
  'Lighting': ['Lighting'],
  'Staging': ['Staging'],
  'Catering': ['Catering', 'Food', 'Beverages'],
  'Staffing': ['Staffing', 'Security', 'Hospitality', 'Technical Services'],
  'Logistics': ['Transport', 'Logistics', 'Delivery'],
  'Branding & Marketing': ['Design', 'Branding', 'Marketing', 'Printing'],
  'Floral & Decor': ['Floral', 'Design'],
  'Furniture': ['Furniture'],
  'Technology': ['IT Services', 'Design', 'Marketing'],
  'Medical': ['Medical'],
  'Scenic & Props': ['Staging', 'Design']
};

/**
 * Validates that ASSET_TAG_TO_SUPPLIER_CATEGORY_MAP has an entry for every tag in config.
 * Call in tests or dev to catch drift when adding new tags to config.
 */
export const validateAssetTagMapKeys = (): { valid: boolean; missing: string[] } => {
  const missing = ASSET_TAG_NAMES.filter(name => !(name in ASSET_TAG_TO_SUPPLIER_CATEGORY_MAP));
  return { valid: missing.length === 0, missing };
};

/**
 * Legacy tag mappings for backward compatibility with existing assets
 * Old 50-tag taxonomy → supplier categories (same logic as consolidated tags)
 */
const LEGACY_TAG_TO_SUPPLIER_CATEGORY_MAP: Record<string, string[]> = {
  'Audio Equipment': ['Audio'], 'Microphones': ['Audio'], 'Sound Reinforcement': ['Audio'],
  'Audio Recording': ['Audio'], 'Wireless Systems': ['Audio'], 'Audio Visual': ['Audio', 'Video'],
  'Backstage Audio': ['Audio'],
  'LED Screens': ['Graphics', 'Video'], 'Projection': ['Graphics', 'Video'],
  'Video Production': ['Video'], 'Photography': ['Photography'],
  'Graphics & Banners': ['Graphics', 'Banners'], 'Signage': ['Graphics', 'Banners'],
  'Digital Displays': ['Graphics', 'Video'], 'Exhibition Displays': ['Graphics', 'Banners'],
  'Stage Lighting': ['Lighting'], 'Atmospheric Lighting': ['Lighting'], 'LED Lighting': ['Lighting'],
  'Special Effects': ['Lighting'], 'Power & Distribution': ['Lighting'], 'Lighting Design': ['Lighting', 'Design'],
  'Stages': ['Staging'], 'Rigging': ['Staging'], 'Scenic Elements': ['Staging', 'Design'],
  'Platforms & Risers': ['Staging'], 'Tents & Structures': ['Staging'],
  'Catering': ['Catering', 'Food'], 'Beverages': ['Beverages'], 'Tableware': ['Food', 'Catering'],
  'Food Stations': ['Food', 'Catering'],
  'Event Staff': ['Staffing'], 'Security': ['Security'], 'Hospitality': ['Hospitality'],
  'Technical Staff': ['Technical Services'], 'Medical Services': ['Medical'],
  'Transportation': ['Transport', 'Logistics'], 'Loading & Setup': ['Logistics', 'Delivery'],
  'Storage': ['Logistics'], 'Waste Management': ['Logistics'],
  'Branding': ['Branding', 'Design'], 'Print Materials': ['Printing', 'Graphics'],
  'Promotional Items': ['Marketing', 'Branding'], 'Social Media': ['Marketing'],
  'Floral': ['Floral'], 'Decor': ['Design'], 'Furniture': ['Furniture'], 'Linens & Draping': ['Design'],
  'Digital Assets': ['Design', 'Marketing'], 'Technology Infrastructure': ['IT Services']
  // Permits & Licenses: intentionally omitted (legal/administrative)
};

/**
 * Maps asset tags to relevant supplier categories
 * Checks both current and legacy tag maps for backward compatibility
 *
 * @param assetTags - Array of asset tag names
 * @returns Set of supplier categories that match the asset tags
 */
export const mapAssetTagsToSupplierCategories = (assetTags: string[]): Set<string> => {
  const relevantCategories = new Set<string>();

  assetTags.forEach(tag => {
    const categories =
      ASSET_TAG_TO_SUPPLIER_CATEGORY_MAP[tag] ?? LEGACY_TAG_TO_SUPPLIER_CATEGORY_MAP[tag] ?? [];
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

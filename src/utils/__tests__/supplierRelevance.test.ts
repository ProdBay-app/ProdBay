/**
 * Unit tests for supplier relevance sorting utility
 */

import {
  ASSET_TAG_TO_SUPPLIER_CATEGORY_MAP,
  mapAssetTagsToSupplierCategories,
  calculateSupplierRelevanceScore,
  sortSuppliersByRelevance,
  getMatchingCategories
} from '../supplierRelevance';
import type { Supplier } from '@/lib/supabase';

describe('supplierRelevance', () => {
  describe('ASSET_TAG_TO_SUPPLIER_CATEGORY_MAP', () => {
    it('should map Audio tag to Audio category', () => {
      expect(ASSET_TAG_TO_SUPPLIER_CATEGORY_MAP['Audio']).toEqual(['Audio']);
    });

    it('should map multi-category tags correctly', () => {
      expect(ASSET_TAG_TO_SUPPLIER_CATEGORY_MAP['Video & Display']).toEqual(['Graphics', 'Video']);
      expect(ASSET_TAG_TO_SUPPLIER_CATEGORY_MAP['Graphics & Signage']).toEqual(['Printing', 'Graphics', 'Banners']);
    });

    it('should map staff and service tags correctly', () => {
      expect(ASSET_TAG_TO_SUPPLIER_CATEGORY_MAP['Staffing']).toEqual(['Staffing', 'Security', 'Hospitality', 'Technical Services']);
      expect(ASSET_TAG_TO_SUPPLIER_CATEGORY_MAP['Floral & Decor']).toEqual(['Floral', 'Design']);
      expect(ASSET_TAG_TO_SUPPLIER_CATEGORY_MAP['Furniture']).toEqual(['Furniture']);
      expect(ASSET_TAG_TO_SUPPLIER_CATEGORY_MAP['Medical']).toEqual(['Medical']);
      expect(ASSET_TAG_TO_SUPPLIER_CATEGORY_MAP['Technology']).toEqual(['IT Services', 'Design', 'Marketing']);
    });
  });

  describe('mapAssetTagsToSupplierCategories', () => {
    it('should map single tag to categories', () => {
      const categories = mapAssetTagsToSupplierCategories(['Audio']);
      expect(Array.from(categories)).toEqual(['Audio']);
    });

    it('should map multiple tags and deduplicate categories', () => {
      const categories = mapAssetTagsToSupplierCategories(['Audio', 'Lighting', 'Staging']);
      const categoryArray = Array.from(categories).sort();
      expect(categoryArray).toEqual(['Audio', 'Lighting', 'Staging']);
    });

    it('should handle multi-category tags', () => {
      const categories = mapAssetTagsToSupplierCategories(['Video & Display', 'Graphics & Signage']);
      const categoryArray = Array.from(categories).sort();
      expect(categoryArray).toEqual(['Banners', 'Graphics', 'Printing', 'Video']);
    });

    it('should map Staffing, Floral, Furniture', () => {
      const categories = mapAssetTagsToSupplierCategories(['Staffing', 'Floral & Decor', 'Furniture']);
      const categoryArray = Array.from(categories).sort();
      expect(categoryArray).toContain('Staffing');
      expect(categoryArray).toContain('Floral');
      expect(categoryArray).toContain('Furniture');
    });

    it('should support legacy tags for backward compatibility', () => {
      const categories = mapAssetTagsToSupplierCategories(['Audio Equipment', 'Event Staff']);
      const categoryArray = Array.from(categories).sort();
      expect(categoryArray).toEqual(['Audio', 'Staffing']);
    });

    it('should handle empty array', () => {
      const categories = mapAssetTagsToSupplierCategories([]);
      expect(categories.size).toBe(0);
    });

    it('should handle unknown tags gracefully', () => {
      const categories = mapAssetTagsToSupplierCategories(['Unknown Tag']);
      expect(categories.size).toBe(0);
    });
  });

  describe('calculateSupplierRelevanceScore', () => {
    const createSupplier = (categories: string[]): Supplier => ({
      id: 'test-id',
      supplier_name: 'Test Supplier',
      service_categories: categories,
      contact_persons: [],
      created_at: new Date().toISOString()
    });

    it('should return 0 for supplier with no matching categories', () => {
      const supplier = createSupplier(['Printing', 'Graphics']);
      const relevantCategories = new Set(['Audio', 'Video']);
      const score = calculateSupplierRelevanceScore(supplier, relevantCategories);
      expect(score).toBe(0);
    });

    it('should return 1 for single matching category', () => {
      const supplier = createSupplier(['Audio', 'Printing']);
      const relevantCategories = new Set(['Audio', 'Video']);
      const score = calculateSupplierRelevanceScore(supplier, relevantCategories);
      expect(score).toBe(1);
    });

    it('should return correct score for multiple matching categories', () => {
      const supplier = createSupplier(['Audio', 'Video', 'Lighting']);
      const relevantCategories = new Set(['Audio', 'Video']);
      const score = calculateSupplierRelevanceScore(supplier, relevantCategories);
      expect(score).toBe(2);
    });

    it('should return 0 for supplier with no categories', () => {
      const supplier = createSupplier([]);
      const relevantCategories = new Set(['Audio', 'Video']);
      const score = calculateSupplierRelevanceScore(supplier, relevantCategories);
      expect(score).toBe(0);
    });
  });

  describe('sortSuppliersByRelevance', () => {
    const createSupplier = (name: string, categories: string[]): Supplier => ({
      id: `id-${name}`,
      supplier_name: name,
      service_categories: categories,
      contact_persons: [],
      created_at: new Date().toISOString()
    });

    it('should sort suppliers by relevance score (high to low)', () => {
      const suppliers = [
        createSupplier('Supplier A', ['Printing']), // Score: 0
        createSupplier('Supplier B', ['Audio', 'Video']), // Score: 2
        createSupplier('Supplier C', ['Audio']), // Score: 1
      ];

      const sorted = sortSuppliersByRelevance(suppliers, ['Audio', 'Video & Display']);

      expect(sorted[0].supplier_name).toBe('Supplier B'); // Score: 2
      expect(sorted[1].supplier_name).toBe('Supplier C'); // Score: 1
      expect(sorted[2].supplier_name).toBe('Supplier A'); // Score: 0
    });

    it('should sort alphabetically for tied scores', () => {
      const suppliers = [
        createSupplier('Zebra Audio', ['Audio']), // Score: 1
        createSupplier('Alpha Audio', ['Audio']), // Score: 1
        createSupplier('Beta Audio', ['Audio']), // Score: 1
      ];

      const sorted = sortSuppliersByRelevance(suppliers, ['Audio']);

      expect(sorted[0].supplier_name).toBe('Alpha Audio');
      expect(sorted[1].supplier_name).toBe('Beta Audio');
      expect(sorted[2].supplier_name).toBe('Zebra Audio');
    });

    it('should handle multi-category asset tags correctly', () => {
      const suppliers = [
        createSupplier('Graphics Only', ['Graphics']),
        createSupplier('Video Only', ['Video']),
        createSupplier('Both Categories', ['Graphics', 'Video']),
      ];

      const sorted = sortSuppliersByRelevance(suppliers, ['Video & Display']);

      expect(sorted[0].supplier_name).toBe('Both Categories'); // Score: 2
      expect(sorted[1].supplier_name).toBe('Graphics Only');
      expect(sorted[2].supplier_name).toBe('Video Only');
    });

    it('should fallback to alphabetical when no asset tags provided', () => {
      const suppliers = [
        createSupplier('Zebra Supplier', ['Audio']),
        createSupplier('Alpha Supplier', ['Video']),
        createSupplier('Beta Supplier', ['Graphics']),
      ];
      
      const sorted = sortSuppliersByRelevance(suppliers, []);
      
      expect(sorted[0].supplier_name).toBe('Alpha Supplier');
      expect(sorted[1].supplier_name).toBe('Beta Supplier');
      expect(sorted[2].supplier_name).toBe('Zebra Supplier');
    });

    it('should fallback to alphabetical when tags map to no categories', () => {
      const suppliers = [
        createSupplier('Zebra Supplier', ['Audio']),
        createSupplier('Alpha Supplier', ['Video']),
      ];

      const sorted = sortSuppliersByRelevance(suppliers, ['Unknown Tag']);

      expect(sorted[0].supplier_name).toBe('Alpha Supplier');
      expect(sorted[1].supplier_name).toBe('Zebra Supplier');
    });

    it('should not mutate original array', () => {
      const suppliers = [
        createSupplier('Supplier A', ['Printing']),
        createSupplier('Supplier B', ['Audio']),
      ];

      const originalOrder = suppliers.map(s => s.supplier_name);
      sortSuppliersByRelevance(suppliers, ['Audio']);

      expect(suppliers.map(s => s.supplier_name)).toEqual(originalOrder);
    });
  });

  describe('getMatchingCategories', () => {
    const createSupplier = (categories: string[]): Supplier => ({
      id: 'test-id',
      supplier_name: 'Test Supplier',
      service_categories: categories,
      contact_persons: [],
      created_at: new Date().toISOString()
    });

    it('should return matching categories for Furniture tag', () => {
      const supplier = createSupplier(['Furniture', 'Catering']);
      const matching = getMatchingCategories(supplier, ['Furniture']);
      expect(matching).toEqual(['Furniture']);
    });

    it('should return matching categories for Floral & Decor tag', () => {
      const supplier = createSupplier(['Floral', 'Design']);
      const matching = getMatchingCategories(supplier, ['Floral & Decor']);
      expect(matching).toEqual(['Floral', 'Design']);
    });

    it('should return matching categories for Staffing tag', () => {
      const supplier = createSupplier(['Staffing', 'Security']);
      const matching = getMatchingCategories(supplier, ['Staffing']);
      expect(matching).toEqual(['Staffing', 'Security']);
    });

    it('should return matching categories for multiple tags', () => {
      const supplier = createSupplier(['Floral', 'Furniture', 'Staffing', 'IT Services']);
      const matching = getMatchingCategories(supplier, ['Floral & Decor', 'Furniture', 'Staffing', 'Technology']);
      const categoryArray = matching.sort();
      expect(categoryArray).toEqual(['Floral', 'Furniture', 'IT Services', 'Staffing']);
    });

    it('should return empty array for non-matching categories', () => {
      const supplier = createSupplier(['Audio', 'Video']);
      const matching = getMatchingCategories(supplier, ['Furniture', 'Floral & Decor']);
      expect(matching).toEqual([]);
    });

    it('should return empty array for unknown tags', () => {
      const supplier = createSupplier(['Logistics', 'Transport']);
      const matching = getMatchingCategories(supplier, ['Unknown Tag']);
      expect(matching).toEqual([]);
    });
  });
});

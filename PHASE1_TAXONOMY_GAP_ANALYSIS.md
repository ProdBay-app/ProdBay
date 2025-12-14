# Phase 1: Taxonomy Gap Analysis - 100% Asset Tag Coverage

## Current State Analysis

### Source of Truth: AVAILABLE_CATEGORIES

**Location:** `src/hooks/useSupplierManagement.ts` (lines 61-65)

**Current Categories (18 total):**
```typescript
const AVAILABLE_CATEGORIES = [
  'Printing', 'Graphics', 'Banners', 'Staging', 'Audio', 'Lighting',
  'Catering', 'Food', 'Beverages', 'Design', 'Branding', 'Marketing',
  'Transport', 'Logistics', 'Delivery', 'Photography', 'Video', 'Security'
];
```

**Usage:**
- Used in `SupplierManagement.tsx` for category selection UI (button grid)
- Used in `CategoryFilter.tsx` for filtering (with hardcoded groups)
- No database constraints - categories are stored as `TEXT[]` arrays

---

## Gap Analysis: Orphaned Asset Tags

### Asset Tags Currently Mapping to Empty Arrays `[]`

| Asset Tag | Current Mapping | Issue | Proposed Solution |
|-----------|----------------|-------|-------------------|
| **'Event Staff'** | `[]` | No supplier category for staffing services | **New Category: `'Staffing'`** |
| **'Hospitality'** | `[]` | No supplier category for hospitality services | **New Category: `'Hospitality'`** |
| **'Technical Staff'** | `[]` | No supplier category for technical/AV staffing | **New Category: `'Technical Services'`** (or map to existing 'Audio'/'Video'?) |
| **'Medical Services'** | `[]` | No supplier category for medical/health services | **New Category: `'Medical'`** or `'Health & Safety'` |
| **'Permits & Licenses'** | `[]` | Administrative/legal - not a supplier service | **Keep as `[]`** (legal services, not event suppliers) |
| **'Floral'** | `[]` | No supplier category for floral services | **New Category: `'Floral'`** |
| **'Furniture'** | `[]` | No supplier category for furniture rental | **New Category: `'Furniture'`** |
| **'Technology Infrastructure'** | `[]` | No supplier category for IT/tech services | **New Category: `'IT Services'`** or `'Technology'` |

### Additional Considerations

| Asset Tag | Current Mapping | Analysis | Recommendation |
|-----------|----------------|----------|----------------|
| **'Power & Distribution'** | `['Lighting']` | Maps to Lighting (reasonable) | **Keep as-is** (power is often part of lighting services) |

---

## Proposed New Supplier Categories

### Categories to Add (7 new categories)

1. **`'Staffing'`** - For event staff, general staffing services
2. **`'Hospitality'`** - For hospitality services, guest services, concierge
3. **`'Technical Services'`** - For technical/AV staffing, AV technicians
4. **`'Medical'`** - For medical services, first aid, health & safety personnel
5. **`'Floral'`** - For floral arrangements, flower services
6. **`'Furniture'`** - For furniture rental, tables, chairs, lounge seating
7. **`'IT Services'`** - For technology infrastructure, WiFi, networking, IT support

**Alternative Naming Considerations:**
- `'Medical'` vs `'Health & Safety'` → **Recommend: `'Medical'`** (shorter, clearer)
- `'IT Services'` vs `'Technology'` → **Recommend: `'IT Services'`** (more specific)
- `'Technical Services'` vs `'AV Services'` → **Recommend: `'Technical Services'`** (broader, covers AV + other tech)

---

## Updated Mapping Proposal

### New Mappings

```typescript
// STAFFING & SERVICES (5 tags)
'Event Staff': ['Staffing'],
'Security': ['Security'], // Already mapped
'Hospitality': ['Hospitality'],
'Technical Staff': ['Technical Services'],
'Medical Services': ['Medical'],

// DECOR & FLORAL (4 tags)
'Floral': ['Floral'],
'Decor': ['Design'], // Already mapped
'Furniture': ['Furniture'],
'Linens & Draping': ['Design'], // Already mapped

// DIGITAL & TECHNOLOGY (2 tags)
'Digital Assets': ['Design', 'Marketing'], // Already mapped
'Technology Infrastructure': ['IT Services'],

// LOGISTICS & OPERATIONS (5 tags)
'Permits & Licenses': [], // Keep as [] - legal/administrative, not supplier service
```

---

## Impact Analysis

### Database Impact
- **No migration required** - Categories are stored as `TEXT[]` arrays in PostgreSQL
- Existing suppliers will continue to work (they just won't have new categories until manually added)
- No schema changes needed

### UI Impact

**Files Requiring Updates:**

1. **`src/hooks/useSupplierManagement.ts`**
   - Update `AVAILABLE_CATEGORIES` constant
   - Add 7 new categories to the array

2. **`src/components/producer/supplier-filters/CategoryFilter.tsx`**
   - Update `categoryGroups` object to include new categories in appropriate groups
   - New groups needed:
     - `'Services'`: ['Staffing', 'Hospitality', 'Technical Services', 'Medical']
     - `'Decor & Rentals'`: ['Floral', 'Furniture']
     - `'Technology'`: ['IT Services']

3. **`src/utils/supplierRelevance.ts`**
   - Update `ASSET_TAG_TO_SUPPLIER_CATEGORY_MAP` with new mappings
   - Update comment documenting available categories

### Backward Compatibility
- ✅ **Fully backward compatible** - Existing suppliers won't break
- ✅ **No data migration** - New categories are optional
- ✅ **Progressive enhancement** - Suppliers can be updated to include new categories over time

---

## Category Grouping Strategy

### Proposed Category Groups (for CategoryFilter.tsx)

```typescript
const categoryGroups = {
  'Production': ['Printing', 'Graphics', 'Banners', 'Staging', 'Audio', 'Lighting'],
  'Catering': ['Catering', 'Food', 'Beverages'],
  'Creative': ['Design', 'Branding', 'Marketing'],
  'Media': ['Photography', 'Video'],
  'Logistics': ['Transport', 'Logistics', 'Delivery'],
  'Services': ['Staffing', 'Hospitality', 'Technical Services', 'Medical', 'Security'],
  'Decor & Rentals': ['Floral', 'Furniture'],
  'Technology': ['IT Services']
};
```

---

## Summary

### Current Coverage
- **Total Asset Tags:** 50
- **Tags with mappings:** 42 (84%)
- **Tags with empty mappings:** 8 (16%)

### After Implementation
- **Total Asset Tags:** 50
- **Tags with mappings:** 49 (98%)
- **Tags with empty mappings:** 1 (2%) - Only 'Permits & Licenses' (intentionally excluded)

### New Categories Required
- **7 new categories** to achieve 98% coverage
- **1 tag intentionally excluded** ('Permits & Licenses' - legal/administrative, not a supplier service)

---

## Recommendations

1. **Add all 7 proposed categories** to achieve near-complete coverage
2. **Keep 'Permits & Licenses' as `[]`** - This is an administrative function, not a supplier service
3. **Update CategoryFilter groups** to organize new categories logically
4. **No database migration needed** - Pure code changes

**Status:** ✅ **Ready for Phase 2** - Taxonomy expansion plan

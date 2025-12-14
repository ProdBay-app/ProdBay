# Phase 2: Taxonomy Expansion Plan

## PR Title
`feat: expand supplier categories for 100% asset tag coverage`

## Problem Statement

Currently, 8 asset tags (16% of all tags) map to empty arrays `[]`, meaning they cannot contribute to relevance scoring. This reduces the effectiveness of the relevance sorting algorithm and prevents users from finding suppliers for these asset types.

**Orphaned Tags:**
- Event Staff, Hospitality, Technical Staff, Medical Services
- Floral, Furniture
- Technology Infrastructure
- Permits & Licenses (intentionally excluded - legal/administrative)

## Solution Overview

Add 7 new supplier categories to achieve 98% asset tag coverage (49 out of 50 tags mapped). The remaining tag ('Permits & Licenses') is intentionally excluded as it represents legal/administrative services, not supplier services.

---

## Implementation Plan

### Step 1: Add New Categories to AVAILABLE_CATEGORIES

**File:** `src/hooks/useSupplierManagement.ts`

**Change:**
```typescript
// BEFORE (18 categories)
const AVAILABLE_CATEGORIES = [
  'Printing', 'Graphics', 'Banners', 'Staging', 'Audio', 'Lighting',
  'Catering', 'Food', 'Beverages', 'Design', 'Branding', 'Marketing',
  'Transport', 'Logistics', 'Delivery', 'Photography', 'Video', 'Security'
];

// AFTER (25 categories)
const AVAILABLE_CATEGORIES = [
  'Printing', 'Graphics', 'Banners', 'Staging', 'Audio', 'Lighting',
  'Catering', 'Food', 'Beverages', 'Design', 'Branding', 'Marketing',
  'Transport', 'Logistics', 'Delivery', 'Photography', 'Video', 'Security',
  'Staffing', 'Hospitality', 'Technical Services', 'Medical', 'Floral', 'Furniture', 'IT Services'
];
```

**Rationale:**
- Maintains alphabetical grouping within logical sections
- New categories added at the end for minimal diff
- Total: 18 → 25 categories (+7)

---

### Step 2: Update Asset Tag Mapping

**File:** `src/utils/supplierRelevance.ts`

**Changes:**

1. **Update the comment** documenting available categories:
```typescript
/**
 * Supplier Categories Available:
 * 'Printing', 'Graphics', 'Banners', 'Staging', 'Audio', 'Lighting',
 * 'Catering', 'Food', 'Beverages', 'Design', 'Branding', 'Marketing',
 * 'Transport', 'Logistics', 'Delivery', 'Photography', 'Video', 'Security',
 * 'Staffing', 'Hospitality', 'Technical Services', 'Medical', 'Floral', 'Furniture', 'IT Services'
 */
```

2. **Update the mapping** for orphaned tags:
```typescript
// STAFFING & SERVICES (5 tags)
'Event Staff': ['Staffing'], // NEW MAPPING
'Security': ['Security'],
'Hospitality': ['Hospitality'], // NEW MAPPING
'Technical Staff': ['Technical Services'], // NEW MAPPING
'Medical Services': ['Medical'], // NEW MAPPING

// DECOR & FLORAL (4 tags)
'Floral': ['Floral'], // NEW MAPPING
'Decor': ['Design'],
'Furniture': ['Furniture'], // NEW MAPPING
'Linens & Draping': ['Design'],

// DIGITAL & TECHNOLOGY (2 tags)
'Digital Assets': ['Design', 'Marketing'],
'Technology Infrastructure': ['IT Services'], // NEW MAPPING

// LOGISTICS & OPERATIONS (5 tags)
'Transportation': ['Transport', 'Logistics'],
'Loading & Setup': ['Logistics', 'Delivery'],
'Storage': ['Logistics'],
'Permits & Licenses': [], // INTENTIONALLY KEPT AS [] - Legal/administrative, not supplier service
'Waste Management': ['Logistics'],
```

---

### Step 3: Update CategoryFilter Groups

**File:** `src/components/producer/supplier-filters/CategoryFilter.tsx`

**Change:**
```typescript
// BEFORE
const categoryGroups = {
  'Production': ['Printing', 'Graphics', 'Banners', 'Staging', 'Audio', 'Lighting'],
  'Catering': ['Catering', 'Food', 'Beverages'],
  'Creative': ['Design', 'Branding', 'Marketing'],
  'Media': ['Photography', 'Video'],
  'Logistics': ['Transport', 'Logistics', 'Delivery'],
  'Security': ['Security']
};

// AFTER
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

**Rationale:**
- Groups new categories logically
- 'Services' group consolidates staffing-related categories
- 'Decor & Rentals' groups decor-related categories
- 'Technology' group for IT services

---

## Impact Analysis

### Database Impact
- ✅ **No migration required**
- Categories stored as `TEXT[]` arrays (PostgreSQL)
- No schema constraints on category values
- Existing suppliers continue to work (they just won't have new categories until manually added)

### UI Impact

**SupplierManagement Component:**
- Category selection grid will show 7 additional buttons
- Grid layout (2 cols mobile, 4 cols desktop) will accommodate new categories
- No breaking changes

**CategoryFilter Component:**
- New groups added: 'Services', 'Decor & Rentals', 'Technology'
- Filtering logic unchanged (uses `availableCategories` prop)
- Dropdown will show organized groups

**Relevance Sorting:**
- 7 additional asset tags will now contribute to relevance scoring
- Improved matching for: Event Staff, Hospitality, Technical Staff, Medical Services, Floral, Furniture, Technology Infrastructure

### Backward Compatibility
- ✅ **Fully backward compatible**
- Existing suppliers without new categories continue to function
- New categories are optional (suppliers can be updated over time)
- No data migration needed

### Performance Impact
- ✅ **Negligible**
- Mapping lookup: O(1) - no change
- Category filtering: O(n) - slightly larger array, but still <30 items
- Relevance calculation: No change in complexity

---

## Testing Strategy

### Unit Tests
- Update `supplierRelevance.test.ts` to test new mappings
- Verify all 7 new categories map correctly
- Verify 'Permits & Licenses' remains unmapped

### Manual Testing
1. **SupplierManagement:**
   - Verify new categories appear in selection grid
   - Verify categories can be selected/deselected
   - Verify suppliers can be saved with new categories

2. **CategoryFilter:**
   - Verify new groups appear in dropdown
   - Verify filtering works with new categories
   - Verify "Select All" works for new groups

3. **Relevance Sorting:**
   - Create asset with 'Floral' tag
   - Verify suppliers with 'Floral' category appear in "Recommended" section
   - Test with multiple new categories

---

## Files to Modify

### Modified Files
1. **`src/hooks/useSupplierManagement.ts`**
   - Update `AVAILABLE_CATEGORIES` constant (add 7 categories)

2. **`src/utils/supplierRelevance.ts`**
   - Update `ASSET_TAG_TO_SUPPLIER_CATEGORY_MAP` (7 new mappings)
   - Update documentation comment

3. **`src/components/producer/supplier-filters/CategoryFilter.tsx`**
   - Update `categoryGroups` object (add 3 new groups)

### Test Files
4. **`src/utils/__tests__/supplierRelevance.test.ts`**
   - Add tests for new mappings

---

## Acceptance Criteria

- [ ] 7 new categories added to `AVAILABLE_CATEGORIES`
- [ ] 7 asset tags mapped to new categories
- [ ] 'Permits & Licenses' remains unmapped (intentional)
- [ ] CategoryFilter groups updated with new categories
- [ ] Documentation comments updated
- [ ] Unit tests updated and passing
- [ ] Manual testing confirms new categories work in UI
- [ ] Relevance sorting works with new categories
- [ ] Backward compatibility maintained (existing suppliers work)

---

## New Categories Summary

| Category | Asset Tags Mapped | Rationale |
|----------|------------------|-----------|
| **Staffing** | Event Staff | General event staffing services |
| **Hospitality** | Hospitality | Guest services, concierge, greeters |
| **Technical Services** | Technical Staff | AV technicians, technical staffing |
| **Medical** | Medical Services | First aid, medical personnel, health services |
| **Floral** | Floral | Flower arrangements, floral services |
| **Furniture** | Furniture | Furniture rental, tables, chairs |
| **IT Services** | Technology Infrastructure | WiFi, networking, IT support, technology |

**Total:** 7 new categories, 7 asset tags mapped

---

## Risk Assessment

**Low Risk:**
- ✅ No database changes
- ✅ No API changes
- ✅ Backward compatible
- ✅ Pure code additions (no deletions)

**Mitigation:**
- Test thoroughly with existing suppliers
- Verify UI components handle new categories gracefully
- Ensure filtering/sorting logic works with expanded list

---

## Dependencies

- None (self-contained changes)
- No external dependencies
- No database migrations

---

## Timeline Estimate

- **Step 1 (Update AVAILABLE_CATEGORIES):** 5 minutes
- **Step 2 (Update Mapping):** 10 minutes
- **Step 3 (Update CategoryFilter):** 10 minutes
- **Step 4 (Update Tests):** 15 minutes
- **Testing & Verification:** 20 minutes

**Total:** ~1 hour

---

## Next Steps

**Awaiting Approval:**
- List of 7 new categories
- Category naming (e.g., 'Medical' vs 'Health & Safety')
- Grouping strategy for CategoryFilter

**Status:** ⏸️ **AWAITING APPROVAL** - Ready for implementation after category list review.

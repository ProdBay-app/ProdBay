# PR Plan: Implement Data-Dense Asset Table with Quote Counts

## PR Title
**`feat(ui): Implement Data-Dense Asset Table with Quote Counts`**

---

## Why

The current Asset List uses a Card/Block layout (purple gradient blocks) that limits data density and makes it difficult to scan and manage multiple assets efficiently. A structured Table View will:

1. **Increase Data Density**: Display 7 key data points per asset in a compact, scannable format
2. **Improve Management Efficiency**: Enable quick comparison across assets (quantities, quote counts, status)
3. **Better Information Architecture**: Present all critical asset metadata in a single row
4. **Maintain Visual Consistency**: Apply our established glassmorphism aesthetic to the table format

---

## The Plan

### Step 1: Extend Asset Type Interface
**File:** `src/types/database.ts` or `src/lib/supabase.ts`

- [ ] Add optional `quote_count?: number` field to `Asset` interface
- [ ] This allows TypeScript to recognize the aggregated count from Supabase

**Rationale:** Type safety for the new quote count field.

---

### Step 2: Update ProducerService Query with Quote Count Aggregation
**File:** `src/services/producerService.ts`

**Location:** `loadProjectAssets()` method (line ~230)

**Current Implementation:**
```typescript
static async loadProjectAssets(projectId: string): Promise<Asset[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('assets')
    .select(`
      *,
      assigned_supplier:suppliers(*)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });
  // ...
}
```

**New Implementation:**
```typescript
static async loadProjectAssets(projectId: string): Promise<Asset[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('assets')
    .select(`
      *,
      assigned_supplier:suppliers(*),
      quotes(count)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  
  // Transform data to extract quote count from nested structure
  return (data || []).map((item: any) => ({
    ...item,
    quote_count: Array.isArray(item.quotes) ? item.quotes.length : 0,
    quotes: undefined // Remove nested quotes array
  })) as unknown as Asset[];
}
```

**Alternative Approach (if Supabase count aggregation doesn't work as expected):**
- Use separate query to fetch quote counts per asset
- Merge counts into asset objects
- Cache counts to avoid N+1 queries

**Rationale:** Efficiently fetch quote counts in a single query using Supabase's relation count feature.

---

### Step 3: Create New AssetTable Component
**File:** `src/components/producer/AssetTable.tsx` (NEW FILE)

**Component Structure:**
```typescript
interface AssetTableProps {
  assets: Asset[];
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  onView?: (asset: Asset) => void;
  hoveredAssetId?: string | null;
  onAssetHover?: (assetId: string | null) => void;
  getStatusColor: (status: string) => string;
}
```

**Features to Implement:**
- [ ] Table header with 7 columns: Name, Quantity, Tags, Supplier Status, # Quote Requests Sent, Last Updated, Actions
- [ ] Table body with glassmorphism-styled rows
- [ ] Responsive design (horizontal scroll on mobile, or stacked layout)
- [ ] Hover states matching existing AssetCard behavior
- [ ] Status badge rendering with color coding
- [ ] Tag display (show first 2-3 tags, with "+X more" indicator if needed)
- [ ] Date formatting for "Last Updated" column
- [ ] Action buttons (Edit, Delete) with icons
- [ ] Empty state handling (passed from parent)

**Styling Approach:**
- **Table Container:** `bg-white/10 backdrop-blur-md border border-white/20 rounded-lg`
- **Table Header:** `bg-white/5 border-b border-white/20`
- **Table Rows:** 
  - Base: `bg-white/5 border-b border-white/10`
  - Hover: `hover:bg-white/10 hover:border-purple-400/30`
  - Highlighted (when hoveredAssetId matches): `ring-2 ring-purple-400/50`
- **Text Colors:**
  - Headers: `text-white font-semibold`
  - Body: `text-gray-200`
  - Muted (dates, counts): `text-gray-400`
- **Action Buttons:**
  - Edit: `bg-purple-500/20 hover:bg-purple-500/30 text-purple-200`
  - Delete: `bg-red-500/20 hover:bg-red-500/30 text-red-200`
- **Status Badges:** Use existing `getStatusColor()` function with glassmorphism background

**Rationale:** Separates table logic from container, enables future view switching (Card vs Table).

---

### Step 4: Update AssetList Component to Use AssetTable
**File:** `src/components/producer/AssetList.tsx`

**Changes:**
- [ ] Import new `AssetTable` component
- [ ] Replace grid layout (line ~465) with conditional rendering:
  ```typescript
  {viewMode === 'table' ? (
    <AssetTable
      assets={filteredAndSortedAssets}
      onEdit={handleOpenEditModal}
      onDelete={handleOpenDeleteModal}
      onView={handleViewAsset}
      hoveredAssetId={hoveredAssetId}
      onAssetHover={onAssetHover}
      getStatusColor={getStatusColor}
    />
  ) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {/* Existing AssetCard grid */}
    </div>
  )}
  ```
- [ ] Add view mode state (default to 'table' for this PR, or add toggle later)
- [ ] Keep all existing functionality (search, filters, sorting, modals)

**Rationale:** Maintains backward compatibility while introducing table view.

---

### Step 5: Format Date Display
**File:** `src/components/producer/AssetTable.tsx`

- [ ] Create utility function to format `updated_at` timestamp
- [ ] Format: "MMM DD, YYYY" or relative time ("2 days ago")
- [ ] Handle null/undefined cases gracefully

**Example:**
```typescript
const formatLastUpdated = (dateString: string | null): string => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
```

**Rationale:** User-friendly date display improves readability.

---

### Step 6: Handle Tag Display in Table
**File:** `src/components/producer/AssetTable.tsx`

- [ ] Display tags as comma-separated list or badge chips
- [ ] Limit display to 2-3 tags with "+X more" indicator
- [ ] Use tag colors from `getTagColor()` utility
- [ ] Handle empty tags array (show "No tags" or dash)

**Rationale:** Compact tag display maintains table density while showing categorization.

---

### Step 7: Responsive Design Implementation
**File:** `src/components/producer/AssetTable.tsx`

**Mobile Strategy:**
- [ ] Option A: Horizontal scroll wrapper (`overflow-x-auto`)
- [ ] Option B: Stacked card layout on mobile (transform table rows to cards)
- [ ] Option C: Hide less critical columns on mobile (show Name, Status, Actions only)

**Recommendation:** Option A (horizontal scroll) for consistency, with sticky first column (Name).

**Rationale:** Ensures table remains functional on all screen sizes.

---

### Step 8: Testing & Validation
**Files:** Multiple

- [ ] Verify quote counts display correctly (0, 1, multiple)
- [ ] Test with assets that have no quotes
- [ ] Test with assets that have many quotes (10+)
- [ ] Verify sorting still works with new table layout
- [ ] Verify filtering (search, tags) still works
- [ ] Test hover states and bi-directional linking with brief
- [ ] Test Edit/Delete actions from table
- [ ] Verify glassmorphism styling matches app aesthetic
- [ ] Test responsive behavior on mobile/tablet

**Rationale:** Ensures feature parity with existing card view.

---

## Impact Analysis

### Supabase Query Performance

**Current Query:**
- Fetches assets with assigned_supplier relation
- Single query, efficient

**New Query:**
- Adds `quotes(count)` relation
- **Performance Consideration:** Supabase PostgREST handles this efficiently via JOIN
- **Potential Impact:** Minimal - count aggregation is lightweight
- **Optimization:** If performance degrades with many assets/quotes, consider:
  - Adding database index on `quotes.asset_id` (likely already exists via foreign key)
  - Caching quote counts if they don't change frequently
  - Using a materialized view for quote counts (future optimization)

**Expected Performance:**
- **Small projects (< 20 assets):** No noticeable impact
- **Medium projects (20-100 assets):** < 50ms additional query time
- **Large projects (100+ assets):** May need optimization (add index or separate count query)

**Monitoring:**
- Monitor Supabase query logs for slow queries
- Add error handling for count aggregation failures

---

### Vercel Re-rendering Impact

**Component Structure:**
- `AssetList` (parent) → `AssetTable` (child)
- Table renders all visible rows (no virtualization initially)

**Re-render Scenarios:**
1. **Asset data updates:** Table re-renders all rows (acceptable for < 100 assets)
2. **Filter/sort changes:** Table re-renders with new data (expected behavior)
3. **Hover state changes:** Only affected row re-renders (React optimization)

**Performance Considerations:**
- **Current:** Card grid renders ~12-16 cards per viewport
- **New:** Table renders ~10-15 rows per viewport
- **Impact:** Similar render count, but table rows are more complex (7 columns vs 1 card)

**Optimization Strategies (if needed):**
- Use `React.memo()` on table rows to prevent unnecessary re-renders
- Implement virtual scrolling for large asset lists (future enhancement)
- Debounce search/filter inputs to reduce re-renders

**Expected Performance:**
- **Initial render:** < 100ms for 50 assets
- **Re-render on filter:** < 50ms
- **Hover state change:** < 10ms (single row update)

**Monitoring:**
- Use React DevTools Profiler to identify slow renders
- Monitor Vercel function execution times

---

### Railway Backend Impact

**Analysis:**
- ✅ **No backend changes required**
- Quote count aggregation happens in Supabase (database layer)
- No new API endpoints needed
- Existing `ProducerService` methods remain compatible

**Rationale:** All data fetching happens client-side via Supabase client, no Railway backend involvement.

---

### Database Schema Impact

**Analysis:**
- ✅ **No schema changes required**
- Uses existing `quotes` table with `asset_id` foreign key
- Count aggregation uses existing relationship

**Index Verification:**
- Verify `quotes.asset_id` has index (should exist via foreign key constraint)
- If missing, add: `CREATE INDEX IF NOT EXISTS idx_quotes_asset_id ON quotes(asset_id);`

---

### Breaking Changes

**Analysis:**
- ✅ **No breaking changes**
- `Asset` interface extended with optional `quote_count` field
- Existing code using `Asset` type remains compatible (optional field)
- `AssetList` component maintains all existing props and functionality

**Migration Path:**
- Existing components continue to work
- New table view is additive feature
- Can revert to card view if needed (view mode toggle)

---

## Rollback Plan

If issues arise:

1. **Revert AssetTable component:** Remove import and restore grid layout
2. **Revert ProducerService change:** Remove quote count aggregation, restore original query
3. **Remove quote_count from Asset type:** Optional field, safe to remove

**Risk Level:** Low - changes are additive and isolated.

---

## Success Criteria

- [ ] Table displays all 7 required columns correctly
- [ ] Quote counts are accurate and update in real-time
- [ ] Glassmorphism styling matches app aesthetic
- [ ] Table is responsive on mobile devices
- [ ] All existing functionality (edit, delete, filter, sort) works
- [ ] Performance is acceptable (< 200ms initial render for 50 assets)
- [ ] No TypeScript errors
- [ ] No console errors or warnings

---

## Future Enhancements (Out of Scope)

- View mode toggle (Card vs Table)
- Column sorting (click headers to sort)
- Column visibility toggle
- Export to CSV
- Virtual scrolling for large lists
- Inline editing (edit directly in table)
- Bulk actions (select multiple assets)

---

**Status:** Ready for Phase 3 Approval


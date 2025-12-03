# PR Plan: Set Default Asset Sort to Name Ascending

## PR Title
**`fix(logic): set default asset sort to Name Ascending`**

---

## Phase 1: Justification & Analysis

### Component Location
✅ **Found:** `src/components/producer/AssetList.tsx`

### Current Sorting State Analysis

**Line 62 - Sort By State:**
```typescript
const [sortBy, setSortBy] = useState<'name' | 'date' | 'quantity'>('date');
```

**Line 63 - Sort Order State:**
```typescript
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
```

**Current Default:**
- `sortBy`: `'date'` (Date Added)
- `sortOrder`: `'desc'` (Descending - newest first)
- **Result:** Assets are sorted by creation date, newest first

### Sorting Logic Analysis

**Lines 243-262 - Sort Function:**
```typescript
const sortFunction = (a: Asset, b: Asset) => {
  let comparison = 0;
  
  switch (sortBy) {
    case 'name':
      comparison = a.asset_name.localeCompare(b.asset_name);
      break;
    case 'date':
      comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      break;
    case 'quantity':
      const aQty = a.quantity || 0;
      const bQty = b.quantity || 0;
      comparison = aQty - bQty;
      break;
    default:
      comparison = 0;
  }

  return sortOrder === 'asc' ? comparison : -comparison;
};
```

**Behavior:**
- When `sortBy === 'name'` and `sortOrder === 'asc'`: Alphabetical A-Z
- When `sortBy === 'name'` and `sortOrder === 'desc'`: Reverse alphabetical Z-A
- `localeCompare()` handles proper alphabetical sorting (case-insensitive, locale-aware)

### Reset Button Analysis

**Line 438-443 - Reset Logic:**
```typescript
{(selectedTags.length > 0 || searchTerm || sortBy !== 'date' || sortOrder !== 'desc') && (
  // ...
  onClick={() => {
    setSortBy('date');
    setSortOrder('desc');
  }}
)}
```

**Note:** The reset button currently resets to `'date'` and `'desc'`. This should be updated to match the new default (`'name'` and `'asc'`), but we'll focus on the default state change first.

---

## Phase 2: The PR Description (The Plan)

### Why
The Asset List currently defaults to sorting by creation date (newest first). Changing the default to Name Ascending (A-Z) will provide a more predictable and user-friendly alphabetical organization of assets, making them easier to find and scan.

### The Plan

#### 1. Update Default Sort State

**Current (Line 62):**
```typescript
const [sortBy, setSortBy] = useState<'name' | 'date' | 'quantity'>('date');
```

**Proposed:**
```typescript
const [sortBy, setSortBy] = useState<'name' | 'date' | 'quantity'>('name');
```

**Current (Line 63):**
```typescript
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
```

**Proposed:**
```typescript
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
```

#### 2. Update Reset Button Logic (Optional Enhancement)

**Current (Line 442-443):**
```typescript
setSortBy('date');
setSortOrder('desc');
```

**Proposed:**
```typescript
setSortBy('name');
setSortOrder('asc');
```

**Rationale:** The reset button should reset to the new default, not the old default.

**Note:** This is an optional enhancement. If you only want to change the initial default and keep the reset button as-is, we can skip this.

---

## Phase 3: Impact Analysis

### ✅ Improved User Experience
- Assets displayed alphabetically by default (A-Z)
- Easier to find specific assets by name
- More predictable and intuitive sorting

### ✅ No Breaking Changes
- Users can still change sorting via the UI controls
- All existing sorting functionality remains intact
- No data or API changes required

### ✅ Consistent Behavior
- Alphabetical sorting is a common default pattern
- Matches user expectations for list views

### Files Affected
1. `src/components/producer/AssetList.tsx`
   - Line 62: Change `sortBy` default from `'date'` to `'name'`
   - Line 63: Change `sortOrder` default from `'desc'` to `'asc'`
   - Lines 442-443 (Optional): Update reset button to match new default

---

## Phase 4: Await Approval

**Status:** ⏸️ **AWAITING APPROVAL**

### Proposed Code Changes

**Change 1: Default Sort By (Line 62)**

**Current:**
```typescript
const [sortBy, setSortBy] = useState<'name' | 'date' | 'quantity'>('date');
```

**Proposed:**
```typescript
const [sortBy, setSortBy] = useState<'name' | 'date' | 'quantity'>('name');
```

**Change 2: Default Sort Order (Line 63)**

**Current:**
```typescript
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
```

**Proposed:**
```typescript
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
```

**Change 3: Reset Button (Lines 442-443) - OPTIONAL**

**Current:**
```typescript
setSortBy('date');
setSortOrder('desc');
```

**Proposed:**
```typescript
setSortBy('name');
setSortOrder('asc');
```

### Expected Behavior After Changes

**Initial Load:**
- Assets automatically sorted alphabetically A-Z by asset name
- No user interaction required

**User Can Still:**
- Change to Date sorting (newest/oldest)
- Change to Quantity sorting
- Reverse order (A-Z ↔ Z-A) using the sort toggle button
- Reset to Name Ascending using the reset button (if updated)

---

## Phase 5: Implementation Notes

### Implementation Steps

1. **Update Line 62:**
   - Change `'date'` to `'name'` in the `useState` initialization

2. **Update Line 63:**
   - Change `'desc'` to `'asc'` in the `useState` initialization

3. **Update Lines 442-443 (Optional):**
   - Change reset button to reset to `'name'` and `'asc'` instead of `'date'` and `'desc'`

### Testing Checklist

- [ ] Assets load sorted by name A-Z on initial page load
- [ ] Sort dropdown shows "Name" as selected by default
- [ ] Sort order indicator shows "A→Z" (ascending) by default
- [ ] User can still change sorting to Date or Quantity
- [ ] User can still toggle between Ascending/Descending
- [ ] Reset button works correctly (if updated)
- [ ] Sorting persists correctly during asset creation/updates

---

**Status:** ⏸️ **AWAITING APPROVAL**

Please confirm:
1. ✅ Approve changing default to Name Ascending
2. ✅ Also update the reset button to match new default (optional)
3. ❌ Need different approach

Once approved, we'll proceed with implementation.


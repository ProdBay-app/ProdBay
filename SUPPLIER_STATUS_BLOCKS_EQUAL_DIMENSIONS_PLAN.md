# PR Plan: Equalize Supplier Status Blocks

## PR Title
**`fix(ui): enforce equal dimensions on supplier status blocks`**

---

## Phase 1: Justification & Analysis

### Component Location
✅ **Found:** `src/components/producer/SupplierStatusTracker.tsx`

### Current Layout Analysis

**Line 189 - Status Columns Container:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
```

**Current Structure:**
- ✅ Uses `grid grid-cols-1 md:grid-cols-3 gap-6` - good for equal widths on desktop
- ✅ Responsive: stacks to 1 column on mobile (`grid-cols-1`), 3 columns on desktop (`md:grid-cols-3`)

**Line 195 - Individual Column Wrapper:**
```tsx
<div key={status} className="space-y-3">
```

**Current Issues:**
- ❌ No height constraint - column shrinks/grows based on content
- ❌ No flex properties to stretch to match tallest column
- ❌ Status header cards can have different heights due to text content

**Line 197 - Status Header Card:**
```tsx
<div className={`${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-lg p-3`}>
```

**Current Issues:**
- ❌ No fixed height - varies based on text content length
- ❌ Text can wrap differently in each card ("Quote requests sent, awaiting response" vs "Quotes received, under review" vs "Supplier selected for this asset")
- ❌ No `h-full` or `min-h-` constraint

**Line 215 - Suppliers List Container:**
```tsx
<div className="space-y-2">
```

**Current Issues:**
- ❌ No height constraint to balance out the columns
- ❌ Different number of suppliers per column causes height variations

### Problem Identified

**Issue:** The three status blocks (Requested, Quoted, Assigned) have different heights because:
1. Status header cards have no fixed height and text wraps differently
2. Individual column wrappers don't stretch to match the tallest column
3. Suppliers lists vary in length, causing additional height differences

**User Experience Impact:**
- Visual inconsistency
- Uneven appearance
- Unprofessional layout

---

## Phase 2: The PR Description (The Plan)

### Why
The supplier status blocks currently have different heights due to varying text content and supplier counts. Enforcing equal dimensions will create a more consistent and professional appearance.

### The Plan

#### 1. Container (Line 189)
**Current:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
```

**Proposed:** Keep as-is - grid layout already provides equal widths.

#### 2. Individual Column Wrapper (Line 195)
**Current:**
```tsx
<div key={status} className="space-y-3">
```

**Proposed:**
```tsx
<div key={status} className="flex flex-col space-y-3 h-full">
```

**Changes:**
- Add `flex flex-col` - Makes column a flex container to distribute space
- Add `h-full` - Forces column to stretch to match tallest column in the row

#### 3. Status Header Card (Line 197)
**Current:**
```tsx
<div className={`${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-lg p-3`}>
```

**Proposed:**
```tsx
<div className={`${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-lg p-3 h-24 flex flex-col justify-center`}>
```

**Changes:**
- Add `h-24` (96px / 6rem) - Fixed height to ensure all three cards are identical
- Add `flex flex-col justify-center` - Vertically centers content within the fixed height

**Alternative:** If `h-24` feels too tall, use `h-20` (80px) or `min-h-[80px]` for flexibility.

#### 4. Suppliers List Container (Line 215)
**Current:**
```tsx
<div className="space-y-2">
```

**Proposed:**
```tsx
<div className="flex-1 space-y-2">
```

**Changes:**
- Add `flex-1` - Takes up remaining vertical space in the flex column, balancing out the layout

---

## Phase 3: Impact Analysis

### ✅ Visual Consistency
- All three status blocks will have identical header card heights
- Columns will stretch to match the tallest column
- Uniform appearance across all statuses

### ✅ Improved Layout
- Professional, balanced design
- Better use of vertical space
- Cleaner visual hierarchy

### ✅ Responsive Design Maintained
- Mobile: Still stacks vertically (`grid-cols-1`)
- Desktop: Three equal-width columns (`md:grid-cols-3`)
- Heights will equalize on desktop, natural flow on mobile

### ✅ No Breaking Changes
- Only CSS class updates
- No logic changes
- No data structure changes
- Existing functionality preserved

### Files Affected
1. `src/components/producer/SupplierStatusTracker.tsx`
   - Line 195: Add `flex flex-col h-full` to column wrapper
   - Line 197: Add `h-24 flex flex-col justify-center` to status header card
   - Line 215: Add `flex-1` to suppliers list container

---

## Phase 4: Await Approval

**Status:** ⏸️ **AWAITING APPROVAL**

### Proposed Changes

#### Change 1: Column Wrapper (Line 195)

**Current:**
```tsx
<div key={status} className="space-y-3">
```

**Proposed:**
```tsx
<div key={status} className="flex flex-col space-y-3 h-full">
```

**Rationale:** Flexbox column layout with `h-full` ensures all columns stretch to match the tallest.

#### Change 2: Status Header Card (Line 197)

**Current:**
```tsx
<div className={`${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-lg p-3`}>
```

**Proposed:**
```tsx
<div className={`${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-lg p-3 h-24 flex flex-col justify-center`}>
```

**Rationale:** Fixed height (`h-24` = 96px) ensures all three header cards are identical, with vertically centered content.

**Alternative Options:**
- `h-20` (80px) - More compact
- `min-h-[80px]` - Minimum height with flexibility
- `h-[100px]` - Taller for more breathing room

#### Change 3: Suppliers List Container (Line 215)

**Current:**
```tsx
<div className="space-y-2">
```

**Proposed:**
```tsx
<div className="flex-1 space-y-2">
```

**Rationale:** `flex-1` makes the list container take up remaining vertical space, balancing the columns.

---

## Phase 5: Implementation Notes

### Implementation Steps

1. **Update Line 195:**
   - Change `className="space-y-3"` to `className="flex flex-col space-y-3 h-full"`

2. **Update Line 197:**
   - Change the className to include `h-24 flex flex-col justify-center`
   - Ensure the dynamic classes (bgColor, borderColor) are preserved

3. **Update Line 215:**
   - Change `className="space-y-2"` to `className="flex-1 space-y-2"`

### Testing Checklist

- [ ] All three status header cards have identical height on desktop
- [ ] Columns stretch to match tallest column
- [ ] Content is vertically centered in header cards
- [ ] Layout works correctly on mobile (stacks vertically)
- [ ] Layout works correctly on desktop (3 equal columns)
- [ ] No visual overflow or clipping
- [ ] Text is readable and properly formatted
- [ ] Empty states display correctly

---

**Status:** ⏸️ **AWAITING APPROVAL**

Please confirm:
1. ✅ Approve the proposed changes
2. ✅ Approve `h-24` (96px) for header card height, or prefer alternative: `h-20` or `min-h-[80px]`
3. ❌ Need different approach

Once approved, we'll proceed with implementation.


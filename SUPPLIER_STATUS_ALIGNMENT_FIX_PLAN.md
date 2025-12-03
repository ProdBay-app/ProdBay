# PR Plan: Fix Supplier Status Block Content Alignment

## PR Title
**`fix(ui): top-align supplier status block content`**

---

## Phase 1: Justification & Analysis

### Component Location
✅ **Found:** `src/components/producer/SupplierStatusTracker.tsx`

### Current Structure

**Line 197 - Status Header Card:**
```tsx
<div className={`${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-lg p-3 h-24 flex flex-col justify-center`}>
  <div className="flex items-center gap-2 mb-1">
    {/* Icon + Title + Count Badge */}
  </div>
  <p className="text-sm text-gray-300">
    {/* Description text */}
  </p>
</div>
```

**Current Classes:**
- `h-24` - Fixed height (96px)
- `flex flex-col` - Column layout
- `justify-center` - **Vertically centers content**
- `p-3` - Padding (12px all around)

### Problem Identified

**Issue:** The `justify-center` class vertically centers the entire content group (title row + description) within the fixed height. When one block has a longer description that wraps to two lines:

- **"Requested":** "Quote requests sent, awaiting response" (wraps to 2 lines)
- **"Quoted":** "Quotes received, under review" (1 line)
- **"Assigned":** "Supplier selected for this asset" (1 line)

The wrapped description takes more vertical space, which pushes the title row higher in the "Requested" block compared to the other blocks.

**Visual Result:**
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│                 │  │  📧 Quoted      │  │  ✓ Assigned     │
│  📧 Requested   │  │  Quotes received│  │  Supplier       │
│  Quote requests │  │                 │  │  selected       │
│  sent, awaiting │  │                 │  │                 │
│  response       │  │                 │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
   (misaligned)         (aligned)            (aligned)
```

---

## Phase 2: The PR Description (The Plan)

### Why
The supplier status blocks have misaligned titles because `justify-center` vertically centers the content group. When descriptions wrap to different line counts, titles end up at different vertical positions, creating a visually inconsistent layout.

### The Plan

#### 1. Status Header Card (Line 197)

**Current Classes:**
```
${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-lg p-3 h-24 flex flex-col justify-center
```

**Proposed Changes:**

**Remove:**
- `justify-center` - This centers content vertically, causing misalignment

**Add/Keep:**
- `justify-start` - Align content from the top (or rely on default flex behavior)
- Keep `h-24` - Fixed height ensures uniform block sizes
- Keep `p-3` - Padding provides spacing from edges
- Keep `mb-1` - Margin between title row and description (already present)

**Alternative Approach:**
- Simply remove `justify-center` and rely on default flex behavior (`justify-start` is the default)
- The padding `p-3` will provide top spacing automatically

**Final Proposed Classes:**
```
${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-lg p-3 h-24 flex flex-col
```

**OR (more explicit):**
```
${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-lg p-3 h-24 flex flex-col justify-start
```

### Expected Result

All titles will align at the top of their respective blocks:

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  📧 Requested   │  │  📧 Quoted      │  │  ✓ Assigned     │
│  Quote requests │  │  Quotes received│  │  Supplier       │
│  sent, awaiting │  │                 │  │  selected       │
│  response       │  │                 │  │                 │
│                 │  │                 │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
   (aligned)            (aligned)            (aligned)
```

---

## Phase 3: Impact Analysis

### ✅ Improved Visual Consistency
- All titles align horizontally across all three blocks
- Professional, clean appearance
- Better readability

### ✅ No Functional Changes
- Only CSS class modification
- No state management changes
- No prop changes
- No logic changes

### ✅ Maintains Fixed Height
- Blocks remain uniform in size (`h-24`)
- Spacing remains consistent
- Layout stability preserved

### Files Affected
1. `src/components/producer/SupplierStatusTracker.tsx` - Remove `justify-center` from status header card

---

## Phase 3: Await Approval

**Status:** ⏸️ **AWAITING APPROVAL**

### Proposed Solution

**Target Element:** Line 197 - Status Header Card `div`

**Current Classes:**
```tsx
className={`${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-lg p-3 h-24 flex flex-col justify-center`}
```

**Proposed Change:**
```tsx
className={`${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-lg p-3 h-24 flex flex-col`}
```

**OR (more explicit, equivalent result):**
```tsx
className={`${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-lg p-3 h-24 flex flex-col justify-start`}
```

### Explanation

- **Remove `justify-center`**: This prevents vertical centering of content
- **Keep `flex flex-col`**: Maintains column layout for title and description
- **Keep `h-24`**: Preserves fixed height for uniform blocks
- **Keep `p-3`**: Padding ensures content doesn't touch edges
- **Default behavior**: Without `justify-center`, flex defaults to `justify-start`, aligning content from the top

### Visual Impact

**Before:**
- Titles at different vertical positions (misaligned)
- Content centered within each block

**After:**
- All titles align horizontally at the top
- Content starts from the top with consistent spacing
- Professional, uniform appearance

---

**Please confirm:**
1. ✅ Approve removing `justify-center` to top-align titles
2. ❌ Prefer a different approach (e.g., specific gap/spacing adjustments)
3. ❌ Need different justification strategy

Once approved, we'll proceed with implementation.


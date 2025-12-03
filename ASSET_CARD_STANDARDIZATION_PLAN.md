# PR Plan: Standardize Asset Cards

## PR Title
**`refactor(ui): standardize asset card dimensions and display`**

---

## Phase 1: Justification & Analysis

### Component Location
✅ **Found:** `src/components/producer/AssetCard.tsx`

### Current AssetCard Analysis

**Line 40 - Main Card Container:**
```tsx
<div className={`bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] p-3 text-white relative group cursor-pointer ${...}`}>
```

**Line 75 - Asset Name Display:**
```tsx
<h3 className="text-sm font-semibold line-clamp-2 pr-16 leading-tight">
  {asset.asset_name}
</h3>
```

**Current Issues:**
1. ❌ **No fixed height** - Cards resize based on content length
2. ❌ **No title case** - Asset names displayed as-is
3. ❌ **Only shows asset name** - Missing additional context
4. ✅ **Already has `line-clamp-2`** - Good for two-line constraint, but needs fixed container height

### Grid Layout Analysis

**Line 464 - Asset Grid Container:**
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
```

- Responsive grid: 1 column (mobile) → 2 (sm) → 3 (lg) → 4 (xl)
- Gap: 16px between cards
- Cards are currently auto-sized

### Asset Interface Analysis

**Available Fields (from `src/lib/supabase.ts`):**
1. `id` - UUID
2. `project_id` - UUID
3. `asset_name` - string
4. `specifications` - string (optional)
5. `timeline` - string | null
6. `status` - 'Pending' | 'Quoting' | 'Approved' | 'In Production' | 'Delivered'
7. `assigned_supplier_id` - string | null
8. `assigned_supplier` - Supplier object (populated)
9. `source_text` - string (optional) - Used for brief highlighting
10. `quantity` - number | null
11. `tags` - string[] - Array of tag names
12. `created_at` - string
13. `updated_at` - string

---

## Phase 2: The PR Description (The Plan)

### Why
Asset cards currently have variable heights and lack visual consistency. Standardizing dimensions and adding contextual information will improve scanability and provide quick insights at a glance.

### CSS Strategy

#### 1. Fixed Height for Two-Line Text

**Approach:**
- Use a fixed height container that accommodates exactly two lines of text
- Calculate: `line-height` × 2 lines + padding

**Tailwind Classes:**
- **Fixed Height:** `h-20` (80px / 5rem)
  - Rationale: Standard Tailwind size
  - Two lines at `text-sm` (14px) with `leading-tight` (~1.25) = ~35px
  - Plus padding (`p-3` = 12px top + 12px bottom) = 24px
  - Total: ~59px (fits comfortably in 80px with room for additional data)
  
  **Alternative Options:**
  - `h-[72px]` - Tighter fit (72px = 4.5rem)
  - `h-24` (96px) - More breathing room

**Implementation:**
- Apply `h-20` to the main card container
- Keep `line-clamp-2` on the asset name to enforce two-line limit
- Use `flex flex-col justify-between` to distribute content vertically

#### 2. Title Case Transformation

**Approach:**
- Use CSS `text-transform: capitalize` OR JavaScript utility function

**Tailwind Class:**
- **Option A (CSS-only):** `capitalize`
  - Pros: Simple, no JS needed
  - Cons: Only capitalizes first letter of each word, may not handle abbreviations well
  
- **Option B (JavaScript utility):** Create `toTitleCase()` function
  - Pros: More control, handles edge cases (e.g., "LED Screen" vs "led screen")
  - Cons: Requires utility function

**Recommendation:** Use CSS `capitalize` class initially (simple), can upgrade to JS utility if needed.

**Implementation:**
- Add `capitalize` class to the asset name `<h3>` element
- If JavaScript transformation is preferred, create utility: `toTitleCase(asset.asset_name)`

---

### The 5 Attribute Suggestions

Based on the available Asset interface fields, here are **5 suggestions** for an additional piece of data to display on the card:

#### 1. **Tags (Primary Recommendation)**
- **Display:** Show the first tag (or "No tags" if empty)
- **Format:** Small badge/chip below the asset name
- **Why Useful:**
  - Visual categorization at a glance
  - Helps with quick scanning and grouping
  - Aligns with the new 50-tag taxonomy
  - Users can quickly see asset type (Audio, Lighting, Catering, etc.)
- **Example Display:** 
  ```
  Main Stage Audio System
  [Audio Equipment]
  ```

#### 2. **Quantity**
- **Display:** Show quantity if available (e.g., "×5" or "Qty: 5")
- **Format:** Small text in corner or below name
- **Why Useful:**
  - Critical for planning and ordering
  - Helps understand scale of requirements
  - Useful for bulk items (chairs, tables, microphones)
- **Example Display:**
  ```
  Wireless Microphones
  Qty: 12
  ```

#### 3. **Status Badge**
- **Display:** Current status with color coding
- **Format:** Small badge/chip (already used elsewhere in app)
- **Why Useful:**
  - Quick workflow status visibility
  - Helps prioritize work (Pending vs In Production)
  - Visual status indicators improve decision-making speed
- **Example Display:**
  ```
  LED Video Wall
  [Quoting]
  ```

#### 4. **Primary Tag (First Tag)**
- **Display:** Show the first tag from the tags array
- **Format:** Small colored badge matching tag color from `assetTags.ts`
- **Why Useful:**
  - Provides immediate category context
  - Uses the new auto-tagging feature
  - Color-coded for quick visual scanning
  - More informative than a generic "Tag" label
- **Example Display:**
  ```
  Main Stage Setup
  [Stages] (purple badge)
  ```

#### 5. **Status Icon**
- **Display:** Status-specific icon (Clock, CheckCircle, etc.) with tooltip
- **Format:** Small icon in corner
- **Why Useful:**
  - Minimal space usage
  - Universal icon language for status
  - Can show more statuses compactly
  - Less visual clutter than text badges
- **Example Display:**
  ```
  Photography Services
  ⏱️ (Pending icon)
  ```

---

## Phase 3: Impact Analysis

### ✅ Visual Consistency
- All cards will have identical dimensions
- Uniform appearance improves professional look
- Easier to scan and compare assets

### ✅ Improved Information Density
- Additional attribute provides more context at a glance
- Reduces need to click into detail modal for basic info

### ✅ CSS-Only Changes
- Fixed height: Add `h-20` class
- Title case: Add `capitalize` class
- Layout: Adjust flex structure to accommodate new attribute

### Files Affected
1. `src/components/producer/AssetCard.tsx` - Main card component
   - Add fixed height
   - Add title case
   - Add new attribute display

---

## Phase 4: Await Approval

**Status:** ⏸️ **AWAITING APPROVAL**

### Proposed CSS Strategy

**1. Fixed Height:**
- **Class:** `h-20` (80px)
- **Rationale:** Comfortably fits two lines of text + padding + additional attribute

**2. Title Case:**
- **Class:** `capitalize`
- **Rationale:** Simple CSS solution, handles most cases

**3. Layout Structure:**
```
Card Container (h-20)
  └─ Flex Column (justify-between)
      ├─ Asset Name (line-clamp-2, capitalize)
      └─ Additional Attribute (suggestions below)
```

### The 5 Attribute Suggestions

Please review and select **ONE** attribute to display:

1. ✅ **Tags** (Primary Recommendation)
   - Shows first tag or "No tags"
   - Visual categorization, aligns with new taxonomy

2. **Quantity**
   - Shows "Qty: X" if available
   - Critical for planning and ordering

3. **Status Badge**
   - Current workflow status
   - Visual status indicators

4. **Primary Tag (First Tag)** 
   - Same as #1 but with tag color from system
   - Color-coded categorization

5. **Status Icon**
   - Minimal icon in corner
   - Less visual clutter

**My Recommendation:** **#1 or #4 (Tags/Primary Tag)** - Most valuable for categorization and aligns with the new auto-tagging feature.

---

## Phase 5: Implementation Notes

### Card Structure (Proposed)

```tsx
<div className="h-20 flex flex-col justify-between p-3 ...">
  {/* Asset Name - Two lines max */}
  <h3 className="text-sm font-semibold line-clamp-2 capitalize leading-tight">
    {asset.asset_name}
  </h3>
  
  {/* Additional Attribute - Selected from suggestions */}
  <div className="text-xs opacity-90">
    {/* Chosen attribute display */}
  </div>
</div>
```

### Height Calculation

- **Container:** `h-20` = 80px
- **Padding:** `p-3` = 12px top + 12px bottom = 24px
- **Name (2 lines):** ~35-40px (14px × 1.25 leading × 2 lines)
- **Attribute line:** ~16-18px
- **Total used:** ~75-82px → `h-20` (80px) is tight but works with `justify-between`

**Alternative:** Use `h-24` (96px) if `h-20` feels cramped.

---

**Status:** ⏸️ **AWAITING APPROVAL OF:**
1. Height value: `h-20` or `h-24`?
2. Title case approach: CSS `capitalize` or JS utility?
3. Additional attribute: Which of the 5 suggestions?

Once approved, we'll proceed with implementation.


# PR Plan: Unify Assets and Brief into Tabbed Interface

## PR Title
**`feat(ui): Unify Assets and Brief into Tabbed Interface`**

---

## Phase 1: Justification & Analysis

### Current Implementation Analysis

#### 1. Component Isolation Status
✅ **Confirmed:** `AssetList` and `EditableBrief` are currently isolated components that are rendered separately in `ProjectDetailPage.tsx`.

- **AssetList Component** (`src/components/producer/AssetList.tsx`):
  - Self-contained component with its own state management
  - Handles asset fetching, filtering, sorting, and display
  - Currently takes 2/3 width when brief is expanded, full width when collapsed
  - Has props for bi-directional hover linking with brief

- **EditableBrief Component** (`src/components/producer/EditableBrief.tsx`):
  - Self-contained component with view/edit modes
  - Currently rendered twice: once as header (collapsed) and once as expanded content (1/3 width)
  - Has props for interactive asset highlighting
  - Contains download PDF, edit/view toggle, and expand/collapse actions

#### 2. Toggle Implementation Analysis

**Existing UI Components:**
- ✅ `Button` component exists (`src/components/ui/Button.tsx`)
- ❌ No existing Tab/Tabs component found in the UI library
- ✅ Custom toggle pattern can be implemented using existing design system

**Recommendation:** 
Create a custom tab switcher component that matches the existing design language (glass-morphism, white/transparent backgrounds with backdrop blur). This aligns with the current UI aesthetic seen in `ProjectDetailPage.tsx`.

#### 3. Data Relationship Analysis

**How Assets Relate to Brief:**
- Assets have an optional `source_text` field (stored in Supabase) that contains the exact text snippet from the brief
- The brief component matches asset `source_text` against brief content to create interactive highlights
- **Bi-directional hover linking already implemented:**
  - Hovering over highlighted text in brief → highlights corresponding asset card in AssetList
  - Hovering over asset card → highlights corresponding text in brief (if `source_text` matches)
- Shared state via `hoveredAssetId` prop managed in `ProjectDetailPage`

**Asset Highlighting in Brief View:**
- ✅ Already fully functional
- Uses `renderInteractiveContent()` function that:
  - Finds all asset `source_text` matches in brief text
  - Wraps matches in interactive `<mark>` elements
  - Supports click-to-open-asset-details
  - Supports hover-to-highlight-asset-card

**Conclusion:** No additional logic needed for asset highlighting within Brief view - it's already implemented and working.

---

## Phase 2: The PR Description (The Plan)

### Why: UX Benefit

**Problem Statement:**
The current layout creates visual clutter and inefficient use of screen space:
- Assets and Brief exist as separate UI blocks that compete for attention
- Side-by-side layout (when brief expanded) forces both sections into constrained widths
- Expand/collapse mechanism adds cognitive load and hides context
- The dual-rendering of Brief (header + expanded) is confusing and redundant

**Solution Benefit:**
- **Decluttered Dashboard:** Single unified container reduces visual noise
- **Focused Workflow:** Users can concentrate on one view at a time (Assets OR Brief)
- **Better Space Utilization:** Full-width view for the active tab maximizes content visibility
- **Clearer Mental Model:** Tab metaphor is universally understood and reduces learning curve
- **Maintained Context:** Quick tab switching preserves all functionality without losing state

### The Plan

#### Step 1: Create View State
**Location:** `src/components/producer/ProjectDetailPage.tsx`

- Add state: `const [activeView, setActiveView] = useState<'assets' | 'brief'>('assets')`
- Default to `'assets'` as specified
- Remove `isBriefExpanded` state (no longer needed)
- Keep `hoveredAssetId` state (still needed for bi-directional hover linking)

#### Step 2: Design Tab/Switcher UI
**Location:** Create new component or inline in `ProjectDetailPage.tsx`

**Design Requirements:**
- Match existing glass-morphism aesthetic (`bg-white/10 backdrop-blur-md border border-white/20`)
- Two tabs: "Assets" and "Brief"
- Active tab should have distinct styling (e.g., `bg-teal-600/30`, border highlight)
- Tab labels: "Assets" (with count badge) and "Brief"
- Smooth transition animations between tabs
- Responsive design (mobile-friendly tab buttons)

**Implementation Options:**
1. **Option A (Recommended):** Create reusable `TabSwitcher` component in `src/components/ui/` for future reuse
2. **Option B:** Inline implementation in `ProjectDetailPage.tsx` if this is a one-off pattern

**Recommendation:** Option A - Create reusable component for consistency and maintainability.

#### Step 3: Move Brief Download/Edit Actions
**Location:** `src/components/producer/EditableBrief.tsx`

**Current Actions in Brief Header (when collapsed):**
- Download PDF button (line 518-525)
- Edit/View mode toggle (line 528-536)
- Expand/Collapse button (line 539-550) ← **Remove this**

**Changes:**
- Keep Download PDF button in Brief tab header
- Keep Edit/View mode toggle in Brief tab header
- **Remove** Expand/Collapse button (replaced by tab switching)
- Move actions to the Brief tab header area (always visible when Brief tab is active)

**New Brief Tab Header Layout:**
```
[Brief] [Download PDF] [Edit/View Toggle]
```

#### Step 4: Implement Asset Toggling Logic in Brief View
**Status:** ✅ **Already Implemented**

**Existing Functionality (No Changes Needed):**
- Asset highlighting via `renderInteractiveContent()` function
- Click-to-open-asset-details via `onAssetClick` prop
- Hover-to-highlight-asset-card via `onAssetHover` prop
- Bi-directional linking via shared `hoveredAssetId` state

**Enhancement Opportunity (Optional):**
- When in Brief tab, show a floating/mini AssetList overlay or sidebar that shows only highlighted assets
- This is a future enhancement, not required for Phase 1

**Current Implementation is Sufficient:**
- When user switches to Brief tab, they see the brief with highlighted asset text
- Clicking highlighted text opens asset detail modal (already working)
- Hovering highlights asset cards (but cards are hidden in Brief tab - this is acceptable)

---

### Impact Analysis

#### Vercel (Frontend) Impact

**React State Changes:**
- ✅ **State Simplification:** Remove `isBriefExpanded` boolean state
- ✅ **New State:** Add `activeView` string state (`'assets' | 'brief'`)
- ✅ **State Preservation:** Keep `hoveredAssetId` for bi-directional linking
- ✅ **No Breaking Changes:** All existing props to `AssetList` and `EditableBrief` remain compatible

**Rendering Impact:**
- ✅ **Conditional Rendering:** Single container with conditional content based on `activeView`
- ✅ **No Dual Rendering:** Eliminate the dual-rendering of `EditableBrief` (header + expanded)
- ✅ **Performance:** Potentially better (only one view rendered at a time)
- ✅ **No Layout Shift:** Tab switcher takes minimal vertical space (replaces current header row)

**Component Modifications:**
- `ProjectDetailPage.tsx`: Major refactor of layout section (lines 360-472)
- `EditableBrief.tsx`: Minor changes - remove expand/collapse button, adjust header visibility logic
- `AssetList.tsx`: No changes required (may remove `isBriefExpanded` prop if not used elsewhere)

#### Supabase (Database) Impact

**Schema Changes Required:** ❌ **NONE**

**Reasoning:**
- Asset highlighting uses existing `source_text` field (already in schema)
- Highlighting state is UI-only (managed by React state)
- No need to persist "highlighted" state - it's computed dynamically from `source_text` matching
- All required data already exists in the database

**Data Flow:**
1. Assets fetched with `source_text` field from Supabase
2. Brief text fetched from project `brief_description` field
3. Matching happens client-side in `renderInteractiveContent()`
4. No database changes needed

---

## Phase 3: Implementation Steps (Once Approved)

### Implementation Order

#### 1. Scaffolding: View State & Tab UI
- [ ] Add `activeView` state to `ProjectDetailPage.tsx`
- [ ] Remove `isBriefExpanded` state and related logic
- [ ] Create `TabSwitcher` component (or inline implementation)
- [ ] Implement tab header with "Assets" and "Brief" tabs
- [ ] Add tab switching handler

#### 2. Migration: Move Assets to Tab
- [ ] Wrap `AssetList` component in conditional render based on `activeView === 'assets'`
- [ ] Update Assets tab header to show count and action buttons
- [ ] Remove Assets header block from old layout
- [ ] Test asset list functionality in new tab context

#### 3. Migration: Move Brief to Tab
- [ ] Wrap `EditableBrief` component in conditional render based on `activeView === 'brief'`
- [ ] Remove expand/collapse button from `EditableBrief` component
- [ ] Adjust `EditableBrief` to always render in "expanded" mode when in tab (no header-only mode)
- [ ] Move download/edit actions to Brief tab header
- [ ] Remove dual-rendering of `EditableBrief` (header + expanded)
- [ ] Test brief functionality in new tab context

#### 4. Interaction: Verify Asset Highlighting
- [ ] Verify bi-directional hover linking still works
- [ ] Test clicking highlighted text opens asset detail modal
- [ ] Confirm asset cards can still trigger brief highlights (if assets visible)
- [ ] Document any edge cases or limitations

---

## Technical Notes

### Edge Cases to Consider

1. **Mobile Responsiveness:**
   - Tabs should stack or become a dropdown on mobile
   - Consider touch-friendly tab sizes

2. **State Persistence:**
   - Tab selection doesn't need to persist across page reloads (default to Assets)
   - Consider URL params for deep linking in future: `?view=brief`

3. **Asset Count Badge:**
   - Show dynamic count: `Assets (${assets.length})`
   - Update in real-time as assets are added/removed

4. **Brief Actions Visibility:**
   - Download PDF and Edit/View buttons should be visible in Brief tab header
   - Consider icon-only buttons on mobile to save space

5. **Animation Transitions:**
   - Smooth fade/scale transition when switching tabs
   - Preserve scroll position if possible (separate scroll containers)

### Testing Checklist

- [ ] Tab switching works smoothly
- [ ] Assets list displays correctly in Assets tab
- [ ] Brief displays correctly in Brief tab
- [ ] Asset highlighting works in Brief tab
- [ ] Clicking highlighted text opens asset modal
- [ ] Download PDF works from Brief tab
- [ ] Edit/View mode toggle works in Brief tab
- [ ] Add Asset button works in Assets tab
- [ ] Filter toggle works in Assets tab
- [ ] Bi-directional hover linking works
- [ ] Mobile responsive design
- [ ] No console errors
- [ ] No layout shift on tab switch

---

## Phase 4: Await Approval

**Status:** ⏸️ **AWAITING APPROVAL**

This plan is complete and ready for review. Once you reply with **"LGTM"**, we will proceed to Phase 4 (Incremental Implementation).

---

## Questions for Clarification (If Needed)

1. Should tab selection persist in browser history/URL params for deep linking?
2. Should we show a mini asset preview/list when in Brief tab, or rely on clicking highlighted text only?
3. Any preference on tab styling (pill-shaped, underlined, bordered)?
4. Should the transition between tabs be instant or animated?


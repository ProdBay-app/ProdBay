# Supplier Portal Refactor Plan

## PR Title
`refactor(portal): glass aesthetic, context update, and submission modal`

## Phase 1: Analysis Summary

### Current Issues Identified

1. **Background Aesthetic:**
   - **Current:** `bg-[#0A0A0A]` (solid black) on main container (line 405)
   - **Issue:** Overrides the `DarkVeil` glass-morphism background from `GuestLayout`
   - **Solution:** Remove `bg-[#0A0A0A]` and use transparent/relative positioning to let `DarkVeil` show through

2. **Project Description:**
   - **Location:** Lines 443-449 in Project Context section
   - **Current:** Displays `project.brief_description` if available
   - **Issue:** Too detailed for supplier context
   - **Solution:** Remove the entire Description block

3. **Submission Form:**
   - **Location:** Lines 610-784
   - **Current:** `sticky bottom-0` floating form that covers content
   - **Issue:** Poor UX, blocks content visibility
   - **Solution:** Extract into modal component

### Background Pattern Analysis

**GuestLayout Structure:**
- Uses `DarkVeil` component for animated glass-morphism background
- Structure: `relative min-h-screen flex flex-col` with fixed `DarkVeil` at `z-0`
- Content layer at `relative z-10`

**Correct Pattern:**
- Main container should be `relative` (not `bg-[#0A0A0A]`)
- Let `DarkVeil` show through from parent layout
- Cards use `bg-white/5 border border-white/10` for glass effect

### Form Structure Analysis

**Current Form Section (lines 610-784):**
- Container: `sticky bottom-0` (floating overlay)
- Contains:
  - Success state (if `quoteSubmitted`)
  - Submission form (price, file upload, notes, submit button)
  - All related state: `quotePrice`, `quoteCurrency`, `quoteNotes`, `selectedFile`, `uploadingFile`, `submittingQuote`, `quoteSubmitted`
  - Handlers: `handleFileSelect`, `uploadFile`, `handleSubmitQuote`

**Extraction Plan:**
- Create `SupplierQuoteModal.tsx`
- Move all form state and handlers
- Modal should:
  - Open when "Submit Quote" button is clicked
  - Show form or success state based on `quoteSubmitted`
  - Handle file upload and quote submission
  - Close on success or user cancel

## Phase 2: Implementation Plan

### Step 1: Fix Background Aesthetic

**File:** `src/pages/portal/QuotePortal.tsx`

**Changes:**
- Line 405: Change `min-h-screen bg-[#0A0A0A]` to `relative` (remove solid background)
- Line 371 (error state): Change `bg-[#0A0A0A]` to `relative`
- Line 391 (loading state): Change `bg-[#0A0A0A]` to `relative`
- Let `GuestLayout`'s `DarkVeil` provide the background

### Step 2: Remove Project Description

**File:** `src/pages/portal/QuotePortal.tsx`

**Changes:**
- Lines 443-449: Remove the entire "Project Description" block
- Keep: Project Name, Client Name, Timeline/Deadline, Physical Parameters, Project Status

### Step 3: Extract Submission Form to Modal

**New File:** `src/components/portal/SupplierQuoteModal.tsx`

**Component Structure:**
```typescript
interface SupplierQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteId: string;
  assetName: string;
  onQuoteSubmitted: (quoteData: Quote) => void;
}
```

**State to Move:**
- `quotePrice`, `quoteCurrency`, `quoteNotes`
- `selectedFile`, `uploadingFile`, `submittingQuote`, `quoteSubmitted`
- All handlers: `handleFileSelect`, `uploadFile`, `handleSubmitQuote`

**Modal Features:**
- Portal rendering (like other modals)
- Dark theme styling
- Form validation
- File upload with progress
- Success state display
- Close button and backdrop click to close

**Update QuotePortal.tsx:**
- Remove form section (lines 610-784)
- Add state: `const [showSubmitModal, setShowSubmitModal] = useState(false)`
- Add "Submit Quote" button (fixed or inline) that opens modal
- Render `SupplierQuoteModal` component
- Pass necessary props (quoteId, assetName, handlers)

## Phase 3: Design Specifications

### Background Fix
- **Remove:** `bg-[#0A0A0A]` from all containers
- **Use:** `relative` positioning to let parent `DarkVeil` show through
- **Result:** Glass-morphism effect visible throughout

### Project Context Update
- **Remove:** Description field (lines 443-449)
- **Keep:** Project Name, Client, Timeline, Location/Logistics, Status
- **Result:** Cleaner, more focused context

### Modal Design
- **Layout:** Centered modal with backdrop
- **Styling:** Dark theme matching QuotePortal
- **Size:** `max-w-2xl` (appropriate for form)
- **Features:**
  - Header with title and close button
  - Form inputs (price, currency, file, notes)
  - Submit button
  - Success state with summary
  - Loading states

### Submit Button (Replacement)
- **Location:** After chat section or in header area
- **Style:** Purple button matching theme
- **Text:** "Submit Quote" or "Submit Your Quote"
- **Behavior:** Opens modal

## Phase 4: Code Locations

### Background Fix
- **Line 371:** Error state container
- **Line 391:** Loading state container  
- **Line 405:** Main content container

### Description Removal
- **Lines 443-449:** Project Description block

### Form Extraction
- **Lines 610-784:** Entire submission form section
- **Lines 42-51:** Form-related state declarations
- **Lines 200-294:** Form-related handlers (`handleFileSelect`, `uploadFile`, `handleSubmitQuote`)

## Phase 5: Testing Checklist

- [ ] Background shows glass-morphism effect (DarkVeil visible)
- [ ] Project Description removed from context
- [ ] Submit Quote button visible and clickable
- [ ] Modal opens when button clicked
- [ ] Form inputs work correctly in modal
- [ ] File upload works in modal
- [ ] Quote submission works from modal
- [ ] Success state displays in modal
- [ ] Modal closes on backdrop click
- [ ] Modal closes on X button
- [ ] No floating form overlay blocking content

## Summary

**Changes:**
1. Remove `bg-[#0A0A0A]` backgrounds → Use `relative` to show `DarkVeil`
2. Remove Project Description from context section
3. Extract submission form → Create `SupplierQuoteModal` component
4. Replace form with "Submit Quote" button

**Result:**
- Glass-morphism aesthetic throughout
- Cleaner project context
- Better UX with modal-based submission
- No content blocking


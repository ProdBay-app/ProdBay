# UI Refactor: Remove Redundant Quote Information

## PR Title
`refactor(ui): remove redundant quote summary from status tracker`

## Problem Analysis

### Current State: Redundant Information Display

**1. SupplierStatusTracker Component** (`src/components/producer/SupplierStatusTracker.tsx`)
- **Location:** Lines 222-278 (supplier cards within status columns)
- **Displays:**
  - ✅ Supplier name and email (lines 230-236)
  - ❌ **Quote cost** (lines 244-250) - **REDUNDANT**
  - ❌ **Notes** (lines 252-256) - **REDUNDANT** (truncated with `line-clamp-2`)
  - ❌ **Service categories/tags** (lines 261-277) - **REDUNDANT** (shows first 3)

**2. QuotesList Component** (`src/components/producer/QuotesList.tsx`)
- **Location:** Lines 232-339 (detailed quote cards)
- **Displays:**
  - ✅ Supplier name and email (lines 242-250)
  - ✅ Status badge (lines 255-258)
  - ✅ **Cost** (lines 270-277) - **FULL DETAIL**
  - ✅ **Notes** (lines 298-306) - **FULL DETAIL** (with `whitespace-pre-wrap`)
  - ✅ **PDF link** (lines 308-322) - **UNIQUE TO LIST**
  - ✅ **Service categories/tags** (lines 324-338) - **FULL LIST** (all tags)
  - ✅ **Chat button** (lines 287-294) - **ACTION**
  - ✅ **Created date** (lines 282-284) - **METADATA**

### Redundancy Identified

The **SupplierStatusTracker** is showing detailed quote information (cost, notes, tags) that is **already fully displayed** in the **QuotesList** below. This creates:
- ❌ Duplicate information
- ❌ Cluttered UI
- ❌ Confusion about where to find details
- ❌ Maintenance burden (two places to update)

---

## Solution: Separation of Concerns

### Goal
- **Top Section (Status Blocks):** High-level metrics only (counts)
- **Bottom Section (QuotesList):** Detailed data and actions

### Implementation Plan

#### Step 1: Simplify SupplierStatusTracker Cards

**Current:** Supplier cards show full quote details (cost, notes, tags)

**Proposed:** Supplier cards show minimal information:
- ✅ Supplier name
- ✅ Supplier email
- ✅ Last activity date (for sorting/context)
- ❌ Remove quote cost display
- ❌ Remove notes display
- ❌ Remove service categories/tags

**Rationale:**
- Status blocks should be a **dashboard** (quick overview)
- Detailed information belongs in the **ledger** (QuotesList)
- Cards can still be clickable to scroll to the detailed quote in the list below

#### Step 2: Verify QuotesList Completeness

**Current QuotesList already includes:**
- ✅ Supplier name and email
- ✅ Cost (formatted currency)
- ✅ Notes (full text, not truncated)
- ✅ PDF document link
- ✅ Service categories (all tags, not just first 3)
- ✅ Status badge
- ✅ Chat button
- ✅ Created date

**No changes needed** - QuotesList is already comprehensive.

#### Step 3: Optional Enhancement

**Consider:** Make supplier cards in StatusTracker clickable to scroll/jump to the corresponding quote in QuotesList (future enhancement, not required for this PR).

---

## Code Changes

### File: `src/components/producer/SupplierStatusTracker.tsx`

**Remove:**
- Lines 243-258: Quote Info section (cost and notes display)
- Lines 260-277: Service Categories section

**Keep:**
- Lines 222-241: Supplier Info section (name, email, last activity)
- Status headers with counts (already correct)

**Result:**
- Supplier cards become minimal "badges" showing only supplier identity
- Status columns remain functional for quick overview
- All detailed information moves to QuotesList

---

## Verification Checklist

### Before Implementation
- [x] Identified redundant code block (lines 243-277 in SupplierStatusTracker)
- [x] Confirmed QuotesList has all necessary details
- [x] Verified no unique information is lost

### After Implementation
- [ ] Status blocks show only counts and supplier names
- [ ] Supplier cards show only name, email, and date
- [ ] QuotesList still displays all quote details (cost, notes, PDF, tags)
- [ ] UI is cleaner and less cluttered
- [ ] No broken functionality

---

## Expected Outcome

### Before:
```
[Status Blocks]
├── Requested (2)
│   └── Supplier Card: Name, Email, Cost, Notes, Tags
├── Quoted (1)
│   └── Supplier Card: Name, Email, Cost, Notes, Tags
└── Assigned (0)

[QuotesList]
└── Detailed Quote Cards: Name, Email, Cost, Notes, PDF, Tags, Actions
```

### After:
```
[Status Blocks - Dashboard View]
├── Requested (2)
│   └── Supplier Card: Name, Email, Date
├── Quoted (1)
│   └── Supplier Card: Name, Email, Date
└── Assigned (0)

[QuotesList - Detailed Ledger]
└── Detailed Quote Cards: Name, Email, Cost, Notes, PDF, Tags, Actions
```

---

## Questions for Confirmation

1. **Should supplier cards be completely removed from status columns?**
   - Option A: Keep minimal cards (name, email, date) ✅ **RECOMMENDED**
   - Option B: Remove cards entirely, show only counts

2. **Should we add click-to-scroll functionality?**
   - Future enhancement: Click supplier card → scroll to quote in list below
   - Not required for this PR

---

## Next Steps

**STOP - Awaiting Approval**

Please confirm:
1. ✅ Remove quote cost, notes, and tags from SupplierStatusTracker cards
2. ✅ Keep only supplier name, email, and date in status cards
3. ✅ QuotesList remains unchanged (already comprehensive)

Once approved, proceed with implementation.


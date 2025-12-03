# Quote Acceptance & Exclusivity Feature Plan

## PR Title
`feat(workflow): implement quote acceptance and exclusivity logic`

## Phase 1: Analysis Summary

### Database Schema Confirmed

**Quote Status Enum:**
- `'Pending'` - Quote requested, awaiting supplier response
- `'Submitted'` - Supplier has submitted their quote
- `'Accepted'` - Producer has accepted the quote ✅
- `'Rejected'` - Producer has rejected the quote

**Asset Status Enum:**
- `'Pending'` - Initial state
- `'Quoting'` - Quotes requested
- `'Approved'` - Asset approved (quote accepted) ✅
- `'In Production'` - Asset in production
- `'Delivered'` - Asset delivered

**Asset Fields:**
- `assigned_supplier_id` (string | null) - UUID of the assigned supplier
- `status` (AssetStatus) - Current asset status
- **Note:** Assets do NOT have a `cost` field. Cost is stored in the Quote table and calculated from accepted quotes.

### Existing Code Patterns

**Frontend Pattern (automationService.ts):**
- `acceptQuote(quoteId)` function exists but is frontend-only
- Sets quote status to `'Accepted'`
- Rejects other quotes for the same asset
- Updates asset: `assigned_supplier_id` and `status: 'Approved'`
- **Missing:** Backend endpoint, proper error handling, transaction safety

**Frontend Pattern (QuoteComparisonModal.tsx):**
- Similar logic but only updates quotes (doesn't update asset)
- Uses direct Supabase calls from frontend

### Key Findings

1. **Status Values:**
   - Quote: Use `'Accepted'` (NOT 'Approved')
   - Asset: Use `'Approved'` (as per existing pattern in automationService.ts)

2. **Asset Cost:**
   - Assets don't store cost directly
   - Cost is stored in `quotes.cost`
   - Total project cost is calculated from accepted quotes
   - **No need to update asset.cost** (field doesn't exist)

3. **Transaction Safety:**
   - Current frontend implementation doesn't use transactions
   - Backend should use a transaction or batch update for atomicity

## Phase 2: Implementation Plan

### Backend Implementation

**New File:** `railway-backend/services/quoteService.js`

**Method:** `acceptQuote(quoteId)`

**Logic:**
1. Fetch quote by ID (with asset_id and supplier_id)
2. Validate quote exists and status is `'Submitted'`
3. **Transaction/Batch Update:**
   - Update target quote: `status = 'Accepted'`
   - Update all other quotes for same asset: `status = 'Rejected'`
   - Update asset: `assigned_supplier_id = quote.supplier_id`, `status = 'Approved'`
4. Return updated quote and asset data

**New Route:** `railway-backend/routes/quotes.js`

**Endpoint:** `POST /api/quotes/:id/accept`

**Request:**
- `:id` - Quote ID (UUID)

**Response:**
```json
{
  "success": true,
  "data": {
    "quote": { ... },
    "asset": { ... }
  },
  "message": "Quote accepted successfully"
}
```

**Error Handling:**
- 404: Quote not found
- 400: Quote already accepted/rejected
- 400: Quote status is not 'Submitted'
- 500: Database error

### Frontend Implementation

**New Service Method:** `src/services/producerService.ts`

**Method:** `acceptQuote(quoteId: string)`

**Logic:**
- Call backend endpoint `POST /api/quotes/:id/accept`
- Return updated quote and asset data

**Update Component:** `src/components/producer/QuoteDetailModal.tsx`

**Changes:**
1. Add "Accept Quote" button:
   - Visible only when `quote.status === 'Submitted'`
   - Primary action button (purple gradient)
   - Position: Below quote details, above chat section
2. Add handler: `handleAcceptQuote`
   - Call `ProducerService.acceptQuote(quote.id)`
   - Show loading state
   - On success:
     - Show success notification
     - Refresh quote data (or update local state)
     - Optionally close modal or show updated status
   - On error: Show error notification

**UI Placement:**
- In the left column (Quote Details section)
- After the status badge
- Before the chat section

## Phase 3: Status Enum Clarification

### Confirmed Values

**Quote Status:**
- ✅ Use `'Accepted'` (NOT 'Approved')
- This matches the existing enum and database schema

**Asset Status:**
- ✅ Use `'Approved'` (as per existing pattern in automationService.ts)
- Alternative could be `'In Production'` but `'Approved'` is more appropriate for quote acceptance

**Asset Cost:**
- ❌ Do NOT try to set `asset.cost` (field doesn't exist)
- Cost is stored in `quotes.cost` and calculated from accepted quotes

## Phase 4: Implementation Details

### Backend Service Structure

```javascript
// railway-backend/services/quoteService.js
class QuoteService {
  static async acceptQuote(quoteId) {
    // 1. Fetch quote with asset_id and supplier_id
    // 2. Validate quote exists and is 'Submitted'
    // 3. Use Supabase transaction or batch update:
    //    - Update quote status to 'Accepted'
    //    - Update other quotes to 'Rejected'
    //    - Update asset: assigned_supplier_id and status
    // 4. Return updated data
  }
}
```

### Frontend Service Method

```typescript
// src/services/producerService.ts
static async acceptQuote(quoteId: string): Promise<{
  quote: Quote;
  asset: Asset;
}> {
  // Call Railway backend endpoint
  // Return typed response
}
```

### Component Update

```typescript
// src/components/producer/QuoteDetailModal.tsx
const handleAcceptQuote = async () => {
  if (!quote || quote.status !== 'Submitted') return;
  
  setAccepting(true);
  try {
    const result = await ProducerService.acceptQuote(quote.id);
    showSuccess('Quote accepted successfully');
    // Update local state or refresh
    onQuoteUpdate?.();
  } catch (error) {
    showError('Failed to accept quote');
  } finally {
    setAccepting(false);
  }
};

// In JSX:
{quote.status === 'Submitted' && (
  <button onClick={handleAcceptQuote}>
    Accept Quote
  </button>
)}
```

## Phase 5: Testing Checklist

- [ ] Backend endpoint accepts valid quote
- [ ] Backend rejects quote that doesn't exist
- [ ] Backend rejects quote that's already accepted
- [ ] Backend rejects quote that's not 'Submitted'
- [ ] Backend updates target quote to 'Accepted'
- [ ] Backend updates other quotes to 'Rejected'
- [ ] Backend updates asset with supplier and status
- [ ] Frontend button only shows for 'Submitted' quotes
- [ ] Frontend button calls backend correctly
- [ ] Frontend shows success notification
- [ ] Frontend updates UI after acceptance
- [ ] Only one quote can be accepted per asset
- [ ] Asset status updates to 'Approved'

## Summary

**Key Decisions:**
1. Quote status: `'Accepted'` (not 'Approved')
2. Asset status: `'Approved'` (matches existing pattern)
3. Asset cost: Not stored on asset (calculated from quotes)
4. Backend endpoint: New `/api/quotes/:id/accept`
5. Frontend button: In QuoteDetailModal, visible for 'Submitted' quotes only

**Implementation Order:**
1. Backend service and route
2. Frontend service method
3. Component button and handler
4. Testing and verification


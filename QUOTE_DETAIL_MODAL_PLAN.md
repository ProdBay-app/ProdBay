# Unified Quote Detail & Chat Modal

## PR Title
`feat(ui): unify quote details and chat into a single modal`

## Problem Analysis

### Current State

**1. Chat Implementation** (`src/pages/dashboard/ProducerQuoteChat.tsx`)
- ✅ **Found:** Full-page chat component
- ✅ **Structure:** Well-organized with clear separation of concerns
- ✅ **Features:**
  - Message fetching via `QuoteService.getQuoteMessages(quoteId)`
  - Message polling (every 8 seconds)
  - Optimistic UI for message sending
  - Auto-scroll to bottom
  - Loading and error states
- ✅ **Extractable:** Yes - Chat UI (lines 238-319) can be extracted into reusable component

**2. Current Triggers**
- **QuotesList:** Has "Chat" button that navigates to `/dashboard/quotes/${quote.id}/chat` (line 288)
- **SupplierStatusTracker:** Supplier cards are not clickable (lines 222-234)

**3. Parent Component**
- **AssetDetailModal:** Houses both `SupplierStatusTracker` and `QuotesList`
- Perfect location for modal state management

---

## Solution: Unified Quote Detail Modal

### Architecture

```
AssetDetailModal
├── SupplierStatusTracker (onQuoteClick handler)
├── QuotesList (onQuoteClick handler)
└── QuoteDetailModal (new)
    ├── Quote Details Panel (left/top)
    │   ├── Supplier Info
    │   ├── Cost
    │   ├── Status Badge
    │   ├── Notes
    │   ├── PDF Link
    │   └── Service Categories
    └── Chat Interface Panel (right/bottom)
        ├── Message List
        ├── Message Input
        └── Send Button
```

---

## Implementation Plan

### Phase 1: Extract Chat Component

**File:** `src/components/shared/QuoteChat.tsx` (new)

**Extract from:** `ProducerQuoteChat.tsx` (lines 238-319)

**Props Interface:**
```typescript
interface QuoteChatProps {
  quoteId: string;
  supplierName: string;
  assetName: string;
  onMessageSent?: () => void;
}
```

**Features to Extract:**
- Message list rendering (lines 255-290)
- Message input and send (lines 293-318)
- Message polling logic (lines 84-100, 171-181)
- Auto-scroll functionality (lines 47-49, 184-186)
- Optimistic UI updates (lines 109-145)

**Remove:**
- Route-dependent logic (`useParams`, `useNavigate`)
- Page-level layout (header, back button)
- Quote data fetching (will be passed as props)

**Keep:**
- All message fetching/sending logic
- Polling mechanism
- Optimistic UI
- Error handling

---

### Phase 2: Create Quote Detail Modal

**File:** `src/components/producer/QuoteDetailModal.tsx` (new)

**Props Interface:**
```typescript
interface QuoteDetailModalProps {
  isOpen: boolean;
  quote: Quote | null;
  onClose: () => void;
  onQuoteUpdate?: () => void;
}
```

**Layout:**
- **Desktop:** Two-column grid (`grid-cols-2`)
- **Mobile:** Stacked layout (`flex-col`)

**Left/Top Panel - Quote Details:**
- Supplier name and email
- Status badge
- Cost (formatted currency)
- Notes (if available)
- PDF document link (if available)
- Service categories/tags
- Created/Updated dates

**Right/Bottom Panel - Chat:**
- `<QuoteChat />` component
- Pass `quoteId`, `supplierName`, `assetName` as props

**Modal Features:**
- Portal rendering (like `AssetDetailModal`)
- Escape key to close
- Backdrop click to close
- Loading state while fetching quote data
- Error state if quote not found

---

### Phase 3: Update Parent Component

**File:** `src/components/producer/AssetDetailModal.tsx`

**Changes:**
1. Add state:
   ```typescript
   const [activeQuote, setActiveQuote] = useState<Quote | null>(null);
   ```

2. Add handlers:
   ```typescript
   const handleQuoteClick = (quote: Quote) => {
     setActiveQuote(quote);
   };
   
   const handleCloseQuoteModal = () => {
     setActiveQuote(null);
   };
   ```

3. Render modal:
   ```typescript
   <QuoteDetailModal
     isOpen={activeQuote !== null}
     quote={activeQuote}
     onClose={handleCloseQuoteModal}
     onQuoteUpdate={() => {
       // Refresh quotes list if needed
     }}
   />
   ```

---

### Phase 4: Wire Up Triggers

**File:** `src/components/producer/QuotesList.tsx`

**Changes:**
1. Add prop:
   ```typescript
   interface QuotesListProps {
     assetId: string;
     assetName: string;
     onQuoteClick?: (quote: Quote) => void; // NEW
   }
   ```

2. Replace Chat button (line 287-294):
   ```typescript
   <button
     onClick={() => onQuoteClick?.(quote)}
     className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
     title="View quote details and chat"
   >
     <MessageCircle className="w-4 h-4" />
     <span>View Details</span>
   </button>
   ```

3. Make entire quote card clickable (optional enhancement):
   ```typescript
   <div
     key={quote.id}
     className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4 hover:bg-white/20 transition-colors cursor-pointer"
     onClick={() => onQuoteClick?.(quote)}
   >
   ```

**File:** `src/components/producer/SupplierStatusTracker.tsx`

**Changes:**
1. Add prop:
   ```typescript
   interface SupplierStatusTrackerProps {
     asset: Asset;
     onStatusUpdate?: () => void;
     onQuoteClick?: (quote: Quote) => void; // NEW
   }
   ```

2. Make supplier cards clickable (line 223):
   ```typescript
   <div
     key={supplier.id}
     className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3 hover:bg-white/20 transition-colors cursor-pointer"
     onClick={() => {
       if (quote) {
         onQuoteClick?.(quote);
       }
     }}
   >
   ```

3. Pass quote to handler:
   - Supplier cards already have `quote` in the map (line 222)
   - Use it in onClick handler

---

### Phase 5: Update AssetDetailModal Integration

**File:** `src/components/producer/AssetDetailModal.tsx`

**Changes:**
1. Pass `onQuoteClick` to both components:
   ```typescript
   <SupplierStatusTracker 
     asset={asset}
     onStatusUpdate={() => {}}
     onQuoteClick={handleQuoteClick}
   />
   
   <QuotesList 
     assetId={asset.id} 
     assetName={asset.asset_name}
     onQuoteClick={handleQuoteClick}
   />
   ```

---

## File Structure

```
src/
├── components/
│   ├── producer/
│   │   ├── AssetDetailModal.tsx (updated)
│   │   ├── QuoteDetailModal.tsx (new)
│   │   ├── QuotesList.tsx (updated)
│   │   └── SupplierStatusTracker.tsx (updated)
│   └── shared/
│       └── QuoteChat.tsx (new)
└── pages/
    └── dashboard/
        └── ProducerQuoteChat.tsx (deprecated - can be removed later)
```

---

## Verification Checklist

### Phase 1: Chat Component Extraction
- [ ] `QuoteChat.tsx` renders message list correctly
- [ ] Message sending works
- [ ] Polling continues to work
- [ ] Auto-scroll functions properly
- [ ] Optimistic UI updates correctly

### Phase 2: Modal Creation
- [ ] Modal opens/closes correctly
- [ ] Quote details display all information
- [ ] Chat interface renders inside modal
- [ ] Responsive layout works (desktop 2-column, mobile stacked)
- [ ] Escape key closes modal
- [ ] Backdrop click closes modal

### Phase 3: Parent Integration
- [ ] `activeQuote` state manages correctly
- [ ] Modal opens when quote is selected
- [ ] Modal closes when `activeQuote` is null

### Phase 4: Trigger Wiring
- [ ] Clicking quote card in `QuotesList` opens modal
- [ ] Clicking supplier card in `SupplierStatusTracker` opens modal (if quote exists)
- [ ] Both triggers pass correct quote data

### Phase 5: End-to-End Testing
- [ ] Quote details display correctly in modal
- [ ] Chat messages load and display
- [ ] Sending messages works
- [ ] Message polling continues in modal
- [ ] Closing modal doesn't break state
- [ ] Opening different quotes updates modal content

---

## Questions for Confirmation

1. **Chat Component Extraction:**
   - ✅ Confirmed: Chat logic can be extracted from `ProducerQuoteChat.tsx`
   - Should we keep the old chat page route for backward compatibility, or remove it?

2. **Modal Layout:**
   - Desktop: Two-column (details left, chat right) ✅ **RECOMMENDED**
   - Mobile: Stacked (details top, chat bottom) ✅ **RECOMMENDED**
   - Alternative: Tabs (Details tab, Chat tab) - Not recommended (less efficient)

3. **Quote Data Fetching:**
   - Option A: Fetch quote data in modal (requires quoteId only) ✅ **RECOMMENDED**
   - Option B: Pass full quote object from parent (requires quote object)
   - **Recommendation:** Option A - Modal fetches its own data for consistency

4. **SupplierStatusTracker Click:**
   - Should clicking a supplier card open modal even if no quote exists?
   - **Recommendation:** Only if `quote` exists (conditional onClick)

---

## Next Steps

**STOP - Awaiting Approval**

Please confirm:
1. ✅ Extract chat component from `ProducerQuoteChat.tsx`
2. ✅ Create `QuoteDetailModal` with two-panel layout
3. ✅ Wire up triggers from both `QuotesList` and `SupplierStatusTracker`
4. ✅ Manage modal state in `AssetDetailModal`

Once approved, proceed with implementation in the order specified above.


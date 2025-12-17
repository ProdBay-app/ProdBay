# PR: Display Initial Quote Request in Supplier Portal and Producer Chat

## Title
`feat(ui): display initial quote request in supplier portal and producer chat`

## Why

**Current State:**
- Quote request email body and attachments are persisted in the database
- However, this data is not displayed anywhere in the UI
- Suppliers cannot see the original request in the portal
- Producers cannot see what was sent to suppliers in the chat interface
- Missing context for both parties when reviewing quote history

**Business Need:**
- **Supplier Portal:** Suppliers need to reference the original quote request email and attachments when submitting quotes
- **Producer Chat:** Producers need to see what was originally sent to suppliers for context in conversations
- **Audit Trail:** Both parties should have access to the complete quote request history
- **User Experience:** Displaying the original request provides clarity and reduces confusion

**Technical Need:**
- Backend queries must fetch the new fields (`request_email_body`, `quote_request_attachments`)
- Frontend interfaces must include these fields
- UI components must render the data appropriately
- Chat interface must synthesize a "system" message from quote data (not from messages table)

## The Plan

### 1. Backend: Update Portal Service Queries

#### 1.1 Update `validateAccessToken` Method
**File:** `railway-backend/services/portalService.js`
- **Location:** Lines 24-45
- **Change:** Update the `.select()` query to include `request_email_body` and join `quote_request_attachments`
- **Implementation:**
  ```javascript
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select(`
      *,
      supplier:suppliers(*),
      asset:assets(
        *,
        project:projects(
          id,
          project_name,
          client_name,
          brief_description,
          physical_parameters,
          timeline_deadline,
          project_status,
          created_at,
          updated_at
        )
      ),
      request_attachments:quote_request_attachments(*)
    `)
    .eq('access_token', token)
    .single();
  ```
- **Note:** The `*` in quotes select will include `request_email_body` automatically

#### 1.2 Update `getPortalSession` Method
**File:** `railway-backend/services/portalService.js`
- **Location:** Lines 79-116
- **Change:** Include `request_email_body` and `request_attachments` in the returned quote object
- **Implementation:**
  ```javascript
  return {
    quote: {
      id: quote.id,
      supplier_id: quote.supplier_id,
      asset_id: quote.asset_id,
      cost: quote.cost,
      notes_capacity: quote.notes_capacity,
      status: quote.status,
      access_token: quote.access_token,
      request_email_body: quote.request_email_body, // Add this
      request_attachments: quote.request_attachments || [], // Add this
      created_at: quote.created_at,
      updated_at: quote.updated_at
    },
    asset: quote.asset,
    project: quote.asset?.project,
    supplier: quote.supplier,
    messages: messages || []
  };
  ```

#### 1.3 Update `getQuoteMessages` Method
**File:** `railway-backend/services/portalService.js`
- **Location:** Lines 474-532
- **Change:** Update the quote select query to include `request_email_body` and join `quote_request_attachments`
- **Implementation:**
  ```javascript
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select(`
      *,
      supplier:suppliers(*),
      asset:assets(
        *,
        project:projects(*)
      ),
      request_attachments:quote_request_attachments(*)
    `)
    .eq('id', quoteId)
    .single();
  ```
- **Change:** Include fields in returned quote object (same as 1.2)

### 2. Frontend: Update TypeScript Interfaces

#### 2.1 Update Portal Service Interface
**File:** `src/services/portalService.ts`
- **Location:** Lines 18-29 (Quote interface)
- **Change:** Add `request_email_body` and `request_attachments` fields
- **Implementation:**
  ```typescript
  export interface Quote {
    id: string;
    supplier_id: string;
    asset_id: string;
    cost: number;
    notes_capacity: string;
    status: 'Pending' | 'Submitted' | 'Accepted' | 'Rejected';
    access_token: string;
    quote_document_url?: string;
    request_email_body?: string; // Add this
    request_attachments?: Array<{ // Add this
      id: string;
      quote_id: string;
      filename: string;
      storage_path: string;
      storage_url: string;
      file_size_bytes: number;
      content_type: string;
      created_at: string;
    }>;
    created_at: string;
    updated_at: string;
  }
  ```

#### 2.2 Update Quote Service Interface
**File:** `src/services/quoteService.ts`
- **Location:** Lines 20-30 (Quote interface)
- **Change:** Add same fields as 2.1

#### 2.3 Update Supabase Library Interface
**File:** `src/lib/supabase.ts`
- **Location:** Lines 128-150 (Quote interface)
- **Change:** Add same fields as 2.1

### 3. Frontend: Supplier Portal UI

#### 3.1 Create "Original Request" Section Component
**File:** `src/components/portal/OriginalRequestCard.tsx` (NEW)
- **Purpose:** Reusable component to display the original quote request
- **Props:**
  ```typescript
  interface OriginalRequestCardProps {
    emailBody?: string;
    attachments?: Array<{
      id: string;
      filename: string;
      storage_url: string;
      file_size_bytes: number;
      content_type: string;
    }>;
  }
  ```
- **Features:**
  - Display email body in a formatted card
  - List attachments as downloadable links
  - Show file sizes and types
  - Handle empty state (no request data)
  - Styled to match portal design (dark theme)

#### 3.2 Integrate into Quote Portal
**File:** `src/pages/portal/QuotePortal.tsx`
- **Location:** Left column (Context section), after Project Context card
- **Change:** Add `<OriginalRequestCard />` component
- **Data Source:** `session.quote.request_email_body` and `session.quote.request_attachments`
- **Conditional Rendering:** Only show if `request_email_body` exists

### 4. Frontend: Producer Chat Interface

#### 4.1 Create Synthesized Message Helper
**File:** `src/utils/quoteRequestMessage.ts` (NEW)
- **Purpose:** Utility to create a synthesized message from quote request data
- **Function:**
  ```typescript
  export function createInitialRequestMessage(quote: {
    request_email_body?: string;
    request_attachments?: Array<{
      id: string;
      filename: string;
      storage_url: string;
      file_size_bytes: number;
      content_type: string;
      created_at: string;
    }>;
    created_at: string;
  }): Message | null {
    if (!quote.request_email_body) return null;
    
    // Build message content with email body and attachment links
    let content = quote.request_email_body;
    
    if (quote.request_attachments && quote.request_attachments.length > 0) {
      content += '\n\n📎 Attachments:\n';
      quote.request_attachments.forEach(att => {
        const sizeMB = (att.file_size_bytes / (1024 * 1024)).toFixed(2);
        content += `• ${att.filename} (${sizeMB} MB) - ${att.storage_url}\n`;
      });
    }
    
    return {
      id: `initial-request-${quote.created_at}`, // Synthetic ID
      quote_id: '', // Will be set by caller
      sender_type: 'PRODUCER',
      content: content,
      created_at: quote.created_at, // Use quote creation date
      is_read: false
    };
  }
  ```

#### 4.2 Update Producer Quote Chat
**File:** `src/pages/dashboard/ProducerQuoteChat.tsx`
- **Location:** `loadQuoteData` function (lines 52-81)
- **Change:** After loading messages, prepend synthesized initial request message
- **Implementation:**
  ```typescript
  const loadQuoteData = useCallback(async () => {
    // ... existing code ...
    
    setQuoteData({
      quote: response.data.quote,
      asset: response.data.asset,
      supplier: response.data.supplier
    });
    
    // Prepend initial request message if it exists
    const initialRequest = createInitialRequestMessage(response.data.quote);
    const allMessages = initialRequest
      ? [initialRequest, ...(response.data.messages || [])]
      : (response.data.messages || []);
    
    setMessages(allMessages);
    // ... rest of code ...
  }, [quoteId]);
  ```

#### 4.3 Update Shared Quote Chat Component
**File:** `src/components/shared/QuoteChat.tsx`
- **Location:** `loadMessages` function (lines 48-72)
- **Change:** Similar to 4.2, prepend initial request message
- **Note:** This component needs access to quote data, may need to pass quote as prop or fetch it

#### 4.4 Update Message Display to Handle Synthesized Messages
**File:** `src/pages/dashboard/ProducerQuoteChat.tsx` and `src/components/shared/QuoteChat.tsx`
- **Location:** Message rendering (lines 222-249)
- **Change:** Add visual distinction for synthesized initial request message
- **Implementation:**
  - Check if message ID starts with `initial-request-`
  - Apply different styling (e.g., border, background color, icon)
  - Add label "Original Request" or similar
  - Ensure attachments are clickable links

### 5. Frontend: Message Type Safety

#### 5.1 Update Message Interface (if needed)
**Files:** 
- `src/services/quoteService.ts`
- `src/services/portalService.ts`
- `src/components/shared/QuoteChat.tsx`

- **Change:** Ensure Message interface allows for synthetic IDs
- **Note:** Current interface should work, but verify `id` field can be string (not strictly UUID)

## Impact Analysis

### Backend Changes
- **Query Performance:**
  - Adding join to `quote_request_attachments` adds one additional table join
  - Impact: Minimal (indexed on `quote_id`, typically 0-10 attachments per quote)
  - **Mitigation:** Join is efficient with proper indexing

- **Response Payload Size:**
  - `request_email_body`: ~1-5KB per quote (text field)
  - `request_attachments`: ~200 bytes per attachment × 10 max = ~2KB
  - **Total:** ~3-7KB additional per quote
  - **Impact:** Negligible for API responses

### Frontend Changes
- **Type Safety:**
  - All interfaces updated to include new optional fields
  - Backward compatible (fields are optional)
  - **Risk:** 🟢 Low

- **UI Rendering:**
  - Supplier Portal: New card component (conditional rendering)
  - Producer Chat: Synthesized message prepended to array
  - **Risk:** 🟡 Medium (synthetic message handling needs careful testing)

- **Synthesized Message Considerations:**
  - **ID Format:** Uses `initial-request-{timestamp}` to avoid conflicts
  - **No Database Record:** Message doesn't exist in `messages` table
  - **Polling Impact:** Polling won't fetch this message (it's client-side only)
  - **Optimistic UI:** Should not interfere with optimistic message handling
  - **Risk:** 🟡 Medium - Need to ensure synthetic message doesn't break:
    - Message filtering
    - Message updates
    - Optimistic UI
    - Polling logic

### Data Flow Verification
1. **Backend → Frontend:**
   - Backend includes `request_email_body` and `request_attachments` in quote object
   - Frontend receives data via existing API endpoints
   - No new endpoints required

2. **Supplier Portal:**
   - `PortalService.getSession()` returns quote with new fields
   - `OriginalRequestCard` component renders the data
   - Attachments are clickable links to Storage URLs

3. **Producer Chat:**
   - `QuoteService.getQuoteMessages()` returns quote with new fields
   - `createInitialRequestMessage()` synthesizes message object
   - Message prepended to messages array before rendering
   - Rendered as first message in chat timeline

### Edge Cases
- **No Request Data:** If `request_email_body` is null/undefined, don't show Original Request section
- **Empty Attachments:** If `request_attachments` is empty array, only show email body
- **Old Quotes:** Quotes created before migration won't have request data (handled by optional fields)
- **Synthetic Message Conflicts:** Ensure synthetic ID format doesn't conflict with real message IDs

## Testing Checklist

- [ ] Backend returns `request_email_body` in quote object
- [ ] Backend returns `request_attachments` array in quote object
- [ ] Supplier Portal displays "Original Request" section when data exists
- [ ] Supplier Portal hides "Original Request" section when data is missing
- [ ] Attachments are clickable and download correctly
- [ ] File sizes display correctly (MB format)
- [ ] Producer Chat shows initial request as first message
- [ ] Initial request message has correct styling (distinct from regular messages)
- [ ] Initial request message shows attachments as links
- [ ] Polling doesn't duplicate or remove synthetic message
- [ ] Optimistic UI doesn't interfere with synthetic message
- [ ] Old quotes (without request data) still work correctly
- [ ] Message timeline is chronologically correct (initial request first)

## Files to Create

1. `src/components/portal/OriginalRequestCard.tsx` (NEW)
2. `src/utils/quoteRequestMessage.ts` (NEW)

## Files to Modify

1. `railway-backend/services/portalService.js`
   - Update `validateAccessToken` query (add join)
   - Update `getPortalSession` return object
   - Update `getQuoteMessages` query and return object

2. `src/services/portalService.ts`
   - Update `Quote` interface

3. `src/services/quoteService.ts`
   - Update `Quote` interface

4. `src/lib/supabase.ts`
   - Update `Quote` interface

5. `src/pages/portal/QuotePortal.tsx`
   - Add `OriginalRequestCard` component

6. `src/pages/dashboard/ProducerQuoteChat.tsx`
   - Import and use `createInitialRequestMessage`
   - Prepend synthesized message to messages array
   - Update message rendering for synthetic message styling

7. `src/components/shared/QuoteChat.tsx`
   - Import and use `createInitialRequestMessage` (if quote data available)
   - Prepend synthesized message
   - Update message rendering

## Risk Assessment

**Risk Level:** 🟡 **Medium**
- **Backend:** Low risk (additive query changes, backward compatible)
- **Frontend Interfaces:** Low risk (optional fields, backward compatible)
- **UI Components:** Medium risk (new components, conditional rendering)
- **Synthesized Messages:** Medium risk (client-side message creation, needs careful handling)
- **Testing:** Requires thorough testing of edge cases (empty data, old quotes, polling)

## Compliance Notes

- **Data Privacy:** Original request data is only shown to authorized parties (supplier via token, producer via auth)
- **Access Control:** RLS policies ensure proper access to `quote_request_attachments` table
- **User Experience:** Provides complete context for both parties without exposing sensitive project data (already filtered in previous PR)


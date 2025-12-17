# PR: Render Interactive Attachment Links for Original Quote Request in Chat

## Title
`feat(chat): render interactive attachment links for original quote request`

## Why

**Current State:**
- The "Original Request" message in Producer Chat displays attachments as plain text in the message content
- Format: `📎 Attachments:\n• Contract.pdf (2MB)\n  https://storage.url/...`
- This is not user-friendly - users must manually copy/paste URLs
- Does not match the Supplier Portal experience (which has clickable download links)

**User Experience Issues:**
- No visual distinction for attachments (just text)
- No clickable links - users must manually copy URLs
- Poor accessibility - screen readers can't identify links
- Inconsistent with Supplier Portal design (which has proper attachment cards)

**Business Need:**
- Better UX for producers viewing original quote requests
- Consistency with Supplier Portal attachment display
- Improved accessibility and usability
- Professional appearance matching the rest of the application

**Technical Need:**
- Leverage structured `request_attachments` data instead of embedding in text
- Render interactive UI components (clickable links with icons)
- Maintain backward compatibility with existing message structure

## The Plan

### 1. Extend Message Interface to Support Attachments
**File:** `src/services/quoteService.ts`
- **Location:** Lines 11-18 (`Message` interface)
- **Change:** Add optional `attachments` field for synthetic messages
- **Implementation:**
  ```typescript
  export interface Message {
    id: string;
    quote_id: string;
    sender_type: 'PRODUCER' | 'SUPPLIER';
    content: string;
    created_at: string;
    is_read: boolean;
    // Optional: For synthetic "initial request" messages only
    attachments?: QuoteRequestAttachment[];
  }
  ```
- **Rationale:** Allows synthetic messages to carry attachment metadata without breaking existing message structure

### 2. Update Initial Request Message Creator
**File:** `src/utils/quoteRequestMessage.ts`
- **Location:** Lines 11-47 (`createInitialRequestMessage` function)
- **Changes:**
  1. Remove attachment text from `content` (lines 27-34)
  2. Keep only the email body in `content`
  3. Add `attachments` field to returned message object
- **Implementation:**
  ```typescript
  export function createInitialRequestMessage(
    quote: {
      request_email_body?: string;
      request_attachments?: QuoteRequestAttachment[];
      created_at: string;
    },
    quoteId: string
  ): Message | null {
    if (!quote.request_email_body) {
      return null;
    }

    // Only include email body in content (no attachment text)
    const content = quote.request_email_body;

    // Create synthesized message object with attachments metadata
    return {
      id: `initial-request-${quote.created_at}`,
      quote_id: quoteId,
      sender_type: 'PRODUCER',
      content: content,
      created_at: quote.created_at,
      is_read: false,
      // Include attachments as structured data
      attachments: quote.request_attachments || []
    };
  }
  ```
- **Result:** Message content is clean (email body only), attachments are available as structured data

### 3. Create Attachment List Component
**File:** `src/components/shared/MessageAttachments.tsx` (NEW)
- **Purpose:** Reusable component to render attachment links in chat messages
- **Props:**
  ```typescript
  interface MessageAttachmentsProps {
    attachments: QuoteRequestAttachment[];
    variant?: 'light' | 'dark'; // For different message bubble styles
  }
  ```
- **Features:**
  - Display attachments as clickable links
  - Show file icon, filename, and file size
  - Open in new tab with `target="_blank"` and `rel="noopener noreferrer"`
  - Download icon for visual clarity
  - Responsive design matching chat UI
- **Styling:** Match the message bubble color scheme (light text on dark backgrounds)

### 4. Update QuoteChat Component
**File:** `src/components/shared/QuoteChat.tsx`
- **Location:** Lines 232-259 (message rendering)
- **Changes:**
  1. Import `MessageAttachments` component
  2. Check if message has `attachments` property
  3. Render `MessageAttachments` below message content if attachments exist
- **Implementation:**
  ```typescript
  import MessageAttachments from './MessageAttachments';
  
  // In message rendering:
  messages.map((message) => {
    const isProducer = message.sender_type === 'PRODUCER';
    const isInitialRequest = isInitialRequestMessage(message.id);
    
    return (
      <div key={message.id} className={`flex ${isProducer ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[75%] rounded-lg p-3 ${...}`}>
          {/* Header */}
          <div className="flex items-center space-x-2 mb-1">
            ...
          </div>
          
          {/* Message Content */}
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          
          {/* Attachments (if present) */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/20">
              <MessageAttachments 
                attachments={message.attachments}
                variant={isProducer ? 'light' : 'dark'}
              />
            </div>
          )}
        </div>
      </div>
    );
  })
  ```

### 5. Update ProducerQuoteChat Component
**File:** `src/pages/dashboard/ProducerQuoteChat.tsx`
- **Location:** Lines 274-305 (message rendering)
- **Changes:** Same as `QuoteChat.tsx` - import and render `MessageAttachments`
- **Note:** This component already has the initial request message logic, just needs the attachment rendering

### 6. Handle Polling Updates
**File:** `src/components/shared/QuoteChat.tsx` and `src/pages/dashboard/ProducerQuoteChat.tsx`
- **Location:** Polling functions (lines 85-101 in QuoteChat, lines 85-113 in ProducerQuoteChat)
- **Change:** Ensure polling also prepends initial request message with attachments
- **Current State:** Polling in `QuoteChat.tsx` doesn't prepend initial request (line 92-95)
- **Fix:** Update polling to include initial request message (similar to `loadMessages`)

## Impact Analysis

### Data Structure Changes
- **Message Interface:** Extended with optional `attachments` field
- **Backward Compatibility:** ✅ Existing messages don't have `attachments`, so they render normally
- **Type Safety:** TypeScript will handle optional field correctly

### Component Changes
- **QuoteChat:** Now renders attachments if present in message
- **ProducerQuoteChat:** Now renders attachments if present in message
- **New Component:** `MessageAttachments` - reusable across both chat components

### User Experience
- **Before:** Plain text attachment list with URLs
- **After:** Clickable download links with icons and file sizes
- **Benefit:** Professional appearance, better UX, matches Supplier Portal

### Performance
- **Minimal Impact:** Only affects initial request message rendering
- **No Additional API Calls:** Uses data already fetched
- **Component Reusability:** `MessageAttachments` can be used elsewhere if needed

### Edge Cases
- **No Attachments:** Component gracefully handles empty array (won't render)
- **Old Messages:** Messages without `attachments` field render normally
- **Polling:** Need to ensure initial request is re-added during polling (if quote data changes)

## Files to Create

1. `src/components/shared/MessageAttachments.tsx` (NEW)
   - Reusable attachment list component
   - Handles clickable links, icons, file sizes
   - Supports light/dark variants for different message bubbles

## Files to Modify

1. `src/services/quoteService.ts`
   - Add optional `attachments?: QuoteRequestAttachment[]` to `Message` interface

2. `src/utils/quoteRequestMessage.ts`
   - Remove attachment text from `content` string
   - Add `attachments` field to returned message object

3. `src/components/shared/QuoteChat.tsx`
   - Import `MessageAttachments` component
   - Update message rendering to show attachments
   - Fix polling to include initial request message

4. `src/pages/dashboard/ProducerQuoteChat.tsx`
   - Import `MessageAttachments` component
   - Update message rendering to show attachments

## Risk Assessment

**Risk Level:** 🟡 **Medium**
- **Type Safety:** Low risk (optional field, TypeScript handles it)
- **Backward Compatibility:** Low risk (existing messages work fine)
- **UI Changes:** Medium risk (need to ensure styling matches chat bubbles)
- **Polling Logic:** Medium risk (need to ensure initial request is maintained during polling)

**Potential Issues:**
- Polling might remove initial request message if not handled correctly
- Styling might not match message bubble colors perfectly
- Need to ensure attachments are clickable and accessible

**Mitigation:**
- Test polling behavior thoroughly
- Match styling to existing message bubble design
- Test accessibility (keyboard navigation, screen readers)
- Ensure links open in new tab (security best practice)

## Testing Checklist

- [ ] Initial request message displays email body correctly
- [ ] Attachments render as clickable links below message content
- [ ] Links open in new tab with correct URL
- [ ] File icons and sizes display correctly
- [ ] Styling matches message bubble (light/dark variants)
- [ ] Regular messages (without attachments) render normally
- [ ] Polling maintains initial request message with attachments
- [ ] Empty attachments array doesn't break rendering
- [ ] Keyboard navigation works for attachment links
- [ ] Screen reader announces attachments correctly
- [ ] Works in both `QuoteChat` and `ProducerQuoteChat` components

## Design Considerations

### Attachment Link Styling
- **Light Variant (Producer messages):** White/light text on blue/purple background
- **Dark Variant (Supplier messages):** Light text on gray background
- **Hover State:** Slight opacity change or underline
- **Icon:** Download icon (from lucide-react) next to filename
- **File Size:** Smaller text, muted color

### Layout
- **Separator:** Border-top to separate attachments from message content
- **Spacing:** Adequate padding between attachments
- **Responsive:** Works on mobile and desktop
- **Max Width:** Respects message bubble max-width constraint

## Future Enhancements (Out of Scope)

- **File Type Icons:** Different icons for PDF, images, documents
- **Preview:** Inline preview for images
- **Download Progress:** Show download progress for large files
- **File Metadata:** Show upload date, file type details


# PR: Persist Quote Request Email Body and Attachments

## Title
`feat(quote-request): persist email body and attachments + enforce 10-file limit`

## Why

**Current State:**
- Quote requests are sent via email but the original email content is not stored
- Attachments are sent via Resend but not persisted
- No way to view the original quote request in Supplier/Producer portals
- Historical context is lost after email delivery

**Business Need:**
- Suppliers need to reference the original quote request email in the portal
- Producers need to see what was sent to suppliers for audit/history
- Attachments must be accessible long-term (not just in email)
- Enable future features like "Resend Quote Request" with original content

**Technical Need:**
- Enforce 10 attachment limit to prevent payload size issues
- Store email body for portal display
- Store attachments in Supabase Storage for long-term access
- Maintain backward compatibility with existing Resend email flow

## The Plan

### 1. Database Schema Updates

#### 1.1 Add `request_email_body` Column to Quotes Table
**File:** `supabase/migrations/20250204000000_add_quote_request_persistence.sql` (NEW)
- **Action:** Add `request_email_body` text column to `quotes` table
- **Rationale:** Store the exact email body sent to supplier
- **Nullable:** Yes (for backward compatibility with existing quotes)
- **Index:** Not needed (queries will filter by quote_id)

```sql
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS request_email_body text;

COMMENT ON COLUMN quotes.request_email_body IS 'Exact email body text sent to supplier in the quote request. Stored for portal history and reference.';
```

#### 1.2 Create `quote_request_attachments` Table
**File:** `supabase/migrations/20250204000000_add_quote_request_persistence.sql` (same file)
- **Action:** Create new table to store attachment metadata
- **Schema:**
  ```sql
  CREATE TABLE IF NOT EXISTS quote_request_attachments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    filename text NOT NULL,
    storage_path text NOT NULL,  -- Path in Supabase Storage
    storage_url text NOT NULL,   -- Public URL from Storage
    file_size_bytes integer NOT NULL,
    content_type text NOT NULL,
    created_at timestamptz DEFAULT now()
  );
  ```
- **Indexes:**
  - `idx_quote_request_attachments_quote_id` on `quote_id` (for fast lookups)
- **RLS:** Enable RLS, allow authenticated users to read attachments for their quotes

### 2. Storage Bucket Configuration

#### 2.1 Update `quote-attachments` Bucket
**File:** `supabase/migrations/20250204000000_add_quote_request_persistence.sql` (same file)
- **Action:** Update existing bucket to support multiple file types (not just PDF)
- **Changes:**
  - Increase file size limit: 10MB → 50MB (to match our 5MB per file × 10 files limit)
  - Expand allowed MIME types: Add common file types (PDF, DOCX, XLSX, images, etc.)
  - Keep public bucket for easy access
- **Path Structure:** `quote-requests/{quoteId}/{timestamp}-{filename}`

```sql
-- Update bucket configuration
UPDATE storage.buckets
SET 
  file_size_limit = 52428800,  -- 50MB (5MB × 10 files)
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'application/zip'
  ]
WHERE id = 'quote-attachments';
```

#### 2.2 Update Storage RLS Policies
**File:** `supabase/migrations/20250204000000_add_quote_request_persistence.sql` (same file)
- **Action:** Add policies for `quote-requests/` folder
- **Policy:** Allow authenticated users (producers) to upload/read quote request attachments
- **Policy:** Allow public reads (for suppliers accessing via portal token)

```sql
-- Policy: Allow authenticated users to upload quote request attachments
CREATE POLICY "Allow authenticated uploads to quote-requests folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'quote-attachments' AND
  (storage.foldername(name))[1] = 'quote-requests'
);

-- Policy: Allow public reads from quote-requests folder (for portal access)
CREATE POLICY "Allow public reads from quote-requests folder"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'quote-attachments' AND
  (storage.foldername(name))[1] = 'quote-requests'
);
```

### 3. Frontend: Enforce 10 Attachment Limit

#### 3.1 Update File Selection Handler
**File:** `src/components/producer/EnhancedRequestQuoteFlow.tsx`
- **Location:** `handleFileSelect` function
- **Changes:**
  1. Check current attachment count before adding new files
  2. Enforce maximum of 10 attachments per email
  3. Show error toast if limit exceeded
  4. Prevent adding files beyond limit

```typescript
const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files.length > 0) {
    const currentEmail = customizedEmails[currentSupplierIndex];
    const currentCount = currentEmail.attachments.length;
    const maxAttachments = 10;
    
    // Check if adding these files would exceed limit
    const newFiles = Array.from(e.target.files);
    if (currentCount + newFiles.length > maxAttachments) {
      const remaining = maxAttachments - currentCount;
      showError(`Maximum ${maxAttachments} attachments allowed. You can add ${remaining} more file(s).`);
      e.target.value = '';
      return;
    }
    
    // ... existing validation logic ...
  }
};
```

#### 3.2 Update UI to Show Attachment Count
**File:** `src/components/producer/EnhancedRequestQuoteFlow.tsx`
- **Location:** Attachments section UI
- **Changes:** Display "X / 10 attachments" counter

### 4. Backend: Upload Attachments to Storage

#### 4.1 Create Storage Upload Utility
**File:** `railway-backend/utils/storageService.js` (NEW)
- **Function:** `uploadQuoteRequestAttachment(quoteId, fileBuffer, filename, contentType)`
- **Logic:**
  1. Generate storage path: `quote-requests/{quoteId}/{timestamp}-{sanitizedFilename}`
  2. Upload to Supabase Storage using service role client
  3. Get public URL
  4. Return `{ storagePath, publicUrl }`
- **Error Handling:** Wrap errors with context

#### 4.2 Update Supplier Service
**File:** `railway-backend/services/supplierService.js`
- **Location:** `sendQuoteRequests` method (after quote creation, before email send)
- **Changes:**
  1. After creating quote record, upload attachments to Storage
  2. Save attachment metadata to `quote_request_attachments` table
  3. Save `request_email_body` to quotes table
  4. Continue with email sending (using Storage URLs or Base64, see Option B below)

**Implementation:**
```javascript
// After quote creation (line 323)
const quote = /* ... created quote ... */;

// Upload attachments and save metadata
if (customizedEmail?.attachments && customizedEmail.attachments.length > 0) {
  const attachmentRecords = [];
  
  for (const attachment of customizedEmail.attachments) {
    // Convert Base64 to Buffer
    const fileBuffer = Buffer.from(attachment.content, 'base64');
    
    // Upload to Storage
    const { storagePath, publicUrl } = await StorageService.uploadQuoteRequestAttachment(
      quote.id,
      fileBuffer,
      attachment.filename,
      attachment.contentType
    );
    
    // Save to database
    const { data: attachmentRecord } = await supabase
      .from('quote_request_attachments')
      .insert({
        quote_id: quote.id,
        filename: attachment.filename,
        storage_path: storagePath,
        storage_url: publicUrl,
        file_size_bytes: fileBuffer.length,
        content_type: attachment.contentType
      })
      .select()
      .single();
    
    attachmentRecords.push(attachmentRecord);
  }
}

// Save email body
if (customizedEmail?.body) {
  await supabase
    .from('quotes')
    .update({ request_email_body: customizedEmail.body })
    .eq('id', quote.id);
}
```

### 5. Backend: Update Email Service (Option B)

#### 5.1 Decision: Use Storage URLs or Base64 for Resend?
**Option B (Recommended):** Backend uploads to Storage, then uses Storage URLs in Resend
- **Pros:**
  - Smaller email payload (URLs instead of Base64)
  - Files accessible long-term
  - Resend can fetch files from URLs
- **Cons:**
  - Slightly more complex (upload before email)
  - Requires Storage to be accessible when Resend sends email

**Implementation:**
- After uploading to Storage, pass Storage URLs to Resend
- Resend will fetch files from URLs when sending email
- Fallback: If URL fetch fails, Resend will handle gracefully

#### 5.2 Update Email Service
**File:** `railway-backend/services/emailService.js`
- **Location:** `sendQuoteRequest` method
- **Changes:**
  1. Accept `attachmentUrls` parameter (array of Storage URLs)
  2. Use Resend's `path` parameter for remote file attachments
  3. Keep Base64 support as fallback

```javascript
async sendQuoteRequest({ 
  to, replyTo, assetName, message, quoteLink, subject = null, 
  attachments = null,  // Base64 (fallback)
  attachmentUrls = null  // Storage URLs (preferred)
}) {
  // ... existing code ...
  
  // Process attachments: Prefer Storage URLs, fallback to Base64
  let resendAttachments = undefined;
  
  if (attachmentUrls && attachmentUrls.length > 0) {
    // Use Storage URLs (preferred method)
    resendAttachments = attachmentUrls.map(url => ({
      path: url,  // Resend will fetch from URL
      filename: extractFilenameFromUrl(url)  // Extract from URL or pass separately
    }));
  } else if (attachments && attachments.length > 0) {
    // Fallback to Base64 (backward compatibility)
    resendAttachments = attachments.map(att => ({
      filename: att.filename,
      content: Buffer.from(att.content, 'base64'),
      ...(att.contentType && { contentType: att.contentType })
    }));
  }
  
  // ... rest of email sending ...
}
```

### 6. Backend: Update Supplier Service Email Call

#### 6.1 Pass Storage URLs to Email Service
**File:** `railway-backend/services/supplierService.js`
- **Location:** `sendQuoteRequestEmail` method
- **Changes:**
  1. After uploading attachments, collect Storage URLs
  2. Pass URLs to `emailService.sendQuoteRequest()` instead of Base64
  3. Keep Base64 as fallback if upload fails

### 7. TypeScript Interface Updates

#### 7.1 Update Quote Interface
**Files:**
- `src/lib/supabase.ts`
- `src/types/database.ts`
- `src/services/portalService.ts`

**Changes:**
```typescript
export interface Quote {
  // ... existing fields ...
  request_email_body?: string;
  request_attachments?: Array<{
    id: string;
    filename: string;
    storage_url: string;
    file_size_bytes: number;
    content_type: string;
    created_at: string;
  }>;
}
```

### 8. Portal Display (Future Enhancement)

**Note:** This is out of scope for this PR, but the data structure supports:
- Display `request_email_body` in Supplier Portal
- List `request_attachments` with download links
- Show original quote request in Producer Dashboard

## Impact Analysis

### Database Migrations
- **New Column:** `quotes.request_email_body` (text, nullable)
- **New Table:** `quote_request_attachments` (7 columns, indexed on `quote_id`)
- **Backward Compatibility:** ✅ All new fields are nullable/optional
- **Migration Risk:** 🟢 Low - Additive changes only

### Storage Configuration
- **Bucket Update:** `quote-attachments` bucket configuration change
  - File size limit: 10MB → 50MB
  - MIME types: PDF only → Multiple types
- **New Folder:** `quote-requests/` folder structure
- **RLS Policies:** New policies for authenticated uploads and public reads
- **Storage Risk:** 🟡 Medium - Policy changes need testing

### Flow Latency
- **Current Flow:** Frontend → Backend → Resend (Base64 in payload)
- **New Flow:** Frontend → Backend → Storage Upload → Database Save → Resend (URLs)
- **Latency Impact:**
  - Storage upload: +200-500ms per file (depends on file size)
  - Database insert: +10-50ms per attachment
  - **Total:** ~500-1000ms additional latency for 10 files
- **Mitigation:**
  - Upload files in parallel (Promise.all)
  - Show progress indicator in UI
  - Consider async upload (upload after email sent) for future optimization

### Payload Size Reduction
- **Before:** Base64 attachments in JSON payload (~6.67MB for 5MB file)
- **After:** Storage URLs in JSON payload (~200 bytes per URL)
- **Reduction:** ~99.7% smaller payload
- **Benefit:** Faster API calls, less memory usage

### Backward Compatibility
- **Existing Quotes:** ✅ No impact (new fields are nullable)
- **Existing Email Flow:** ✅ Still works (Base64 fallback maintained)
- **Storage Bucket:** ✅ Existing supplier quote documents unaffected (different folder)

### Error Handling
- **Storage Upload Failure:**
  - Log error, continue with email (Base64 fallback)
  - Don't block email sending if storage fails
- **Database Save Failure:**
  - Log error, continue with email
  - Email still sent, but history not saved
- **Resend URL Fetch Failure:**
  - Resend will handle gracefully (may skip attachment or show error)

## Testing Checklist

- [ ] 10 attachment limit enforced in frontend
- [ ] Error message shows when limit exceeded
- [ ] Attachments upload to Storage successfully
- [ ] Attachment metadata saved to database
- [ ] Email body saved to quotes table
- [ ] Resend email includes attachments (via URLs)
- [ ] Base64 fallback works if Storage upload fails
- [ ] Existing quotes unaffected (backward compatibility)
- [ ] Storage RLS policies allow authenticated uploads
- [ ] Storage RLS policies allow public reads
- [ ] Multiple file types supported (PDF, DOCX, images, etc.)
- [ ] Large files (up to 5MB each) upload successfully
- [ ] Portal can retrieve and display stored email body (future)
- [ ] Portal can retrieve and display stored attachments (future)

## Files to Create

1. `supabase/migrations/20250204000000_add_quote_request_persistence.sql` (NEW)
2. `railway-backend/utils/storageService.js` (NEW)

## Files to Modify

1. `src/components/producer/EnhancedRequestQuoteFlow.tsx`
   - Add 10 attachment limit validation
   - Update UI to show attachment count

2. `railway-backend/services/supplierService.js`
   - Upload attachments to Storage
   - Save attachment metadata
   - Save email body
   - Pass Storage URLs to email service

3. `railway-backend/services/emailService.js`
   - Accept `attachmentUrls` parameter
   - Use Storage URLs in Resend (preferred)
   - Keep Base64 fallback

4. `src/lib/supabase.ts`
   - Add `request_email_body` and `request_attachments` to Quote interface

5. `src/types/database.ts`
   - Add `request_email_body` and `request_attachments` to Quote interface

6. `src/services/portalService.ts`
   - Add `request_email_body` and `request_attachments` to Quote interface

## Risk Assessment

**Risk Level:** 🟡 **Medium**
- **Complexity:** High (multiple systems: DB, Storage, Email)
- **Storage Upload:** New dependency, needs error handling
- **RLS Policies:** Need careful testing for security
- **Latency:** Additional upload time may impact UX
- **Backward Compatibility:** ✅ Maintained (nullable fields, Base64 fallback)

## Compliance Notes

- **Data Retention:** Attachments stored in Supabase Storage (long-term)
- **Access Control:** RLS policies ensure proper access control
- **Audit Trail:** Email body and attachments stored for history
- **File Size Limits:** 10 files × 5MB = 50MB max per quote request


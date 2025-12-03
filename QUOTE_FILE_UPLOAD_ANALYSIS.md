# Quote File Upload Feature - Analysis & Implementation Plan

## Phase 1: Current State Analysis

### 1. Database Schema ❌ **MISSING COLUMN**

**Location:** `supabase/setup.sql` and all migrations

**Current `quotes` table columns:**
- `id` (uuid)
- `supplier_id` (uuid)
- `asset_id` (uuid)
- `cost` (numeric)
- `notes_capacity` (text)
- `status` (quote_status_enum)
- `quote_token` (text)
- `access_token` (uuid) - Added in migration `20250131000000_add_supplier_portal_schema.sql`
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Missing:** `quote_document_url` column does NOT exist.

**Evidence:**
- Backend code has TODO comment: `railway-backend/services/portalService.js:364`
  ```javascript
  // TODO: Add quote_document_url column to quotes table if needed
  // updateData.quote_document_url = fileUrl;
  ```
- TypeScript interfaces don't include it: `src/lib/supabase.ts`, `src/types/database.ts`
- No migration file adds this column

**Status:** ❌ Column needs to be added

---

### 2. Supabase Storage Bucket ❌ **DOES NOT EXIST**

**Location:** `supabase/config.toml`

**Current Storage Configuration:**
```toml
[storage]
enabled = true
file_size_limit = "50MiB"

# Uncomment to configure local storage buckets
# [storage.buckets.images]
# public = false
# file_size_limit = "50MiB"
# allowed_mime_types = ["image/png", "image/jpeg"]
# objects_path = "./images"
```

**Findings:**
- Storage is enabled globally
- No buckets are configured
- No `quote-attachments` bucket exists
- No existing storage bucket examples in the codebase

**Security Considerations:**
- Suppliers access portal via `access_token` (no Supabase Auth session)
- Need public upload capability OR backend proxy
- **Recommendation:** Create public bucket with path-based access control

**Status:** ❌ Bucket needs to be created

---

### 3. Frontend Implementation ⚠️ **PLACEHOLDER ONLY**

**Location:** `src/pages/portal/QuotePortal.tsx` (lines 484-498)

**Current State:**
```tsx
{/* File Upload */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    <Upload className="h-4 w-4 inline mr-1" />
    Attach Quote Document (Optional)
  </label>
  <button
    type="button"
    disabled={submittingQuote}
    className="w-full border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <Upload className="h-5 w-5" />
    <span>Choose File</span>
  </button>
  <p className="text-xs text-gray-500 mt-1">File upload coming soon</p>
</div>
```

**Issues:**
- Button has no `onClick` handler
- No `<input type="file" />` element
- No file state management
- No upload logic
- No file preview/display

**Status:** ⚠️ UI placeholder exists, functionality missing

---

### 4. Backend Implementation ✅ **READY (with column addition)**

**Location:** `railway-backend/services/portalService.js` (lines 316-379)

**Current State:**
```javascript
static async submitQuoteViaPortal(token, cost, notes = '', fileUrl = null) {
  // ... validation code ...
  
  const updateData = {
    cost: cost,
    notes_capacity: notes || '',
    status: 'Submitted',
    updated_at: new Date().toISOString()
  };

  // Add file URL if provided (for future file upload support)
  if (fileUrl) {
    // TODO: Add quote_document_url column to quotes table if needed
    // updateData.quote_document_url = fileUrl;
  }
  
  // ... rest of update logic ...
}
```

**Status:** ✅ Backend accepts `fileUrl` parameter, but doesn't save it (needs column)

---

### 5. Existing Storage Patterns ❌ **NONE FOUND**

**Search Results:**
- No examples of Supabase Storage uploads in codebase
- PDF extraction uses Railway backend (`railway-backend/routes/pdfExtraction.js`)
- No `storage.from()` calls found
- No storage bucket references

**Implication:** This will be the first Supabase Storage implementation in the codebase

---

## Phase 2: Implementation Plan

### PR Title
`feat(supplier): wire up quote file uploads to Supabase Storage`

### Required Changes

#### 1. Database Migration
**File:** `supabase/migrations/YYYYMMDDHHMMSS_add_quote_document_url.sql`

**Add:**
```sql
-- Add quote_document_url column to quotes table
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS quote_document_url text;

-- Add index for performance (if needed for queries)
CREATE INDEX IF NOT EXISTS idx_quotes_document_url ON quotes(quote_document_url) WHERE quote_document_url IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN quotes.quote_document_url IS 'URL to uploaded quote document (PDF) in Supabase Storage. Stored in quote-attachments bucket.';
```

#### 2. Storage Bucket Setup
**Option A: SQL Migration (Recommended)**
**File:** `supabase/migrations/YYYYMMDDHHMMSS_create_quote_attachments_bucket.sql`

```sql
-- Create public bucket for quote attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'quote-attachments',
  'quote-attachments',
  true,  -- Public bucket for anonymous uploads
  10485760,  -- 10MB limit (10 * 1024 * 1024)
  ARRAY['application/pdf']  -- Only PDF files
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policy for public uploads (anonymous users can upload)
CREATE POLICY "Allow public uploads to quote-attachments"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'quote-attachments' AND
  (storage.foldername(name))[1] = 'public'
);

-- Create RLS policy for public reads (anyone can download)
CREATE POLICY "Allow public reads from quote-attachments"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'quote-attachments');
```

**Option B: Manual Setup via Supabase Dashboard**
- Create bucket: `quote-attachments`
- Set as public
- File size limit: 10MB
- Allowed MIME types: `application/pdf`
- RLS policies: Allow public uploads/reads

#### 3. Frontend: File Upload Hook/Function
**File:** `src/pages/portal/QuotePortal.tsx`

**Add:**
- State for selected file: `const [selectedFile, setSelectedFile] = useState<File | null>(null);`
- State for upload progress: `const [uploadingFile, setUploadingFile] = useState(false);`
- File input handler
- Upload function using Supabase Storage
- File preview/display

**Implementation:**
```typescript
// File selection handler
const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  // Validate file type
  if (file.type !== 'application/pdf') {
    showError('Only PDF files are allowed');
    return;
  }
  
  // Validate file size (10MB)
  if (file.size > 10 * 1024 * 1024) {
    showError('File size must be less than 10MB');
    return;
  }
  
  setSelectedFile(file);
};

// Upload file to Supabase Storage
const uploadFile = async (file: File, quoteId: string): Promise<string> => {
  const supabase = await getSupabase();
  
  // Generate unique filename: quote-{quoteId}-{timestamp}.pdf
  const timestamp = Date.now();
  const filename = `public/quote-${quoteId}-${timestamp}.pdf`;
  
  const { data, error } = await supabase.storage
    .from('quote-attachments')
    .upload(filename, file, {
      contentType: 'application/pdf',
      upsert: false
    });
  
  if (error) throw error;
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('quote-attachments')
    .getPublicUrl(filename);
  
  return urlData.publicUrl;
};
```

#### 4. Frontend: Wire Up UI
**File:** `src/pages/portal/QuotePortal.tsx`

**Replace placeholder button with:**
```tsx
<input
  type="file"
  id="quote-file-upload"
  accept=".pdf,application/pdf"
  onChange={handleFileSelect}
  disabled={submittingQuote || uploadingFile}
  className="hidden"
/>
<label
  htmlFor="quote-file-upload"
  className="w-full border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
>
  <Upload className="h-5 w-5" />
  <span>
    {uploadingFile ? 'Uploading...' : selectedFile ? selectedFile.name : 'Choose File'}
  </span>
</label>
{selectedFile && (
  <p className="text-xs text-green-600 mt-1">
    ✓ {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
  </p>
)}
```

#### 5. Frontend: Update Submit Handler
**File:** `src/pages/portal/QuotePortal.tsx`

**Modify `handleSubmitQuote`:**
```typescript
const handleSubmitQuote = useCallback(async () => {
  if (!token || !session) return;
  
  if (quotePrice <= 0) {
    showError('Please enter a valid price greater than 0');
    return;
  }
  
  setSubmittingQuote(true);
  let fileUrl: string | undefined = undefined;
  
  try {
    // Upload file first if selected
    if (selectedFile && session.quote.id) {
      setUploadingFile(true);
      try {
        fileUrl = await uploadFile(selectedFile, session.quote.id);
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        showError('Failed to upload file. Please try again.');
        setUploadingFile(false);
        setSubmittingQuote(false);
        return;
      } finally {
        setUploadingFile(false);
      }
    }
    
    // Submit quote with file URL
    const response = await PortalService.submitQuote(
      token,
      quotePrice,
      quoteNotes,
      fileUrl
    );
    
    // ... rest of submission logic ...
  } catch (error) {
    // ... error handling ...
  } finally {
    setSubmittingQuote(false);
  }
}, [token, session, quotePrice, quoteNotes, selectedFile, showSuccess, showError]);
```

#### 6. Backend: Enable File URL Saving
**File:** `railway-backend/services/portalService.js`

**Update `submitQuoteViaPortal` method:**
```javascript
// Add file URL if provided
if (fileUrl) {
  updateData.quote_document_url = fileUrl;
}
```

**Remove the TODO comment and uncomment the line.**

#### 7. TypeScript Types Update
**Files:** 
- `src/lib/supabase.ts`
- `src/types/database.ts`
- `src/services/portalService.ts`

**Add to Quote interface:**
```typescript
export interface Quote {
  // ... existing fields ...
  quote_document_url?: string;
}
```

---

## Phase 3: Security Considerations

### Public Bucket vs Private Bucket

**Option A: Public Bucket (Recommended for MVP)**
- ✅ Simpler implementation
- ✅ No backend proxy needed
- ✅ Direct upload from frontend
- ⚠️ Files are publicly accessible via URL
- ✅ Can add path-based access control later

**Option B: Private Bucket with Backend Proxy**
- ✅ More secure (files not publicly accessible)
- ❌ Requires backend upload endpoint
- ❌ More complex implementation
- ❌ Slower (extra hop through backend)

**Recommendation:** Use public bucket with path structure:
- Path: `public/quote-{quoteId}-{timestamp}.pdf`
- URLs are long and hard to guess
- Can add signed URLs later if needed

---

## Phase 4: Testing Checklist

- [ ] Migration adds `quote_document_url` column successfully
- [ ] Storage bucket `quote-attachments` exists and is public
- [ ] RLS policies allow public uploads/reads
- [ ] File input accepts only PDF files
- [ ] File size validation (10MB limit) works
- [ ] File uploads to Supabase Storage successfully
- [ ] Public URL is generated correctly
- [ ] File URL is saved to database on quote submission
- [ ] File can be downloaded via public URL
- [ ] Error handling for upload failures
- [ ] File preview shows selected file name
- [ ] Upload progress indicator (optional)
- [ ] File can be removed before submission
- [ ] Multiple file selection prevented (single file only)

---

## Phase 5: Summary

### Current State
- ❌ Database column missing
- ❌ Storage bucket doesn't exist
- ⚠️ Frontend has placeholder UI only
- ✅ Backend accepts fileUrl parameter (but doesn't save it)

### Required Work
1. **Database:** Add `quote_document_url` column (migration)
2. **Storage:** Create `quote-attachments` public bucket (migration or manual)
3. **Frontend:** Implement file upload logic in `QuotePortal.tsx`
4. **Backend:** Uncomment file URL saving in `portalService.js`
5. **Types:** Update TypeScript interfaces

### Estimated Effort
- Database migration: 15 minutes
- Storage setup: 15 minutes
- Frontend implementation: 2-3 hours
- Backend update: 5 minutes
- Testing: 1 hour
- **Total: ~4-5 hours**

---

## Phase 6: Awaiting Approval

**Questions to confirm:**

1. ✅ **Does the `quotes` table currently have a column for the file?**
   - **Answer: NO** - Column needs to be added

2. ✅ **Does the bucket exist?**
   - **Answer: NO** - Bucket needs to be created

3. **Security preference:**
   - Public bucket (simpler, recommended for MVP) ✅
   - Private bucket with backend proxy (more secure, more complex)

4. **File size limit:**
   - Recommended: 10MB (matches PDF extraction endpoint)
   - Alternative: 5MB, 20MB?

**Ready to proceed once approved!** 🚀


# PR: Implement File Attachment Logic with 5MB Size Validation

## Title
`feat(attachments): implement file upload with 5MB size limit validation for quote requests`

## Why

**Current State:**
- File attachment UI exists in `EnhancedRequestQuoteFlow.tsx` (file input, file list display)
- Files are collected in component state (`customizedEmails[].attachments: File[]`)
- **BUT**: Attachments are NOT sent to backend (only `supplierId`, `subject`, `body` are transmitted)
- **AND**: Backend email service does NOT process attachments
- **RESULT**: Feature appears functional but files are silently discarded

**Problems:**
1. **No Size Validation**: Users can select files of any size, leading to:
   - Server rejections (Resend/email service limits)
   - Poor user experience (no feedback until submission fails)
   - Potential payload size issues (if sending Base64)

2. **Incomplete Implementation**: 
   - Frontend UI exists but data flow is broken
   - Backend doesn't accept or process attachments
   - Resend API call doesn't include attachments

3. **User Confusion**: 
   - Users can attach files but they never arrive
   - No error messages or warnings

**Solution:**
- Implement frontend size validation (5MB per file, immediate feedback)
- Complete the data flow: Frontend → Backend → Resend
- Use Base64 encoding for file transmission (Resend supports this)
- Add clear UI feedback for file size violations

## The Plan

### 1. Frontend: File Size Validation Utility
**File:** `src/utils/fileValidation.ts` (NEW)
- **Create:** New utility file for file validation
- **Function:** `validateFileSize(file: File, maxSizeMB: number = 5): { valid: boolean; error?: string }`
- **Logic:**
  - Check `file.size` against `maxSizeMB * 1024 * 1024` (5MB = 5,242,880 bytes)
  - Return validation result with error message if invalid
- **Error Message:** `"File '${file.name}' exceeds the maximum size of ${maxSizeMB}MB. Please choose a smaller file."`

### 2. Frontend: Update File Selection Handler
**File:** `src/components/producer/EnhancedRequestQuoteFlow.tsx`
- **Location:** `handleFileSelect` function (lines 317-328)
- **Changes:**
  1. Import `validateFileSize` utility
  2. Validate each file before adding to state
  3. Show error toast for files exceeding 5MB limit
  4. Only add valid files to `attachments` array
  5. Track rejected files for user feedback
- **Implementation:**
  ```typescript
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const validFiles: File[] = [];
      const rejectedFiles: { file: File; reason: string }[] = [];
      
      newFiles.forEach(file => {
        const validation = validateFileSize(file, 5);
        if (validation.valid) {
          validFiles.push(file);
        } else {
          rejectedFiles.push({ file, reason: validation.error || 'File too large' });
          showError(validation.error || `File "${file.name}" exceeds 5MB limit`);
        }
      });
      
      if (validFiles.length > 0) {
        setCustomizedEmails(prev => 
          prev.map((email, index) => 
            index === currentSupplierIndex 
              ? { ...email, attachments: [...email.attachments, ...validFiles] }
              : email
          )
        );
      }
    }
  };
  ```

### 3. Frontend: Display File Sizes in UI
**File:** `src/components/producer/EnhancedRequestQuoteFlow.tsx`
- **Location:** Attachment list display (lines 890-904)
- **Changes:**
  1. Display file size next to file name
  2. Format size as "X MB" or "X KB" (human-readable)
  3. Add visual indicator if file is at/near limit (optional enhancement)
- **Helper Function:** `formatFileSize(bytes: number): string`

### 4. Frontend: Convert Files to Base64 Before Sending
**File:** `src/components/producer/EnhancedRequestQuoteFlow.tsx`
- **Location:** `handleSendAll` function (lines 349-421)
- **Changes:**
  1. Before sending to backend, convert `File[]` to Base64 strings
  2. Create new interface for backend payload:
     ```typescript
     interface BackendCustomizedEmail {
       supplierId: string;
       subject: string;
       body: string;
       attachments?: Array<{
         filename: string;
         content: string; // Base64 encoded
         contentType: string;
       }>;
     }
     ```
  3. Convert files using `FileReader` API (async)
  4. Update `backendCustomizedEmails` mapping to include attachments
- **Implementation:**
  ```typescript
  const convertFilesToBase64 = async (files: File[]): Promise<Array<{ filename: string; content: string; contentType: string }>> => {
    const conversions = files.map(file => {
      return new Promise<{ filename: string; content: string; contentType: string }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1]; // Remove data:type;base64, prefix
          resolve({
            filename: file.name,
            content: base64,
            contentType: file.type || 'application/octet-stream'
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });
    return Promise.all(conversions);
  };
  ```

### 5. Frontend: Update Service Interface
**File:** `src/services/quoteRequestService.ts`
- **Location:** `CustomizedEmail` interface (lines 4-8)
- **Changes:**
  1. Add `attachments` field to interface:
     ```typescript
     export interface CustomizedEmail {
       supplierId: string;
       subject: string;
       body: string;
       attachments?: Array<{
         filename: string;
         content: string; // Base64
         contentType: string;
       }>;
     }
     ```

### 6. Backend: Update Route Handler
**File:** `railway-backend/routes/suppliers.js`
- **Location:** `/send-quote-requests` endpoint (lines 192-305)
- **Changes:**
  1. Accept `attachments` array in `customizedEmails` payload
  2. Pass attachments to `SupplierService.sendQuoteRequests()`
  3. No validation needed here (frontend handles it)

### 7. Backend: Update Supplier Service
**File:** `railway-backend/services/supplierService.js`
- **Location:** `sendQuoteRequestEmail` method (lines 420-474)
- **Changes:**
  1. Accept `attachments` parameter from `customizedEmail`
  2. Pass attachments to `emailService.sendQuoteRequest()`
  3. Update method signature:
     ```javascript
     static async sendQuoteRequestEmail(supplier, asset, quote, from, customizedEmail = null) {
       // ... existing code ...
       
       // Extract attachments if present
       const attachments = customizedEmail?.attachments || null;
       
       const emailResult = await emailService.sendQuoteRequest({
         to: supplierEmail,
         replyTo: from.email,
         assetName: asset.asset_name,
         message: message,
         quoteLink: quoteLink,
         subject: subject,
         attachments: attachments // Add this
       });
       
       return emailResult;
     }
     ```

### 8. Backend: Update Email Service
**File:** `railway-backend/services/emailService.js`
- **Location:** `sendQuoteRequest` method (lines 42-167)
- **Changes:**
  1. Add `attachments` parameter to method signature:
     ```javascript
     async sendQuoteRequest({ to, replyTo, assetName, message, quoteLink, subject = null, attachments = null })
     ```
  2. Convert Base64 strings to Resend attachment format
  3. Add attachments array to Resend API call (line 126)
  4. **Resend Format:**
     ```javascript
     attachments: attachments ? attachments.map(att => ({
       filename: att.filename,
       content: Buffer.from(att.content, 'base64'), // Convert Base64 to Buffer
       // OR use content directly if Resend accepts Base64 strings
     })) : undefined
     ```
  5. **Note:** Resend accepts either:
     - `content`: Buffer (preferred) or Base64 string
     - `path`: URL to remote file
     - We'll use Buffer conversion for Base64 strings

### 9. Frontend: Prevent Submission if Files Exceed Limit
**File:** `src/components/producer/EnhancedRequestQuoteFlow.tsx`
- **Location:** `handleSendAll` function (lines 349-421)
- **Changes:**
  1. Before submission, validate all attachments across all emails
  2. If any file exceeds 5MB, show error and prevent submission
  3. This is a safety check (primary validation happens on file select)

### 10. Frontend: Add File Size Display Helper
**File:** `src/utils/fileValidation.ts` (same file as step 1)
- **Function:** `formatFileSize(bytes: number): string`
- **Logic:**
  - If < 1024 bytes: return "X B"
  - If < 1024 * 1024 bytes: return "X KB" (1 decimal)
  - Otherwise: return "X MB" (2 decimals)
- **Example:** `formatFileSize(5242880)` → `"5.00 MB"`

## Impact Analysis

### File Transmission Method: Base64 Encoding
**Decision:** We will send files as **Base64-encoded strings** in the JSON payload.

**Implications:**
1. **Payload Size Increase:**
   - Base64 encoding increases file size by ~33%
   - 5MB file → ~6.67MB in Base64
   - Multiple files multiply this overhead
   - **Mitigation:** 5MB limit per file prevents excessive payload sizes

2. **Backend Processing:**
   - Railway backend receives Base64 strings
   - Converts to Buffer before sending to Resend
   - Resend accepts Buffer format (preferred method)

3. **Alternative Considered:**
   - **Supabase Storage Upload**: Upload files first, then send links
   - **Pros:** Smaller payload, files accessible later
   - **Cons:** Requires storage setup, additional API calls, complexity
   - **Decision:** Use Base64 for MVP (simpler, direct integration)

4. **Resend API Limits:**
   - Resend doesn't specify hard file size limits in documentation
   - Typical email service limits: ~10MB total per email
   - Our 5MB per file limit provides safety margin
   - Multiple files: 5MB × N files (user should be mindful of total)

5. **Network Considerations:**
   - Large Base64 payloads increase request time
   - Railway backend may have request size limits
   - **Mitigation:** 5MB limit prevents extreme cases

### Data Flow Verification
1. **Frontend → Backend:**
   - Files validated (5MB limit)
   - Converted to Base64 strings
   - Sent in `customizedEmails[].attachments[]` array
   - JSON payload size: Email body + Base64 attachments

2. **Backend → Resend:**
   - Base64 strings converted to Buffer
   - Attached to Resend email API call
   - Resend handles delivery

3. **Supplier Receives:**
   - Email with attachments as separate files
   - Files downloadable from email client

### Testing Checklist
- [ ] File size validation: 5MB file accepted, 5.1MB file rejected
- [ ] Multiple files: All validated individually
- [ ] UI feedback: Error toast shows for rejected files
- [ ] File size display: Shows "X MB" or "X KB" format
- [ ] Base64 conversion: Files correctly encoded
- [ ] Backend receives: Attachments array in payload
- [ ] Resend API: Attachments included in email
- [ ] Email delivery: Supplier receives attachments
- [ ] Edge cases: Empty attachments array, null/undefined handling

## Files to Create

1. `src/utils/fileValidation.ts` (NEW)

## Files to Modify

1. `src/components/producer/EnhancedRequestQuoteFlow.tsx`
   - Update `handleFileSelect` (add validation)
   - Update `handleSendAll` (add Base64 conversion)
   - Update attachment list UI (add file size display)
   - Add `formatFileSize` helper or import from utils

2. `src/services/quoteRequestService.ts`
   - Update `CustomizedEmail` interface (add attachments field)

3. `railway-backend/routes/suppliers.js`
   - Pass attachments through to service (no changes if already passed)

4. `railway-backend/services/supplierService.js`
   - Update `sendQuoteRequestEmail` (accept and pass attachments)

5. `railway-backend/services/emailService.js`
   - Update `sendQuoteRequest` (accept attachments, convert to Buffer, send to Resend)

## Risk Assessment

**Risk Level:** 🟡 **Medium**
- **Complexity:** Moderate (multiple layers: frontend validation, Base64 conversion, backend processing, Resend integration)
- **Payload Size:** Base64 encoding increases payload size (mitigated by 5MB limit)
- **Backward Compatibility:** Existing quote requests without attachments will continue to work (attachments optional)
- **Error Handling:** Need robust error handling for file conversion failures
- **Testing:** Requires end-to-end testing with actual file uploads

## Compliance Notes

- **User Experience:** Immediate feedback prevents user frustration
- **Server Protection:** Size limits prevent server overload
- **Data Integrity:** Base64 encoding ensures binary data transmission integrity


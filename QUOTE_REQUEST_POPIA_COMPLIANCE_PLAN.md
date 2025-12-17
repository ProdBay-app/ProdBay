# PR: Remove Confidential Project Data from Quote Request Emails

## Title
`refactor(email): remove project/client/deadline from quote request emails for POPIA compliance`

## Why

**POPIA Compliance & Project Confidentiality:**
- Quote request emails currently include confidential project information (Project Name, Client Name, Project Deadline) that should not be shared with suppliers
- This violates Project Confidentiality requirements and POPIA (Protection of Personal Information Act) compliance
- Suppliers only need asset specifications to provide accurate quotes, not the broader project context
- Removing this data prevents potential information leaks and supplier confusion about project scope

**Current Issue:**
The frontend email template generation in `EnhancedRequestQuoteFlow.tsx` includes project details in the email body, which are then sent via the Railway backend to suppliers through Resend.

## The Plan

### 1. Frontend Email Template Generation
**File:** `src/components/producer/EnhancedRequestQuoteFlow.tsx`
- **Location:** Lines 252-257 (`generateDefaultEmail` function)
- **Change:** Remove the `projectInfo` block that includes:
  - `project_name`
  - `client_name` 
  - `timeline_deadline`
- **Action:** Delete lines 252-257 and remove `${projectInfo}` from the email body template (line 262)
- **Result:** Email body will only contain asset information (asset name, specifications, timeline)

### 2. Verify Backend Email Generation
**File:** `railway-backend/services/supplierService.js`
- **Location:** Lines 233-252 (`generateEmailBody` method)
- **Status:** ✅ Already compliant - does NOT include project information
- **Action:** No changes needed (backend default template is clean)

### 3. Verify Email Service
**File:** `railway-backend/services/emailService.js`
- **Location:** Lines 42-167 (`sendQuoteRequest` method)
- **Status:** ✅ Already compliant - only formats and sends the message it receives
- **Action:** No changes needed

### 4. Verify Backend Data Fetching
**File:** `railway-backend/services/supplierService.js`
- **Location:** Lines 154-159 (`generateEmailPreviews` and `sendQuoteRequests` methods)
- **Status:** ✅ Already compliant - fetches asset with `select('*')` which does NOT include project join
- **Action:** No changes needed

### 5. Verify Preview Modal
**File:** `src/components/producer/QuoteRequestPreviewModal.tsx`
- **Location:** Lines 84-98 (email preview generation)
- **Status:** ✅ Already compliant - does NOT include project information
- **Action:** No changes needed

## Impact Analysis

### Supabase Data Fetching
- **Frontend:** `ProducerService.getAssetById()` will continue to fetch project data via `project:projects(*)` join for UI display purposes (e.g., showing project context in modals)
- **Backend:** Already does NOT fetch project data - uses `select('*')` on assets table only
- **Decision:** We will **continue fetching** project data in the frontend for UI purposes, but **exclude it** from the email body template
- **Rationale:** The UI may need to display project context to producers, but this information should not be transmitted to suppliers via email

### Resend Email Template
- **Before:** Email body included:
  ```
  Project: [Project Name]
  Client: [Client Name]
  Deadline: [Deadline]
  
  Asset: [Asset Name]
  Specifications: [Specifications]
  Timeline: [Timeline]
  ```
- **After:** Email body will only include:
  ```
  Asset: [Asset Name]
  Specifications: [Specifications]
  Timeline: [Timeline] (asset-level timeline, not project deadline)
  ```
- **Impact:** Suppliers will receive only asset-specific information required for quoting, maintaining project confidentiality

### Data Flow Verification
1. **Frontend → Backend:** Customized email content (without project info) sent via `/api/suppliers/send-quote-requests`
2. **Backend → Resend:** Email body (without project info) formatted and sent via Resend API
3. **Supplier Receives:** Email containing only asset specifications and quote submission link

### Testing Checklist
- [ ] Verify email preview in `EnhancedRequestQuoteFlow` does not show project/client/deadline
- [ ] Verify actual emails sent via Resend do not contain project/client/deadline
- [ ] Verify backend default email generation (if customized email not provided) does not include project info
- [ ] Verify UI still displays project context to producers (for their reference)
- [ ] Verify asset-level timeline (if present) is still included (this is asset-specific, not project deadline)

## Files to Modify

1. `src/components/producer/EnhancedRequestQuoteFlow.tsx` (Lines 252-262)

## Files to Verify (No Changes Expected)

1. `railway-backend/services/supplierService.js` (Backend email generation - already clean)
2. `railway-backend/services/emailService.js` (Email service - already clean)
3. `src/components/producer/QuoteRequestPreviewModal.tsx` (Preview modal - already clean)

## Risk Assessment

**Risk Level:** 🟢 **Low**
- Single file modification in frontend
- Backend already compliant
- No database schema changes required
- No API contract changes
- Backward compatible (removes data, doesn't break existing functionality)

## Compliance Notes

- **POPIA Compliance:** Removes personal/project information from supplier communications
- **Project Confidentiality:** Ensures suppliers only receive asset-level information necessary for quoting
- **Data Minimization:** Aligns with principle of sharing only necessary information with third parties


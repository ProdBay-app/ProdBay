# PR: Fix CC and BCC Recipients in Quote Request Emails

## Title
`fix(email): pass CC and BCC recipients to Resend API`

## Why

**Problem:**
CC and BCC recipients are completely ignored when sending Quote Request emails. Users can input CC/BCC emails in the frontend UI, but:
- No emails are delivered to CC/BCC recipients
- No logs indicate CC/BCC processing
- The feature appears broken despite UI being present

**Root Cause Analysis:**

1. **Frontend Component** (`EnhancedRequestQuoteFlow.tsx`):
   - ✅ Has `ccEmails` and `bccEmails` fields in local interface (lines 32-33)
   - ✅ UI allows users to input CC/BCC emails (lines 933-951)
   - ❌ **Missing:** When transforming data for backend (lines 438-448), CC/BCC fields are **not included** in the payload

2. **Frontend Service** (`quoteRequestService.ts`):
   - ❌ **Missing:** `CustomizedEmail` interface doesn't include `ccEmails` or `bccEmails` (lines 4-13)

3. **Backend Service** (`supplierService.js`):
   - ❌ **Missing:** `sendQuoteRequestEmail` method doesn't extract `ccEmails`/`bccEmails` from `customizedEmail` (line 518)
   - ❌ **Missing:** Doesn't pass CC/BCC to `emailService.sendQuoteRequest` (lines 561-570)

4. **Email Service** (`emailService.js`):
   - ❌ **Missing:** `sendQuoteRequest` method doesn't accept `cc` or `bcc` parameters (line 44)
   - ❌ **Missing:** Resend API call doesn't include `cc` or `bcc` fields in payload (lines 171-178)

**Impact:**
- Users expect CC/BCC functionality but it silently fails
- No error messages or logs indicate the issue
- Feature appears implemented but doesn't work

## The Plan

### 1. Update Frontend Service Interface

**File:** `src/services/quoteRequestService.ts`
- **Location:** Lines 4-13 (`CustomizedEmail` interface)
- **Change:** Add optional `ccEmails` and `bccEmails` fields
- **New Interface:**
  ```typescript
  export interface CustomizedEmail {
    supplierId: string;
    subject: string;
    body: string;
    ccEmails?: string;  // Comma-separated string
    bccEmails?: string; // Comma-separated string
    attachments?: Array<{
      filename: string;
      content: string; // Base64 encoded
      contentType: string;
    }>;
  }
  ```

### 2. Update Frontend Component Payload

**File:** `src/components/producer/EnhancedRequestQuoteFlow.tsx`
- **Location:** Lines 438-448 (data transformation before sending to backend)
- **Change:** Include `ccEmails` and `bccEmails` in the transformed payload
- **Current Code:**
  ```typescript
  return {
    supplierId: email.supplierId,
    subject: email.subject,
    body: email.body,
    ...(attachments && { attachments })
  };
  ```
- **New Code:**
  ```typescript
  return {
    supplierId: email.supplierId,
    subject: email.subject,
    body: email.body,
    ...(email.ccEmails && { ccEmails: email.ccEmails }),
    ...(email.bccEmails && { bccEmails: email.bccEmails }),
    ...(attachments && { attachments })
  };
  ```

### 3. Update Backend Service to Extract CC/BCC

**File:** `railway-backend/services/supplierService.js`
- **Location:** Lines 518-570 (`sendQuoteRequestEmail` method)
- **Change:** Extract `ccEmails` and `bccEmails` from `customizedEmail` and pass to email service
- **Add After Line 553:**
  ```javascript
  // Extract CC and BCC emails from customizedEmail
  const ccEmails = customizedEmail?.ccEmails || null;
  const bccEmails = customizedEmail?.bccEmails || null;
  ```
- **Update Line 561:** Add `cc` and `bcc` parameters to `emailService.sendQuoteRequest` call:
  ```javascript
  const emailResult = await emailService.sendQuoteRequest({
    to: supplierEmail,
    replyTo: from.email,
    assetName: asset.asset_name,
    message: message,
    quoteLink: quoteLink,
    subject: subject,
    attachments: finalAttachments,
    attachmentUrls: finalAttachmentUrls,
    cc: ccEmails,  // Add this
    bcc: bccEmails // Add this
  });
  ```

### 4. Update Email Service to Accept and Pass CC/BCC

**File:** `railway-backend/services/emailService.js`
- **Location:** Line 44 (`sendQuoteRequest` method signature)
- **Change:** Add optional `cc` and `bcc` parameters
- **New Signature:**
  ```javascript
  async sendQuoteRequest({ to, replyTo, assetName, message, quoteLink, subject = null, attachments = null, attachmentUrls = null, cc = null, bcc = null })
  ```

- **Location:** Lines 169-178 (Resend API payload construction)
- **Change:** Parse CC/BCC strings into arrays and add to payload
- **Add After Line 167:**
  ```javascript
  // Parse CC and BCC emails (comma-separated strings to arrays)
  let ccArray = null;
  let bccArray = null;
  
  if (cc && typeof cc === 'string' && cc.trim()) {
    ccArray = cc.split(',').map(e => e.trim()).filter(Boolean);
    if (ccArray.length === 0) ccArray = null;
    console.log(`[EmailService] CC recipients: ${ccArray.join(', ')}`);
  }
  
  if (bcc && typeof bcc === 'string' && bcc.trim()) {
    bccArray = bcc.split(',').map(e => e.trim()).filter(Boolean);
    if (bccArray.length === 0) bccArray = null;
    console.log(`[EmailService] BCC recipients: ${bccArray.length} recipient(s)`); // Don't log BCC emails for privacy
  }
  ```

- **Update Line 171:** Add `cc` and `bcc` to email payload:
  ```javascript
  const emailPayload = {
    from: this.fromEmail,
    to: [to],
    reply_to: [replyTo],
    subject: emailSubject,
    text: emailBody,
    html: htmlBody,
    ...(ccArray && { cc: ccArray }),
    ...(bccArray && { bcc: bccArray })
  };
  ```

## Impact Analysis

### Positive Impacts:
- ✅ CC/BCC functionality will work as expected
- ✅ Users can copy stakeholders on quote requests
- ✅ BCC allows sending to internal team without exposing recipients
- ✅ Better email workflow for production management

### Potential Risks:
- 🟡 **Low Risk:** Resend API format - Need to verify array format (but `to` and `reply_to` already use arrays, so `cc`/`bcc` should follow same pattern)
- 🟡 **Low Risk:** Email validation - Resend will validate email addresses, invalid ones will cause errors (expected behavior)
- 🟢 **No Breaking Changes:** All fields are optional, backward compatible

### Data Flow After Fix:
1. **Frontend:** User inputs CC/BCC → Included in payload → Sent to backend
2. **Backend Service:** Extracts CC/BCC from `customizedEmail` → Passes to email service
3. **Email Service:** Parses comma-separated strings → Converts to arrays → Adds to Resend payload
4. **Resend API:** Receives `cc` and `bcc` arrays → Delivers emails to all recipients

### Resend API Format:
Based on existing code pattern:
- `to: [to]` - Array format
- `reply_to: [replyTo]` - Array format
- **Expected:** `cc: [email1, email2]` - Array format
- **Expected:** `bcc: [email1, email2]` - Array format

### Testing Checklist:
- [ ] Verify CC emails are delivered to all recipients
- [ ] Verify BCC emails are delivered (recipients shouldn't see each other)
- [ ] Verify CC/BCC work with single email
- [ ] Verify CC/BCC work with comma-separated multiple emails
- [ ] Verify empty CC/BCC fields don't cause errors
- [ ] Verify invalid email addresses are handled gracefully by Resend
- [ ] Verify logs show CC/BCC processing
- [ ] Verify BCC emails are not logged (privacy)

## Files to Modify

1. **`src/services/quoteRequestService.ts`**
   - Add `ccEmails?: string` and `bccEmails?: string` to `CustomizedEmail` interface

2. **`src/components/producer/EnhancedRequestQuoteFlow.tsx`**
   - Include `ccEmails` and `bccEmails` in the payload transformation (lines 438-448)

3. **`railway-backend/services/supplierService.js`**
   - Extract `ccEmails` and `bccEmails` from `customizedEmail`
   - Pass them to `emailService.sendQuoteRequest`

4. **`railway-backend/services/emailService.js`**
   - Add `cc` and `bcc` parameters to `sendQuoteRequest` method
   - Parse comma-separated strings into arrays
   - Add `cc` and `bcc` to Resend API payload

## Implementation Details

### CC/BCC Parsing Logic:
```javascript
// Parse comma-separated string: "email1@example.com, email2@example.com"
// Into array: ["email1@example.com", "email2@example.com"]
// Handle edge cases:
// - Empty strings → null
// - Whitespace → trimmed
// - Empty after split → null
```

### Resend Payload Format:
```javascript
{
  from: "ProdBay <noreply@prodbay.com>",
  to: ["supplier@example.com"],
  reply_to: ["producer@example.com"],
  cc: ["cc1@example.com", "cc2@example.com"],  // Optional
  bcc: ["bcc@example.com"],                     // Optional
  subject: "Quote Request: Asset Name",
  text: "...",
  html: "..."
}
```

### Logging Strategy:
- **CC:** Log all CC recipients (they're visible to all recipients anyway)
- **BCC:** Log count only (privacy - BCC recipients shouldn't be exposed in logs)

## Risk Assessment

**Risk Level:** 🟢 **Low**
- Simple data flow fix (add missing fields)
- Resend API supports CC/BCC (standard email feature)
- All changes are additive (optional fields)
- Backward compatible (existing emails without CC/BCC still work)

## Notes

- **Resend API Format:** Based on existing code, Resend uses arrays for email fields (`to: [email]`, `reply_to: [email]`), so `cc` and `bcc` should also be arrays
- **Email Validation:** Resend will validate email addresses. Invalid addresses will cause the email send to fail (expected behavior)
- **Privacy:** BCC recipients should not be logged in detail (only count) to maintain privacy
- **Comma-Separated Parsing:** Frontend sends comma-separated strings, backend needs to parse into arrays for Resend API


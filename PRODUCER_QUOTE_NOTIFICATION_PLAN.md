# Producer Quote Notification & Display Feature

## PR Title
`feat(quotes): notify producer on submission and display quote details`

## Objective
Close the loop on the Supplier Quote workflow by:
1. **Notify:** Send email to Producer when supplier submits a quote via Portal
2. **Display:** Show submitted quote details (Price, Notes, PDF) in `AssetDetailModal`

---

## Phase 1: Analysis Summary

### Backend Analysis ✅

**Current State:**
- `submitQuoteViaPortal` in `railway-backend/services/portalService.js` updates quote but doesn't notify producer
- Email service pattern exists in `railway-backend/services/emailService.js` (Resend integration)
- Producer email stored in `producer_settings.from_email` table
- Relationship chain: `Quote` → `Asset` → `Project` (no direct user table, uses `producer_settings`)

**Email Fetching Strategy:**
- Fetch `producer_settings.from_email` (single row, limit 1)
- If not available, log warning and skip email (non-blocking)
- Use same pattern as `supplierService.js` for email sending

### Frontend Analysis ✅

**Current State:**
- `QuotesList` component already fetches quotes via `ProducerService.getQuotesForAsset(assetId)`
- `getQuotesForAsset` selects `*` from quotes, so `quote_document_url` should be included
- Quotes are displayed with status badges, cost, and supplier info
- Missing: Notes display and PDF document link

**Data Availability:**
- ✅ Quotes are fetched with `*` selector (includes `quote_document_url`)
- ✅ Quotes include `cost`, `notes_capacity`, `status`
- ✅ Quotes include `supplier` relation
- ⚠️ Need to verify `quote_document_url` is in TypeScript interface (already added in previous PR)

---

## Phase 2: Implementation Plan

### Backend Changes

#### 1. Add Email Notification Method to `emailService.js`

**Location:** `railway-backend/services/emailService.js`

**New Method:**
```javascript
/**
 * Send quote received notification to producer
 * @param {Object} params - Email parameters
 * @param {string} params.to - Producer email address
 * @param {string} params.replyTo - Supplier email (for Reply-To header)
 * @param {string} params.assetName - Name of the asset
 * @param {string} params.supplierName - Name of the supplier
 * @param {number} params.cost - Quote cost
 * @param {string} [params.notes] - Optional notes/capacity details
 * @param {string} [params.documentUrl] - Optional PDF document URL
 * @param {string} params.dashboardLink - Link to producer dashboard
 * @returns {Promise<Object>} Result with success status and messageId or error
 */
async sendQuoteReceivedNotification({ to, replyTo, assetName, supplierName, cost, notes, documentUrl, dashboardLink })
```

**Email Template:**
- Subject: `New Quote Received: ${assetName}`
- Body: Include asset name, supplier name, cost (formatted), notes (if provided), PDF link (if available), dashboard link

#### 2. Update `submitQuoteViaPortal` in `portalService.js`

**Location:** `railway-backend/services/portalService.js` (after line 379)

**Changes:**
1. After successful quote update, fetch producer email:
   ```javascript
   // Fetch producer email from settings
   const { data: producerSettings } = await supabase
     .from('producer_settings')
     .select('from_email, from_name')
     .limit(1)
     .single();
   ```

2. Fetch quote with full relations (asset, supplier, project):
   ```javascript
   const { data: quoteWithRelations } = await supabase
     .from('quotes')
     .select(`
       *,
       asset:assets(
         asset_name,
         project:projects(project_name)
       ),
       supplier:suppliers(supplier_name, contact_email)
     `)
     .eq('id', updatedQuote.id)
     .single();
   ```

3. Generate dashboard link:
   ```javascript
   const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
   const dashboardLink = `${frontendUrl}/dashboard`;
   ```

4. Send notification email (non-blocking):
   ```javascript
   if (producerSettings?.from_email) {
     try {
       await emailService.sendQuoteReceivedNotification({
         to: producerSettings.from_email,
         replyTo: quoteWithRelations.supplier.contact_email,
         assetName: quoteWithRelations.asset.asset_name,
         supplierName: quoteWithRelations.supplier.supplier_name,
         cost: updatedQuote.cost,
         notes: updatedQuote.notes_capacity || '',
         documentUrl: updatedQuote.quote_document_url || null,
         dashboardLink: dashboardLink
       });
     } catch (emailError) {
       // Log but don't fail the quote submission
       console.error('Failed to send producer notification:', emailError);
     }
   }
   ```

**Error Handling:**
- Email failures should NOT block quote submission
- Log errors but continue with successful quote update response

### Frontend Changes

#### 1. Update `QuotesList.tsx` to Display Quote Details

**Location:** `src/components/producer/QuotesList.tsx`

**Changes:**
1. Add notes display for submitted quotes (after cost display, around line 277):
   ```tsx
   {quote.status === 'Submitted' && quote.notes_capacity && (
     <div className="mt-3 pt-3 border-t border-white/10">
       <p className="text-sm text-gray-300 mb-1">Notes:</p>
       <p className="text-white text-sm whitespace-pre-wrap">
         {quote.notes_capacity}
       </p>
     </div>
   )}
   ```

2. Add PDF document link (after notes, around line 285):
   ```tsx
   {quote.status === 'Submitted' && quote.quote_document_url && (
     <div className="mt-3 pt-3 border-t border-white/10">
       <a
         href={quote.quote_document_url}
         target="_blank"
         rel="noopener noreferrer"
         className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
       >
         <FileText className="w-4 h-4" />
         View Quote PDF
       </a>
     </div>
   )}
   ```

**UI Placement:**
- Notes: Below cost display, within the quote card
- PDF Link: Below notes (or below cost if no notes), styled as button

---

## Phase 3: Verification Checklist

### Backend Verification
- [ ] Producer email is fetched from `producer_settings` table
- [ ] Email includes all required information (asset, supplier, cost, notes, PDF link)
- [ ] Email failures don't block quote submission
- [ ] Dashboard link is correctly formatted
- [ ] Reply-To header uses supplier email

### Frontend Verification
- [ ] `quote_document_url` is included in Quote TypeScript interface
- [ ] Notes are displayed for submitted quotes
- [ ] PDF link opens in new tab with `target="_blank" rel="noopener noreferrer"`
- [ ] UI is responsive and matches existing design patterns
- [ ] Empty states handled (no notes, no PDF)

---

## Phase 4: Testing Scenarios

### Backend Testing
1. **Happy Path:**
   - Supplier submits quote with cost, notes, and PDF
   - Producer receives email with all details
   - Email includes working dashboard link

2. **Edge Cases:**
   - Quote submitted without notes → Email sent without notes section
   - Quote submitted without PDF → Email sent without PDF link
   - Producer settings missing → Quote still submitted, no email sent (logged)
   - Email service fails → Quote still submitted, error logged

### Frontend Testing
1. **Display:**
   - Quote with cost, notes, and PDF → All displayed correctly
   - Quote with only cost → Only cost displayed
   - Quote with cost and notes → Cost and notes displayed
   - Quote with cost and PDF → Cost and PDF link displayed

2. **Interaction:**
   - PDF link opens in new tab
   - PDF link is accessible (public URL)
   - Notes wrap correctly for long text

---

## Phase 5: Implementation Order

1. ✅ **Backend Email Service** - Add `sendQuoteReceivedNotification` method
2. ✅ **Backend Portal Service** - Update `submitQuoteViaPortal` to send email
3. ✅ **Frontend QuotesList** - Add notes and PDF display
4. ✅ **Testing** - Test all scenarios
5. ✅ **Documentation** - Update if needed

---

## Questions for Confirmation

1. **Producer Email Source:**
   - ✅ Confirmed: Use `producer_settings.from_email` (single row)
   - Alternative: If multiple producers, we'd need `project.producer_id` → `users.email` (not currently in schema)

2. **Email Template:**
   - Should we use HTML email or plain text? (Currently using plain text)
   - Should we include project name in email? (Available via `asset.project.project_name`)

3. **Frontend Display:**
   - Should notes be collapsible for long text?
   - Should PDF open in modal or new tab? (Proposed: new tab)

---

## Next Steps

**STOP - Awaiting Approval**

Please confirm:
1. ✅ Producer email source (`producer_settings.from_email`)
2. ✅ Email template approach (plain text, include project name)
3. ✅ Frontend display approach (notes always visible, PDF in new tab)

Once approved, proceed with implementation in the order specified above.


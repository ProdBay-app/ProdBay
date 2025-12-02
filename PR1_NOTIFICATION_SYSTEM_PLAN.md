# PR #1: Notification System - Email Trigger Architecture Plan

**Title:** `feat(notifications): setup email trigger for new messages`

**Status:** 📋 **AWAITING REVIEW** - Analysis Complete, Implementation Pending

---

## Phase 1: Schema Analysis & Justification

### 1.1 Messages Table Audit ✅

**Location:** `supabase/migrations/20250131000000_add_supplier_portal_schema.sql`

**Current Schema:**
```sql
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('PRODUCER', 'SUPPLIER')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_read boolean DEFAULT false
);
```

**Analysis:**
- ✅ **Links to `quote`:** Yes, via `quote_id` FK
- ✅ **Tracks sender:** Yes, via `sender_type` enum ('PRODUCER' or 'SUPPLIER')
- ⚠️ **Missing:** No explicit `sender_id` column (we can infer from `sender_type` + quote relationship)
- ✅ **Read status:** `is_read` boolean exists
- ✅ **Timestamps:** `created_at` exists

**Recipient Determination Logic:**
- **If `sender_type = 'PRODUCER'`** → Recipient is the **Supplier** (from `quotes.supplier_id`)
- **If `sender_type = 'SUPPLIER'`** → Recipient is the **Producer** (from `quotes.asset_id → assets.project_id → projects.producer_id`)

### 1.2 Quotes Table Relationship Chain ✅

**Path to Supplier Email:**
```
messages.quote_id → quotes.supplier_id → suppliers.contact_email
```

**Path to Producer Email:**
```
messages.quote_id → quotes.asset_id → assets.project_id → projects.producer_id → producers.email
```

**Schema Verification:**
- ✅ `quotes.supplier_id` → `suppliers.id` (FK exists)
- ✅ `suppliers.contact_email` (text, UNIQUE, NOT NULL)
- ✅ `quotes.asset_id` → `assets.id` (FK exists)
- ✅ `assets.project_id` → `projects.id` (FK exists)
- ✅ `projects.producer_id` → `producers.id` (FK exists, added in migration `20250202000000_add_producer_id_to_projects.sql`)
- ✅ `producers.email` (text, NOT NULL, denormalized from `auth.users.email`)

### 1.3 Schema Gaps & Recommendations

**Issues Identified:**
1. ❌ **No `sender_id` column** - Currently only `sender_type` exists
   - **Impact:** Cannot directly identify which producer sent the message (if multiple producers exist per project)
   - **Workaround:** Use `projects.producer_id` for PRODUCER messages (assumes one producer per project)
   - **Future Enhancement:** Consider adding `sender_id` if multi-producer collaboration is needed

2. ✅ **`is_read` exists** - No changes needed

3. ⚠️ **No `read_at` timestamp** - Consider adding for analytics
   - **Recommendation:** Add in future PR if read tracking is needed

**Conclusion:** Schema is **sufficient for MVP** notification system. The relationship chain allows us to determine recipient emails correctly.

---

## Phase 2: Trigger Strategy Decision

### 2.1 Options Evaluated

#### Option A: Supabase Database Webhook → API Route
**Pros:**
- ✅ Works with Vercel/Railway backend
- ✅ No database trigger complexity
- ✅ Easy to debug (HTTP logs)
- ✅ Can retry on failure
- ✅ Can add authentication/authorization

**Cons:**
- ⚠️ Requires Supabase webhook configuration
- ⚠️ Network latency (HTTP call)

#### Option B: Postgres Trigger → Edge Function
**Pros:**
- ✅ Lower latency (direct function call)
- ✅ No external HTTP dependency

**Cons:**
- ❌ Edge Functions require Supabase-specific deployment
- ❌ Less flexible for Railway/Vercel backend
- ❌ Harder to debug
- ❌ Limited retry mechanisms

### 2.2 Decision: **Option A - Database Webhook**

**Rationale:**
- Our backend is on Railway (Express.js), not Supabase Edge Functions
- Webhooks integrate cleanly with existing Railway infrastructure
- Better error handling and retry logic
- Easier to test and monitor
- Aligns with existing architecture (Railway backend handles business logic)

---

## Phase 3: Implementation Plan

### Step 1: Schema Fixes (Optional Enhancements)

**File:** `supabase/migrations/YYYYMMDDHHMMSS_add_message_notification_fields.sql`

**Proposed SQL (if needed):**
```sql
-- Optional: Add read_at timestamp for analytics
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- Optional: Add index for unread message queries
CREATE INDEX IF NOT EXISTS idx_messages_quote_is_read 
ON messages(quote_id, is_read) 
WHERE is_read = false;

-- Note: sender_id not needed for MVP (we use sender_type + quote relationship)
```

**Decision:** Skip for MVP. Current schema is sufficient.

### Step 2: Create API Route (Railway Backend)

**File:** `railway-backend/routes/messageNotifications.js` (NEW)

**Endpoint:** `POST /api/webhooks/new-message`

**Responsibilities:**
1. Receive webhook payload from Supabase
2. Validate webhook signature (if Supabase provides)
3. Extract message data from payload
4. Determine recipient email based on `sender_type`:
   - If `PRODUCER` → Lookup `quotes.supplier_id → suppliers.contact_email`
   - If `SUPPLIER` → Lookup `quotes.asset_id → assets.project_id → projects.producer_id → producers.email`
5. Call Resend API to send email notification
6. Return success/error response

**Implementation Details:**
- Use existing `EmailService` from `railway-backend/services/emailService.js`
- Query Supabase using service role key (bypass RLS)
- Handle errors gracefully (log, don't crash)
- Return 200 OK to Supabase even if email fails (to prevent retry loops)

**Email Template:**
- Subject: `"New message on quote [Quote ID]"`
- Body: Include message content, sender info, link to quote portal
- Reply-To: Set based on sender type

### Step 3: Create Supabase Database Webhook

**Configuration:**
- **Table:** `messages`
- **Event:** `INSERT`
- **HTTP Method:** `POST`
- **URL:** `https://[railway-backend-url]/api/webhooks/new-message`
- **Headers:** 
  - `Content-Type: application/json`
  - `X-Webhook-Secret: [SECRET]` (for validation)
- **Payload:** Full row data (Supabase default)

**Webhook Payload Structure:**
```json
{
  "type": "INSERT",
  "table": "messages",
  "record": {
    "id": "uuid",
    "quote_id": "uuid",
    "sender_type": "PRODUCER" | "SUPPLIER",
    "content": "text",
    "created_at": "timestamp",
    "is_read": false
  }
}
```

**Security:**
- Validate webhook secret in API route
- Use Supabase service role for database queries
- Rate limit webhook endpoint (prevent abuse)

### Step 4: Environment Variables

**Railway Backend (`railway-backend/env.example`):**
```env
# Existing
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=requests@prodbay.com

# New
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
WEBHOOK_SECRET=your_webhook_secret_here
```

**Supabase Dashboard:**
- Configure webhook URL in Database → Webhooks
- Set webhook secret (store in Railway env vars)

---

## Phase 4: Implementation Checklist

### Backend (Railway)
- [ ] Create `railway-backend/routes/messageNotifications.js`
- [ ] Add webhook secret validation middleware
- [ ] Implement recipient email lookup logic
- [ ] Integrate with existing `EmailService`
- [ ] Add error handling and logging
- [ ] Register route in `railway-backend/index.js`
- [ ] Update `railway-backend/env.example`
- [ ] Test locally with Supabase webhook simulator

### Database (Supabase)
- [ ] Create Database Webhook in Supabase Dashboard
- [ ] Configure webhook URL (Railway production URL)
- [ ] Set webhook secret
- [ ] Test webhook with sample INSERT

### Testing
- [ ] Unit test: Recipient email lookup logic
- [ ] Integration test: Webhook → API → Resend flow
- [ ] Test PRODUCER → SUPPLIER notification
- [ ] Test SUPPLIER → PRODUCER notification
- [ ] Test error scenarios (invalid quote_id, missing email, etc.)

### Documentation
- [ ] Update `railway-backend/README.md` with new endpoint
- [ ] Document webhook configuration in deployment guide
- [ ] Add troubleshooting section for webhook failures

---

## Phase 5: Error Handling & Edge Cases

### Error Scenarios

1. **Quote not found:**
   - Log error, return 200 OK (prevent retry)
   - Don't send email

2. **Supplier email missing:**
   - Log warning, return 200 OK
   - Consider fallback to `suppliers.contact_persons[0].email` if exists

3. **Producer email missing:**
   - Log error, return 200 OK
   - This should never happen (producers.email is NOT NULL)

4. **Resend API failure:**
   - Log error with full details
   - Return 200 OK (prevent Supabase retry loop)
   - Consider implementing retry queue in future PR

5. **Webhook secret mismatch:**
   - Return 401 Unauthorized
   - Log security warning

### Monitoring

- Log all webhook invocations
- Track email send success/failure rates
- Alert on high failure rates
- Monitor webhook latency

---

## Phase 6: Future Enhancements (Out of Scope)

- [ ] Add `sender_id` column to messages table (multi-producer support)
- [ ] Add `read_at` timestamp for analytics
- [ ] Implement email retry queue (for Resend failures)
- [ ] Add email preferences (opt-out per user)
- [ ] Support HTML email templates
- [ ] Add email delivery status tracking
- [ ] Implement digest emails (batch notifications)

---

## Summary

**Schema Status:** ✅ **READY** - No changes required for MVP

**Architecture Decision:** ✅ **Database Webhook → Railway API Route**

**Implementation Complexity:** 🟡 **Medium** - Requires webhook setup + API route + email integration

**Risk Level:** 🟢 **Low** - Uses existing infrastructure (Resend, Railway, Supabase)

**Estimated Effort:** 4-6 hours (backend route + webhook config + testing)

---

## Next Steps

**STOP** - Awaiting "LGTM" approval before implementation.

Once approved:
1. Implement API route
2. Configure Supabase webhook
3. Test end-to-end flow
4. Deploy to production


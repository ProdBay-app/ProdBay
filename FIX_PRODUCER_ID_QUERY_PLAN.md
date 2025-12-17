# PR: Fix Missing producer_id in Project Query

## Title
`fix(backend): include producer_id in project fetch query to enable email notifications`

## Why

**Problem:**
The email notification system for supplier messages is failing with the error:
```
[PortalService] ❌ Broken Chain: Project {id} has no producer_id set. Skipping email notification.
```

**Root Cause:**
The `validateAccessToken` method in `portalService.js` (called by `sendSupplierMessage`) uses an explicit field list for the `project:projects(...)` selection that **omits `producer_id`**. Even though `producer_id` exists in the database, it's not being fetched, causing `project.producer_id` to be `undefined` at line 174.

**Evidence:**
- User confirmed `producer_id` exists in the `projects` table
- The query at lines 31-41 explicitly lists project fields but excludes `producer_id`
- Other queries in the file (e.g., `getQuoteMessages` at line 493) use `project:projects(*)` which would include all fields
- The error occurs at line 176: `if (!producerId)` where `producerId = project.producer_id` is `undefined`

**Impact:**
- Email notifications to producers are completely blocked
- Suppliers can send messages, but producers never receive email alerts
- Silent failure: message is created successfully, but notification is skipped

## The Plan

### 1. Update Project Field Selection

**File:** `railway-backend/services/portalService.js`
- **Location:** Lines 31-41 (`validateAccessToken` method)
- **Current Query:**
  ```javascript
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
  ```
- **Change:** Add `producer_id` to the field list
- **New Query:**
  ```javascript
  project:projects(
    id,
    project_name,
    client_name,
    brief_description,
    physical_parameters,
    timeline_deadline,
    project_status,
    producer_id,
    created_at,
    updated_at
  )
  ```

### 2. Verify Other Queries (Optional Enhancement)

**File:** `railway-backend/services/portalService.js`
- **Location:** Line 423-425 (`submitQuoteViaPortal` method)
- **Status:** Uses `project:projects(project_name)` - only fetches `project_name` for email context
- **Action:** No change needed - this query is for a different purpose (quote submission notification)

**Note:** Other queries like `getQuoteMessages` (line 493) already use `project:projects(*)` which includes all fields.

## Impact Analysis

### Positive Impacts:
- ✅ Email notifications will work correctly
- ✅ Producers will receive alerts when suppliers send messages
- ✅ Fixes the "Broken Chain" error
- ✅ No breaking changes: only adds a missing field to the selection

### Potential Risks:
- 🟢 **Very Low Risk:** Only adding a field to the selection list
- 🟢 **No Data Changes:** Not modifying any data, only fetching an existing field
- 🟢 **Backward Compatible:** Existing code that doesn't use `producer_id` will continue to work

### Data Flow After Fix:
1. Supplier sends message → `sendSupplierMessage(token, content)`
2. `validateAccessToken(token)` fetches quote with **`producer_id` included**
3. `project.producer_id` is now populated (not `undefined`)
4. Producer fetch succeeds → Email notification sent ✅

### Testing Checklist:
- [ ] Verify `project.producer_id` is populated after the fix
- [ ] Verify email notification is sent successfully
- [ ] Verify no errors in logs about missing `producer_id`
- [ ] Test with a quote that has a valid `producer_id` in the database
- [ ] Verify other functionality using `validateAccessToken` still works

## Files to Modify

1. **`railway-backend/services/portalService.js`**
   - Update `validateAccessToken` method (Lines 31-41)
   - Add `producer_id` to the `project:projects(...)` field list

## Implementation Details

### Current Behavior (Broken):
```javascript
// Line 174: project.producer_id is undefined
const producerId = project.producer_id; // undefined
if (!producerId) { // This check fails, skipping email
  console.error('❌ Broken Chain: Project has no producer_id set');
}
```

### After Fix:
```javascript
// Line 174: project.producer_id is now populated
const producerId = project.producer_id; // e.g., "uuid-here"
if (!producerId) { // This check passes
  // ... fetch producer and send email
}
```

### Query Comparison:

**Before (Missing producer_id):**
```javascript
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
```

**After (Includes producer_id):**
```javascript
project:projects(
  id,
  project_name,
  client_name,
  brief_description,
  physical_parameters,
  timeline_deadline,
  project_status,
  producer_id,  // ← Added
  created_at,
  updated_at
)
```

## Risk Assessment

**Risk Level:** 🟢 **Very Low**
- Single field addition to existing query
- No structural changes
- No data modifications
- Backward compatible
- Fixes a critical bug (email notifications not working)

## Notes

- The comment on line 23 mentions "financial_parameters is intentionally excluded" - this is fine, we're only adding `producer_id` which is needed for the email flow
- Other methods in the file (`getQuoteMessages`, `sendProducerMessage`) use `project:projects(*)` which includes all fields, but `validateAccessToken` uses an explicit list for security/performance reasons
- Adding `producer_id` to the explicit list maintains the same security posture while enabling the email notification feature


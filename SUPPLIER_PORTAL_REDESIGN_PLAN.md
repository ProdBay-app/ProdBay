# Supplier Portal Redesign Plan

## PR Title
`style(portal): redesign supplier quote view and expand project details`

## Phase 1: Analysis Summary

### Current Data Availability

**Backend (`railway-backend/services/portalService.js`):**
- Currently selects only: `project:projects(id, project_name, producer_id)`
- **Missing fields** that should be included:
  - `brief_description` ✅ (available in schema)
  - `physical_parameters` ✅ (available in schema)
  - `timeline_deadline` ✅ (available in schema, date field)
  - `client_name` ✅ (available in schema)
  - `financial_parameters` ❌ (should be **explicitly excluded**)

**Frontend (`src/pages/portal/QuotePortal.tsx`):**
- Currently uses light theme: `bg-white/90`, `text-gray-900`
- Missing project context section
- Only displays asset specifications and timeline

**Available Project Fields (from schema):**
- `id`, `project_name`, `client_name` ✅
- `brief_description` ✅
- `physical_parameters` ✅
- `timeline_deadline` ✅ (date field)
- `financial_parameters` ❌ (must exclude)
- `project_status` ✅
- `created_at`, `updated_at` ✅

**Note:** The schema does **NOT** have `start_date`, `end_date`, or `location` fields. We'll work with available fields:
- Use `timeline_deadline` for date information
- Use `physical_parameters` for location/logistics if available
- Use `brief_description` for project description

## Phase 2: Implementation Plan

### Step 1: Backend - Expand Project Data Selection

**File:** `railway-backend/services/portalService.js`

**Change:** Update `validateAccessToken` method to select additional project fields:

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
  // NOTE: financial_parameters is intentionally excluded
)
```

### Step 2: Frontend - Update TypeScript Interface

**File:** `src/services/portalService.ts`

**Change:** Update `Project` interface to include new fields (if not already present):

```typescript
export interface Project {
  id: string;
  project_name: string;
  client_name: string;
  brief_description: string;
  physical_parameters?: string;
  timeline_deadline?: string;  // Date string
  project_status: string;
  // financial_parameters is NOT included
  created_at: string;
  updated_at: string;
}
```

### Step 3: Frontend - Apply Dark Theme

**File:** `src/pages/portal/QuotePortal.tsx`

**Global Container:**
- Change: `min-h-screen bg-[#0A0A0A] text-white`

**Cards:**
- Replace `bg-white/90 backdrop-blur-sm` with `bg-white/5 border border-white/10 rounded-xl`
- Replace `text-gray-900` with `text-white`
- Replace `text-gray-700` with `text-gray-300`
- Replace `text-gray-500` with `text-gray-400`

**Form Inputs:**
- Change: `bg-white/5 border-white/10 text-white placeholder-gray-400`
- Focus states: `focus:ring-purple-500 focus:border-purple-500`

**Buttons:**
- Primary: `bg-purple-600 hover:bg-purple-700 text-white`
- Secondary: `bg-white/10 hover:bg-white/20 text-white`

### Step 4: Frontend - Add Project Context Section

**New Section:** Add "Project Context" card before "Asset Specifications"

**Display Fields:**
1. **Project Name** (`session.project.project_name`)
2. **Client Name** (`session.project.client_name`)
3. **Project Description** (`session.project.brief_description`) - if available
4. **Timeline/Deadline** (`session.project.timeline_deadline`) - formatted date, if available
5. **Physical Parameters** (`session.project.physical_parameters`) - if available (may contain location/logistics)
6. **Project Status** (`session.project.project_status`) - badge style

**Layout:**
- Card with glass-morphism styling
- Icon header (e.g., `Building2` or `Briefcase`)
- Grid layout for key-value pairs
- Conditional rendering (only show if data exists)

**Explicitly Exclude:**
- `financial_parameters` - Do NOT display anywhere

### Step 5: Frontend - Refactor Quote Submission Form

**Styling:**
- Apply dark theme to all form elements
- Match input styling with rest of portal
- Ensure submit button matches primary button style

**Layout:**
- Keep existing functionality
- Update visual styling only

## Phase 3: Design Specifications

### Color Palette
- **Background:** `bg-[#0A0A0A]` (dark)
- **Cards:** `bg-white/5 border border-white/10`
- **Text Primary:** `text-white`
- **Text Secondary:** `text-gray-300`
- **Text Tertiary:** `text-gray-400`
- **Accent:** `text-purple-300` / `bg-purple-600`
- **Borders:** `border-white/10` / `border-white/20`

### Typography
- **Headings:** `text-white font-semibold` or `font-bold`
- **Body:** `text-gray-300` or `text-gray-400`
- **Labels:** `text-gray-300 font-medium`

### Spacing
- **Card Padding:** `p-6`
- **Section Gap:** `space-y-6` or `gap-6`
- **Internal Spacing:** `space-y-4`

## Phase 4: Data Flow Verification

### Backend → Frontend
1. Backend `validateAccessToken` selects expanded project fields
2. Backend `getPortalSession` returns project with all fields (except `financial_parameters`)
3. Frontend `PortalService.getSession` receives full project data
4. Frontend `QuotePortal` component accesses `session.project.*` fields

### Conditional Rendering
- Only display fields that have values (avoid empty sections)
- Use optional chaining: `session.project?.brief_description`
- Format dates: `new Date(session.project.timeline_deadline).toLocaleDateString()`

## Phase 5: Testing Checklist

- [ ] Backend returns expanded project fields
- [ ] Frontend receives all project data
- [ ] Dark theme applied consistently
- [ ] Project Context section displays correctly
- [ ] All fields conditionally rendered (no empty sections)
- [ ] Financial parameters NOT displayed anywhere
- [ ] Quote submission form matches dark theme
- [ ] Responsive layout works on mobile
- [ ] Loading and error states match dark theme

## Summary

**Backend Changes:**
- Expand project field selection in `validateAccessToken`
- Exclude `financial_parameters` explicitly

**Frontend Changes:**
- Apply dark theme (`bg-[#0A0A0A]`, glass-morphism cards)
- Add "Project Context" section
- Refactor form styling
- Update TypeScript interfaces

**Data Displayed:**
- Project Name, Client Name
- Project Description (brief_description)
- Timeline/Deadline (timeline_deadline)
- Physical Parameters (physical_parameters - may contain location/logistics)
- Project Status

**Data Excluded:**
- Financial Parameters (budget) - explicitly hidden


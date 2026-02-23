export interface ReleaseNote {
  date: string;
  version: string;
  title: string;
  bulletPoints: string[];
}

export const RELEASE_NOTES: ReleaseNote[] = [
  {
    date: '2026-02-23',
    version: 'v0.9.0',
    title: 'Professional Email Overhaul (Part 1)',
    bulletPoints: [
      'New branded global email template with ProdBay header and consistent typography (Inter/system-serif).',
      'Fixed quote request email formatting: line breaks and links now display correctly instead of raw HTML tags.',
      'Prominent "Submit Quote" button as the primary visual anchor for supplier action.',
      'Reusable BaseEmailLayout infrastructure for future email types.'
    ]
  },
  {
    date: '2026-02-23',
    version: 'v0.9.0',
    title: 'Professional Email Overhaul (Part 2)',
    bulletPoints: [
      'System-wide email content standardization: Quote Received, New Message, and Quote Accepted notifications.',
      'Quote Received: Document links now render as clickable links (valueHtml support in email generator).',
      'New Message: All user-supplied content (sender name, quote name, message preview) escaped to prevent XSS.',
      'Quote Accepted: "View in Portal" CTA button when portal link is available; consistent 16px/1.6 typography.'
    ]
  },
  {
    date: '2026-02-24',
    version: 'v0.9.0',
    title: 'Customizable Business Branding',
    bulletPoints: [
      'Quote request emails now carry your professional identity: name, company, email, and phone from your profile.',
      'New Company Name and Business Phone Number fields in Settings → Profile; values sync to producers table and user metadata.',
      'Backend fetches producer profile when building default quote request emails, replacing generic "[Your Name]" fallbacks.',
      'Removed redundant "You will receive a unique link via email" sentence from quote request body.'
    ]
  },
  {
    date: '2026-02-24',
    version: 'v0.9.0',
    title: 'Email & Branding Overhaul (Complete)',
    bulletPoints: [
      'Universal branding applied to acceptance notifications and message alerts.',
      'Quote Accepted and "New Message" (producer → supplier) emails now carry the producer\'s signature and branding.',
      'Clean fallback logic: incomplete profiles (name-only, no company/phone) render without empty lines or weird punctuation.',
      "Implemented 'Airbnb-style' From headers for enhanced brand recognition.",
      'Email & Branding Overhaul: 100% complete.'
    ]
  },
  {
    date: '2026-02-23',
    version: 'v0.9.0',
    title: 'Intelligence Upgrade: Senior Production Controller',
    bulletPoints: [
      'AI Asset Analysis engine refactored to act as a Senior Production Controller with event procurement expertise.',
      'Identifies implied infrastructure and operational requirements (e.g., rigging, power, crew when LED screens or branded structures are mentioned).',
      'Tracks asset lifecycle from fabrication through transport, installation, live operation, and derig.',
      "New 'Supplier Context' field provides vendor-ready instructions: indoor/outdoor use, installation requirements, operator needs, transport.",
      'Smart handling of TBC and Estimated quantities—stored in specifications when exact count is uncertain.',
      "Procurement Insights section in AI preview and 'Supplier & Logistics Context' in asset details surface these insights before creation."
    ]
  },
  {
    date: '2026-02-24',
    version: 'v0.9.0',
    title: 'Global inline table editing for assets',
    bulletPoints: [
      'Added Edit Mode toggle to the asset table for rapid updates without opening modals.',
      'Inline editing for Name, Quantity, Tags, and Specifications directly in the table view.',
      'Tags use the same predefined list and multi-select dropdown as the asset forms.',
      'Save All persists changes; partial failures keep failed assets editable and show clear feedback.',
      'Discard clears unsaved edits; confirmation required when exiting edit mode with unsaved changes.'
    ]
  },
  {
    date: '2026-02-23',
    version: 'v0.8.9',
    title: 'Asset table updates: specifications column and streamlined columns',
    bulletPoints: [
      'Removed deprecated # Quote Requests and # Quotes Received columns from the asset table list view.',
      'Added Specifications column between Tags and Supplier Status so asset specs are visible at a glance.',
      'Long specifications are truncated with ellipsis; hover to see the full text in a tooltip.'
    ]
  },
  {
    date: '2026-02-19',
    version: 'v0.8.8',
    title: 'Simplified asset tags for consistent AI attribution',
    bulletPoints: [
      'Reduced predefined asset tags from 50 to 15 distinct categories for clearer LLM tagging.',
      'Tags are now more distinct with minimal overlap: Audio, Video & Display, Photography, Graphics & Signage, Lighting, Staging, Catering, Staffing, Logistics, Branding & Marketing, Floral & Decor, Furniture, Technology, Medical, Scenic & Props.',
      'AI prompt updated to encourage 2–3 tags per asset when appropriate for better categorization.',
      'Supplier relevance matching updated for the new tags; legacy tags continue to map correctly for existing assets.'
    ]
  },
  {
    date: '2026-02-19',
    version: 'v0.8.7',
    title: 'Event date extraction and project modal polish',
    bulletPoints: [
      'Added event date extraction from briefs via BriefHighlightService; event date surfaced in ActiveProjectsGrid, ProjectDetailPage, and ProjectModal.',
      'Adjusted ProjectModal grid layout for improved spacing.'
    ]
  },
  {
    date: '2026-02-18',
    version: 'v0.8.6',
    title: 'Settings page and project dashboard refinements',
    bulletPoints: [
      'Added a comprehensive Settings page with vertical sidebar layout and Profile, Appearance, Notifications, and Billing tabs.',
      'Profile settings: Name, Email, Bio, and 10 selectable avatar presets (initials-based). All profile data persists via Supabase Auth.',
      'Settings link added to the header navigation for quick access.',
      'Project dashboard: Search bar now always visible; removed status labels (New, In Progress, Quoting) from project cards for a cleaner layout.',
      'Project cards made more compact with the arrow inline with the deadline.',
      'Project detail Overview: Edit and Delete buttons (icon-only) in the Overview block header.',
      'Overview edit modal supports Project Name, Client, Budget, and Deadline with persistence; Delete project with confirmation modal.'
    ]
  },
  {
    date: '2026-02-18',
    version: 'v0.8.5',
    title: 'Email delivery rate-limit hardening for supplier workflows',
    bulletPoints: [
      'Added centralized email send throttling to keep outbound Resend requests safely below platform limits.',
      'Introduced bounded retry with exponential backoff for temporary 429 and 5xx email delivery failures.',
      'Improved quote-request email reliability in bulk supplier sends without changing producer-facing flow.'
    ]
  },
  {
    date: '2026-02-15',
    version: 'v0.8.4',
    title: 'Asset workspace polish and reliability improvements',
    bulletPoints: [
      'Improved autosave stability when switching quickly between assets.',
      'Refined visual hierarchy in asset details for faster scanning.',
      'Added guardrails around quote refresh behavior in asset workflows.'
    ]
  },
  {
    date: '2026-02-08',
    version: 'v0.8.3',
    title: 'Producer dashboard quality-of-life updates',
    bulletPoints: [
      'Enhanced tab behavior for quote requests and supplier status views.',
      'Reduced friction in project navigation for active producer tasks.',
      'Applied consistency fixes across dashboard card components.'
    ]
  },
  {
    date: '2026-02-01',
    version: 'v0.8.2',
    title: 'Supplier quote flow enhancements',
    bulletPoints: [
      'Improved quote submission reliability for shared and portal flows.',
      'Expanded feedback states to better surface submission progress.',
      'Adjusted validation messaging for clearer supplier guidance.'
    ]
  },
  {
    date: '2026-01-25',
    version: 'v0.8.1',
    title: 'Project detail and metadata updates',
    bulletPoints: [
      'Updated project and asset metadata presentation for clarity.',
      'Smoothed interactions in detail modals and contextual panels.',
      'Addressed minor UI inconsistencies across producer pages.'
    ]
  },
  {
    date: '2026-01-18',
    version: 'v0.8.0',
    title: 'Foundation updates for platform transparency',
    bulletPoints: [
      'Prepared core routing and layout patterns for release communications.',
      'Standardized shared styling primitives used by system pages.',
      'Improved maintainability with small cleanup passes across UI modules.'
    ]
  }
];

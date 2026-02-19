export interface ReleaseNote {
  date: string;
  version: string;
  title: string;
  bulletPoints: string[];
}

export const RELEASE_NOTES: ReleaseNote[] = [
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

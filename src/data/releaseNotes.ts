export interface ReleaseNote {
  date: string;
  version: string;
  title: string;
  bulletPoints: string[];
}

export const RELEASE_NOTES: ReleaseNote[] = [
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

// Application constants
export const APP_NAME = 'ProdBay';
export const APP_DESCRIPTION = 'Production Management Platform';

// Route paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/',
  PRODUCER_DASHBOARD: '/producer/dashboard',
  PRODUCER_SUPPLIERS: '/producer/suppliers',
  SUPPLIER_QUOTES: '/supplier/quotes',
  SUPPLIER_SUBMIT: '/supplier/submit',
  ADMIN_DASHBOARD: '/admin/dashboard',
  QUOTE_SUBMISSION: '/quote/:token'
} as const;

// Project statuses
export const PROJECT_STATUSES = {
  NEW: 'New',
  IN_PROGRESS: 'In Progress',
  QUOTING: 'Quoting',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
} as const;

// Asset statuses
export const ASSET_STATUSES = {
  PENDING: 'Pending',
  QUOTING: 'Quoting',
  APPROVED: 'Approved',
  IN_PRODUCTION: 'In Production',
  DELIVERED: 'Delivered'
} as const;

// Quote statuses
export const QUOTE_STATUSES = {
  SUBMITTED: 'Submitted',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected'
} as const;

// Color themes for different user types
export const USER_THEMES = {
  PRODUCER: {
    primary: 'bg-teal-600',
    hover: 'hover:bg-teal-700',
    text: 'text-teal-600'
  },
  SUPPLIER: {
    primary: 'bg-orange-600',
    hover: 'hover:bg-orange-700',
    text: 'text-orange-600'
  },
  ADMIN: {
    primary: 'bg-gray-800',
    hover: 'hover:bg-gray-900',
    text: 'text-gray-800'
  }
} as const;

// Asset keywords for automation
export const ASSET_KEYWORDS = {
  'printing': ['print', 'banner', 'poster', 'flyer', 'brochure', 'signage'],
  'staging': ['stage', 'platform', 'backdrop', 'display'],
  'audio': ['sound', 'speaker', 'microphone', 'audio', 'music'],
  'lighting': ['light', 'lighting', 'illumination', 'led'],
  'catering': ['food', 'catering', 'meal', 'refreshment', 'beverage'],
  'transport': ['transport', 'delivery', 'logistics', 'shipping'],
  'design': ['design', 'graphic', 'branding', 'logo', 'creative']
} as const;

// Default values
export const DEFAULTS = {
  PAGE_SIZE: 10,
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 5000
} as const;

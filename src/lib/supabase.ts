import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Guard against missing environment variables to avoid runtime crashes
// Provide a minimal no-op client if environment variables are missing
let supabaseClient: ReturnType<typeof createClient>;

try {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      '[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
      'Set them in your .env.local or .env.production before building.'
    );
    // Create a fallback client that will fail gracefully
    supabaseClient = createClient('http://localhost', 'invalid');
  } else {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
} catch (error) {
  console.error('[Supabase] Failed to initialize client:', error);
  // Fallback to invalid client
  supabaseClient = createClient('http://localhost', 'invalid');
}

export const supabase = supabaseClient;

// Database types
export interface Project {
  id: string;
  project_name: string;
  client_name: string;
  brief_description: string;
  physical_parameters?: string;
  financial_parameters?: number;
  timeline_deadline?: string;
  project_status: 'New' | 'In Progress' | 'Quoting' | 'Completed' | 'Cancelled';
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  project_id: string;
  asset_name: string;
  specifications?: string;
  timeline?: string;
  status: 'Pending' | 'Quoting' | 'Approved' | 'In Production' | 'Delivered';
  assigned_supplier_id?: string;
  created_at: string;
  updated_at: string;
  assigned_supplier?: Supplier;
}

export interface Supplier {
  id: string;
  supplier_name: string;
  contact_email: string;
  service_categories: string[];
  created_at: string;
}

export interface Quote {
  id: string;
  supplier_id: string;
  asset_id: string;
  cost: number;
  notes_capacity?: string;
  status: 'Submitted' | 'Accepted' | 'Rejected';
  quote_token: string;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
  asset?: Asset;
}

export interface ProducerSettings {
  id: string;
  from_name: string;
  from_email: string;
  created_at: string;
  updated_at: string;
}
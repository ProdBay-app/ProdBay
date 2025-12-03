import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Supabase client instance
let supabaseInstance: SupabaseClient | null = null;

/**
 * Get Supabase client instance
 * This provides immediate access to the Supabase client
 */
export const getSupabase = async (): Promise<SupabaseClient> => {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Guard against missing environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    // eslint-disable-next-line no-console
    console.error(
      '[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
      'Set them in your .env.local or .env.production before building.'
    );
    // Return fallback client for development
    supabaseInstance = createClient('http://localhost', 'invalid');
  } else {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Supabase] Failed to initialize client:', error);
      supabaseInstance = createClient('http://localhost', 'invalid');
    }
  }

  return supabaseInstance;
};

/**
 * Synchronous Supabase client for immediate use
 */
export const getSyncSupabase = (): SupabaseClient => {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Guard against missing environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    // eslint-disable-next-line no-console
    console.error(
      '[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
      'Set them in your .env.local or .env.production before building.'
    );
    // Return fallback client for development
    supabaseInstance = createClient('http://localhost', 'invalid');
  } else {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Supabase] Failed to initialize client:', error);
      supabaseInstance = createClient('http://localhost', 'invalid');
    }
  }

  return supabaseInstance;
};

/**
 * Synchronous Supabase client export
 * This provides immediate access to the Supabase client for components that need it
 */
export const supabase = getSyncSupabase();


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
  ai_allocation_completed_at?: string;
  producer_id: string;
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
  source_text?: string;
  quantity?: number;
  tags?: string[];
  created_at: string;
  updated_at: string;
  assigned_supplier?: Supplier;
}

export interface ContactPerson {
  name: string;
  email: string;
  role: string;
  phone?: string;
  is_primary: boolean;
}

export interface Supplier {
  id: string;
  supplier_name: string;
  contact_email: string;
  service_categories: string[];
  contact_persons: ContactPerson[];
  created_at: string;
}

export interface Quote {
  id: string;
  supplier_id: string;
  asset_id: string;
  cost: number;
  notes_capacity?: string;
  status: 'Pending' | 'Submitted' | 'Accepted' | 'Rejected';
  quote_token: string;
  quote_document_url?: string;
  cost_breakdown?: {
    labor: number;
    materials: number;
    equipment: number;
    other: number;
  };
  valid_until?: string;
  response_time_hours?: number;
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

export interface SuggestedSupplier extends Supplier {
  already_contacted: boolean;
}

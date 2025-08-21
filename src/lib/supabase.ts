import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
/**
 * Database types for Supabase tables
 * Generated from database schema
 */

export type ProjectStatus = 'New' | 'In Progress' | 'Quoting' | 'Completed' | 'Cancelled';
export type AssetStatus = 'Pending' | 'Quoting' | 'Approved' | 'In Production' | 'Delivered';
export type QuoteStatus = 'Submitted' | 'Accepted' | 'Rejected';

export interface Project {
  id: string;
  project_name: string;
  client_name: string;
  brief_description: string;
  physical_parameters: string;
  financial_parameters: number;
  timeline_deadline: string | null;
  project_status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  project_id: string;
  asset_name: string;
  specifications: string;
  timeline: string | null;
  status: AssetStatus;
  assigned_supplier_id: string | null;
  created_at: string;
  updated_at: string;
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
  notes_capacity: string;
  status: QuoteStatus;
  quote_token: string;
  created_at: string;
  updated_at: string;
}

// Insert types (for creating new records)
export type QuoteInsert = Omit<Quote, 'id' | 'created_at' | 'updated_at' | 'quote_token'> & {
  id?: string;
  quote_token?: string;
  created_at?: string;
  updated_at?: string;
};

export type AssetInsert = Omit<Asset, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type ProjectInsert = Omit<Project, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type SupplierInsert = Omit<Supplier, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

// Update types (for updating existing records)
export type QuoteUpdate = Partial<Omit<Quote, 'id' | 'created_at' | 'updated_at'>>;
export type AssetUpdate = Partial<Omit<Asset, 'id' | 'created_at' | 'updated_at'>>;
export type ProjectUpdate = Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>;
export type SupplierUpdate = Partial<Omit<Supplier, 'id' | 'created_at'>>;


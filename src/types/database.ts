/**
 * Database types for Supabase tables
 * Generated from database schema
 */

export type ProjectStatus = 'New' | 'In Progress' | 'Quoting' | 'Completed' | 'Cancelled';
export type AssetStatus = 'Pending' | 'Quoting' | 'Approved' | 'In Production' | 'Delivered';
export type QuoteStatus = 'Pending' | 'Submitted' | 'Accepted' | 'Rejected';
export type MilestoneStatus = 'pending' | 'completed' | 'cancelled';
export type ActionType = 'producer_review_quote' | 'producer_approve_asset' | 'producer_assign_supplier' | 'supplier_submit_quote' | 'supplier_revise_quote' | 'client_approval' | 'other';
export type ActionStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type ActionAssignee = 'producer' | 'supplier' | 'client';

export interface Project {
  id: string;
  project_name: string;
  client_name: string;
  brief_description: string;
  physical_parameters: string;
  financial_parameters: number;
  timeline_deadline: string | null;
  project_status: ProjectStatus;
  producer_id: string;
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
  quantity: number | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  quote_count?: number; // Total count of quote requests sent (all statuses)
  received_quote_count?: number; // Count of quotes received (Submitted, Accepted, or Rejected status)
}

export interface Supplier {
  id: string;
  supplier_name: string;
  contact_email: string | null;
  service_categories: string[];
  contact_persons?: ContactPerson[];
  created_at: string;
}

export interface ContactPerson {
  name: string;
  email: string;
  role: string;
  phone?: string;
  is_primary?: boolean;
  isPrimary?: boolean;
  default_cc?: boolean;
  default_bcc?: boolean;
}

export interface Quote {
  id: string;
  supplier_id: string;
  asset_id: string;
  cost: number;
  notes_capacity: string;
  status: QuoteStatus;
  quote_token: string;
  access_token?: string; // UUID token for supplier portal access
  quote_document_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  milestone_name: string;
  milestone_date: string;
  status: MilestoneStatus;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface ActionItem {
  id: string;
  project_id: string;
  asset_id: string | null;
  quote_id: string | null;
  action_type: ActionType;
  action_description: string;
  status: ActionStatus;
  assigned_to: ActionAssignee;
  priority: number;
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
}

export interface ProjectBudgetSummary {
  project_id: string;
  project_name: string;
  total_budget: number;
  total_spent: number;
  budget_remaining: number;
  budget_used_percentage: number;
}

// Aggregated project summary for tracking widgets
export interface ProjectTrackingSummary {
  projectId: string;
  budget: {
    total: number;
    spent: number;
    remaining: number;
    percentageUsed: number;
  };
  timeline: {
    deadline: string | null;
    daysRemaining: number | null;
    milestones: ProjectMilestone[];
  };
  actions: {
    producerActions: number;
    supplierActions: number;
  };
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

export type SupplierInsert = Omit<Supplier, 'id' | 'created_at' | 'contact_email'> & {
  id?: string;
  created_at?: string;
  contact_email?: string | null;
};

export type MilestoneInsert = Omit<ProjectMilestone, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type ActionItemInsert = Omit<ActionItem, 'id' | 'created_at' | 'updated_at' | 'completed_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
};

// Update types (for updating existing records)
export type QuoteUpdate = Partial<Omit<Quote, 'id' | 'created_at' | 'updated_at'>>;
export type AssetUpdate = Partial<Omit<Asset, 'id' | 'created_at' | 'updated_at'>>;
export type ProjectUpdate = Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>;
export type SupplierUpdate = Partial<Omit<Supplier, 'id' | 'created_at'>>;
export type MilestoneUpdate = Partial<Omit<ProjectMilestone, 'id' | 'created_at' | 'updated_at'>>;
export type ActionItemUpdate = Partial<Omit<ActionItem, 'id' | 'created_at' | 'updated_at'>>;


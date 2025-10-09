/*
  # Project Tracking Enhancement Migration
  
  This migration adds tables to support project health tracking widgets:
  
  1. `project_milestones` - Track timeline checkpoints beyond final deadline
  2. `action_items` - Explicit tracking of pending producer/supplier actions
  
  These enable:
  - Budget tracking bar (via quote aggregation)
  - Timeline widget with milestones
  - "Your Actions" and "Their Actions" counters
*/

-- Create enum for milestone status
CREATE TYPE milestone_status_enum AS ENUM ('pending', 'completed', 'cancelled');

-- Create enum for action item types
CREATE TYPE action_type_enum AS ENUM (
  'producer_review_quote',
  'producer_approve_asset',
  'producer_assign_supplier',
  'supplier_submit_quote',
  'supplier_revise_quote',
  'client_approval',
  'other'
);

-- Create enum for action status
CREATE TYPE action_status_enum AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- Create enum for action assignee
CREATE TYPE action_assignee_enum AS ENUM ('producer', 'supplier', 'client');

-- Project Milestones Table
CREATE TABLE IF NOT EXISTS project_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  milestone_name text NOT NULL,
  milestone_date date NOT NULL,
  status milestone_status_enum DEFAULT 'pending',
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Action Items Table
CREATE TABLE IF NOT EXISTS action_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
  quote_id uuid REFERENCES quotes(id) ON DELETE CASCADE,
  action_type action_type_enum NOT NULL,
  action_description text NOT NULL,
  status action_status_enum DEFAULT 'pending',
  assigned_to action_assignee_enum NOT NULL,
  priority integer DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
  due_date date,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_date ON project_milestones(milestone_date);
CREATE INDEX IF NOT EXISTS idx_project_milestones_status ON project_milestones(status);

CREATE INDEX IF NOT EXISTS idx_action_items_project_id ON action_items(project_id);
CREATE INDEX IF NOT EXISTS idx_action_items_asset_id ON action_items(asset_id);
CREATE INDEX IF NOT EXISTS idx_action_items_status ON action_items(status);
CREATE INDEX IF NOT EXISTS idx_action_items_assigned_to ON action_items(assigned_to);
CREATE INDEX IF NOT EXISTS idx_action_items_due_date ON action_items(due_date);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_action_items_project_status_assignee 
  ON action_items(project_id, status, assigned_to);

-- Enable Row Level Security
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies (public access for MVP - simplified security)
CREATE POLICY "Allow all operations on project_milestones"
  ON project_milestones
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on action_items"
  ON action_items
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add helpful comments for documentation
COMMENT ON TABLE project_milestones IS 'Timeline checkpoints and milestones for project tracking';
COMMENT ON TABLE action_items IS 'Explicit tracking of pending actions for producers, suppliers, and clients';
COMMENT ON COLUMN action_items.priority IS 'Priority level: 1 (lowest) to 5 (highest)';
COMMENT ON COLUMN action_items.assigned_to IS 'Who is responsible for completing this action';

-- Create helper function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for auto-updating updated_at
CREATE TRIGGER update_project_milestones_updated_at
  BEFORE UPDATE ON project_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_action_items_updated_at
  BEFORE UPDATE ON action_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create a view for easy budget tracking
CREATE OR REPLACE VIEW project_budget_summary AS
SELECT 
  p.id AS project_id,
  p.project_name,
  p.financial_parameters AS total_budget,
  COALESCE(SUM(CASE WHEN q.status = 'Accepted' THEN q.cost ELSE 0 END), 0) AS total_spent,
  p.financial_parameters - COALESCE(SUM(CASE WHEN q.status = 'Accepted' THEN q.cost ELSE 0 END), 0) AS budget_remaining,
  CASE 
    WHEN p.financial_parameters > 0 THEN 
      ROUND((COALESCE(SUM(CASE WHEN q.status = 'Accepted' THEN q.cost ELSE 0 END), 0) / p.financial_parameters * 100)::numeric, 2)
    ELSE 0
  END AS budget_used_percentage
FROM projects p
LEFT JOIN assets a ON a.project_id = p.id
LEFT JOIN quotes q ON q.asset_id = a.id
GROUP BY p.id, p.project_name, p.financial_parameters;

COMMENT ON VIEW project_budget_summary IS 'Aggregated budget tracking data for all projects';


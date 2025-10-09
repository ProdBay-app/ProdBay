-- ============================================
-- ProdBay Database Setup Script
-- ============================================
-- Complete schema setup including all migrations
-- Run this after reset.sql to rebuild the database

-- ============================================
-- 1. BASE SCHEMA (Migration: 20250820125716_crimson_disk.sql)
-- ============================================

-- Create enum types
CREATE TYPE project_status_enum AS ENUM ('New', 'In Progress', 'Quoting', 'Completed', 'Cancelled');
CREATE TYPE asset_status_enum AS ENUM ('Pending', 'Quoting', 'Approved', 'In Production', 'Delivered');
CREATE TYPE quote_status_enum AS ENUM ('Submitted', 'Accepted', 'Rejected');

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name text NOT NULL,
  client_name text NOT NULL,
  brief_description text NOT NULL,
  physical_parameters text DEFAULT '',
  financial_parameters numeric DEFAULT 0,
  timeline_deadline date,
  project_status project_status_enum DEFAULT 'New',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Suppliers table  
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_name text NOT NULL,
  contact_email text UNIQUE NOT NULL,
  service_categories text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  asset_name text NOT NULL,
  specifications text DEFAULT '',
  timeline date,
  status asset_status_enum DEFAULT 'Pending',
  assigned_supplier_id uuid REFERENCES suppliers(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  cost numeric DEFAULT 0,
  notes_capacity text DEFAULT '',
  status quote_status_enum DEFAULT 'Submitted',
  quote_token text UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;  
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public access (MVP - simplified security)
CREATE POLICY "Allow all operations on projects"
  ON projects FOR ALL TO public
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on assets"
  ON assets FOR ALL TO public
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on suppliers"
  ON suppliers FOR ALL TO public
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on quotes"
  ON quotes FOR ALL TO public
  USING (true) WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_projects_updated_at 
  BEFORE UPDATE ON projects 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_assets_updated_at 
  BEFORE UPDATE ON assets 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at 
  BEFORE UPDATE ON quotes 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================
-- 2. AI ALLOCATION TABLES (Migration: 20250121000000_ai_allocation_tables.sql)
-- ============================================

-- Create ai_allocations table
CREATE TABLE IF NOT EXISTS ai_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE CASCADE,
  ai_confidence_score numeric CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),
  ai_reasoning text,
  allocation_method text CHECK (allocation_method IN ('ai', 'manual', 'hybrid')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ai_processing_logs table
CREATE TABLE IF NOT EXISTS ai_processing_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  processing_type text NOT NULL CHECK (processing_type IN ('asset_creation', 'supplier_matching', 'allocation')),
  input_data jsonb,
  output_data jsonb,
  processing_time_ms integer CHECK (processing_time_ms >= 0),
  success boolean NOT NULL DEFAULT false,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Add AI allocation columns to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS use_ai_allocation boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_allocation_enabled_at timestamptz;

-- ============================================
-- 3. AI ALLOCATION COMPLETION TRACKING (Migration: 20250124000000_add_ai_allocation_completion_tracking.sql)
-- ============================================

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS ai_allocation_completed_at timestamptz;

COMMENT ON COLUMN projects.ai_allocation_completed_at IS 'Timestamp when AI allocation was completed for this project';

-- ============================================
-- 4. CONTACT PERSONS (Migration: 20250125000000_add_contact_persons_to_suppliers.sql)
-- ============================================

ALTER TABLE suppliers 
ADD COLUMN IF NOT EXISTS contact_persons JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN suppliers.contact_persons IS 'Array of contact person objects with name, email, role, phone, and is_primary fields';

-- ============================================
-- 5. QUOTE COMPARISON FIELDS (Migration: 20250126000000_add_quote_comparison_fields.sql)
-- ============================================

ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS cost_breakdown JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS valid_until DATE,
ADD COLUMN IF NOT EXISTS response_time_hours INTEGER;

COMMENT ON COLUMN quotes.cost_breakdown IS 'Structured breakdown of quote costs (labor, materials, equipment, other)';
COMMENT ON COLUMN quotes.valid_until IS 'Date when the quote expires';
COMMENT ON COLUMN quotes.response_time_hours IS 'Hours taken by supplier to respond to quote request';

-- ============================================
-- 6. PENDING QUOTE STATUS (Migration: 20250127000000_add_pending_quote_status.sql)
-- ============================================

-- Add 'Pending' to quote_status_enum
ALTER TYPE quote_status_enum ADD VALUE IF NOT EXISTS 'Pending';

-- ============================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- AI Allocations indexes
CREATE INDEX IF NOT EXISTS idx_ai_allocations_project_id ON ai_allocations(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_allocations_asset_id ON ai_allocations(asset_id);
CREATE INDEX IF NOT EXISTS idx_ai_allocations_supplier_id ON ai_allocations(supplier_id);
CREATE INDEX IF NOT EXISTS idx_ai_allocations_method ON ai_allocations(allocation_method);

-- AI Processing Logs indexes
CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_project_id ON ai_processing_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_type ON ai_processing_logs(processing_type);
CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_success ON ai_processing_logs(success);
CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_created_at ON ai_processing_logs(created_at);

-- Quote comparison indexes
CREATE INDEX IF NOT EXISTS idx_quotes_asset_status ON quotes(asset_id, status);
CREATE INDEX IF NOT EXISTS idx_quotes_valid_until ON quotes(valid_until);
CREATE INDEX IF NOT EXISTS idx_quotes_response_time ON quotes(response_time_hours);

-- Contact persons index
CREATE INDEX IF NOT EXISTS idx_suppliers_contact_persons ON suppliers USING GIN (contact_persons);

-- ============================================
-- 8. ENABLE RLS ON NEW TABLES
-- ============================================

ALTER TABLE ai_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_processing_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_allocations (public access for MVP)
CREATE POLICY "Allow all operations on ai_allocations"
  ON ai_allocations FOR ALL
  USING (true) WITH CHECK (true);

-- RLS Policies for ai_processing_logs (public access for MVP)
CREATE POLICY "Allow all operations on ai_processing_logs"
  ON ai_processing_logs FOR ALL
  USING (true) WITH CHECK (true);

-- ============================================
-- 9. TABLE COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE projects IS 'Client projects and event briefs';
COMMENT ON TABLE assets IS 'Individual deliverables within projects';
COMMENT ON TABLE suppliers IS 'Service providers and vendors';
COMMENT ON TABLE quotes IS 'Supplier proposals for assets';
COMMENT ON TABLE ai_allocations IS 'Tracks AI-powered allocation decisions for assets and suppliers';
COMMENT ON TABLE ai_processing_logs IS 'Logs AI processing activities for monitoring and debugging';

COMMENT ON COLUMN ai_allocations.ai_confidence_score IS 'AI confidence score (0-1) for the allocation decision';
COMMENT ON COLUMN ai_allocations.allocation_method IS 'Method used for allocation: ai, manual, or hybrid';
COMMENT ON COLUMN projects.use_ai_allocation IS 'Whether this project uses AI-powered allocation';
COMMENT ON COLUMN projects.ai_allocation_enabled_at IS 'Timestamp when AI allocation was enabled for this project';

-- Setup complete
SELECT 
  'Database setup complete!' as status,
  COUNT(*) FILTER (WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as tables_created,
  COUNT(*) FILTER (WHERE table_schema = 'public' AND table_type = 'VIEW') as views_created
FROM information_schema.tables 
WHERE table_schema = 'public';


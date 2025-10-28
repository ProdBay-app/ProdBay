
/*
  # AI Allocation Tables Migration
  
  This migration adds tables to support AI-powered asset allocation:
  
  1. `ai_allocations` - Track AI allocation decisions
  2. `ai_processing_logs` - Store AI processing logs for monitoring
  3. Enhanced `projects` table with AI allocation preference
*/

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_allocations_project_id ON ai_allocations(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_allocations_asset_id ON ai_allocations(asset_id);
CREATE INDEX IF NOT EXISTS idx_ai_allocations_supplier_id ON ai_allocations(supplier_id);
CREATE INDEX IF NOT EXISTS idx_ai_allocations_method ON ai_allocations(allocation_method);

CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_project_id ON ai_processing_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_type ON ai_processing_logs(processing_type);
CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_success ON ai_processing_logs(success);
CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_created_at ON ai_processing_logs(created_at);

-- Enable Row Level Security
ALTER TABLE ai_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_processing_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_allocations (public access for MVP)
CREATE POLICY "Allow all operations on ai_allocations"
  ON ai_allocations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for ai_processing_logs (public access for MVP)
CREATE POLICY "Allow all operations on ai_processing_logs"
  ON ai_processing_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE ai_allocations IS 'Tracks AI-powered allocation decisions for assets and suppliers';
COMMENT ON TABLE ai_processing_logs IS 'Logs AI processing activities for monitoring and debugging';
COMMENT ON COLUMN ai_allocations.ai_confidence_score IS 'AI confidence score (0-1) for the allocation decision';
COMMENT ON COLUMN ai_allocations.allocation_method IS 'Method used for allocation: ai, manual, or hybrid';
COMMENT ON COLUMN projects.use_ai_allocation IS 'Whether this project uses AI-powered allocation';
COMMENT ON COLUMN projects.ai_allocation_enabled_at IS 'Timestamp when AI allocation was enabled for this project';

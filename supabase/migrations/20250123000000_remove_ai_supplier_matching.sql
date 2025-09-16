/*
  # Remove AI Supplier Matching Migration
  
  This migration removes AI supplier matching functionality while preserving AI Asset Analysis:
  
  1. Drop `ai_allocations` table (used only for supplier matching)
  2. Remove `allocation_method` column from `projects` table (used for supplier matching selection)
  3. Keep `ai_processing_logs` table (used by both AI Asset Analysis and supplier matching)
  4. Keep `use_ai_allocation` column (used for AI Asset Analysis)
*/

-- Drop ai_allocations table (used exclusively for AI supplier matching)
DROP TABLE IF EXISTS ai_allocations;

-- Remove allocation_method column from projects table (used for supplier matching selection)
ALTER TABLE projects DROP COLUMN IF EXISTS allocation_method;

-- Drop the index for allocation_method since the column is being removed
DROP INDEX IF EXISTS idx_projects_allocation_method;

-- Add comment to clarify remaining AI functionality
COMMENT ON COLUMN projects.use_ai_allocation IS 'Whether this project uses AI-powered asset analysis';
COMMENT ON COLUMN projects.ai_allocation_enabled_at IS 'Timestamp when AI asset analysis was enabled for this project';

-- Update ai_processing_logs table comment to reflect remaining functionality
COMMENT ON TABLE ai_processing_logs IS 'Logs AI processing activities for asset analysis and monitoring';

/*
  # Add AI Allocation Completion Tracking
  
  This migration adds completion tracking for AI allocation to prevent duplicate executions:
  
  1. Add `ai_allocation_completed_at` column to projects table
  2. Add index for performance
  3. Add documentation comments
*/

-- Add AI allocation completion tracking column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS ai_allocation_completed_at timestamptz;

-- Create index for better performance on completion status queries
CREATE INDEX IF NOT EXISTS idx_projects_ai_allocation_completed_at ON projects(ai_allocation_completed_at);

-- Add comment for documentation
COMMENT ON COLUMN projects.ai_allocation_completed_at IS 'Timestamp when AI allocation was successfully completed for this project. NULL means never completed.';

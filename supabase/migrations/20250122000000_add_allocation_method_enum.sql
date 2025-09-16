/*
  # Add Allocation Method Enum to Projects Table
  
  This migration adds an allocation_method enum column to the projects table
  to provide explicit "Static" vs "AI" allocation method selection.
  
  Changes:
  1. Add allocation_method enum column with values: 'static', 'ai'
  2. Set default value to 'static' for backward compatibility
  3. Update existing records to use the new enum based on use_ai_allocation
  4. Add index for performance
*/

-- Add allocation_method enum column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS allocation_method text CHECK (allocation_method IN ('static', 'ai')) DEFAULT 'static';

-- Update existing records to use enum based on current use_ai_allocation value
UPDATE projects 
SET allocation_method = CASE 
  WHEN use_ai_allocation = true THEN 'ai' 
  ELSE 'static' 
END
WHERE allocation_method IS NULL;

-- Create index for better performance on allocation_method queries
CREATE INDEX IF NOT EXISTS idx_projects_allocation_method ON projects(allocation_method);

-- Add comment for documentation
COMMENT ON COLUMN projects.allocation_method IS 'Asset allocation method: static (rule-based) or ai (AI-powered)';

-- Update the existing use_ai_allocation column comment to reference the new enum
COMMENT ON COLUMN projects.use_ai_allocation IS 'Legacy boolean field - use allocation_method enum instead';

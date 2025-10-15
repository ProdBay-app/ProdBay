-- Add quantity and tags fields to assets table
-- This migration adds support for asset quantity tracking and tagging system

-- Add quantity field to assets table
ALTER TABLE assets ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

-- Add tags field to assets table (array of text)
ALTER TABLE assets ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create index on tags for better query performance
CREATE INDEX IF NOT EXISTS idx_assets_tags ON assets USING GIN (tags);

-- Create index on quantity for sorting/filtering
CREATE INDEX IF NOT EXISTS idx_assets_quantity ON assets (quantity);

-- Add comment to document the new fields
COMMENT ON COLUMN assets.quantity IS 'Optional quantity/amount field for the asset';
COMMENT ON COLUMN assets.tags IS 'Array of tags for categorizing and filtering assets';
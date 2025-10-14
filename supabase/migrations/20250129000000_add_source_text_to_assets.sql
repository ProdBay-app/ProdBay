-- =====================================================
-- Migration: Add source_text to assets table
-- =====================================================
-- 
-- Purpose: Enable bi-directional linking between project briefs and assets
-- 
-- This migration adds a new column to store the original text snippet
-- from the project brief that was used to identify or generate an asset.
-- This is essential for the interactive brief highlighting feature where:
-- - Hovering over an asset highlights its source text in the brief
-- - Clicking highlighted text in the brief opens the asset details
-- 
-- The column is nullable to support:
-- - Existing assets (no source text available)
-- - Manually created assets (not derived from brief)
-- - Only AI-generated assets will have this field populated
-- =====================================================

-- Add source_text column to assets table
ALTER TABLE assets 
ADD COLUMN IF NOT EXISTS source_text text DEFAULT NULL;

-- Add descriptive comment for database documentation
COMMENT ON COLUMN assets.source_text IS 
'Original text snippet from the project brief that was used to identify or generate this asset. Used for interactive brief-to-asset linking in the UI, enabling hover highlighting and click navigation. NULL for manually created assets or assets created before this feature was implemented.';

-- Note: No index is added initially as text searching is not required yet.
-- If we implement fuzzy matching or full-text search in the future, consider:
-- CREATE INDEX idx_assets_source_text_gin ON assets USING gin(to_tsvector('english', source_text));



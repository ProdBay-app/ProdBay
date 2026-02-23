-- =====================================================
-- Migration: Add supplier_context to assets table
-- =====================================================
--
-- Purpose: Store operational and vendor-relevant context for each asset
-- (indoor/outdoor use, installation requirements, delivery dates, etc.)
-- Used by the Senior Production Controller asset analysis engine.
--
-- =====================================================

ALTER TABLE assets ADD COLUMN IF NOT EXISTS supplier_context TEXT;

COMMENT ON COLUMN assets.supplier_context IS 'Operational and vendor-relevant context: indoor/outdoor use, installation requirements, delivery dates, operator needs, transport, etc. Populated by AI asset analysis.';

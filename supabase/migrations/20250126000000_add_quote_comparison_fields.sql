-- Migration: Add quote comparison fields
-- This migration adds fields to support the Advanced Quote Comparison Interface

-- Add new columns to quotes table for comparison features
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS cost_breakdown JSONB DEFAULT '{}';
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS valid_until DATE;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS response_time_hours INTEGER;

-- Add indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_quotes_asset_status ON quotes(asset_id, status);
CREATE INDEX IF NOT EXISTS idx_quotes_valid_until ON quotes(valid_until);
CREATE INDEX IF NOT EXISTS idx_quotes_response_time ON quotes(response_time_hours);

-- Add comments for documentation
COMMENT ON COLUMN quotes.cost_breakdown IS 'Structured breakdown of quote costs (labor, materials, equipment, other)';
COMMENT ON COLUMN quotes.valid_until IS 'Date when the quote expires';
COMMENT ON COLUMN quotes.response_time_hours IS 'Hours taken by supplier to respond to quote request';

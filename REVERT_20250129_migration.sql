/*
  # ROLLBACK SCRIPT for Migration 20250129000000_add_action_item_event_tracking
  
  This script reverts all changes made by the action item event tracking migration.
  
  Run this in Supabase SQL Editor to undo the migration.
*/

-- Drop helper functions
DROP FUNCTION IF EXISTS complete_action_items_by_event(VARCHAR, UUID, action_type_enum[]);
DROP FUNCTION IF EXISTS action_item_exists(VARCHAR, UUID, action_type_enum);

-- Drop indexes
DROP INDEX IF EXISTS idx_action_items_event_status;
DROP INDEX IF EXISTS idx_action_items_triggering_event;

-- Remove columns from action_items table
ALTER TABLE action_items 
DROP COLUMN IF EXISTS triggering_event_id,
DROP COLUMN IF EXISTS triggering_event_type;

-- Verification query (optional - run after rollback to confirm)
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'action_items' 
-- ORDER BY ordinal_position;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE 'Migration 20250129000000 has been successfully reverted.';
  RAISE NOTICE 'All event tracking columns, indexes, and functions have been removed.';
END $$;


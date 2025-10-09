-- ============================================
-- ProdBay Database Reset Script
-- ============================================
-- WARNING: This will delete ALL data and drop ALL tables
-- Use this to start completely fresh

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS ai_allocations CASCADE;
DROP TABLE IF EXISTS ai_processing_logs CASCADE;
DROP TABLE IF EXISTS quotes CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;

-- Drop all custom types
DROP TYPE IF EXISTS project_status_enum CASCADE;
DROP TYPE IF EXISTS asset_status_enum CASCADE;
DROP TYPE IF EXISTS quote_status_enum CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Reset complete
SELECT 'Database reset complete. All tables, types, and functions dropped.' as status;


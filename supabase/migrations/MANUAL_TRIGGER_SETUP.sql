/*
  # Manual Trigger Setup for Producer Role Schema
  
  This script must be run MANUALLY in Supabase Dashboard > SQL Editor
  if the automatic trigger creation in the migration fails due to permissions.
  
  The trigger automatically creates a user_profiles row when a new user is created
  in auth.users, ensuring data consistency without client-side intervention.
  
  Instructions:
  1. Open Supabase Dashboard
  2. Go to SQL Editor
  3. Paste and execute this script
  4. Verify the trigger was created: SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
*/

-- Create the trigger on auth.users
-- This requires ownership or superuser privileges
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Verify the trigger was created
SELECT 
  t.tgname as trigger_name,
  n.nspname as schema_name,
  c.relname as table_name,
  pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE t.tgname = 'on_auth_user_created';


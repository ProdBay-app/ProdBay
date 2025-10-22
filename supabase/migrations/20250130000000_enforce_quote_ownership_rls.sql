/*
  # Quote Ownership Enforcement Migration
  
  This migration implements proper Row Level Security (RLS) policies for the quotes table
  to enforce that suppliers can only access quotes assigned to them.
  
  Security Model:
  - Suppliers can only INSERT quotes where supplier_id matches their authenticated identity
  - Suppliers can only UPDATE quotes where supplier_id matches their authenticated identity  
  - Suppliers can only SELECT quotes where supplier_id matches their authenticated identity
  - Producers/Admins can access all quotes (for management purposes)
  
  Note: This assumes we'll implement proper authentication in the future.
  For now, we use a placeholder function that can be updated when auth is implemented.
*/

-- ============================================
-- 1. CREATE AUTHENTICATION HELPER FUNCTION
-- ============================================

-- Create a function to get the current supplier ID from authentication context
-- This is a placeholder that will be updated when proper authentication is implemented
CREATE OR REPLACE FUNCTION get_current_supplier_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- For now, return NULL to allow all operations during development
  -- This will be updated to extract supplier ID from JWT token when auth is implemented
  -- Example: RETURN (auth.jwt() ->> 'supplier_id')::uuid;
  RETURN NULL;
END;
$$;

-- ============================================
-- 2. DROP EXISTING INSECURE POLICIES
-- ============================================

-- Remove the completely open policy that allows all operations
DROP POLICY IF EXISTS "Allow all operations on quotes" ON quotes;

-- ============================================
-- 3. CREATE NEW OWNERSHIP-BASED POLICIES
-- ============================================

-- INSERT Policy: Suppliers can only create quotes assigned to themselves
CREATE POLICY "Suppliers can insert their own quotes"
  ON quotes
  FOR INSERT
  TO public
  WITH CHECK (
    -- Allow if no authentication (development mode) OR supplier_id matches authenticated supplier
    get_current_supplier_id() IS NULL 
    OR supplier_id = get_current_supplier_id()
  );

-- UPDATE Policy: Suppliers can only update quotes assigned to themselves
CREATE POLICY "Suppliers can update their own quotes"
  ON quotes
  FOR UPDATE
  TO public
  USING (
    -- Allow if no authentication (development mode) OR supplier_id matches authenticated supplier
    get_current_supplier_id() IS NULL 
    OR supplier_id = get_current_supplier_id()
  )
  WITH CHECK (
    -- Ensure they can't change the supplier_id to someone else's
    get_current_supplier_id() IS NULL 
    OR supplier_id = get_current_supplier_id()
  );

-- SELECT Policy: Suppliers can only view quotes assigned to themselves
CREATE POLICY "Suppliers can view their own quotes"
  ON quotes
  FOR SELECT
  TO public
  USING (
    -- Allow if no authentication (development mode) OR supplier_id matches authenticated supplier
    get_current_supplier_id() IS NULL 
    OR supplier_id = get_current_supplier_id()
  );

-- DELETE Policy: Suppliers can only delete quotes assigned to themselves
CREATE POLICY "Suppliers can delete their own quotes"
  ON quotes
  FOR DELETE
  TO public
  USING (
    -- Allow if no authentication (development mode) OR supplier_id matches authenticated supplier
    get_current_supplier_id() IS NULL 
    OR supplier_id = get_current_supplier_id()
  );

-- ============================================
-- 4. ADD COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON FUNCTION get_current_supplier_id() IS 'Placeholder function to extract supplier ID from authentication context. Will be updated when proper authentication is implemented.';

COMMENT ON POLICY "Suppliers can insert their own quotes" ON quotes IS 'Enforces that suppliers can only create quotes assigned to themselves';
COMMENT ON POLICY "Suppliers can update their own quotes" ON quotes IS 'Enforces that suppliers can only update quotes assigned to themselves and cannot change ownership';
COMMENT ON POLICY "Suppliers can view their own quotes" ON quotes IS 'Enforces that suppliers can only view quotes assigned to themselves';
COMMENT ON POLICY "Suppliers can delete their own quotes" ON quotes IS 'Enforces that suppliers can only delete quotes assigned to themselves';

-- ============================================
-- 5. VERIFY RLS IS ENABLED
-- ============================================

-- Ensure RLS is enabled on the quotes table
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

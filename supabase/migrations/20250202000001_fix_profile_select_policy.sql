/*
  # Fix Profile SELECT Policy - Ensure Users Can Read Their Own Profile
  
  This migration fixes the RLS SELECT policy on public.profiles to ensure
  authenticated users can read their own profile data.
  
  Issue: Login fails with "Failed to load profile" even though profile exists.
  Root Cause: SELECT policy may be missing or incorrectly configured.
  
  Changes:
  1. Drop existing SELECT policy (if exists) and recreate with explicit conditions
  2. Drop existing UPDATE policy (if exists) and recreate for consistency
*/

-- ============================================
-- 1. FIX SELECT POLICY
-- ============================================

-- Drop existing policy if it exists (handles variations in naming)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create explicit SELECT policy ensuring users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Add comment
COMMENT ON POLICY "Users can view own profile" ON public.profiles IS 
  'Allows authenticated users to view their own profile. Required for login and profile fetching.';

-- ============================================
-- 2. FIX UPDATE POLICY (for consistency)
-- ============================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create explicit UPDATE policy ensuring users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add comment
COMMENT ON POLICY "Users can update own profile" ON public.profiles IS 
  'Allows authenticated users to update their own profile (except role changes which require admin).';


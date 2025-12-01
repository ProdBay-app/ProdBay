/*
  # Self-Healing Profile Flow - Allow Users to Insert Their Own Profile
  
  This migration adds an RLS policy that allows authenticated users to insert
  their own profile if the database trigger fails to create it automatically.
  
  This enables the frontend to "self-heal" by creating missing profiles on-the-fly.
  
  Changes:
  1. Add INSERT policy on public.profiles table
  2. Policy allows users to insert their own profile (auth.uid() = id)
*/

-- ============================================
-- 1. ADD INSERT POLICY FOR PROFILES
-- ============================================

-- Policy: Users can insert their own profile
-- This allows the frontend to create a profile if the trigger fails
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Add comment explaining the policy
COMMENT ON POLICY "Users can insert their own profile" ON public.profiles IS 
  'Allows authenticated users to insert their own profile if the database trigger fails. Enables self-healing profile creation from the frontend.';


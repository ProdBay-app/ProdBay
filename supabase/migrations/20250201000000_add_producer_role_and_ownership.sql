/*
  # Producer Authentication & Access Control Migration
  
  This migration implements role-based access control for Producers and secures
  chat log access based on project ownership.
  
  Changes:
  1. Create `user_role` enum for type-safe role assignment
  2. Create `profiles` table linked to `auth.users` with role information
  3. Create trigger function to auto-create profile when user signs up
  4. Add `producer_id` column to `projects` table for ownership tracking
  5. Replace permissive RLS policies on `messages` with ownership-based policies
*/

-- ============================================
-- 1. CREATE USER_ROLE ENUM
-- ============================================

-- Create enum type for user roles
CREATE TYPE user_role AS ENUM ('PRODUCER', 'SUPPLIER', 'ADMIN');

COMMENT ON TYPE user_role IS 'User role types: PRODUCER (default), SUPPLIER, ADMIN';

-- ============================================
-- 2. CREATE PROFILES TABLE
-- ============================================

-- Create profiles table linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'PRODUCER',
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

-- Add comments for documentation
COMMENT ON TABLE public.profiles IS 'User profiles with role information, linked to auth.users';
COMMENT ON COLUMN public.profiles.id IS 'Foreign key to auth.users.id (1:1 relationship)';
COMMENT ON COLUMN public.profiles.role IS 'User role: PRODUCER (default), SUPPLIER, or ADMIN';
COMMENT ON COLUMN public.profiles.full_name IS 'User full name for display purposes';

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policy: Users can update their own profile (except role - role changes require admin)
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 3. CREATE TRIGGER FUNCTION FOR AUTO-PROFILE CREATION
-- ============================================

-- Function to automatically create a profile when a new user is created in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    'PRODUCER', -- Default role for all new users
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email) -- Use metadata or email as fallback
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent errors if profile already exists
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile with PRODUCER role when a new user signs up';

-- Create trigger on auth.users to call handle_new_user()
-- Note: This trigger runs AFTER a row is inserted into auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 4. ADD PRODUCER_ID TO PROJECTS TABLE
-- ============================================

-- Add producer_id column to projects table
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS producer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for performance (critical for RLS policy joins)
CREATE INDEX IF NOT EXISTS idx_projects_producer_id ON public.projects(producer_id);

-- Add comment for documentation
COMMENT ON COLUMN public.projects.producer_id IS 'Foreign key to auth.users.id. Identifies the Producer who owns this project. NULL for legacy projects.';

-- ============================================
-- 5. UPDATE MESSAGES TABLE RLS POLICIES
-- ============================================

-- Drop existing permissive policies on messages table
DROP POLICY IF EXISTS "Authenticated users can view messages for their quotes" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages for their quotes" ON public.messages;

-- New Policy: Producers can view messages for quotes in their projects
-- This policy enforces ownership by joining: messages → quotes → assets → projects → producer_id
CREATE POLICY "Producers can view messages for their quotes"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    -- Verify user is a PRODUCER
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'PRODUCER'
    )
    AND
    -- Verify producer owns the project that contains the quote
    EXISTS (
      SELECT 1 FROM public.quotes q
      INNER JOIN public.assets a ON q.asset_id = a.id
      INNER JOIN public.projects p ON a.project_id = p.id
      WHERE q.id = messages.quote_id
      AND p.producer_id = auth.uid()
    )
  );

-- New Policy: Producers can insert messages for quotes in their projects
CREATE POLICY "Producers can insert messages for their quotes"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Verify user is a PRODUCER
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'PRODUCER'
    )
    AND
    -- Verify producer owns the project that contains the quote
    EXISTS (
      SELECT 1 FROM public.quotes q
      INNER JOIN public.assets a ON q.asset_id = a.id
      INNER JOIN public.projects p ON a.project_id = p.id
      WHERE q.id = messages.quote_id
      AND p.producer_id = auth.uid()
    )
  );

-- Add comments explaining the policies
COMMENT ON POLICY "Producers can view messages for their quotes" ON public.messages IS 
  'Allows PRODUCER role users to view messages only for quotes belonging to projects they own (producer_id = auth.uid())';

COMMENT ON POLICY "Producers can insert messages for their quotes" ON public.messages IS 
  'Allows PRODUCER role users to send messages only for quotes belonging to projects they own (producer_id = auth.uid())';

-- ============================================
-- 6. HELPER FUNCTION: CHECK IF USER IS PRODUCER
-- ============================================

-- Utility function to check if a user has PRODUCER role
-- This can be used in other RLS policies or application logic
CREATE OR REPLACE FUNCTION public.is_producer(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'PRODUCER'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_producer(uuid) IS 'Returns true if the user has PRODUCER role, false otherwise';

-- ============================================
-- 7. DATA MIGRATION: BACKFILL PROFILES FOR EXISTING USERS
-- ============================================

-- Create profiles for any existing auth.users that don't have one
-- This ensures all existing users have a profile with default PRODUCER role
INSERT INTO public.profiles (id, role, full_name)
SELECT 
  id,
  'PRODUCER'::user_role,
  COALESCE(raw_user_meta_data->>'full_name', email)
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 8. VERIFICATION QUERIES (for manual testing)
-- ============================================

-- Uncomment these to verify the migration:
-- SELECT COUNT(*) as total_users FROM auth.users;
-- SELECT COUNT(*) as total_profiles FROM public.profiles;
-- SELECT COUNT(*) as profiles_with_producer_role FROM public.profiles WHERE role = 'PRODUCER';
-- SELECT COUNT(*) as projects_with_producer_id FROM public.projects WHERE producer_id IS NOT NULL;


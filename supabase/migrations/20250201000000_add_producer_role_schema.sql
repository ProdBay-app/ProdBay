/*
  # Producer Role Schema Migration
  
  This migration introduces the Producer role system to enable proper authentication
  and authorization for Producers in the ProdBay platform.
  
  Changes:
  1. Create `user_role_enum` type for role-based access control
  2. Create `public.user_profiles` table to store user roles and profile data
  3. Add trigger to auto-create user_profiles when auth.users are created
  4. Add `producer_id` to `projects` table for ownership tracking
  5. Create helper functions for RLS policies
  6. Update RLS policies to enforce Producer-only access
  
  Security Model:
  - Producers can only access projects they own (via producer_id)
  - All authenticated users get a default 'producer' role
  - Future roles (admin) can be added to the enum without breaking changes
  
  IMPORTANT - Trigger Setup:
  If the automatic trigger creation on auth.users fails due to permissions,
  you MUST manually create it using the script in MANUAL_TRIGGER_SETUP.sql
  via Supabase Dashboard > SQL Editor. Without this trigger, new users will
  not automatically get a user_profiles row, which will break authentication.
*/

-- ============================================
-- CHUNK A: ENUM & TABLES
-- ============================================

-- Step 1: Create user_role_enum type
-- This enum defines the available user roles in the system.
-- We start with 'producer' and 'admin' to future-proof the system.
-- The 'admin' role will be used in future PRs for administrative access.
CREATE TYPE user_role_enum AS ENUM ('producer', 'admin');

-- Add comment for documentation
COMMENT ON TYPE user_role_enum IS 'User roles in the ProdBay system. Default role is producer.';

-- Step 2: Create public.user_profiles table
-- This table extends Supabase's auth.users with role information and future profile data.
-- The id column references auth.users.id (UUID) to maintain referential integrity.
-- We use ON DELETE CASCADE to ensure profile cleanup if a user is deleted.
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role_enum NOT NULL DEFAULT 'producer',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add index on role for efficient role-based queries in RLS policies
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- Add comments for documentation
COMMENT ON TABLE public.user_profiles IS 'User profile table extending auth.users with role information. Auto-populated via trigger on auth.users insert.';
COMMENT ON COLUMN public.user_profiles.id IS 'References auth.users.id. One-to-one relationship with Supabase auth users.';
COMMENT ON COLUMN public.user_profiles.role IS 'User role determining access permissions. Default is producer.';
COMMENT ON COLUMN public.user_profiles.created_at IS 'Timestamp when the profile was created (matches user creation time).';
COMMENT ON COLUMN public.user_profiles.updated_at IS 'Timestamp when the profile was last updated.';

-- Step 3: Enable Row Level Security on user_profiles
-- RLS is essential to prevent users from accessing or modifying other users' profiles.
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CHUNK B: THE TRIGGER
-- ============================================

-- Step 1: Create function to handle new user creation
-- This function is called automatically when a new user is inserted into auth.users.
-- It ensures that every new user gets a corresponding profile with the default 'producer' role.
-- This maintains data consistency without requiring client-side intervention.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert a new profile for the newly created user
  -- The NEW record contains the newly inserted auth.users row
  INSERT INTO public.user_profiles (id, role)
  VALUES (NEW.id, 'producer');
  
  -- Return the NEW record to allow the trigger to complete
  RETURN NEW;
EXCEPTION
  -- If profile already exists (shouldn't happen, but handle gracefully)
  WHEN unique_violation THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'User profile already exists for user %', NEW.id;
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log any other errors but allow user creation to proceed
    -- This prevents auth failures if profile creation fails
    RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function that automatically creates a user_profiles row with default producer role when a new user is created in auth.users.';

-- Step 2: Create trigger on auth.users
-- This trigger fires AFTER INSERT to ensure the user record exists before creating the profile.
-- We use AFTER INSERT (not BEFORE) because we need the user ID to be committed first.
-- 
-- ⚠️  MANUAL STEP REQUIRED ⚠️
-- Due to Supabase permissions, the trigger on auth.users must be created MANUALLY.
-- The migration will complete successfully, but you MUST run the following script
-- in Supabase Dashboard > SQL Editor after this migration completes:
--
--   See: supabase/migrations/MANUAL_TRIGGER_SETUP.sql
--
-- Without this trigger, new users will NOT automatically get a user_profiles row,
-- which will cause authentication failures.
--
-- The trigger function (handle_new_user) is already created above and ready to use.
-- You just need to bind it to auth.users via the trigger.
--
-- Alternative: If you prefer, you can use Supabase Database Webhooks to call
-- handle_new_user() function on user creation events instead of a trigger.

-- ============================================
-- CHUNK C: PROJECT SCHEMA & MIGRATION
-- ============================================

-- Step 1: Add producer_id column to projects table
-- This column establishes ownership of projects by Producers.
-- It's nullable to allow existing projects (created before this migration) to remain accessible.
-- Future migrations can backfill this column or assign ownership as needed.
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS producer_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- Add index for efficient lookups by producer_id in RLS policies
CREATE INDEX IF NOT EXISTS idx_projects_producer_id ON public.projects(producer_id);

-- Add comment for documentation
COMMENT ON COLUMN public.projects.producer_id IS 'Foreign key to user_profiles.id. Identifies the Producer who owns this project. Nullable for backward compatibility with existing projects.';

-- Step 2: Create helper function to get current user's role
-- This function extracts the user's role from user_profiles using the authenticated user's ID.
-- It's used in RLS policies to check if a user has the 'producer' role.
-- Returns NULL if the user is not authenticated or has no profile.
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role_enum
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_role user_role_enum;
BEGIN
  -- Get the role from user_profiles for the currently authenticated user
  -- auth.uid() returns the UUID of the authenticated user, or NULL if not authenticated
  SELECT role INTO user_role
  FROM public.user_profiles
  WHERE id = auth.uid();
  
  -- Return the role, or NULL if user not found/not authenticated
  RETURN user_role;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_user_role() IS 'Returns the role of the currently authenticated user from user_profiles. Returns NULL if user is not authenticated or has no profile.';

-- Step 3: Create helper function to check if current user is a producer
-- This is a convenience function that wraps get_user_role() for cleaner RLS policies.
-- Returns true if the user is authenticated and has the 'producer' role, false otherwise.
CREATE OR REPLACE FUNCTION public.is_producer()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  -- Check if the current user has the 'producer' role
  RETURN public.get_user_role() = 'producer';
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.is_producer() IS 'Returns true if the currently authenticated user has the producer role, false otherwise.';

-- ============================================
-- CHUNK D: RLS POLICIES
-- ============================================

-- Step 1: RLS Policies for user_profiles table
-- Users can only view and update their own profile.
-- The USING clause checks if the profile id matches the authenticated user's id (auth.uid()).

-- Policy: Users can SELECT their own profile
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policy: Users can UPDATE their own profile (limited to role field for now)
-- In the future, this can be expanded to allow updates to other profile fields.
CREATE POLICY "Users can update their own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Step 2: Drop existing permissive policies on projects and assets
-- These policies allowed all operations and need to be replaced with producer-based policies.
DROP POLICY IF EXISTS "Allow all operations on projects" ON public.projects;
DROP POLICY IF EXISTS "Allow all operations on assets" ON public.assets;

-- Step 3: RLS Policies for projects table
-- Producers can only access projects where they are the owner (producer_id = auth.uid()).
-- The USING clause is for SELECT/DELETE operations (checking existing rows).
-- The WITH CHECK clause is for INSERT/UPDATE operations (validating new/modified rows).

-- Policy: Producers can SELECT projects they own
CREATE POLICY "Producers can view their own projects"
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    -- Check if user is a producer and owns the project
    public.is_producer() = true
    AND producer_id = auth.uid()
  );

-- Policy: Producers can INSERT projects (and must set producer_id to themselves)
CREATE POLICY "Producers can create projects"
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Check if user is a producer and is setting producer_id to themselves
    public.is_producer() = true
    AND producer_id = auth.uid()
  );

-- Policy: Producers can UPDATE projects they own
CREATE POLICY "Producers can update their own projects"
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (
    -- Check ownership for existing row
    public.is_producer() = true
    AND producer_id = auth.uid()
  )
  WITH CHECK (
    -- Ensure they can't change ownership to someone else
    public.is_producer() = true
    AND producer_id = auth.uid()
  );

-- Policy: Producers can DELETE projects they own
CREATE POLICY "Producers can delete their own projects"
  ON public.projects
  FOR DELETE
  TO authenticated
  USING (
    -- Check if user is a producer and owns the project
    public.is_producer() = true
    AND producer_id = auth.uid()
  );

-- Step 4: RLS Policies for assets table
-- Producers can access assets that belong to projects they own.
-- This requires a join through the projects table to check ownership.

-- Policy: Producers can SELECT assets for projects they own
CREATE POLICY "Producers can view assets for their projects"
  ON public.assets
  FOR SELECT
  TO authenticated
  USING (
    -- Check if user is a producer and owns the project containing this asset
    public.is_producer() = true
    AND EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = assets.project_id
      AND projects.producer_id = auth.uid()
    )
  );

-- Policy: Producers can INSERT assets into projects they own
CREATE POLICY "Producers can create assets in their projects"
  ON public.assets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Check if user is a producer and owns the project
    public.is_producer() = true
    AND EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = assets.project_id
      AND projects.producer_id = auth.uid()
    )
  );

-- Policy: Producers can UPDATE assets in projects they own
CREATE POLICY "Producers can update assets in their projects"
  ON public.assets
  FOR UPDATE
  TO authenticated
  USING (
    -- Check ownership for existing row
    public.is_producer() = true
    AND EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = assets.project_id
      AND projects.producer_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Ensure they can't move asset to a project they don't own
    public.is_producer() = true
    AND EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = assets.project_id
      AND projects.producer_id = auth.uid()
    )
  );

-- Policy: Producers can DELETE assets from projects they own
CREATE POLICY "Producers can delete assets from their projects"
  ON public.assets
  FOR DELETE
  TO authenticated
  USING (
    -- Check if user is a producer and owns the project
    public.is_producer() = true
    AND EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = assets.project_id
      AND projects.producer_id = auth.uid()
    )
  );

-- Step 5: RLS Policies for quotes table
-- Producers can access quotes for assets in projects they own.
-- Note: Existing supplier policies remain in place (from 20250130000000_enforce_quote_ownership_rls.sql).
-- These policies add producer access alongside supplier access.

-- Policy: Producers can SELECT quotes for their projects
CREATE POLICY "Producers can view quotes for their projects"
  ON public.quotes
  FOR SELECT
  TO authenticated
  USING (
    -- Check if user is a producer and owns the project containing the asset
    public.is_producer() = true
    AND EXISTS (
      SELECT 1 FROM public.assets
      INNER JOIN public.projects ON projects.id = assets.project_id
      WHERE assets.id = quotes.asset_id
      AND projects.producer_id = auth.uid()
    )
  );

-- Policy: Producers can UPDATE quotes for their projects
CREATE POLICY "Producers can update quotes for their projects"
  ON public.quotes
  FOR UPDATE
  TO authenticated
  USING (
    -- Check ownership for existing row
    public.is_producer() = true
    AND EXISTS (
      SELECT 1 FROM public.assets
      INNER JOIN public.projects ON projects.id = assets.project_id
      WHERE assets.id = quotes.asset_id
      AND projects.producer_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Ensure quote still belongs to their project after update
    public.is_producer() = true
    AND EXISTS (
      SELECT 1 FROM public.assets
      INNER JOIN public.projects ON projects.id = assets.project_id
      WHERE assets.id = quotes.asset_id
      AND projects.producer_id = auth.uid()
    )
  );

-- Step 6: RLS Policies for messages table
-- Producers can access messages for quotes in projects they own.
-- This refines the existing TODO comments in 20250131000000_add_supplier_portal_schema.sql.

-- Drop existing permissive policies (if they exist)
DROP POLICY IF EXISTS "Authenticated users can view messages for their quotes" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages for their quotes" ON public.messages;

-- Policy: Producers can SELECT messages for quotes in their projects
CREATE POLICY "Producers can view messages for their project quotes"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    -- Check if user is a producer and owns the project containing the quote
    public.is_producer() = true
    AND EXISTS (
      SELECT 1 FROM public.quotes
      INNER JOIN public.assets ON assets.id = quotes.asset_id
      INNER JOIN public.projects ON projects.id = assets.project_id
      WHERE quotes.id = messages.quote_id
      AND projects.producer_id = auth.uid()
    )
  );

-- Policy: Producers can INSERT messages for quotes in their projects
CREATE POLICY "Producers can insert messages for their project quotes"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Check if user is a producer and owns the project containing the quote
    public.is_producer() = true
    AND EXISTS (
      SELECT 1 FROM public.quotes
      INNER JOIN public.assets ON assets.id = quotes.asset_id
      INNER JOIN public.projects ON projects.id = assets.project_id
      WHERE quotes.id = messages.quote_id
      AND projects.producer_id = auth.uid()
    )
    -- Ensure sender_type is 'PRODUCER' when producer is sending
    AND sender_type = 'PRODUCER'
  );


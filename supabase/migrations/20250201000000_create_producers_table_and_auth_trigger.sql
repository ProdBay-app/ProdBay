-- ============================================
-- Create Producers Table and Auth Trigger
-- ============================================
-- This migration creates a public.producers table linked to auth.users
-- and automatically creates a producer profile when a new user signs up.
--
-- Migration: 20250201000000_create_producers_table_and_auth_trigger.sql
-- ============================================

-- ============================================
-- 1. CREATE PRODUCERS TABLE
-- ============================================
-- One-to-one relationship with auth.users
-- Primary key (id) references auth.users(id)

CREATE TABLE IF NOT EXISTS public.producers (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  company_name text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add comment to table
COMMENT ON TABLE public.producers IS 'Producer profiles linked to authenticated users. One-to-one relationship with auth.users.';

-- Add comments to columns
COMMENT ON COLUMN public.producers.id IS 'Primary key, references auth.users(id). One-to-one relationship.';
COMMENT ON COLUMN public.producers.email IS 'Email address (denormalized from auth.users for easier querying).';
COMMENT ON COLUMN public.producers.full_name IS 'Full name of the producer (optional).';
COMMENT ON COLUMN public.producers.company_name IS 'Company or organization name (optional).';

-- ============================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.producers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. CREATE RLS POLICIES
-- ============================================

-- Policy: Users can view their own producer profile
CREATE POLICY "Users can view their own producer profile"
  ON public.producers
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own producer profile
CREATE POLICY "Users can update their own producer profile"
  ON public.producers
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Users can insert their own producer profile (for manual creation edge cases)
CREATE POLICY "Users can insert their own producer profile"
  ON public.producers
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 4. CREATE TRIGGER FUNCTION
-- ============================================
-- Function that automatically creates a producer profile
-- when a new user is created in auth.users
--
-- Uses SECURITY DEFINER to bypass RLS when inserting

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.producers (id, email, full_name, company_name)
  VALUES (
    NEW.id,
    NEW.email,
    NULL, -- full_name can be set later
    NULL  -- company_name can be set later
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate inserts if function runs multiple times
  
  RETURN NEW;
END;
$$;

-- Add comment to function
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function that automatically creates a producer profile when a new user signs up via Supabase Auth.';

-- ============================================
-- 5. CREATE TRIGGER
-- ============================================
-- Triggers AFTER INSERT on auth.users to call handle_new_user()

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 6. BACKFILL EXISTING USERS
-- ============================================
-- If there are existing users in auth.users without producer profiles,
-- create producer profiles for them.
--
-- This ensures existing test/demo users don't break the system.

INSERT INTO public.producers (id, email, full_name, company_name)
SELECT 
  u.id,
  u.email,
  NULL AS full_name,
  NULL AS company_name
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 
  FROM public.producers p 
  WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- The producers table is now:
-- ✅ Created and linked to auth.users
-- ✅ Protected by RLS policies
-- ✅ Auto-populated via trigger on new user signup
-- ✅ Backfilled with existing users (if any)


-- ============================================
-- Add Producer ID to Projects and Enforce RLS
-- ============================================
-- This migration adds producer ownership to projects and enforces
-- Row Level Security so producers can only access their own projects.
--
-- Migration: 20250202000000_add_producer_id_to_projects.sql
-- ============================================

-- ============================================
-- 1. CLEAN EXISTING DATA (Demo -> Prod Transition)
-- ============================================
-- Since we're transitioning from demo mode to production,
-- we'll clear existing demo projects to ensure clean data ownership.

TRUNCATE TABLE public.projects CASCADE;

-- ============================================
-- 2. ADD PRODUCER_ID COLUMN
-- ============================================
-- Add foreign key column linking projects to producers
-- Since we truncated the table, we can make it NOT NULL immediately

ALTER TABLE public.projects
ADD COLUMN producer_id uuid NOT NULL REFERENCES public.producers(id) ON DELETE CASCADE;

-- Add comment to column
COMMENT ON COLUMN public.projects.producer_id IS 'Foreign key to public.producers(id). Links projects to their owner.';

-- ============================================
-- 3. CREATE INDEX FOR PERFORMANCE
-- ============================================
-- Index on producer_id for efficient filtering

CREATE INDEX IF NOT EXISTS idx_projects_producer_id ON public.projects(producer_id);

-- Add comment to index
COMMENT ON INDEX idx_projects_producer_id IS 'Index on producer_id for efficient filtering of projects by owner.';

-- ============================================
-- 4. ENSURE RLS IS ENABLED
-- ============================================
-- RLS should already be enabled, but ensure it's on

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. DROP OLD PERMISSIVE POLICY
-- ============================================
-- Remove the "Allow all operations" policy that was used in demo mode

DROP POLICY IF EXISTS "Allow all operations on projects" ON public.projects;

-- ============================================
-- 6. CREATE RLS POLICIES
-- ============================================

-- Policy: Producers can view their own projects
-- Since producer_id references public.producers(id) which equals auth.users(id),
-- we can directly compare producer_id to auth.uid()
CREATE POLICY "Producers can view their own projects"
  ON public.projects
  FOR SELECT
  USING (producer_id = auth.uid());

-- Policy: Producers can insert projects for themselves
CREATE POLICY "Producers can create projects for themselves"
  ON public.projects
  FOR INSERT
  WITH CHECK (producer_id = auth.uid());

-- Policy: Producers can update their own projects
CREATE POLICY "Producers can update their own projects"
  ON public.projects
  FOR UPDATE
  USING (producer_id = auth.uid())
  WITH CHECK (producer_id = auth.uid());

-- Policy: Producers can delete their own projects
CREATE POLICY "Producers can delete their own projects"
  ON public.projects
  FOR DELETE
  USING (producer_id = auth.uid());

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- The projects table is now:
-- ✅ Linked to producers via producer_id foreign key
-- ✅ Protected by RLS policies enforcing ownership
-- ✅ Indexed for efficient queries
-- ✅ Clean slate (demo data removed)


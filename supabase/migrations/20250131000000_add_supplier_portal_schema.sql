/*
  # Supplier Portal Schema Migration
  
  This migration adds support for the "Booking.com style" guest portal where Suppliers
  can chat with Producers and upload quotes via a secure, unique link.
  
  Changes:
  1. Add `access_token` column to `quotes` table for secure portal access
  2. Backfill `access_token` for existing quotes
  3. Create `messages` table for Producer-Supplier chat functionality
  4. Enable RLS on `messages` table with appropriate policies
*/

-- ============================================
-- 1. ADD ACCESS_TOKEN TO QUOTES TABLE
-- ============================================

-- Add access_token column to quotes table
-- This is a separate UUID token specifically for portal access
-- (quote_token remains for legacy upload forms if needed)
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS access_token uuid UNIQUE DEFAULT gen_random_uuid();

-- Add index for fast lookups by access_token
CREATE INDEX IF NOT EXISTS idx_quotes_access_token ON quotes(access_token);

-- Add comment for documentation
COMMENT ON COLUMN quotes.access_token IS 'Unique UUID token for secure supplier portal access. Used for Booking.com-style guest portal where suppliers can chat and upload quotes without logging in.';

-- ============================================
-- 2. BACKFILL ACCESS_TOKEN FOR EXISTING QUOTES
-- ============================================

-- Generate access_token for any existing quotes that don't have one
-- This ensures all quotes have a valid access_token
UPDATE quotes 
SET access_token = gen_random_uuid()
WHERE access_token IS NULL;

-- Make access_token NOT NULL after backfill
-- This ensures all future quotes will have an access_token
ALTER TABLE quotes 
ALTER COLUMN access_token SET NOT NULL;

-- ============================================
-- 3. CREATE MESSAGES TABLE
-- ============================================

-- Create messages table for Producer-Supplier chat
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('PRODUCER', 'SUPPLIER')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_read boolean DEFAULT false
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_quote_id ON messages(quote_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);

-- Add comments for documentation
COMMENT ON TABLE messages IS 'Chat messages between Producers and Suppliers for quote discussions';
COMMENT ON COLUMN messages.quote_id IS 'Foreign key to quotes table. Messages are scoped to a specific quote.';
COMMENT ON COLUMN messages.sender_type IS 'Type of sender: PRODUCER or SUPPLIER';
COMMENT ON COLUMN messages.content IS 'Message content/text';
COMMENT ON COLUMN messages.is_read IS 'Whether the message has been read by the recipient';

-- ============================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. CREATE RLS POLICIES
-- ============================================

-- Policy 1: Authenticated users (Producers) can SELECT and INSERT messages
-- for quotes they own (through quotes -> assets -> projects)
-- 
-- Note: Currently, this allows all authenticated users to access messages.
-- This should be refined when proper producer ownership is implemented
-- (e.g., when projects table has a producer_id or user_id field).
-- 
-- The policy structure is ready for refinement:
--   - Add join to verify project ownership
--   - Add check for producer role in auth context
CREATE POLICY "Authenticated users can view messages for their quotes"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    -- Allow access if user is authenticated
    -- TODO: Refine this to check quote ownership through projects table
    -- when producer_id/user_id is added to projects
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can insert messages for their quotes"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow insert if user is authenticated
    -- TODO: Refine this to check quote ownership through projects table
    -- when producer_id/user_id is added to projects
    auth.role() = 'authenticated'
  );

-- Policy 2: No policy for anon role
-- Suppliers will access messages exclusively through Railway Backend
-- which uses Service Role to bypass RLS after validating access_token
-- This ensures messages table is not exposed directly to public internet

-- ============================================
-- 6. VERIFICATION
-- ============================================

-- Verify that all quotes now have access_token
DO $$
DECLARE
  quotes_without_token integer;
BEGIN
  SELECT COUNT(*) INTO quotes_without_token
  FROM quotes
  WHERE access_token IS NULL;
  
  IF quotes_without_token > 0 THEN
    RAISE EXCEPTION 'Migration failed: % quotes still missing access_token', quotes_without_token;
  END IF;
END $$;


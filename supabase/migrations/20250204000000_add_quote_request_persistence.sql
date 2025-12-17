-- Migration: Add Quote Request Persistence
-- This migration adds support for persisting quote request email body and attachments
-- Enables historical viewing in Supplier/Producer portals

-- ============================================
-- 1. ADD REQUEST_EMAIL_BODY COLUMN TO QUOTES
-- ============================================

-- Add request_email_body column to quotes table
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS request_email_body text;

-- Add comment for documentation
COMMENT ON COLUMN quotes.request_email_body IS 'Exact email body text sent to supplier in the quote request. Stored for portal history and reference.';

-- ============================================
-- 2. CREATE QUOTE_REQUEST_ATTACHMENTS TABLE
-- ============================================

-- Create table to store quote request attachment metadata
CREATE TABLE IF NOT EXISTS quote_request_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  filename text NOT NULL,
  storage_path text NOT NULL,
  storage_url text NOT NULL,
  file_size_bytes integer NOT NULL,
  content_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add index for fast lookups by quote_id
CREATE INDEX IF NOT EXISTS idx_quote_request_attachments_quote_id 
ON quote_request_attachments(quote_id);

-- Add comments for documentation
COMMENT ON TABLE quote_request_attachments IS 'Metadata for attachments sent with quote requests. Files are stored in Supabase Storage bucket quote-attachments.';
COMMENT ON COLUMN quote_request_attachments.quote_id IS 'Foreign key to quotes table. Links attachment to the quote request.';
COMMENT ON COLUMN quote_request_attachments.storage_path IS 'Path in Supabase Storage bucket (e.g., quote-requests/{quoteId}/{filename})';
COMMENT ON COLUMN quote_request_attachments.storage_url IS 'Public URL for accessing the file from Storage';
COMMENT ON COLUMN quote_request_attachments.file_size_bytes IS 'File size in bytes';
COMMENT ON COLUMN quote_request_attachments.content_type IS 'MIME type of the file (e.g., application/pdf, image/jpeg)';

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on quote_request_attachments table
ALTER TABLE quote_request_attachments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE RLS POLICIES
-- ============================================

-- Policy: Authenticated users can view attachments for quotes they own
-- (Through quotes -> assets -> projects ownership chain)
CREATE POLICY "Authenticated users can view quote request attachments"
ON quote_request_attachments
FOR SELECT
TO authenticated
USING (
  -- Allow access if user is authenticated
  -- TODO: Refine this to check quote ownership through projects table
  -- when producer_id/user_id is added to projects
  auth.role() = 'authenticated'
);

-- Policy: Authenticated users can insert attachments (when creating quote requests)
CREATE POLICY "Authenticated users can insert quote request attachments"
ON quote_request_attachments
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow insert if user is authenticated
  -- TODO: Refine this to check quote ownership through projects table
  auth.role() = 'authenticated'
);

-- Policy: Public/anonymous users can view attachments (for supplier portal access)
-- Suppliers access via Railway Backend which validates access_token
-- This policy allows public reads for portal functionality
CREATE POLICY "Public can view quote request attachments"
ON quote_request_attachments
FOR SELECT
TO public
USING (true);

-- ============================================
-- 5. UPDATE STORAGE BUCKET CONFIGURATION
-- ============================================

-- Update quote-attachments bucket to support quote request attachments
-- Increase file size limit: 10MB -> 50MB (to support 10 files × 5MB each)
-- Expand allowed MIME types beyond PDF only
UPDATE storage.buckets
SET 
  file_size_limit = 52428800,  -- 50MB (5MB × 10 files)
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-zip-compressed'
  ]
WHERE id = 'quote-attachments';

-- ============================================
-- 6. CREATE STORAGE RLS POLICIES
-- ============================================

-- Drop existing policies for quote-requests folder if they exist (for idempotency)
DROP POLICY IF EXISTS "Allow authenticated uploads to quote-requests folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from quote-requests folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to quote-requests folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes to quote-requests folder" ON storage.objects;

-- Policy 1: Allow authenticated users to upload quote request attachments
-- Only allow uploads to the 'quote-requests' folder within the bucket
CREATE POLICY "Allow authenticated uploads to quote-requests folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'quote-attachments' AND
  (storage.foldername(name))[1] = 'quote-requests'
);

-- Policy 2: Allow public reads from quote-requests folder (for supplier portal access)
-- Suppliers can access attachments via portal token validation
CREATE POLICY "Allow public reads from quote-requests folder"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'quote-attachments' AND
  (storage.foldername(name))[1] = 'quote-requests'
);

-- Policy 3: Allow authenticated users to update quote request attachments
-- (For future: replacing files if needed)
CREATE POLICY "Allow authenticated updates to quote-requests folder"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'quote-attachments' AND
  (storage.foldername(name))[1] = 'quote-requests'
)
WITH CHECK (
  bucket_id = 'quote-attachments' AND
  (storage.foldername(name))[1] = 'quote-requests'
);

-- Policy 4: Allow authenticated users to delete quote request attachments
-- (For future: removing files if needed)
CREATE POLICY "Allow authenticated deletes to quote-requests folder"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'quote-attachments' AND
  (storage.foldername(name))[1] = 'quote-requests'
);

-- ============================================
-- 7. VERIFICATION
-- ============================================

-- Verify request_email_body column was added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quotes' AND column_name = 'request_email_body'
  ) THEN
    RAISE EXCEPTION 'Migration failed: request_email_body column not found';
  END IF;
END $$;

-- Verify quote_request_attachments table was created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'quote_request_attachments'
  ) THEN
    RAISE EXCEPTION 'Migration failed: quote_request_attachments table not found';
  END IF;
END $$;


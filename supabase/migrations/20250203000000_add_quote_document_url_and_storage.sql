-- Migration: Add quote document URL column and create storage bucket
-- This migration adds support for suppliers to upload quote documents (PDFs)

-- ============================================
-- 1. ADD QUOTE_DOCUMENT_URL COLUMN
-- ============================================

-- Add quote_document_url column to quotes table
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS quote_document_url text;

-- Add index for performance (if needed for queries)
CREATE INDEX IF NOT EXISTS idx_quotes_document_url ON quotes(quote_document_url) WHERE quote_document_url IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN quotes.quote_document_url IS 'URL to uploaded quote document (PDF) in Supabase Storage. Stored in quote-attachments bucket.';

-- ============================================
-- 2. CREATE STORAGE BUCKET
-- ============================================

-- Create public bucket for quote attachments
-- Note: This uses the storage.buckets table which is managed by Supabase Storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'quote-attachments',
  'quote-attachments',
  true,  -- Public bucket for anonymous uploads
  10485760,  -- 10MB limit (10 * 1024 * 1024)
  ARRAY['application/pdf']  -- Only PDF files
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf'];

-- ============================================
-- 3. CREATE RLS POLICIES FOR STORAGE
-- ============================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Allow public uploads to quote-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from quote-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates to quote-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes from quote-attachments" ON storage.objects;

-- Policy 1: Allow public uploads to quote-attachments bucket
-- Only allow uploads to the 'public' folder within the bucket
CREATE POLICY "Allow public uploads to quote-attachments"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'quote-attachments' AND
  (storage.foldername(name))[1] = 'public'
);

-- Policy 2: Allow public reads from quote-attachments bucket
-- Anyone can download files from this bucket
CREATE POLICY "Allow public reads from quote-attachments"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'quote-attachments');

-- Policy 3: Allow public updates (for replacing files if needed)
-- Suppliers can update their own uploaded files
CREATE POLICY "Allow public updates to quote-attachments"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'quote-attachments')
WITH CHECK (
  bucket_id = 'quote-attachments' AND
  (storage.foldername(name))[1] = 'public'
);

-- Policy 4: Allow public deletes (for removing files if needed)
CREATE POLICY "Allow public deletes from quote-attachments"
ON storage.objects
FOR DELETE
TO public
USING (
  bucket_id = 'quote-attachments' AND
  (storage.foldername(name))[1] = 'public'
);


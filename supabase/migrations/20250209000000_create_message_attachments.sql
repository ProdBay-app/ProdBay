-- Migration: Create message_attachments table and storage policies
-- Adds support for chat attachments linked to messages

-- ============================================
-- 1. CREATE MESSAGE_ATTACHMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('PRODUCER', 'SUPPLIER')),
  filename text NOT NULL,
  storage_path text NOT NULL,
  file_size_bytes bigint NOT NULL,
  content_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_message_attachments_quote_id_created_at
ON message_attachments(quote_id, created_at);

CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id
ON message_attachments(message_id);

-- Comments for documentation
COMMENT ON TABLE message_attachments IS 'Metadata for chat message attachments. Files stored in Supabase Storage bucket quote-attachments.';
COMMENT ON COLUMN message_attachments.message_id IS 'Foreign key to messages table. Links attachment to a specific chat message.';
COMMENT ON COLUMN message_attachments.quote_id IS 'Foreign key to quotes table. Used for side-panel attachment queries.';
COMMENT ON COLUMN message_attachments.storage_path IS 'Path in Supabase Storage bucket (e.g., message-attachments/{quoteId}/{messageId}/{filename})';

-- ============================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. CREATE RLS POLICIES
-- ============================================

-- Mirror messages table policies (authenticated access)
CREATE POLICY "Authenticated users can view message attachments"
  ON message_attachments
  FOR SELECT
  TO authenticated
  USING (
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can insert message attachments"
  ON message_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.role() = 'authenticated'
  );

-- ============================================
-- 4. STORAGE POLICIES FOR MESSAGE ATTACHMENTS
-- ============================================

-- Drop existing policies for message-attachments folder if they exist (idempotency)
DROP POLICY IF EXISTS "Allow authenticated uploads to message-attachments folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from message-attachments folder" ON storage.objects;

-- Allow authenticated users to upload message attachments
CREATE POLICY "Allow authenticated uploads to message-attachments folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'quote-attachments' AND
  (storage.foldername(name))[1] = 'message-attachments'
);

-- Allow public reads from message-attachments folder
CREATE POLICY "Allow public reads from message-attachments folder"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'quote-attachments' AND
  (storage.foldername(name))[1] = 'message-attachments'
);


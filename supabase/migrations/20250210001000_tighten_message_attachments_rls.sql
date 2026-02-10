-- Tighten RLS for message_attachments to enforce quote ownership.
-- Replaces broad authenticated-only access with producer/supplier stake checks.

-- Drop insecure policies from the original migration.
DROP POLICY IF EXISTS "Authenticated users can view message attachments" ON public.message_attachments;
DROP POLICY IF EXISTS "Authenticated users can insert message attachments" ON public.message_attachments;

-- SELECT: Only allow users tied to the quote:
-- - Producer who owns the quote's project
-- - Supplier assigned to the quote
CREATE POLICY "Users can view message attachments for owned quotes"
  ON public.message_attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.quotes q
      JOIN public.assets a ON a.id = q.asset_id
      JOIN public.projects p ON p.id = a.project_id
      WHERE q.id = message_attachments.quote_id
        AND (
          p.producer_id = auth.uid()
          OR q.supplier_id = auth.uid()
        )
    )
  );

-- INSERT: Only allow users tied to the quote:
-- - Producer who owns the quote's project
-- - Supplier assigned to the quote
CREATE POLICY "Users can insert message attachments for owned quotes"
  ON public.message_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.quotes q
      JOIN public.assets a ON a.id = q.asset_id
      JOIN public.projects p ON p.id = a.project_id
      WHERE q.id = message_attachments.quote_id
        AND (
          p.producer_id = auth.uid()
          OR q.supplier_id = auth.uid()
        )
    )
  );

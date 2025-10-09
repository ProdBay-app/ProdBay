/*
  # Add 'Pending' Status to Quote Status Enum

  1. Changes
    - Add 'Pending' value to the quote_status_enum type
    - This allows quotes to be created with 'Pending' status when first requested
    - Enables clearer semantic distinction between:
      - 'Pending': Quote requested, awaiting supplier response
      - 'Submitted': Supplier has submitted their quote
      - 'Accepted': Producer has accepted the quote
      - 'Rejected': Producer has rejected the quote

  2. Migration Strategy
    - Use ALTER TYPE ... ADD VALUE to add the new enum value
    - Add it as the first value (before 'Submitted') to represent the earliest state
    - No data migration needed as this is a new value

  3. Impact
    - Existing quotes remain unchanged
    - New quote request functionality will use 'Pending' status
    - Application code updated to handle 'Pending' status
*/

-- Add 'Pending' to the quote_status_enum type
-- Note: In PostgreSQL, ALTER TYPE ADD VALUE cannot be run in a transaction block
-- Supabase handles this automatically
ALTER TYPE quote_status_enum ADD VALUE 'Pending' BEFORE 'Submitted';

-- Optional: Add a comment to the quotes table status column for documentation
COMMENT ON COLUMN quotes.status IS 'Quote status: Pending (requested), Submitted (supplier responded), Accepted (approved by producer), Rejected (declined by producer)';


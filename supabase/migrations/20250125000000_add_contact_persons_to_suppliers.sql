-- Add contact_persons field to suppliers table
-- This migration adds support for multiple contact persons per supplier

-- Add contact_persons JSONB column to suppliers table
ALTER TABLE suppliers 
ADD COLUMN contact_persons JSONB DEFAULT '[]'::jsonb;

-- Add index for better query performance on contact_persons field
CREATE INDEX idx_suppliers_contact_persons ON suppliers USING GIN (contact_persons);

-- Add comment to document the structure
COMMENT ON COLUMN suppliers.contact_persons IS 'Array of contact person objects with name, email, role, phone, and is_primary fields';

-- Example structure for contact_persons:
-- [
--   {
--     "name": "John Smith",
--     "email": "john@supplier.com", 
--     "role": "Sales Manager",
--     "phone": "+1-555-0123",
--     "is_primary": true
--   },
--   {
--     "name": "Jane Doe",
--     "email": "jane@supplier.com",
--     "role": "Project Coordinator", 
--     "phone": "+1-555-0124",
--     "is_primary": false
--   }
-- ]

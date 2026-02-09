-- Migrate suppliers.contact_email into contact_persons when missing
-- Note: contact_persons uses is_primary (snake_case) in this codebase

UPDATE suppliers
SET contact_persons = COALESCE(contact_persons, '[]'::jsonb) || jsonb_build_array(
  jsonb_build_object(
    'name', 'General Contact',
    'email', contact_email,
    'role', 'Primary',
    'is_primary', true
  )
)
WHERE contact_email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM jsonb_array_elements(COALESCE(contact_persons, '[]'::jsonb)) AS person
    WHERE lower(person->>'email') = lower(contact_email)
  );

-- Relax constraints after data migration
ALTER TABLE suppliers
  DROP CONSTRAINT IF EXISTS suppliers_contact_email_key;

ALTER TABLE suppliers
  ALTER COLUMN contact_email DROP NOT NULL;

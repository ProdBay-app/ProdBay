ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS cities_served TEXT[] DEFAULT '{}'::text[];

CREATE INDEX IF NOT EXISTS idx_suppliers_cities_served ON suppliers USING GIN (cities_served);

/*
  # ProdBay Production Management Schema

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `project_name` (text)
      - `client_name` (text) 
      - `brief_description` (text)
      - `physical_parameters` (text)
      - `financial_parameters` (numeric)
      - `timeline_deadline` (date)
      - `project_status` (text, enum)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `assets`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `asset_name` (text)
      - `specifications` (text)
      - `timeline` (date)
      - `status` (text, enum)
      - `assigned_supplier_id` (uuid, references suppliers)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `suppliers`
      - `id` (uuid, primary key)
      - `supplier_name` (text)
      - `contact_email` (text)
      - `service_categories` (text[])
      - `created_at` (timestamptz)

    - `quotes`
      - `id` (uuid, primary key)
      - `supplier_id` (uuid, references suppliers)
      - `asset_id` (uuid, references assets)
      - `cost` (numeric)
      - `notes_capacity` (text)
      - `status` (text, enum)
      - `quote_token` (text, unique)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for different user roles
*/

-- Create enum types
CREATE TYPE project_status_enum AS ENUM ('New', 'In Progress', 'Quoting', 'Completed', 'Cancelled');
CREATE TYPE asset_status_enum AS ENUM ('Pending', 'Quoting', 'Approved', 'In Production', 'Delivered');
CREATE TYPE quote_status_enum AS ENUM ('Submitted', 'Accepted', 'Rejected');

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name text NOT NULL,
  client_name text NOT NULL,
  brief_description text NOT NULL,
  physical_parameters text DEFAULT '',
  financial_parameters numeric DEFAULT 0,
  timeline_deadline date,
  project_status project_status_enum DEFAULT 'New',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Suppliers table  
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_name text NOT NULL,
  contact_email text UNIQUE NOT NULL,
  service_categories text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  asset_name text NOT NULL,
  specifications text DEFAULT '',
  timeline date,
  status asset_status_enum DEFAULT 'Pending',
  assigned_supplier_id uuid REFERENCES suppliers(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  cost numeric DEFAULT 0,
  notes_capacity text DEFAULT '',
  status quote_status_enum DEFAULT 'Submitted',
  quote_token text UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;  
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public access (MVP - simplified security)
CREATE POLICY "Allow all operations on projects"
  ON projects
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on assets"
  ON assets
  FOR ALL 
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on suppliers"
  ON suppliers
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on quotes"
  ON quotes
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
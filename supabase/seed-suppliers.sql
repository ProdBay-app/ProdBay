-- ProdBay Suppliers Seed Data
-- This script populates the suppliers table with realistic test data
-- covering all service categories used in the application
-- Uses ON CONFLICT to handle existing suppliers gracefully

INSERT INTO suppliers (supplier_name, contact_email, service_categories, contact_persons) VALUES
-- Printing & Graphics Specialists
('Premier Print Solutions', 'contact@premierprint.example.com', ARRAY['Printing', 'Graphics', 'Banners'], 
 '[{"name": "Sarah Johnson", "email": "sarah@premierprint.example.com", "role": "Sales Manager", "phone": "+1-555-0101", "is_primary": true}, {"name": "Mike Chen", "email": "mike@premierprint.example.com", "role": "Project Coordinator", "phone": "+1-555-0102", "is_primary": false}]'::jsonb),
('Digital Graphics Co', 'info@digitalgraphics.example.com', ARRAY['Graphics', 'Design', 'Branding'], 
 '[{"name": "Emily Rodriguez", "email": "emily@digitalgraphics.example.com", "role": "Creative Director", "phone": "+1-555-0201", "is_primary": true}]'::jsonb),
('Banner Masters', 'sales@bannermasters.example.com', ARRAY['Banners', 'Printing', 'Graphics'], 
 '[{"name": "David Thompson", "email": "david@bannermasters.example.com", "role": "Sales Director", "phone": "+1-555-0301", "is_primary": true}, {"name": "Lisa Wang", "email": "lisa@bannermasters.example.com", "role": "Production Manager", "phone": "+1-555-0302", "is_primary": false}]'::jsonb),
('Creative Printworks', 'hello@creativeprintworks.example.com', ARRAY['Printing', 'Design', 'Branding'], 
 '[{"name": "James Wilson", "email": "james@creativeprintworks.example.com", "role": "Account Manager", "phone": "+1-555-0401", "is_primary": true}]'::jsonb),

-- Event Production & Staging
('Elite Event Productions', 'contact@eliteevents.example.com', ARRAY['Staging', 'Audio', 'Lighting'], 
 '[{"name": "Alex Martinez", "email": "alex@eliteevents.example.com", "role": "Event Director", "phone": "+1-555-0501", "is_primary": true}]'::jsonb),
('Grand Stage Solutions', 'info@grandstage.example.com', ARRAY['Staging', 'Lighting', 'Audio'], '[]'::jsonb),
('Professional Audio Systems', 'sales@proaudio.example.com', ARRAY['Audio', 'Lighting', 'Staging'], '[]'::jsonb),
('Dynamic Lighting Co', 'contact@dynamiclighting.example.com', ARRAY['Lighting', 'Audio', 'Staging'], '[]'::jsonb),

-- Catering & Food Services
('Gourmet Catering Plus', 'orders@gourmetcatering.example.com', ARRAY['Catering', 'Food', 'Beverages'], '[]'::jsonb),
('Fresh Bites Catering', 'info@freshbites.example.com', ARRAY['Food', 'Catering', 'Beverages'], '[]'::jsonb),
('Premium Beverage Co', 'sales@premiumbeverage.example.com', ARRAY['Beverages', 'Catering'], '[]'::jsonb),
('Artisan Food Services', 'contact@artisanfood.example.com', ARRAY['Food', 'Catering', 'Beverages'], '[]'::jsonb),

-- Design & Marketing
('Brand Design Studio', 'hello@branddesign.example.com', ARRAY['Design', 'Branding', 'Marketing'], '[]'::jsonb),
('Creative Marketing Solutions', 'info@creativemarketing.example.com', ARRAY['Marketing', 'Design', 'Branding'], '[]'::jsonb),
('Visual Identity Co', 'contact@visualidentity.example.com', ARRAY['Branding', 'Design', 'Graphics'], '[]'::jsonb),

-- Photography & Video
('Professional Photography Co', 'bookings@prophotography.example.com', ARRAY['Photography', 'Video'], '[]'::jsonb),
('Event Video Productions', 'info@eventvideo.example.com', ARRAY['Video', 'Photography'], '[]'::jsonb),
('Creative Media Studio', 'contact@creativemedia.example.com', ARRAY['Photography', 'Video', 'Design'], '[]'::jsonb),

-- Logistics & Transport
('Reliable Transport Services', 'dispatch@reliabletransport.example.com', ARRAY['Transport', 'Logistics', 'Delivery'], '[]'::jsonb),
('Express Delivery Co', 'contact@expressdelivery.example.com', ARRAY['Delivery', 'Transport', 'Logistics'], '[]'::jsonb),
('Logistics Solutions Inc', 'info@logisticssolutions.example.com', ARRAY['Logistics', 'Transport', 'Delivery'], '[]'::jsonb),

-- Security Services
('Premier Security Group', 'contact@premiersecurity.example.com', ARRAY['Security'], '[]'::jsonb),
('Event Security Solutions', 'info@eventsecurity.example.com', ARRAY['Security'], '[]'::jsonb),

-- Multi-Service Event Companies
('Complete Event Solutions', 'contact@completeevents.example.com', ARRAY['Staging', 'Audio', 'Lighting', 'Catering', 'Security'], '[]'::jsonb),
('Full Service Events Co', 'info@fullserviceevents.example.com', ARRAY['Staging', 'Catering', 'Transport', 'Security', 'Photography'], '[]'::jsonb),
('Mega Event Productions', 'sales@megaevents.example.com', ARRAY['Staging', 'Audio', 'Lighting', 'Catering', 'Transport', 'Security'], '[]'::jsonb)

ON CONFLICT (contact_email) 
DO UPDATE SET 
  supplier_name = EXCLUDED.supplier_name,
  service_categories = EXCLUDED.service_categories,
  contact_persons = EXCLUDED.contact_persons;

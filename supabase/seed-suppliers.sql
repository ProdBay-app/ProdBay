-- ProdBay Suppliers Seed Data
-- This script populates the suppliers table with realistic test data
-- covering all service categories used in the application

INSERT INTO suppliers (supplier_name, contact_email, service_categories) VALUES
-- Printing & Graphics Specialists
('Premier Print Solutions', 'contact@premierprint.example.com', ARRAY['Printing', 'Graphics', 'Banners']),
('Digital Graphics Co', 'info@digitalgraphics.example.com', ARRAY['Graphics', 'Design', 'Branding']),
('Banner Masters', 'sales@bannermasters.example.com', ARRAY['Banners', 'Printing', 'Graphics']),
('Creative Printworks', 'hello@creativeprintworks.example.com', ARRAY['Printing', 'Design', 'Branding']),

-- Event Production & Staging
('Elite Event Productions', 'contact@eliteevents.example.com', ARRAY['Staging', 'Audio', 'Lighting']),
('Grand Stage Solutions', 'info@grandstage.example.com', ARRAY['Staging', 'Lighting', 'Audio']),
('Professional Audio Systems', 'sales@proaudio.example.com', ARRAY['Audio', 'Lighting', 'Staging']),
('Dynamic Lighting Co', 'contact@dynamiclighting.example.com', ARRAY['Lighting', 'Audio', 'Staging']),

-- Catering & Food Services
('Gourmet Catering Plus', 'orders@gourmetcatering.example.com', ARRAY['Catering', 'Food', 'Beverages']),
('Fresh Bites Catering', 'info@freshbites.example.com', ARRAY['Food', 'Catering', 'Beverages']),
('Premium Beverage Co', 'sales@premiumbeverage.example.com', ARRAY['Beverages', 'Catering']),
('Artisan Food Services', 'contact@artisanfood.example.com', ARRAY['Food', 'Catering', 'Beverages']),

-- Design & Marketing
('Brand Design Studio', 'hello@branddesign.example.com', ARRAY['Design', 'Branding', 'Marketing']),
('Creative Marketing Solutions', 'info@creativemarketing.example.com', ARRAY['Marketing', 'Design', 'Branding']),
('Visual Identity Co', 'contact@visualidentity.example.com', ARRAY['Branding', 'Design', 'Graphics']),

-- Photography & Video
('Professional Photography Co', 'bookings@prophotography.example.com', ARRAY['Photography', 'Video']),
('Event Video Productions', 'info@eventvideo.example.com', ARRAY['Video', 'Photography']),
('Creative Media Studio', 'contact@creativemedia.example.com', ARRAY['Photography', 'Video', 'Design']),

-- Logistics & Transport
('Reliable Transport Services', 'dispatch@reliabletransport.example.com', ARRAY['Transport', 'Logistics', 'Delivery']),
('Express Delivery Co', 'contact@expressdelivery.example.com', ARRAY['Delivery', 'Transport', 'Logistics']),
('Logistics Solutions Inc', 'info@logisticssolutions.example.com', ARRAY['Logistics', 'Transport', 'Delivery']),

-- Security Services
('Premier Security Group', 'contact@premiersecurity.example.com', ARRAY['Security']),
('Event Security Solutions', 'info@eventsecurity.example.com', ARRAY['Security']),

-- Multi-Service Event Companies
('Complete Event Solutions', 'contact@completeevents.example.com', ARRAY['Staging', 'Audio', 'Lighting', 'Catering', 'Security']),
('Full Service Events Co', 'info@fullserviceevents.example.com', ARRAY['Staging', 'Catering', 'Transport', 'Security', 'Photography']),
('Mega Event Productions', 'sales@megaevents.example.com', ARRAY['Staging', 'Audio', 'Lighting', 'Catering', 'Transport', 'Security']);

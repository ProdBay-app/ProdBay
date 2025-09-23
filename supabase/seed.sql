--  rodBay Complete Database Seed Data
-- This script populates all tables with realistic test data for development and testing

-- First, ensure we have suppliers (this should be run after seed-suppliers.sql)
-- The suppliers table should already be populated from seed-suppliers.sql

-- Projects seed data
INSERT INTO projects (
  project_name, 
  client_name, 
  brief_description, 
  physical_parameters, 
  financial_parameters, 
  timeline_deadline, 
  project_status,
  use_ai_allocation,
  ai_allocation_enabled_at,
  ai_allocation_completed_at
) VALUES
-- Corporate Events
(
  'TechCorp Annual Conference 2024',
  'TechCorp Industries',
  'Annual technology conference for 500 attendees featuring keynote speakers, breakout sessions, and networking events',
  'Convention center, 500 capacity, 3-day event, multiple breakout rooms, main auditorium',
  150000.00,
  '2024-03-15',
  'In Progress',
  true,
  '2024-01-15 10:00:00+00',
  '2024-01-20 14:30:00+00'
),
(
  'Global Marketing Summit',
  'Marketing Masters Inc',
  'International marketing conference with 300 delegates, product launches, and award ceremony',
  'Hotel ballroom, 300 capacity, 2-day event, exhibition space, gala dinner venue',
  95000.00,
  '2024-04-22',
  'Quoting',
  false,
  null,
  null
),
(
  'Startup Pitch Competition',
  'Innovation Hub',
  'Startup pitch competition with 50 companies, investor panels, and networking sessions',
  'Co-working space, 200 capacity, 1-day event, presentation stage, networking area',
  25000.00,
  '2024-02-28',
  'Completed',
  true,
  '2024-01-10 09:00:00+00',
  '2024-01-12 16:45:00+00'
),

-- Product Launches
(
  'Luxury Watch Collection Launch',
  'Prestige Timepieces',
  'Exclusive product launch event for new luxury watch collection with VIP guests and media',
  'Museum gallery, 150 capacity, evening event, display cases, presentation area',
  75000.00,
  '2024-05-10',
  'New',
  false,
  null,
  null
),
(
  'Eco-Friendly Apparel Launch',
  'Green Fashion Co',
  'Sustainable fashion brand launch with runway show and sustainability panel discussion',
  'Warehouse venue, 400 capacity, evening event, runway, panel discussion area',
  120000.00,
  '2024-06-05',
  'In Progress',
  true,
  '2024-01-25 11:00:00+00',
  null
),

-- Weddings & Private Events
(
  'Johnson-Williams Wedding',
  'Sarah Johnson & Michael Williams',
  'Elegant wedding celebration for 200 guests with ceremony, cocktail hour, and reception',
  'Historic mansion, 200 capacity, full day event, ceremony garden, reception hall',
  85000.00,
  '2024-07-20',
  'Quoting',
  false,
  null,
  null
),
(
  'Corporate Gala Dinner',
  'Fortune 500 Corp',
  'Annual corporate gala dinner celebrating company achievements with awards ceremony',
  'Grand hotel ballroom, 300 capacity, evening event, awards stage, dining area',
  110000.00,
  '2024-08-15',
  'New',
  true,
  '2024-01-30 14:00:00+00',
  null
),

-- Trade Shows & Exhibitions
(
  'HealthTech Innovation Expo',
  'Medical Innovation Society',
  'Healthcare technology exhibition with 100 exhibitors and 2000 attendees',
  'Convention center, 2000 capacity, 3-day event, exhibition hall, conference rooms',
  200000.00,
  '2024-09-12',
  'In Progress',
  true,
  '2024-02-01 10:30:00+00',
  '2024-02-05 12:15:00+00'
),
(
  'Art & Design Fair',
  'Creative Arts Foundation',
  'Contemporary art and design fair featuring local and international artists',
  'Art gallery complex, 500 capacity, 2-day event, exhibition spaces, workshop areas',
  45000.00,
  '2024-10-08',
  'New',
  false,
  null,
  null
),

-- Cancelled Project
(
  'Music Festival 2024',
  'SoundWave Productions',
  'Outdoor music festival with multiple stages, food vendors, and camping facilities',
  'Outdoor venue, 5000 capacity, 3-day event, multiple stages, camping area',
  500000.00,
  '2024-11-15',
  'Cancelled',
  false,
  null,
  null
);

-- Assets seed data (linked to projects)
-- Note: We'll use subqueries to get project IDs since UUIDs are generated
INSERT INTO assets (
  project_id,
  asset_name,
  specifications,
  timeline,
  status,
  assigned_supplier_id
) VALUES
-- TechCorp Annual Conference 2024 assets
(
  (SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024'),
  'Main Stage Setup',
  'Professional stage with backdrop, podium, and AV equipment for keynote presentations',
  '2024-03-14',
  'Approved',
  (SELECT id FROM suppliers WHERE supplier_name = 'Elite Event Productions')
),
(
  (SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024'),
  'Breakout Room AV',
  'Audio-visual equipment for 5 breakout rooms including projectors, screens, and microphones',
  '2024-03-14',
  'In Production',
  (SELECT id FROM suppliers WHERE supplier_name = 'Professional Audio Systems')
),
(
  (SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024'),
  'Registration Materials',
  'Welcome packets, name badges, lanyards, and conference programs for 500 attendees',
  '2024-03-10',
  'Delivered',
  (SELECT id FROM suppliers WHERE supplier_name = 'Premier Print Solutions')
),
(
  (SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024'),
  'Networking Reception',
  'Cocktail reception setup with catering, bar service, and networking area',
  '2024-03-15',
  'Quoting',
  (SELECT id FROM suppliers WHERE supplier_name = 'Gourmet Catering Plus')
),

-- Global Marketing Summit assets
(
  (SELECT id FROM projects WHERE project_name = 'Global Marketing Summit'),
  'Main Presentation Stage',
  'Large stage with LED backdrop, professional lighting, and sound system',
  '2024-04-21',
  'Pending',
  null
),
(
  (SELECT id FROM projects WHERE project_name = 'Global Marketing Summit'),
  'Exhibition Booths',
  '20 custom exhibition booths with power, lighting, and display fixtures',
  '2024-04-21',
  'Pending',
  null
),
(
  (SELECT id FROM projects WHERE project_name = 'Global Marketing Summit'),
  'Gala Dinner Setup',
  'Elegant dinner setup for 300 guests with centerpieces, linens, and tableware',
  '2024-04-22',
  'Quoting',
  (SELECT id FROM suppliers WHERE supplier_name = 'Artisan Food Services')
),

-- Startup Pitch Competition assets
(
  (SELECT id FROM projects WHERE project_name = 'Startup Pitch Competition'),
  'Presentation Stage',
  'Compact stage with projection screen and sound system for pitch presentations',
  '2024-02-27',
  'Delivered',
  (SELECT id FROM suppliers WHERE supplier_name = 'Grand Stage Solutions')
),
(
  (SELECT id FROM projects WHERE project_name = 'Startup Pitch Competition'),
  'Networking Area Setup',
  'Networking lounge with seating, refreshments, and business card exchange area',
  '2024-02-28',
  'Delivered',
  (SELECT id FROM suppliers WHERE supplier_name = 'Fresh Bites Catering')
),

-- Luxury Watch Collection Launch assets
(
  (SELECT id FROM projects WHERE project_name = 'Luxury Watch Collection Launch'),
  'Display Cases',
  'Premium display cases with security features and elegant lighting for watch collection',
  '2024-05-09',
  'Pending',
  null
),
(
  (SELECT id FROM projects WHERE project_name = 'Luxury Watch Collection Launch'),
  'VIP Reception Setup',
  'Exclusive reception area with premium catering and bar service',
  '2024-05-10',
  'Pending',
  null
),

-- Eco-Friendly Apparel Launch assets
(
  (SELECT id FROM projects WHERE project_name = 'Eco-Friendly Apparel Launch'),
  'Runway Setup',
  'Professional runway with lighting, sound, and seating for 400 guests',
  '2024-06-04',
  'In Production',
  (SELECT id FROM suppliers WHERE supplier_name = 'Dynamic Lighting Co')
),
(
  (SELECT id FROM projects WHERE project_name = 'Eco-Friendly Apparel Launch'),
  'Sustainability Panel Area',
  'Panel discussion setup with seating, microphones, and presentation screen',
  '2024-06-05',
  'Quoting',
  (SELECT id FROM suppliers WHERE supplier_name = 'Professional Audio Systems')
),

-- Johnson-Williams Wedding assets
(
  (SELECT id FROM projects WHERE project_name = 'Johnson-Williams Wedding'),
  'Ceremony Setup',
  'Garden ceremony setup with arch, seating for 200, and sound system',
  '2024-07-20',
  'Quoting',
  (SELECT id FROM suppliers WHERE supplier_name = 'Complete Event Solutions')
),
(
  (SELECT id FROM projects WHERE project_name = 'Johnson-Williams Wedding'),
  'Reception Setup',
  'Reception hall setup with dance floor, lighting, and dining tables',
  '2024-07-20',
  'Quoting',
  (SELECT id FROM suppliers WHERE supplier_name = 'Full Service Events Co')
),

-- Corporate Gala Dinner assets
(
  (SELECT id FROM projects WHERE project_name = 'Corporate Gala Dinner'),
  'Awards Stage',
  'Professional stage with backdrop, podium, and lighting for awards ceremony',
  '2024-08-14',
  'Pending',
  null
),
(
  (SELECT id FROM projects WHERE project_name = 'Corporate Gala Dinner'),
  'Dining Setup',
  'Elegant dining setup for 300 guests with premium table settings',
  '2024-08-15',
  'Pending',
  null
),

-- HealthTech Innovation Expo assets
(
  (SELECT id FROM projects WHERE project_name = 'HealthTech Innovation Expo'),
  'Exhibition Hall Setup',
  'Large exhibition hall with 100 booth spaces, power, and lighting',
  '2024-09-11',
  'Approved',
  (SELECT id FROM suppliers WHERE supplier_name = 'Mega Event Productions')
),
(
  (SELECT id FROM projects WHERE project_name = 'HealthTech Innovation Expo'),
  'Conference Room AV',
  'Audio-visual equipment for 5 conference rooms with presentation capabilities',
  '2024-09-11',
  'In Production',
  (SELECT id FROM suppliers WHERE supplier_name = 'Professional Audio Systems')
),

-- Art & Design Fair assets
(
  (SELECT id FROM projects WHERE project_name = 'Art & Design Fair'),
  'Gallery Display Setup',
  'Professional gallery display setup with lighting and security for artwork',
  '2024-10-07',
  'Pending',
  null
),
(
  (SELECT id FROM projects WHERE project_name = 'Art & Design Fair'),
  'Workshop Area Setup',
  'Interactive workshop area with tables, chairs, and art supplies',
  '2024-10-08',
  'Pending',
  null
);

-- Quotes seed data (linked to assets and suppliers)
INSERT INTO quotes (
  supplier_id,
  asset_id,
  cost,
  notes_capacity,
  status
) VALUES
-- TechCorp Conference quotes
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Elite Event Productions'),
  (SELECT id FROM assets WHERE asset_name = 'Main Stage Setup' AND project_id = (SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024')),
  8500.00,
  'Professional stage setup with full AV integration. Includes setup, operation, and breakdown.',
  'Accepted'
),
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Professional Audio Systems'),
  (SELECT id FROM assets WHERE asset_name = 'Breakout Room AV' AND project_id = (SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024')),
  3200.00,
  'Complete AV package for 5 breakout rooms. Includes projectors, screens, microphones, and technician.',
  'Accepted'
),
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Premier Print Solutions'),
  (SELECT id FROM assets WHERE asset_name = 'Registration Materials' AND project_id = (SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024')),
  1200.00,
  '500 welcome packets with custom design, name badges, lanyards, and conference programs.',
  'Accepted'
),
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Gourmet Catering Plus'),
  (SELECT id FROM assets WHERE asset_name = 'Networking Reception' AND project_id = (SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024')),
  4500.00,
  'Cocktail reception for 500 guests with appetizers, bar service, and staff.',
  'Submitted'
),

-- Global Marketing Summit quotes
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Artisan Food Services'),
  (SELECT id FROM assets WHERE asset_name = 'Gala Dinner Setup' AND project_id = (SELECT id FROM projects WHERE project_name = 'Global Marketing Summit')),
  8500.00,
  'Elegant dinner service for 300 guests with premium menu options and full service.',
  'Submitted'
),

-- Startup Pitch Competition quotes (completed)
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Grand Stage Solutions'),
  (SELECT id FROM assets WHERE asset_name = 'Presentation Stage' AND project_id = (SELECT id FROM projects WHERE project_name = 'Startup Pitch Competition')),
  1800.00,
  'Compact stage setup with projection screen and sound system.',
  'Accepted'
),
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Fresh Bites Catering'),
  (SELECT id FROM assets WHERE asset_name = 'Networking Area Setup' AND project_id = (SELECT id FROM projects WHERE project_name = 'Startup Pitch Competition')),
  950.00,
  'Networking lounge with light refreshments and coffee service.',
  'Accepted'
),

-- Eco-Friendly Apparel Launch quotes
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Dynamic Lighting Co'),
  (SELECT id FROM assets WHERE asset_name = 'Runway Setup' AND project_id = (SELECT id FROM projects WHERE project_name = 'Eco-Friendly Apparel Launch')),
  6500.00,
  'Professional runway with LED lighting, sound system, and seating for 400 guests.',
  'Accepted'
),
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Professional Audio Systems'),
  (SELECT id FROM assets WHERE asset_name = 'Sustainability Panel Area' AND project_id = (SELECT id FROM projects WHERE project_name = 'Eco-Friendly Apparel Launch')),
  2200.00,
  'Panel discussion setup with microphones, presentation screen, and seating.',
  'Submitted'
),

-- Wedding quotes
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Complete Event Solutions'),
  (SELECT id FROM assets WHERE asset_name = 'Ceremony Setup' AND project_id = (SELECT id FROM projects WHERE project_name = 'Johnson-Williams Wedding')),
  3200.00,
  'Garden ceremony setup with floral arch, seating for 200, and sound system.',
  'Submitted'
),
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Full Service Events Co'),
  (SELECT id FROM assets WHERE asset_name = 'Reception Setup' AND project_id = (SELECT id FROM projects WHERE project_name = 'Johnson-Williams Wedding')),
  7800.00,
  'Complete reception setup with dance floor, lighting, and dining tables for 200 guests.',
  'Submitted'
),

-- HealthTech Expo quotes
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Mega Event Productions'),
  (SELECT id FROM assets WHERE asset_name = 'Exhibition Hall Setup' AND project_id = (SELECT id FROM projects WHERE project_name = 'HealthTech Innovation Expo')),
  25000.00,
  'Complete exhibition hall setup with 100 booth spaces, power distribution, and lighting.',
  'Accepted'
),
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Professional Audio Systems'),
  (SELECT id FROM assets WHERE asset_name = 'Conference Room AV' AND project_id = (SELECT id FROM projects WHERE project_name = 'HealthTech Innovation Expo')),
  8500.00,
  'AV equipment for 5 conference rooms with presentation capabilities and technician support.',
  'Accepted'
);

-- AI Processing Logs seed data
INSERT INTO ai_processing_logs (
  project_id,
  processing_type,
  input_data,
  output_data,
  processing_time_ms,
  success,
  error_message
) VALUES
-- TechCorp Conference AI processing
(
  (SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024'),
  'asset_creation',
  '{"project_brief": "Annual technology conference for 500 attendees", "requirements": ["main stage", "breakout rooms", "registration", "networking"]}',
  '{"assets_created": ["Main Stage Setup", "Breakout Room AV", "Registration Materials", "Networking Reception"], "confidence": 0.92}',
  1250,
  true,
  null
),
(
  (SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024'),
  'allocation',
  '{"assets": ["Main Stage Setup", "Breakout Room AV"], "suppliers": ["Elite Event Productions", "Professional Audio Systems"]}',
  '{"allocations": [{"asset": "Main Stage Setup", "supplier": "Elite Event Productions", "confidence": 0.88}, {"asset": "Breakout Room AV", "supplier": "Professional Audio Systems", "confidence": 0.91}]}',
  890,
  true,
  null
),

-- Startup Pitch Competition AI processing
(
  (SELECT id FROM projects WHERE project_name = 'Startup Pitch Competition'),
  'asset_creation',
  '{"project_brief": "Startup pitch competition with 50 companies", "requirements": ["presentation stage", "networking area"]}',
  '{"assets_created": ["Presentation Stage", "Networking Area Setup"], "confidence": 0.85}',
  980,
  true,
  null
),
(
  (SELECT id FROM projects WHERE project_name = 'Startup Pitch Competition'),
  'allocation',
  '{"assets": ["Presentation Stage", "Networking Area Setup"], "suppliers": ["Grand Stage Solutions", "Fresh Bites Catering"]}',
  '{"allocations": [{"asset": "Presentation Stage", "supplier": "Grand Stage Solutions", "confidence": 0.93}, {"asset": "Networking Area Setup", "supplier": "Fresh Bites Catering", "confidence": 0.87}]}',
  720,
  true,
  null
),

-- Eco-Friendly Apparel Launch AI processing
(
  (SELECT id FROM projects WHERE project_name = 'Eco-Friendly Apparel Launch'),
  'asset_creation',
  '{"project_brief": "Sustainable fashion brand launch with runway show", "requirements": ["runway", "panel discussion area"]}',
  '{"assets_created": ["Runway Setup", "Sustainability Panel Area"], "confidence": 0.89}',
  1100,
  true,
  null
),
(
  (SELECT id FROM projects WHERE project_name = 'Eco-Friendly Apparel Launch'),
  'allocation',
  '{"assets": ["Runway Setup"], "suppliers": ["Dynamic Lighting Co", "Grand Stage Solutions"]}',
  '{"allocations": [{"asset": "Runway Setup", "supplier": "Dynamic Lighting Co", "confidence": 0.91}]}',
  650,
  true,
  null
),

-- HealthTech Expo AI processing
(
  (SELECT id FROM projects WHERE project_name = 'HealthTech Innovation Expo'),
  'asset_creation',
  '{"project_brief": "Healthcare technology exhibition with 100 exhibitors", "requirements": ["exhibition hall", "conference rooms"]}',
  '{"assets_created": ["Exhibition Hall Setup", "Conference Room AV"], "confidence": 0.94}',
  1450,
  true,
  null
),
(
  (SELECT id FROM projects WHERE project_name = 'HealthTech Innovation Expo'),
  'allocation',
  '{"assets": ["Exhibition Hall Setup", "Conference Room AV"], "suppliers": ["Mega Event Productions", "Professional Audio Systems"]}',
  '{"allocations": [{"asset": "Exhibition Hall Setup", "supplier": "Mega Event Productions", "confidence": 0.95}, {"asset": "Conference Room AV", "supplier": "Professional Audio Systems", "confidence": 0.89}]}',
  1120,
  true,
  null
),

-- Failed AI processing example
(
  (SELECT id FROM projects WHERE project_name = 'Global Marketing Summit'),
  'asset_creation',
  '{"project_brief": "International marketing conference", "requirements": ["main stage", "exhibition booths"]}',
  null,
  500,
  false,
  'Insufficient project details for asset creation. Missing venue specifications and capacity requirements.'
),

-- Corporate Gala Dinner AI processing
(
  (SELECT id FROM projects WHERE project_name = 'Corporate Gala Dinner'),
  'asset_creation',
  '{"project_brief": "Annual corporate gala dinner with awards ceremony", "requirements": ["awards stage", "dining setup"]}',
  '{"assets_created": ["Awards Stage", "Dining Setup"], "confidence": 0.87}',
  1050,
  true,
  null
);

-- Add some additional quotes with different statuses for variety
INSERT INTO quotes (
  supplier_id,
  asset_id,
  cost,
  notes_capacity,
  status
) VALUES
-- Rejected quotes
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Banner Masters'),
  (SELECT id FROM assets WHERE asset_name = 'Registration Materials' AND project_id = (SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024')),
  1800.00,
  'Alternative quote for registration materials with premium printing options.',
  'Rejected'
),
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Express Delivery Co'),
  (SELECT id FROM assets WHERE asset_name = 'Networking Reception' AND project_id = (SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024')),
  5200.00,
  'Alternative catering quote with premium menu options.',
  'Rejected'
),

-- More submitted quotes for variety
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Brand Design Studio'),
  (SELECT id FROM assets WHERE asset_name = 'Main Presentation Stage' AND project_id = (SELECT id FROM projects WHERE project_name = 'Global Marketing Summit')),
  12000.00,
  'Premium stage design with custom branding and LED backdrop.',
  'Submitted'
),
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Creative Printworks'),
  (SELECT id FROM assets WHERE asset_name = 'Exhibition Booths' AND project_id = (SELECT id FROM projects WHERE project_name = 'Global Marketing Summit')),
  15000.00,
  'Custom exhibition booths with premium graphics and display fixtures.',
  'Submitted'
);

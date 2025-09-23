-- Quote Comparison Seed Data
-- This script populates the database with realistic competing quotes for testing the comparison feature
-- Run this after the basic seed.sql to add comparison data

-- First, clear existing quotes to start fresh
DELETE FROM quotes;

-- Insert enhanced quotes with comparison data
-- Each asset will have 3-4 competing quotes with realistic cost variations and breakdowns

INSERT INTO quotes (
  supplier_id,
  asset_id,
  cost,
  cost_breakdown,
  notes_capacity,
  status,
  valid_until,
  response_time_hours
) VALUES

-- TechCorp Annual Conference 2024 - Main Stage Setup (4 competing quotes)
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Elite Event Productions'),
  (SELECT id FROM assets WHERE asset_name = 'Main Stage Setup' AND project_id = (SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024')),
  8500.00,
  '{"labor": 3400.00, "materials": 2975.00, "equipment": 1700.00, "other": 425.00}',
  'Professional stage setup with full AV integration. Includes setup, operation, and breakdown. Available for the entire event duration with experienced crew.',
  'Accepted',
  '2024-03-20',
  24
),
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Grand Stage Solutions'),
  (SELECT id FROM assets WHERE asset_name = 'Main Stage Setup' AND project_id = (SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024')),
  10200.00,
  '{"labor": 4080.00, "materials": 3570.00, "equipment": 2040.00, "other": 510.00}',
  'Premium stage design with custom branding and LED backdrop. High-end service with attention to detail and premium materials.',
  'Rejected',
  '2024-03-18',
  48
),
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Mega Event Productions'),
  (SELECT id FROM assets WHERE asset_name = 'Main Stage Setup' AND project_id = (SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024')),
  7800.00,
  '{"labor": 3120.00, "materials": 2730.00, "equipment": 1560.00, "other": 390.00}',
  'Cost-effective option with reliable service and quick response time. Complete solution including setup, operation, and breakdown services.',
  'Rejected',
  '2024-03-22',
  12
),
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Complete Event Solutions'),
  (SELECT id FROM assets WHERE asset_name = 'Main Stage Setup' AND project_id = (SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024')),
  9200.00,
  '{"labor": 3680.00, "materials": 3220.00, "equipment": 1840.00, "other": 460.00}',
  'Flexible package that can be customized based on your specific needs. Experienced team with proven track record in similar events.',
  'Rejected',
  '2024-03-19',
  36
),

-- TechCorp Annual Conference 2024 - Breakout Room AV (3 competing quotes)
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Professional Audio Systems'),
  (SELECT id FROM assets WHERE asset_name = 'Breakout Room AV' AND project_id = (SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024')),
  3200.00,
  '{"labor": 960.00, "materials": 320.00, "equipment": 1760.00, "other": 160.00}',
  'Complete AV package for 5 breakout rooms. Includes projectors, screens, microphones, and technician support.',
  'Accepted',
  '2024-03-20',
  18
),
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Dynamic Lighting Co'),
  (SELECT id FROM assets WHERE asset_name = 'Breakout Room AV' AND project_id = (SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024')),
  3800.00,
  '{"labor": 1140.00, "materials": 380.00, "equipment": 2090.00, "other": 190.00}',
  'Premium AV package with backup equipment. Can accommodate last-minute changes with advanced lighting integration.',
  'Rejected',
  '2024-03-18',
  30
),
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Elite Event Productions'),
  (SELECT id FROM assets WHERE asset_name = 'Breakout Room AV' AND project_id = (SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024')),
  2900.00,
  '{"labor": 870.00, "materials": 290.00, "equipment": 1595.00, "other": 145.00}',
  'Budget-friendly option without compromising on quality. Reliable equipment with professional setup and support.',
  'Rejected',
  '2024-03-21',
  6
),

-- TechCorp Annual Conference 2024 - Registration Materials (3 competing quotes)
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Premier Print Solutions'),
  (SELECT id FROM assets WHERE asset_name = 'Registration Materials' AND project_id = (SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024')),
  1200.00,
  '{"labor": 240.00, "materials": 840.00, "equipment": 60.00, "other": 60.00}',
  '500 welcome packets with custom design, name badges, lanyards, and conference programs. Premium printing with quick turnaround.',
  'Accepted',
  '2024-03-10',
  12
),
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Banner Masters'),
  (SELECT id FROM assets WHERE asset_name = 'Registration Materials' AND project_id = (SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024')),
  1800.00,
  '{"labor": 360.00, "materials": 1260.00, "equipment": 90.00, "other": 90.00}',
  'Alternative quote for registration materials with premium printing options and custom branding elements.',
  'Rejected',
  '2024-03-08',
  24
),
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Creative Printworks'),
  (SELECT id FROM assets WHERE asset_name = 'Registration Materials' AND project_id = (SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024')),
  950.00,
  '{"labor": 190.00, "materials": 665.00, "equipment": 47.50, "other": 47.50}',
  'Cost-effective printing solution with standard quality materials. Fast delivery and reliable service.',
  'Rejected',
  '2024-03-12',
  8
),

-- TechCorp Annual Conference 2024 - Networking Reception (4 competing quotes)
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Gourmet Catering Plus'),
  (SELECT id FROM assets WHERE asset_name = 'Networking Reception' AND project_id = (SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024')),
  4500.00,
  '{"labor": 2250.00, "materials": 1800.00, "equipment": 225.00, "other": 225.00}',
  'Cocktail reception for 500 guests with appetizers, bar service, and professional staff. Premium menu options available.',
  'Submitted',
  '2024-03-15',
  36
),
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Express Delivery Co'),
  (SELECT id FROM assets WHERE asset_name = 'Networking Reception' AND project_id = (SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024')),
  5200.00,
  '{"labor": 2600.00, "materials": 2080.00, "equipment": 260.00, "other": 260.00}',
  'Alternative catering quote with premium menu options and extended bar service. Can scale up or down based on final numbers.',
  'Submitted',
  '2024-03-14',
  48
),
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Fresh Bites Catering'),
  (SELECT id FROM assets WHERE asset_name = 'Networking Reception' AND project_id = (SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024')),
  3800.00,
  '{"labor": 1900.00, "materials": 1520.00, "equipment": 190.00, "other": 190.00}',
  'Fresh, locally-sourced catering with creative presentation. Sustainable options and dietary accommodations available.',
  'Submitted',
  '2024-03-16',
  24
),
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Artisan Food Services'),
  (SELECT id FROM assets WHERE asset_name = 'Networking Reception' AND project_id = (SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024')),
  4900.00,
  '{"labor": 2450.00, "materials": 1960.00, "equipment": 245.00, "other": 245.00}',
  'Artisanal catering with gourmet selections and premium presentation. Experienced team with attention to detail.',
  'Submitted',
  '2024-03-13',
  42
),

-- Global Marketing Summit - Main Presentation Stage (3 competing quotes)
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Brand Design Studio'),
  (SELECT id FROM assets WHERE asset_name = 'Main Presentation Stage' AND project_id = (SELECT id FROM projects WHERE project_name = 'Global Marketing Summit')),
  12000.00,
  '{"labor": 4800.00, "materials": 4200.00, "equipment": 2400.00, "other": 600.00}',
  'Premium stage design with custom branding and LED backdrop. High-end service with dedicated project manager.',
  'Submitted',
  '2024-04-25',
  24
),
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Elite Event Productions'),
  (SELECT id FROM assets WHERE asset_name = 'Main Presentation Stage' AND project_id = (SELECT id FROM projects WHERE project_name = 'Global Marketing Summit')),
  10500.00,
  '{"labor": 4200.00, "materials": 3675.00, "equipment": 2100.00, "other": 525.00}',
  'Professional stage setup with full AV integration. Reliable service with comprehensive support and maintenance.',
  'Submitted',
  '2024-04-26',
  18
),
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Grand Stage Solutions'),
  (SELECT id FROM assets WHERE asset_name = 'Main Presentation Stage' AND project_id = (SELECT id FROM projects WHERE project_name = 'Global Marketing Summit')),
  9800.00,
  '{"labor": 3920.00, "materials": 3430.00, "equipment": 1960.00, "other": 490.00}',
  'Cost-effective stage solution with professional quality. Flexible package that can be customized based on needs.',
  'Submitted',
  '2024-04-27',
  12
),

-- Global Marketing Summit - Exhibition Booths (4 competing quotes)
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Creative Printworks'),
  (SELECT id FROM assets WHERE asset_name = 'Exhibition Booths' AND project_id = (SELECT id FROM projects WHERE project_name = 'Global Marketing Summit')),
  15000.00,
  '{"labor": 5250.00, "materials": 7500.00, "equipment": 1500.00, "other": 750.00}',
  'Custom exhibition booths with premium graphics and display fixtures. Complete design and installation service.',
  'Submitted',
  '2024-04-25',
  36
),
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Mega Event Productions'),
  (SELECT id FROM assets WHERE asset_name = 'Exhibition Booths' AND project_id = (SELECT id FROM projects WHERE project_name = 'Global Marketing Summit')),
  18000.00,
  '{"labor": 6300.00, "materials": 9000.00, "equipment": 1800.00, "other": 900.00}',
  'Premium exhibition setup with advanced display technology and custom branding. Full-service solution with project management.',
  'Submitted',
  '2024-04-24',
  48
),
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Complete Event Solutions'),
  (SELECT id FROM assets WHERE asset_name = 'Exhibition Booths' AND project_id = (SELECT id FROM projects WHERE project_name = 'Global Marketing Summit')),
  13500.00,
  '{"labor": 4725.00, "materials": 6750.00, "equipment": 1350.00, "other": 675.00}',
  'Standard exhibition booths with professional graphics and reliable setup. Budget-friendly option with quality service.',
  'Submitted',
  '2024-04-26',
  30
),
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Banner Masters'),
  (SELECT id FROM assets WHERE asset_name = 'Exhibition Booths' AND project_id = (SELECT id FROM projects WHERE project_name = 'Global Marketing Summit')),
  16500.00,
  '{"labor": 5775.00, "materials": 8250.00, "equipment": 1650.00, "other": 825.00}',
  'High-quality exhibition booths with premium materials and custom design elements. Experienced installation team.',
  'Submitted',
  '2024-04-23',
  42
),

-- Startup Pitch Competition - Presentation Stage (2 competing quotes - completed project)
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Grand Stage Solutions'),
  (SELECT id FROM assets WHERE asset_name = 'Presentation Stage' AND project_id = (SELECT id FROM projects WHERE project_name = 'Startup Pitch Competition')),
  1800.00,
  '{"labor": 720.00, "materials": 630.00, "equipment": 360.00, "other": 90.00}',
  'Compact stage setup with projection screen and sound system. Perfect for pitch presentations with professional quality.',
  'Accepted',
  '2024-02-25',
  6
),
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Elite Event Productions'),
  (SELECT id FROM assets WHERE asset_name = 'Presentation Stage' AND project_id = (SELECT id FROM projects WHERE project_name = 'Startup Pitch Competition')),
  2200.00,
  '{"labor": 880.00, "materials": 770.00, "equipment": 440.00, "other": 110.00}',
  'Premium stage setup with advanced AV equipment and professional lighting. High-end service for important presentations.',
  'Rejected',
  '2024-02-24',
  12
),

-- Startup Pitch Competition - Networking Area Setup (2 competing quotes - completed project)
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Fresh Bites Catering'),
  (SELECT id FROM assets WHERE asset_name = 'Networking Area Setup' AND project_id = (SELECT id FROM projects WHERE project_name = 'Startup Pitch Competition')),
  950.00,
  '{"labor": 475.00, "materials": 380.00, "equipment": 47.50, "other": 47.50}',
  'Networking lounge with light refreshments and coffee service. Perfect for startup networking and informal discussions.',
  'Accepted',
  '2024-02-26',
  4
),
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Gourmet Catering Plus'),
  (SELECT id FROM assets WHERE asset_name = 'Networking Area Setup' AND project_id = (SELECT id FROM projects WHERE project_name = 'Startup Pitch Competition')),
  1200.00,
  '{"labor": 600.00, "materials": 480.00, "equipment": 60.00, "other": 60.00}',
  'Premium networking setup with gourmet refreshments and professional service. Enhanced experience for networking.',
  'Rejected',
  '2024-02-25',
  8
),

-- Eco-Friendly Apparel Launch - Runway Setup (3 competing quotes)
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Dynamic Lighting Co'),
  (SELECT id FROM assets WHERE asset_name = 'Runway Setup' AND project_id = (SELECT id FROM projects WHERE project_name = 'Eco-Friendly Apparel Launch')),
  6500.00,
  '{"labor": 1950.00, "materials": 1300.00, "equipment": 2925.00, "other": 325.00}',
  'Professional runway with LED lighting, sound system, and seating for 400 guests. Eco-friendly lighting options available.',
  'Accepted',
  '2024-06-08',
  24
),
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Grand Stage Solutions'),
  (SELECT id FROM assets WHERE asset_name = 'Runway Setup' AND project_id = (SELECT id FROM projects WHERE project_name = 'Eco-Friendly Apparel Launch')),
  7800.00,
  '{"labor": 2340.00, "materials": 1560.00, "equipment": 3510.00, "other": 390.00}',
  'Premium runway setup with advanced lighting and sound. Custom design elements and professional presentation.',
  'Rejected',
  '2024-06-07',
  36
),
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Elite Event Productions'),
  (SELECT id FROM assets WHERE asset_name = 'Runway Setup' AND project_id = (SELECT id FROM projects WHERE project_name = 'Eco-Friendly Apparel Launch')),
  7200.00,
  '{"labor": 2160.00, "materials": 1440.00, "equipment": 3240.00, "other": 360.00}',
  'High-end runway production with professional lighting and sound. Experienced team with fashion show expertise.',
  'Rejected',
  '2024-06-09',
  18
),

-- Eco-Friendly Apparel Launch - Sustainability Panel Area (2 competing quotes)
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Professional Audio Systems'),
  (SELECT id FROM assets WHERE asset_name = 'Sustainability Panel Area' AND project_id = (SELECT id FROM projects WHERE project_name = 'Eco-Friendly Apparel Launch')),
  2200.00,
  '{"labor": 660.00, "materials": 220.00, "equipment": 1210.00, "other": 110.00}',
  'Panel discussion setup with microphones, presentation screen, and seating. Professional AV support for sustainability discussions.',
  'Submitted',
  '2024-06-08',
  12
),
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Dynamic Lighting Co'),
  (SELECT id FROM assets WHERE asset_name = 'Sustainability Panel Area' AND project_id = (SELECT id FROM projects WHERE project_name = 'Eco-Friendly Apparel Launch')),
  2800.00,
  '{"labor": 840.00, "materials": 280.00, "equipment": 1540.00, "other": 140.00}',
  'Enhanced panel setup with premium lighting and advanced AV equipment. Perfect for professional sustainability presentations.',
  'Submitted',
  '2024-06-07',
  24
),

-- Johnson-Williams Wedding - Ceremony Setup (3 competing quotes)
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Complete Event Solutions'),
  (SELECT id FROM assets WHERE asset_name = 'Ceremony Setup' AND project_id = (SELECT id FROM projects WHERE project_name = 'Johnson-Williams Wedding')),
  3200.00,
  '{"labor": 1280.00, "materials": 1280.00, "equipment": 480.00, "other": 160.00}',
  'Garden ceremony setup with floral arch, seating for 200, and sound system. Elegant and romantic atmosphere.',
  'Submitted',
  '2024-07-25',
  48
),
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Full Service Events Co'),
  (SELECT id FROM assets WHERE asset_name = 'Ceremony Setup' AND project_id = (SELECT id FROM projects WHERE project_name = 'Johnson-Williams Wedding')),
  3800.00,
  '{"labor": 1520.00, "materials": 1520.00, "equipment": 570.00, "other": 190.00}',
  'Premium ceremony setup with custom floral arrangements and professional sound. Full-service wedding coordination.',
  'Submitted',
  '2024-07-24',
  36
),
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Elite Event Productions'),
  (SELECT id FROM assets WHERE asset_name = 'Ceremony Setup' AND project_id = (SELECT id FROM projects WHERE project_name = 'Johnson-Williams Wedding')),
  2900.00,
  '{"labor": 1160.00, "materials": 1160.00, "equipment": 435.00, "other": 145.00}',
  'Beautiful ceremony setup with elegant decorations and reliable sound system. Cost-effective option with quality service.',
  'Submitted',
  '2024-07-26',
  24
),

-- Johnson-Williams Wedding - Reception Setup (3 competing quotes)
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Full Service Events Co'),
  (SELECT id FROM assets WHERE asset_name = 'Reception Setup' AND project_id = (SELECT id FROM projects WHERE project_name = 'Johnson-Williams Wedding')),
  7800.00,
  '{"labor": 3510.00, "materials": 2730.00, "equipment": 1170.00, "other": 390.00}',
  'Complete reception setup with dance floor, lighting, and dining tables for 200 guests. Full wedding coordination service.',
  'Submitted',
  '2024-07-25',
  42
),
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Complete Event Solutions'),
  (SELECT id FROM assets WHERE asset_name = 'Reception Setup' AND project_id = (SELECT id FROM projects WHERE project_name = 'Johnson-Williams Wedding')),
  7200.00,
  '{"labor": 3240.00, "materials": 2520.00, "equipment": 1080.00, "other": 360.00}',
  'Elegant reception setup with professional lighting and dance floor. Experienced team with wedding expertise.',
  'Submitted',
  '2024-07-24',
  30
),
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Dynamic Lighting Co'),
  (SELECT id FROM assets WHERE asset_name = 'Reception Setup' AND project_id = (SELECT id FROM projects WHERE project_name = 'Johnson-Williams Wedding')),
  8500.00,
  '{"labor": 3825.00, "materials": 2975.00, "equipment": 1275.00, "other": 425.00}',
  'Premium reception setup with advanced lighting and sound. High-end service with attention to detail.',
  'Submitted',
  '2024-07-23',
  48
),

-- HealthTech Innovation Expo - Exhibition Hall Setup (2 competing quotes - accepted)
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Mega Event Productions'),
  (SELECT id FROM assets WHERE asset_name = 'Exhibition Hall Setup' AND project_id = (SELECT id FROM projects WHERE project_name = 'HealthTech Innovation Expo')),
  25000.00,
  '{"labor": 10000.00, "materials": 7500.00, "equipment": 6250.00, "other": 1250.00}',
  'Complete exhibition hall setup with 100 booth spaces, power distribution, and lighting. Professional installation and management.',
  'Accepted',
  '2024-09-15',
  24
),
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Complete Event Solutions'),
  (SELECT id FROM assets WHERE asset_name = 'Exhibition Hall Setup' AND project_id = (SELECT id FROM projects WHERE project_name = 'HealthTech Innovation Expo')),
  28000.00,
  '{"labor": 11200.00, "materials": 8400.00, "equipment": 7000.00, "other": 1400.00}',
  'Premium exhibition hall setup with advanced infrastructure and custom booth designs. Full-service project management.',
  'Rejected',
  '2024-09-14',
  36
),

-- HealthTech Innovation Expo - Conference Room AV (2 competing quotes - accepted)
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Professional Audio Systems'),
  (SELECT id FROM assets WHERE asset_name = 'Conference Room AV' AND project_id = (SELECT id FROM projects WHERE project_name = 'HealthTech Innovation Expo')),
  8500.00,
  '{"labor": 2550.00, "materials": 850.00, "equipment": 4675.00, "other": 425.00}',
  'AV equipment for 5 conference rooms with presentation capabilities and technician support. Professional setup and operation.',
  'Accepted',
  '2024-09-15',
  18
),
(
  (SELECT id FROM suppliers WHERE supplier_name = 'Dynamic Lighting Co'),
  (SELECT id FROM assets WHERE asset_name = 'Conference Room AV' AND project_id = (SELECT id FROM projects WHERE project_name = 'HealthTech Innovation Expo')),
  9200.00,
  '{"labor": 2760.00, "materials": 920.00, "equipment": 5060.00, "other": 460.00}',
  'Enhanced AV setup with premium equipment and advanced lighting. High-end service with dedicated technical support.',
  'Rejected',
  '2024-09-14',
  30
);

-- Display summary of inserted data
SELECT 
  'Quote Comparison Data Seeding Summary' as summary,
  COUNT(*) as total_quotes,
  COUNT(DISTINCT asset_id) as assets_with_quotes,
  COUNT(CASE WHEN status = 'Submitted' THEN 1 END) as submitted_quotes,
  COUNT(CASE WHEN status = 'Accepted' THEN 1 END) as accepted_quotes,
  COUNT(CASE WHEN status = 'Rejected' THEN 1 END) as rejected_quotes,
  ROUND(AVG(cost), 2) as average_cost,
  ROUND(MIN(cost), 2) as lowest_cost,
  ROUND(MAX(cost), 2) as highest_cost
FROM quotes;

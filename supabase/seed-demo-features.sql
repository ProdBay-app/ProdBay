-- =====================================================
-- Demo Seed Script for New Features
-- =====================================================
-- This script demonstrates:
-- 1. Overview Block (Project Name + Client Name)
-- 2. Client Projects Modal (Multiple projects per client)
-- 3. Budget Bar (Live data from accepted quotes)
-- 4. Budget Assets Modal (Clickable breakdown)
-- =====================================================

-- Clean up existing data (optional - comment out if you want to keep existing data)
-- DELETE FROM quotes;
-- DELETE FROM assets;
-- DELETE FROM projects;
-- DELETE FROM suppliers;

-- =====================================================
-- SUPPLIERS
-- =====================================================

INSERT INTO suppliers (id, supplier_name, contact_email, service_categories, contact_persons) VALUES
  -- Film Equipment Suppliers
  ('550e8400-e29b-41d4-a716-446655440001', 'FilmGear Pro', 'sales@filmgearpro.com', 
   ARRAY['Camera Equipment', 'Lighting', 'Audio'], 
   '[{"name": "Sarah Johnson", "email": "sarah@filmgearpro.com", "role": "Sales Manager", "phone": "+1-555-0101", "is_primary": true}]'::jsonb),
  
  ('550e8400-e29b-41d4-a716-446655440002', 'StageCraft Studios', 'info@stagecraft.com', 
   ARRAY['Set Design', 'Props', 'Construction'], 
   '[{"name": "Mike Chen", "email": "mike@stagecraft.com", "role": "Project Lead", "phone": "+1-555-0102", "is_primary": true}]'::jsonb),
  
  ('550e8400-e29b-41d4-a716-446655440003', 'LightMaster Supply', 'orders@lightmaster.com', 
   ARRAY['Lighting', 'Electrical', 'Grip Equipment'], 
   '[{"name": "Elena Rodriguez", "email": "elena@lightmaster.com", "role": "Technical Director", "phone": "+1-555-0103", "is_primary": true}]'::jsonb),
  
  ('550e8400-e29b-41d4-a716-446655440004', 'AudioTech Solutions', 'support@audiotech.com', 
   ARRAY['Audio', 'Sound Design', 'Recording'], 
   '[{"name": "David Park", "email": "david@audiotech.com", "role": "Sound Engineer", "phone": "+1-555-0104", "is_primary": true}]'::jsonb),
  
  ('550e8400-e29b-41d4-a716-446655440005', 'Creative Props Co', 'hello@creativeprops.com', 
   ARRAY['Props', 'Set Decoration', 'Art Department'], 
   '[{"name": "Lisa Zhang", "email": "lisa@creativeprops.com", "role": "Art Director", "phone": "+1-555-0105", "is_primary": true}]'::jsonb);

-- =====================================================
-- CLIENT 1: "Netflix Studios" - 3 Projects
-- Demonstrates: Client Projects Modal showing multiple projects
-- =====================================================

-- Project 1.1: Sci-Fi Series "Nebula Rising" (High Budget, Active)
INSERT INTO projects (id, project_name, client_name, brief_description, physical_parameters, financial_parameters, timeline_deadline, project_status, created_at) VALUES
  ('650e8400-e29b-41d4-a716-446655440001', 
   'Nebula Rising - Season 1', 
   'Netflix Studios',
   'Epic sci-fi series requiring advanced visual effects, futuristic sets, and specialized equipment. Set in a distant galaxy with multiple alien worlds.',
   '8 episodes, 45min each. Multiple space station sets, 3 alien planet environments',
   120000,
   (CURRENT_DATE + INTERVAL '90 days')::date,
   'In Progress',
   CURRENT_TIMESTAMP - INTERVAL '15 days');

-- Assets for Nebula Rising
INSERT INTO assets (id, project_id, asset_name, specifications, timeline, status, assigned_supplier_id, created_at) VALUES
  ('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001',
   'Cinema Camera Package', 
   'ARRI Alexa Mini LF with full lens set, 4K ProRes RAW recording, wireless video transmission',
   (CURRENT_DATE + INTERVAL '60 days')::date, 'Approved', '550e8400-e29b-41d4-a716-446655440001',
   CURRENT_TIMESTAMP - INTERVAL '12 days'),
  
  ('750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001',
   'LED Wall System', 
   'Virtual production LED wall, 20ft x 12ft, real-time rendering compatible',
   (CURRENT_DATE + INTERVAL '50 days')::date, 'Approved', '550e8400-e29b-41d4-a716-446655440003',
   CURRENT_TIMESTAMP - INTERVAL '10 days'),
  
  ('750e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440001',
   'Futuristic Set Props', 
   'Alien technology props, holographic displays, sci-fi control panels (custom fabrication)',
   (CURRENT_DATE + INTERVAL '40 days')::date, 'In Production', '550e8400-e29b-41d4-a716-446655440005',
   CURRENT_TIMESTAMP - INTERVAL '8 days');

-- Accepted Quotes for Nebula Rising (with cost breakdowns)
INSERT INTO quotes (id, supplier_id, asset_id, cost, notes_capacity, status, cost_breakdown, created_at, updated_at) VALUES
  ('850e8400-e29b-41d4-a716-446655440001', 
   '550e8400-e29b-41d4-a716-446655440001',
   '750e8400-e29b-41d4-a716-446655440001',
   45000,
   'Premium cinema camera package with full support. Includes: Camera body, 5 prime lenses, wireless monitoring, media cards, and on-set technician.',
   'Accepted',
   '{"labor": 8000, "materials": 0, "equipment": 35000, "other": 2000}'::jsonb,
   CURRENT_TIMESTAMP - INTERVAL '11 days',
   CURRENT_TIMESTAMP - INTERVAL '9 days'),
  
  ('850e8400-e29b-41d4-a716-446655440002',
   '550e8400-e29b-41d4-a716-446655440003',
   '750e8400-e29b-41d4-a716-446655440002',
   38000,
   'Complete LED wall installation with Unreal Engine integration. Includes setup, calibration, and technical support throughout production.',
   'Accepted',
   '{"labor": 12000, "materials": 15000, "equipment": 10000, "other": 1000}'::jsonb,
   CURRENT_TIMESTAMP - INTERVAL '9 days',
   CURRENT_TIMESTAMP - INTERVAL '7 days'),
  
  ('850e8400-e29b-41d4-a716-446655440003',
   '550e8400-e29b-41d4-a716-446655440005',
   '750e8400-e29b-41d4-a716-446655440003',
   22000,
   'Custom-designed futuristic props and set pieces. All materials included, 3D printing and fabrication.',
   'Accepted',
   '{"labor": 10000, "materials": 8000, "equipment": 3000, "other": 1000}'::jsonb,
   CURRENT_TIMESTAMP - INTERVAL '7 days',
   CURRENT_TIMESTAMP - INTERVAL '5 days');

-- Project 1.2: Documentary "Ocean Depths" (Medium Budget)
INSERT INTO projects (id, project_name, client_name, brief_description, physical_parameters, financial_parameters, timeline_deadline, project_status, created_at) VALUES
  ('650e8400-e29b-41d4-a716-446655440002',
   'Ocean Depths Documentary',
   'Netflix Studios',
   'Underwater documentary exploring deep-sea ecosystems. Requires specialized underwater cameras and lighting.',
   '6 episodes, 30min each. Underwater filming in various ocean locations',
   65000,
   (CURRENT_DATE + INTERVAL '120 days')::date,
   'Quoting',
   CURRENT_TIMESTAMP - INTERVAL '8 days');

-- Assets for Ocean Depths
INSERT INTO assets (id, project_id, asset_name, specifications, timeline, status, assigned_supplier_id, created_at) VALUES
  ('750e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440002',
   'Underwater Camera Housing',
   'Waterproof housing for RED camera, depth rated 300ft, with lighting mounts',
   (CURRENT_DATE + INTERVAL '100 days')::date, 'Approved', '550e8400-e29b-41d4-a716-446655440001',
   CURRENT_TIMESTAMP - INTERVAL '6 days'),
  
  ('750e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440002',
   'Underwater Lighting Kit',
   'High-power LED lights with waterproof battery packs, 4x 500W units',
   (CURRENT_DATE + INTERVAL '95 days')::date, 'Approved', '550e8400-e29b-41d4-a716-446655440003',
   CURRENT_TIMESTAMP - INTERVAL '5 days');

-- Accepted Quotes for Ocean Depths
INSERT INTO quotes (id, supplier_id, asset_id, cost, notes_capacity, status, cost_breakdown, created_at, updated_at) VALUES
  ('850e8400-e29b-41d4-a716-446655440004',
   '550e8400-e29b-41d4-a716-446655440001',
   '750e8400-e29b-41d4-a716-446655440004',
   28000,
   'Professional underwater camera housing with all necessary accessories. Rental for 8 weeks.',
   'Accepted',
   '{"labor": 3000, "materials": 0, "equipment": 24000, "other": 1000}'::jsonb,
   CURRENT_TIMESTAMP - INTERVAL '5 days',
   CURRENT_TIMESTAMP - INTERVAL '3 days'),
  
  ('850e8400-e29b-41d4-a716-446655440005',
   '550e8400-e29b-41d4-a716-446655440003',
   '750e8400-e29b-41d4-a716-446655440005',
   15000,
   'Complete underwater lighting package. Includes batteries, chargers, and waterproof power distribution.',
   'Accepted',
   '{"labor": 2000, "materials": 0, "equipment": 12000, "other": 1000}'::jsonb,
   CURRENT_TIMESTAMP - INTERVAL '4 days',
   CURRENT_TIMESTAMP - INTERVAL '2 days');

-- Project 1.3: Comedy Special "Stand-Up Royale" (Low Budget, Completed)
INSERT INTO projects (id, project_name, client_name, brief_description, physical_parameters, financial_parameters, timeline_deadline, project_status, created_at) VALUES
  ('650e8400-e29b-41d4-a716-446655440003',
   'Stand-Up Royale Live Recording',
   'Netflix Studios',
   'Live comedy special recording. Simple setup with multiple camera angles and professional audio.',
   'Single venue, 90min show. 5-camera setup, live audience of 500',
   25000,
   (CURRENT_DATE - INTERVAL '10 days')::date,
   'Completed',
   CURRENT_TIMESTAMP - INTERVAL '45 days');

-- Assets for Stand-Up Royale
INSERT INTO assets (id, project_id, asset_name, specifications, timeline, status, assigned_supplier_id, created_at) VALUES
  ('750e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440003',
   'Multi-Camera Setup',
   '5x broadcast cameras with tripods, wireless CCU, video switcher',
   (CURRENT_DATE - INTERVAL '15 days')::date, 'Delivered', '550e8400-e29b-41d4-a716-446655440001',
   CURRENT_TIMESTAMP - INTERVAL '40 days'),
  
  ('750e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440003',
   'Professional Audio Package',
   'Wireless lavalier mics, audience mics, mixer, recording interface',
   (CURRENT_DATE - INTERVAL '15 days')::date, 'Delivered', '550e8400-e29b-41d4-a716-446655440004',
   CURRENT_TIMESTAMP - INTERVAL '40 days');

-- Accepted Quotes for Stand-Up Royale
INSERT INTO quotes (id, supplier_id, asset_id, cost, notes_capacity, status, created_at, updated_at) VALUES
  ('850e8400-e29b-41d4-a716-446655440006',
   '550e8400-e29b-41d4-a716-446655440001',
   '750e8400-e29b-41d4-a716-446655440006',
   12000,
   'Complete 5-camera broadcast setup. Includes camera operators and video engineer for the shoot.',
   'Accepted',
   CURRENT_TIMESTAMP - INTERVAL '38 days',
   CURRENT_TIMESTAMP - INTERVAL '35 days'),
  
  ('850e8400-e29b-41d4-a716-446655440007',
   '550e8400-e29b-41d4-a716-446655440004',
   '750e8400-e29b-41d4-a716-446655440007',
   8000,
   'Professional audio setup with sound engineer. All microphones, mixing, and recording equipment included.',
   'Accepted',
   CURRENT_TIMESTAMP - INTERVAL '38 days',
   CURRENT_TIMESTAMP - INTERVAL '35 days');

-- =====================================================
-- CLIENT 2: "Warner Bros Pictures" - 2 Projects
-- Demonstrates: Another client with multiple projects
-- =====================================================

-- Project 2.1: Action Film "Thunder Strike" (Very High Budget)
INSERT INTO projects (id, project_name, client_name, brief_description, physical_parameters, financial_parameters, timeline_deadline, project_status, created_at) VALUES
  ('650e8400-e29b-41d4-a716-446655440004',
   'Thunder Strike - Principal Photography',
   'Warner Bros Pictures',
   'High-octane action film with complex stunts and practical effects. Requires extensive equipment and set construction.',
   'Feature film, 120min. Multiple action set pieces, explosion sequences, vehicle stunts',
   200000,
   (CURRENT_DATE + INTERVAL '150 days')::date,
   'In Progress',
   CURRENT_TIMESTAMP - INTERVAL '20 days');

-- Assets for Thunder Strike
INSERT INTO assets (id, project_id, asset_name, specifications, timeline, status, assigned_supplier_id, created_at) VALUES
  ('750e8400-e29b-41d4-a716-446655440008', '650e8400-e29b-41d4-a716-446655440004',
   'IMAX Camera Package',
   'IMAX-certified camera system with large format sensors, specialized lenses',
   (CURRENT_DATE + INTERVAL '130 days')::date, 'Approved', '550e8400-e29b-41d4-a716-446655440001',
   CURRENT_TIMESTAMP - INTERVAL '18 days'),
  
  ('750e8400-e29b-41d4-a716-446655440009', '650e8400-e29b-41d4-a716-446655440004',
   'Action Set Construction',
   'Large-scale destructible sets for explosion sequences, reinforced structures',
   (CURRENT_DATE + INTERVAL '120 days')::date, 'In Production', '550e8400-e29b-41d4-a716-446655440002',
   CURRENT_TIMESTAMP - INTERVAL '16 days'),
  
  ('750e8400-e29b-41d4-a716-446655440010', '650e8400-e29b-41d4-a716-446655440004',
   'Stunt Rigging Equipment',
   'Wire rigs, safety harnesses, motion control systems for action sequences',
   (CURRENT_DATE + INTERVAL '125 days')::date, 'Approved', '550e8400-e29b-41d4-a716-446655440002',
   CURRENT_TIMESTAMP - INTERVAL '14 days');

-- Accepted Quotes for Thunder Strike
INSERT INTO quotes (id, supplier_id, asset_id, cost, notes_capacity, status, cost_breakdown, created_at, updated_at) VALUES
  ('850e8400-e29b-41d4-a716-446655440008',
   '550e8400-e29b-41d4-a716-446655440001',
   '750e8400-e29b-41d4-a716-446655440008',
   75000,
   'Premium IMAX-certified camera package. 16-week rental with full technical support and backup equipment.',
   'Accepted',
   '{"labor": 15000, "materials": 0, "equipment": 58000, "other": 2000}'::jsonb,
   CURRENT_TIMESTAMP - INTERVAL '17 days',
   CURRENT_TIMESTAMP - INTERVAL '15 days'),
  
  ('850e8400-e29b-41d4-a716-446655440009',
   '550e8400-e29b-41d4-a716-446655440002',
   '750e8400-e29b-41d4-a716-446655440009',
   62000,
   'Custom set construction with safety-certified destructible elements. All materials and labor included.',
   'Accepted',
   '{"labor": 30000, "materials": 28000, "equipment": 3000, "other": 1000}'::jsonb,
   CURRENT_TIMESTAMP - INTERVAL '15 days',
   CURRENT_TIMESTAMP - INTERVAL '13 days'),
  
  ('850e8400-e29b-41d4-a716-446655440010',
   '550e8400-e29b-41d4-a716-446655440002',
   '750e8400-e29b-41d4-a716-446655440010',
   35000,
   'Professional stunt rigging system with certified safety equipment and experienced riggers.',
   'Accepted',
   '{"labor": 18000, "materials": 5000, "equipment": 11000, "other": 1000}'::jsonb,
   CURRENT_TIMESTAMP - INTERVAL '13 days',
   CURRENT_TIMESTAMP - INTERVAL '11 days');

-- Project 2.2: Drama "The Last Letter" (Medium Budget)
INSERT INTO projects (id, project_name, client_name, brief_description, physical_parameters, financial_parameters, timeline_deadline, project_status, created_at) VALUES
  ('650e8400-e29b-41d4-a716-446655440005',
   'The Last Letter',
   'Warner Bros Pictures',
   'Period drama set in 1940s. Requires authentic props, costumes, and vintage camera aesthetic.',
   'Feature film, 105min. Multiple period-accurate interior sets, vintage vehicles',
   85000,
   (CURRENT_DATE + INTERVAL '180 days')::date,
   'New',
   CURRENT_TIMESTAMP - INTERVAL '5 days');

-- Assets for The Last Letter
INSERT INTO assets (id, project_id, asset_name, specifications, timeline, status, assigned_supplier_id, created_at) VALUES
  ('750e8400-e29b-41d4-a716-446655440011', '650e8400-e29b-41d4-a716-446655440005',
   'Vintage Camera Package',
   'Film cameras with vintage lenses for authentic period look, 35mm film stock',
   (CURRENT_DATE + INTERVAL '160 days')::date, 'Approved', '550e8400-e29b-41d4-a716-446655440001',
   CURRENT_TIMESTAMP - INTERVAL '3 days'),
  
  ('750e8400-e29b-41d4-a716-446655440012', '650e8400-e29b-41d4-a716-446655440005',
   '1940s Period Props Collection',
   'Authentic period furniture, decorations, telephones, radios, and household items',
   (CURRENT_DATE + INTERVAL '155 days')::date, 'Approved', '550e8400-e29b-41d4-a716-446655440005',
   CURRENT_TIMESTAMP - INTERVAL '2 days');

-- Accepted Quotes for The Last Letter
INSERT INTO quotes (id, supplier_id, asset_id, cost, notes_capacity, status, cost_breakdown, created_at, updated_at) VALUES
  ('850e8400-e29b-41d4-a716-446655440011',
   '550e8400-e29b-41d4-a716-446655440001',
   '750e8400-e29b-41d4-a716-446655440011',
   42000,
   'Complete vintage film camera package with period-accurate lenses. Includes film processing and scanning.',
   'Accepted',
   '{"labor": 8000, "materials": 12000, "equipment": 20000, "other": 2000}'::jsonb,
   CURRENT_TIMESTAMP - INTERVAL '2 days',
   CURRENT_TIMESTAMP - INTERVAL '1 days'),
  
  ('850e8400-e29b-41d4-a716-446655440012',
   '550e8400-e29b-41d4-a716-446655440005',
   '750e8400-e29b-41d4-a716-446655440012',
   28000,
   'Curated collection of authentic 1940s props and set dressing. All items vetted for historical accuracy.',
   'Accepted',
   '{"labor": 6000, "materials": 20000, "equipment": 1000, "other": 1000}'::jsonb,
   CURRENT_TIMESTAMP - INTERVAL '1 days',
   CURRENT_TIMESTAMP);

-- =====================================================
-- CLIENT 3: "Amazon Prime Video" - 1 Project
-- Demonstrates: Single project client
-- =====================================================

INSERT INTO projects (id, project_name, client_name, brief_description, physical_parameters, financial_parameters, timeline_deadline, project_status, created_at) VALUES
  ('650e8400-e29b-41d4-a716-446655440006',
   'Urban Tales - Pilot Episode',
   'Amazon Prime Video',
   'Modern drama series pilot. Contemporary urban setting with handheld camera aesthetic.',
   'Pilot episode, 50min. On-location shooting in major city, minimal sets',
   45000,
   (CURRENT_DATE + INTERVAL '60 days')::date,
   'Quoting',
   CURRENT_TIMESTAMP - INTERVAL '3 days');

-- Assets for Urban Tales
INSERT INTO assets (id, project_id, asset_name, specifications, timeline, status, assigned_supplier_id, created_at) VALUES
  ('750e8400-e29b-41d4-a716-446655440013', '650e8400-e29b-41d4-a716-446655440006',
   'Handheld Camera Rig',
   'Lightweight cinema camera with gimbal stabilization, wireless follow focus',
   (CURRENT_DATE + INTERVAL '50 days')::date, 'Approved', '550e8400-e29b-41d4-a716-446655440001',
   CURRENT_TIMESTAMP - INTERVAL '2 days'),
  
  ('750e8400-e29b-41d4-a716-446655440014', '650e8400-e29b-41d4-a716-446655440006',
   'Location Audio Kit',
   'Professional boom mics, wireless lavs, portable recorder with mixer',
   (CURRENT_DATE + INTERVAL '50 days')::date, 'Approved', '550e8400-e29b-41d4-a716-446655440004',
   CURRENT_TIMESTAMP - INTERVAL '2 days');

-- Accepted Quotes for Urban Tales
INSERT INTO quotes (id, supplier_id, asset_id, cost, notes_capacity, status, created_at, updated_at) VALUES
  ('850e8400-e29b-41d4-a716-446655440013',
   '550e8400-e29b-41d4-a716-446655440001',
   '750e8400-e29b-41d4-a716-446655440013',
   18000,
   'Complete handheld camera package optimized for documentary-style shooting. 6-week rental.',
   'Accepted',
   CURRENT_TIMESTAMP - INTERVAL '1 days',
   CURRENT_TIMESTAMP),
  
  ('850e8400-e29b-41d4-a716-446655440014',
   '550e8400-e29b-41d4-a716-446655440004',
   '750e8400-e29b-41d4-a716-446655440014',
   12000,
   'Professional location audio package with experienced sound recordist. All equipment and labor included.',
   'Accepted',
   CURRENT_TIMESTAMP - INTERVAL '1 days',
   CURRENT_TIMESTAMP);

-- =====================================================
-- ADDITIONAL DATA: Pending/Rejected Quotes
-- These should NOT appear in the budget breakdown
-- =====================================================

-- Some pending quotes (to show they're not counted in budget)
INSERT INTO quotes (id, supplier_id, asset_id, cost, notes_capacity, status, created_at) VALUES
  ('850e8400-e29b-41d4-a716-446655440101',
   '550e8400-e29b-41d4-a716-446655440002',
   '750e8400-e29b-41d4-a716-446655440003',
   25000,
   'Alternative quote for futuristic props - still pending client review.',
   'Pending',
   CURRENT_TIMESTAMP - INTERVAL '6 days'),
  
  ('850e8400-e29b-41d4-a716-446655440102',
   '550e8400-e29b-41d4-a716-446655440002',
   '750e8400-e29b-41d4-a716-446655440010',
   32000,
   'Alternative rigging solution - pending safety certification.',
   'Pending',
   CURRENT_TIMESTAMP - INTERVAL '12 days');

-- Some rejected quotes
INSERT INTO quotes (id, supplier_id, asset_id, cost, notes_capacity, status, created_at, updated_at) VALUES
  ('850e8400-e29b-41d4-a716-446655440201',
   '550e8400-e29b-41d4-a716-446655440003',
   '750e8400-e29b-41d4-a716-446655440001',
   55000,
   'Premium camera package - rejected due to budget constraints.',
   'Rejected',
   CURRENT_TIMESTAMP - INTERVAL '13 days',
   CURRENT_TIMESTAMP - INTERVAL '11 days');

-- =====================================================
-- SUMMARY OF SEEDED DATA
-- =====================================================
-- 
-- CLIENTS (3):
-- 1. Netflix Studios - 3 projects (Nebula Rising, Ocean Depths, Stand-Up Royale)
-- 2. Warner Bros Pictures - 2 projects (Thunder Strike, The Last Letter)
-- 3. Amazon Prime Video - 1 project (Urban Tales)
--
-- PROJECTS (6 total):
-- - Various budgets: $25k to $200k
-- - Various statuses: New, Quoting, In Progress, Completed
-- - Multiple assets per project
--
-- ASSETS (14 total):
-- - All with accepted quotes (some also have pending/rejected)
-- - Mix of equipment, sets, props, etc.
--
-- QUOTES (14 Accepted, 2 Pending, 1 Rejected):
-- - Accepted quotes total per project:
--   * Nebula Rising: $105,000 (88% of $120k budget)
--   * Ocean Depths: $43,000 (66% of $65k budget)
--   * Stand-Up Royale: $20,000 (80% of $25k budget)
--   * Thunder Strike: $172,000 (86% of $200k budget)
--   * The Last Letter: $70,000 (82% of $85k budget)
--   * Urban Tales: $30,000 (67% of $45k budget)
--
-- DEMO FEATURES:
-- ✅ Overview Block: Shows project name and client name
-- ✅ Client Projects Modal: 
--    - Click "Netflix Studios" → see 3 projects
--    - Click "Warner Bros Pictures" → see 2 projects
--    - Click "Amazon Prime Video" → see 1 project
-- ✅ Budget Bar: Live data showing spent vs total
-- ✅ Budget Assets Modal: Click budget bar to see breakdown
--    - Lists all assets with accepted quotes
--    - Shows costs, suppliers, dates
--    - Some have detailed cost breakdowns
--    - Total matches budget bar "Spent" value
-- =====================================================

-- Verification Queries (run these to test):
-- 
-- -- See all clients and their project counts:
-- SELECT client_name, COUNT(*) as project_count 
-- FROM projects 
-- GROUP BY client_name 
-- ORDER BY project_count DESC;
--
-- -- See budget breakdown for "Nebula Rising":
-- SELECT 
--   a.asset_name,
--   q.cost,
--   s.supplier_name,
--   q.status
-- FROM assets a
-- JOIN quotes q ON q.asset_id = a.id
-- JOIN suppliers s ON s.id = q.supplier_id
-- WHERE a.project_id = '650e8400-e29b-41d4-a716-446655440001'
--   AND q.status = 'Accepted'
-- ORDER BY a.created_at;
--
-- -- See total spending per project:
-- SELECT * FROM project_budget_summary ORDER BY total_spent DESC;



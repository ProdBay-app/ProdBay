-- ProdBay Comprehensive Seed Data - 2 Projects
-- Showcases all major features with realistic data

-- Clean existing data
DELETE FROM quotes;
DELETE FROM assets;
DELETE FROM projects;
DELETE FROM suppliers;

-- Insert Suppliers with contact persons
INSERT INTO suppliers (supplier_name, contact_email, service_categories, contact_persons) VALUES
('Elite Event Productions', 'contact@eliteevents.example.com', 
 ARRAY['Staging', 'Audio', 'Lighting'], 
 '[{"name": "Alex Martinez", "email": "alex@eliteevents.example.com", "role": "Event Director", "phone": "+1-555-0501", "is_primary": true}]'::jsonb),
('Premier Print Solutions', 'contact@premierprint.example.com', 
 ARRAY['Printing', 'Graphics', 'Banners'], 
 '[{"name": "Sarah Johnson", "email": "sarah@premierprint.example.com", "role": "Sales Manager", "phone": "+1-555-0101", "is_primary": true}]'::jsonb),
('Gourmet Catering Plus', 'orders@gourmetcatering.example.com', 
 ARRAY['Catering', 'Food', 'Beverages'], 
 '[{"name": "Maria Garcia", "email": "maria@gourmetcatering.example.com", "role": "Catering Manager", "phone": "+1-555-0601", "is_primary": true}]'::jsonb),
('Professional Audio Systems', 'sales@proaudio.example.com', 
 ARRAY['Audio', 'Lighting', 'Staging'], 
 '[{"name": "David Chen", "email": "david@proaudio.example.com", "role": "Technical Director", "phone": "+1-555-0301", "is_primary": true}]'::jsonb),
('Dynamic Lighting Co', 'contact@dynamiclighting.example.com', 
 ARRAY['Lighting', 'Audio', 'Staging'], 
 '[{"name": "Rachel Brown", "email": "rachel@dynamiclighting.example.com", "role": "Sales Lead", "phone": "+1-555-0401", "is_primary": true}]'::jsonb),
('Complete Event Solutions', 'contact@completeevents.example.com', 
 ARRAY['Staging', 'Audio', 'Lighting', 'Catering', 'Security'], 
 '[{"name": "Michael Torres", "email": "michael@completeevents.example.com", "role": "Project Manager", "phone": "+1-555-0701", "is_primary": true}]'::jsonb);

-- PROJECT 1: TechCorp Annual Conference (In Progress, with AI allocation)
INSERT INTO projects (
  project_name, client_name, brief_description, physical_parameters, 
  financial_parameters, timeline_deadline, project_status, 
  use_ai_allocation, ai_allocation_enabled_at, ai_allocation_completed_at
) VALUES (
  'TechCorp Annual Conference 2024',
  'TechCorp Industries',
  'Annual technology conference for 500 attendees featuring keynote speakers, breakout sessions, and networking events. Requires professional AV, stage setup, catering, and printed materials.',
  'Convention center, 500 capacity, 3-day event, multiple breakout rooms, main auditorium, networking areas',
  150000.00,
  '2024-06-15',
  'In Progress',
  true,
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '8 days'
);

-- PROJECT 2: Eco Fashion Launch (Quoting stage, multiple quotes)
INSERT INTO projects (
  project_name, client_name, brief_description, physical_parameters,
  financial_parameters, timeline_deadline, project_status,
  use_ai_allocation, ai_allocation_enabled_at, ai_allocation_completed_at
) VALUES (
  'Eco-Friendly Apparel Launch',
  'Green Fashion Co',
  'Sustainable fashion brand launch with runway show, sustainability panel discussion, and media coverage. Emphasizes eco-friendly production and messaging.',
  'Warehouse venue, 400 capacity, evening event, runway setup, panel discussion area, media zone',
  120000.00,
  '2024-07-20',
  'Quoting',
  false,
  NULL,
  NULL
);

-- ASSETS for Project 1: TechCorp Conference
INSERT INTO assets (project_id, asset_name, specifications, timeline, status, assigned_supplier_id) VALUES
((SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024'),
 'Main Stage Setup',
 'Professional stage with LED backdrop, podium, confidence monitors, and full AV integration for keynote presentations. Requires 20ft wide x 12ft deep stage.',
 '2024-06-14',
 'Approved',
 (SELECT id FROM suppliers WHERE supplier_name = 'Elite Event Productions')),

((SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024'),
 'Breakout Room AV Package',
 'Audio-visual equipment for 5 breakout rooms: projectors, screens (10ft), wireless microphones, speakers, and technical support during event.',
 '2024-06-14',
 'In Production',
 (SELECT id FROM suppliers WHERE supplier_name = 'Professional Audio Systems')),

((SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024'),
 'Registration Materials',
 'Welcome packets, custom name badges with QR codes, branded lanyards, conference programs (32 pages), and tote bags for 500 attendees.',
 '2024-06-10',
 'Delivered',
 (SELECT id FROM suppliers WHERE supplier_name = 'Premier Print Solutions')),

((SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024'),
 'Networking Reception Catering',
 'Cocktail reception for 500 guests with premium appetizers, open bar (beer, wine, cocktails), and professional service staff for 3 hours.',
 '2024-06-15',
 'Quoting',
 NULL);

-- ASSETS for Project 2: Eco Fashion Launch
INSERT INTO assets (project_id, asset_name, specifications, timeline, status, assigned_supplier_id) VALUES
((SELECT id FROM projects WHERE project_name = 'Eco-Friendly Apparel Launch'),
 'Runway Setup with Lighting',
 'Professional 40ft runway with eco-friendly LED lighting system, sound system, seating for 400 guests. Sustainable materials preferred.',
 '2024-07-19',
 'Quoting',
 NULL),

((SELECT id FROM projects WHERE project_name = 'Eco-Friendly Apparel Launch'),
 'Sustainability Panel Area',
 'Panel discussion setup with seating for 100, wireless microphones (5), presentation screen (12ft), and recording equipment.',
 '2024-07-20',
 'Quoting',
 NULL),

((SELECT id FROM projects WHERE project_name = 'Eco-Friendly Apparel Launch'),
 'Event Branding & Signage',
 'Eco-friendly printed materials: entrance banners, directional signage, branded backdrops, programs on recycled paper (400 copies).',
 '2024-07-19',
 'Pending',
 NULL);

-- QUOTES with cost breakdown and comparison data
-- Project 1 Quotes
INSERT INTO quotes (supplier_id, asset_id, cost, cost_breakdown, notes_capacity, status, valid_until, response_time_hours) VALUES
-- Main Stage: Accepted quote
((SELECT id FROM suppliers WHERE supplier_name = 'Elite Event Productions'),
 (SELECT id FROM assets WHERE asset_name = 'Main Stage Setup'),
 8500.00,
 '{"labor": 3400.00, "materials": 2975.00, "equipment": 1700.00, "other": 425.00}'::jsonb,
 'Professional stage setup with full AV integration. Includes setup, operation, and breakdown. Experienced crew of 6.',
 'Accepted',
 '2024-06-20',
 24),

-- Main Stage: Competing quote (rejected)
((SELECT id FROM suppliers WHERE supplier_name = 'Complete Event Solutions'),
 (SELECT id FROM assets WHERE asset_name = 'Main Stage Setup'),
 9200.00,
 '{"labor": 3680.00, "materials": 3220.00, "equipment": 1840.00, "other": 460.00}'::jsonb,
 'Premium stage package with custom branding options and dedicated project manager.',
 'Rejected',
 '2024-06-19',
 36),

-- Breakout AV: Accepted quote
((SELECT id FROM suppliers WHERE supplier_name = 'Professional Audio Systems'),
 (SELECT id FROM assets WHERE asset_name = 'Breakout Room AV Package'),
 3200.00,
 '{"labor": 960.00, "materials": 320.00, "equipment": 1760.00, "other": 160.00}'::jsonb,
 'Complete AV for 5 rooms. Includes projectors, screens, microphones, and on-site technician.',
 'Accepted',
 '2024-06-20',
 18),

-- Registration Materials: Accepted quote
((SELECT id FROM suppliers WHERE supplier_name = 'Premier Print Solutions'),
 (SELECT id FROM assets WHERE asset_name = 'Registration Materials'),
 1200.00,
 '{"labor": 240.00, "materials": 840.00, "equipment": 60.00, "other": 60.00}'::jsonb,
 '500 complete registration packets with custom design. Fast turnaround, premium printing quality.',
 'Accepted',
 '2024-06-10',
 12),

-- Networking Reception: Multiple competing quotes (still deciding)
((SELECT id FROM suppliers WHERE supplier_name = 'Gourmet Catering Plus'),
 (SELECT id FROM assets WHERE asset_name = 'Networking Reception Catering'),
 4500.00,
 '{"labor": 2250.00, "materials": 1800.00, "equipment": 225.00, "other": 225.00}'::jsonb,
 'Premium cocktail reception with gourmet appetizers, full bar service, professional staff (8 people).',
 'Submitted',
 '2024-06-15',
 36),

((SELECT id FROM suppliers WHERE supplier_name = 'Complete Event Solutions'),
 (SELECT id FROM assets WHERE asset_name = 'Networking Reception Catering'),
 5200.00,
 '{"labor": 2600.00, "materials": 2080.00, "equipment": 260.00, "other": 260.00}'::jsonb,
 'Luxury catering package with premium menu, extensive bar, dedicated event coordinator.',
 'Submitted',
 '2024-06-14',
 48);

-- Project 2 Quotes (multiple suppliers competing)
INSERT INTO quotes (supplier_id, asset_id, cost, cost_breakdown, notes_capacity, status, valid_until, response_time_hours) VALUES
-- Runway Setup: Three competing quotes
((SELECT id FROM suppliers WHERE supplier_name = 'Dynamic Lighting Co'),
 (SELECT id FROM assets WHERE asset_name = 'Runway Setup with Lighting'),
 6500.00,
 '{"labor": 1950.00, "materials": 1300.00, "equipment": 2925.00, "other": 325.00}'::jsonb,
 'Professional runway with eco-friendly LED lighting. Energy-efficient system, modern design.',
 'Submitted',
 '2024-07-25',
 24),

((SELECT id FROM suppliers WHERE supplier_name = 'Elite Event Productions'),
 (SELECT id FROM assets WHERE asset_name = 'Runway Setup with Lighting'),
 7200.00,
 '{"labor": 2160.00, "materials": 1440.00, "equipment": 3240.00, "other": 360.00}'::jsonb,
 'Premium runway production with advanced lighting and sound. Fashion show expertise.',
 'Submitted',
 '2024-07-24',
 18),

((SELECT id FROM suppliers WHERE supplier_name = 'Complete Event Solutions'),
 (SELECT id FROM assets WHERE asset_name = 'Runway Setup with Lighting'),
 7800.00,
 '{"labor": 2340.00, "materials": 1560.00, "equipment": 3510.00, "other": 390.00}'::jsonb,
 'All-inclusive runway package with premium lighting, sound, and full event coordination.',
 'Submitted',
 '2024-07-23',
 42),

-- Panel Area: Two competing quotes
((SELECT id FROM suppliers WHERE supplier_name = 'Professional Audio Systems'),
 (SELECT id FROM assets WHERE asset_name = 'Sustainability Panel Area'),
 2200.00,
 '{"labor": 660.00, "materials": 220.00, "equipment": 1210.00, "other": 110.00}'::jsonb,
 'Panel setup with professional microphones, presentation screen, recording. AV technician included.',
 'Submitted',
 '2024-07-25',
 12),

((SELECT id FROM suppliers WHERE supplier_name = 'Dynamic Lighting Co'),
 (SELECT id FROM assets WHERE asset_name = 'Sustainability Panel Area'),
 2800.00,
 '{"labor": 840.00, "materials": 280.00, "equipment": 1540.00, "other": 140.00}'::jsonb,
 'Enhanced panel setup with premium lighting, advanced AV, and live streaming capabilities.',
 'Submitted',
 '2024-07-24',
 24),

-- Branding: One quote received
((SELECT id FROM suppliers WHERE supplier_name = 'Premier Print Solutions'),
 (SELECT id FROM assets WHERE asset_name = 'Event Branding & Signage'),
 1800.00,
 '{"labor": 360.00, "materials": 1260.00, "equipment": 90.00, "other": 90.00}'::jsonb,
 'Eco-friendly printing on recycled materials. Sustainable inks, carbon-neutral production.',
 'Submitted',
 '2024-07-26',
 8);

-- AI Processing Logs (for Project 1 only - shows AI allocation feature)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_processing_logs') THEN
    INSERT INTO ai_processing_logs (project_id, processing_type, input_data, output_data, processing_time_ms, success, error_message) VALUES
    ((SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024'),
     'asset_creation',
     '{"project_brief": "Annual technology conference for 500 attendees", "requirements": ["main stage", "breakout rooms", "registration", "networking"]}'::jsonb,
     '{"assets_created": ["Main Stage Setup", "Breakout Room AV", "Registration Materials", "Networking Reception"], "confidence": 0.92}'::jsonb,
     1250,
     true,
     NULL),
    
    ((SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024'),
     'allocation',
     '{"assets": ["Main Stage Setup", "Breakout Room AV"], "suppliers": ["Elite Event Productions", "Professional Audio Systems"]}'::jsonb,
     '{"allocations": [{"asset": "Main Stage Setup", "supplier": "Elite Event Productions", "confidence": 0.88}, {"asset": "Breakout Room AV", "supplier": "Professional Audio Systems", "confidence": 0.91}]}'::jsonb,
     890,
     true,
     NULL);
  END IF;
END $$;

-- AI Allocations (for Project 1 only)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_allocations') THEN
    INSERT INTO ai_allocations (project_id, asset_id, supplier_id, ai_confidence_score, ai_reasoning, allocation_method) VALUES
    ((SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024'),
     (SELECT id FROM assets WHERE asset_name = 'Main Stage Setup'),
     (SELECT id FROM suppliers WHERE supplier_name = 'Elite Event Productions'),
     0.88,
     'Elite Event Productions has extensive experience with large-scale conference staging and AV integration. Strong match for technical requirements.',
     'ai'),
    
    ((SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024'),
     (SELECT id FROM assets WHERE asset_name = 'Breakout Room AV Package'),
     (SELECT id FROM suppliers WHERE supplier_name = 'Professional Audio Systems'),
     0.91,
     'Professional Audio Systems specializes in multi-room AV setups and has excellent reviews for technical support during events.',
     'ai');
  END IF;
END $$;

-- Summary
SELECT 
  'Seed Data Summary' as summary,
  (SELECT COUNT(*) FROM projects) as projects,
  (SELECT COUNT(*) FROM assets) as assets,
  (SELECT COUNT(*) FROM suppliers) as suppliers,
  (SELECT COUNT(*) FROM quotes) as quotes;


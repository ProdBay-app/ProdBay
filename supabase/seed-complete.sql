-- ============================================
-- ProdBay Complete Seed Data
-- ============================================
-- Comprehensive seed data with 10 projects
-- Showcases all application features

-- ============================================
-- 1. CLEAN EXISTING DATA
-- ============================================

DELETE FROM ai_allocations;
DELETE FROM ai_processing_logs;
DELETE FROM quotes;
DELETE FROM assets;
DELETE FROM projects;
DELETE FROM suppliers;

-- ============================================
-- 2. SEED SUPPLIERS (10 suppliers with contact persons)
-- ============================================

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
 '[{"name": "Michael Torres", "email": "michael@completeevents.example.com", "role": "Project Manager", "phone": "+1-555-0701", "is_primary": true}]'::jsonb),

('Fresh Bites Catering', 'info@freshbites.example.com', 
 ARRAY['Food', 'Catering', 'Beverages'], 
 '[{"name": "Emma Wilson", "email": "emma@freshbites.example.com", "role": "Operations Manager", "phone": "+1-555-0801", "is_primary": true}]'::jsonb),

('Grand Stage Solutions', 'info@grandstage.example.com', 
 ARRAY['Staging', 'Lighting', 'Audio'], 
 '[{"name": "James Anderson", "email": "james@grandstage.example.com", "role": "Stage Director", "phone": "+1-555-0901", "is_primary": true}]'::jsonb),

('Banner Masters', 'sales@bannermasters.example.com', 
 ARRAY['Banners', 'Printing', 'Graphics'], 
 '[{"name": "Lisa Wang", "email": "lisa@bannermasters.example.com", "role": "Production Manager", "phone": "+1-555-1001", "is_primary": true}]'::jsonb),

('Mega Event Productions', 'sales@megaevents.example.com', 
 ARRAY['Staging', 'Audio', 'Lighting', 'Catering', 'Transport', 'Security'], 
 '[{"name": "Robert Kim", "email": "robert@megaevents.example.com", "role": "Executive Producer", "phone": "+1-555-1101", "is_primary": true}]'::jsonb);

-- ============================================
-- 3. SEED PROJECTS (10 projects with varied statuses)
-- ============================================

-- PROJECT 1: TechCorp Conference (In Progress, AI enabled)
INSERT INTO projects (project_name, client_name, brief_description, physical_parameters, financial_parameters, timeline_deadline, project_status, use_ai_allocation, ai_allocation_enabled_at, ai_allocation_completed_at) VALUES
('TechCorp Annual Conference 2024', 'TechCorp Industries', 'Annual technology conference for 500 attendees with keynote speakers and breakout sessions', 'Convention center, 500 capacity, 3-day event', 150000.00, '2024-06-15', 'In Progress', true, NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days');

-- PROJECT 2: Eco Fashion Launch (Quoting)
INSERT INTO projects (project_name, client_name, brief_description, physical_parameters, financial_parameters, timeline_deadline, project_status, use_ai_allocation) VALUES
('Eco-Friendly Apparel Launch', 'Green Fashion Co', 'Sustainable fashion brand launch with runway show', 'Warehouse venue, 400 capacity', 120000.00, '2024-07-20', 'Quoting', false);

-- PROJECT 3: Luxury Wedding (New)
INSERT INTO projects (project_name, client_name, brief_description, physical_parameters, financial_parameters, timeline_deadline, project_status, use_ai_allocation) VALUES
('Johnson-Williams Wedding', 'Sarah Johnson & Michael Williams', 'Elegant wedding for 200 guests with ceremony and reception', 'Historic mansion, 200 capacity', 85000.00, '2024-08-15', 'New', false);

-- PROJECT 4: Product Launch (In Progress)
INSERT INTO projects (project_name, client_name, brief_description, physical_parameters, financial_parameters, timeline_deadline, project_status, use_ai_allocation) VALUES
('Luxury Watch Launch', 'Prestige Timepieces', 'Exclusive product launch for new luxury watch collection', 'Museum gallery, 150 capacity', 75000.00, '2024-09-10', 'In Progress', false);

-- PROJECT 5: Trade Show (Completed)
INSERT INTO projects (project_name, client_name, brief_description, physical_parameters, financial_parameters, timeline_deadline, project_status, use_ai_allocation, ai_allocation_enabled_at, ai_allocation_completed_at) VALUES
('HealthTech Innovation Expo', 'Medical Innovation Society', 'Healthcare technology exhibition with 100 exhibitors', 'Convention center, 2000 capacity, 3-day event', 200000.00, '2024-05-12', 'Completed', true, NOW() - INTERVAL '90 days', NOW() - INTERVAL '88 days');

-- PROJECT 6: Music Festival (Cancelled)
INSERT INTO projects (project_name, client_name, brief_description, physical_parameters, financial_parameters, timeline_deadline, project_status, use_ai_allocation) VALUES
('Summer Music Festival', 'SoundWave Productions', 'Outdoor music festival with multiple stages', 'Outdoor venue, 5000 capacity, 3-day event', 500000.00, '2024-08-25', 'Cancelled', false);

-- PROJECT 7: Corporate Gala (Quoting, AI enabled)
INSERT INTO projects (project_name, client_name, brief_description, physical_parameters, financial_parameters, timeline_deadline, project_status, use_ai_allocation, ai_allocation_enabled_at) VALUES
('Fortune 500 Annual Gala', 'Global Corp Industries', 'Corporate gala dinner with awards ceremony', 'Grand hotel ballroom, 300 capacity', 110000.00, '2024-10-15', 'Quoting', true, NOW() - INTERVAL '2 days');

-- PROJECT 8: Art Exhibition (In Progress)
INSERT INTO projects (project_name, client_name, brief_description, physical_parameters, financial_parameters, timeline_deadline, project_status, use_ai_allocation) VALUES
('Contemporary Art Fair', 'Creative Arts Foundation', 'Art and design fair with local artists', 'Art gallery, 500 capacity, 2-day event', 45000.00, '2024-11-08', 'In Progress', false);

-- PROJECT 9: Startup Pitch (Completed, AI enabled)
INSERT INTO projects (project_name, client_name, brief_description, physical_parameters, financial_parameters, timeline_deadline, project_status, use_ai_allocation, ai_allocation_enabled_at, ai_allocation_completed_at) VALUES
('Startup Pitch Competition', 'Innovation Hub', 'Pitch competition with 50 startups and investor panel', 'Co-working space, 200 capacity', 25000.00, '2024-04-28', 'Completed', true, NOW() - INTERVAL '120 days', NOW() - INTERVAL '118 days');

-- PROJECT 10: Marketing Summit (Quoting)
INSERT INTO projects (project_name, client_name, brief_description, physical_parameters, financial_parameters, timeline_deadline, project_status, use_ai_allocation) VALUES
('Global Marketing Summit', 'Marketing Masters Inc', 'International marketing conference with 300 delegates', 'Hotel ballroom, 300 capacity, 2-day event', 95000.00, '2024-12-15', 'Quoting', false);

-- ============================================
-- 4. SEED ASSETS (23 assets across all projects)
-- ============================================

-- Project 1 Assets
INSERT INTO assets (project_id, asset_name, specifications, timeline, status, assigned_supplier_id) VALUES
((SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024'), 'Main Stage Setup', 'Professional stage with LED backdrop and AV integration', '2024-06-14', 'Approved', (SELECT id FROM suppliers WHERE supplier_name = 'Elite Event Productions')),
((SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024'), 'Breakout Room AV', 'AV equipment for 5 breakout rooms', '2024-06-14', 'In Production', (SELECT id FROM suppliers WHERE supplier_name = 'Professional Audio Systems')),
((SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024'), 'Registration Materials', 'Name badges, lanyards, programs for 500', '2024-06-10', 'Delivered', (SELECT id FROM suppliers WHERE supplier_name = 'Premier Print Solutions'));

-- Project 2 Assets
INSERT INTO assets (project_id, asset_name, specifications, timeline, status) VALUES
((SELECT id FROM projects WHERE project_name = 'Eco-Friendly Apparel Launch'), 'Runway Setup', '40ft runway with eco-friendly LED lighting', '2024-07-19', 'Quoting'),
((SELECT id FROM projects WHERE project_name = 'Eco-Friendly Apparel Launch'), 'Panel Discussion Area', 'Panel setup for 100 with microphones', '2024-07-20', 'Quoting');

-- Project 3 Assets
INSERT INTO assets (project_id, asset_name, specifications, timeline, status) VALUES
((SELECT id FROM projects WHERE project_name = 'Johnson-Williams Wedding'), 'Ceremony Setup', 'Garden ceremony with floral arch', '2024-08-15', 'Pending'),
((SELECT id FROM projects WHERE project_name = 'Johnson-Williams Wedding'), 'Reception Setup', 'Reception hall with dance floor and lighting', '2024-08-15', 'Pending');

-- Project 4 Assets
INSERT INTO assets (project_id, asset_name, specifications, timeline, status, assigned_supplier_id) VALUES
((SELECT id FROM projects WHERE project_name = 'Luxury Watch Launch'), 'Display Cases', 'Premium display cases with security lighting', '2024-09-09', 'Quoting', NULL),
((SELECT id FROM projects WHERE project_name = 'Luxury Watch Launch'), 'VIP Reception', 'Exclusive reception with premium catering', '2024-09-10', 'Approved', (SELECT id FROM suppliers WHERE supplier_name = 'Gourmet Catering Plus'));

-- Project 5 Assets
INSERT INTO assets (project_id, asset_name, specifications, timeline, status, assigned_supplier_id) VALUES
((SELECT id FROM projects WHERE project_name = 'HealthTech Innovation Expo'), 'Exhibition Hall Setup', '100 booth spaces with power and lighting', '2024-05-11', 'Delivered', (SELECT id FROM suppliers WHERE supplier_name = 'Mega Event Productions')),
((SELECT id FROM projects WHERE project_name = 'HealthTech Innovation Expo'), 'Conference Room AV', 'AV for 5 conference rooms', '2024-05-11', 'Delivered', (SELECT id FROM suppliers WHERE supplier_name = 'Professional Audio Systems'));

-- Project 6 Assets
INSERT INTO assets (project_id, asset_name, specifications, timeline, status) VALUES
((SELECT id FROM projects WHERE project_name = 'Summer Music Festival'), 'Main Stage Production', 'Large outdoor stage with full production', '2024-08-24', 'Pending'),
((SELECT id FROM projects WHERE project_name = 'Summer Music Festival'), 'Food & Beverage', 'Multiple food vendors and bars', '2024-08-25', 'Pending');

-- Project 7 Assets
INSERT INTO assets (project_id, asset_name, specifications, timeline, status) VALUES
((SELECT id FROM projects WHERE project_name = 'Fortune 500 Annual Gala'), 'Awards Stage', 'Stage with backdrop and podium', '2024-10-14', 'Quoting'),
((SELECT id FROM projects WHERE project_name = 'Fortune 500 Annual Gala'), 'Dinner Service', 'Formal dinner for 300', '2024-10-15', 'Quoting');

-- Project 8 Assets
INSERT INTO assets (project_id, asset_name, specifications, timeline, status, assigned_supplier_id) VALUES
((SELECT id FROM projects WHERE project_name = 'Contemporary Art Fair'), 'Gallery Lighting', 'Professional gallery lighting for artwork', '2024-11-07', 'Approved', (SELECT id FROM suppliers WHERE supplier_name = 'Dynamic Lighting Co')),
((SELECT id FROM projects WHERE project_name = 'Contemporary Art Fair'), 'Event Signage', 'Directional and artwork labels', '2024-11-06', 'In Production', (SELECT id FROM suppliers WHERE supplier_name = 'Premier Print Solutions'));

-- Project 9 Assets
INSERT INTO assets (project_id, asset_name, specifications, timeline, status, assigned_supplier_id) VALUES
((SELECT id FROM projects WHERE project_name = 'Startup Pitch Competition'), 'Presentation Stage', 'Compact stage with projection', '2024-04-27', 'Delivered', (SELECT id FROM suppliers WHERE supplier_name = 'Grand Stage Solutions')),
((SELECT id FROM projects WHERE project_name = 'Startup Pitch Competition'), 'Networking Lounge', 'Lounge setup with refreshments', '2024-04-28', 'Delivered', (SELECT id FROM suppliers WHERE supplier_name = 'Fresh Bites Catering'));

-- Project 10 Assets
INSERT INTO assets (project_id, asset_name, specifications, timeline, status) VALUES
((SELECT id FROM projects WHERE project_name = 'Global Marketing Summit'), 'Main Presentation Stage', 'Stage with LED backdrop', '2024-12-14', 'Quoting'),
((SELECT id FROM projects WHERE project_name = 'Global Marketing Summit'), 'Exhibition Booths', '20 exhibition booths with power', '2024-12-14', 'Quoting'),
((SELECT id FROM projects WHERE project_name = 'Global Marketing Summit'), 'Gala Dinner', 'Dinner for 300 with awards', '2024-12-15', 'Quoting');

-- ============================================
-- 5. SEED QUOTES (30+ quotes with cost breakdowns)
-- ============================================

-- Project 1 Quotes
INSERT INTO quotes (supplier_id, asset_id, cost, cost_breakdown, notes_capacity, status, valid_until, response_time_hours) VALUES
((SELECT id FROM suppliers WHERE supplier_name = 'Elite Event Productions'), (SELECT id FROM assets WHERE asset_name = 'Main Stage Setup'), 8500.00, '{"labor": 3400, "materials": 2975, "equipment": 1700, "other": 425}'::jsonb, 'Professional stage with full AV integration', 'Accepted', '2024-06-20', 24),
((SELECT id FROM suppliers WHERE supplier_name = 'Professional Audio Systems'), (SELECT id FROM assets WHERE asset_name = 'Breakout Room AV'), 3200.00, '{"labor": 960, "materials": 320, "equipment": 1760, "other": 160}'::jsonb, 'Complete AV for 5 rooms with technician', 'Accepted', '2024-06-20', 18),
((SELECT id FROM suppliers WHERE supplier_name = 'Premier Print Solutions'), (SELECT id FROM assets WHERE asset_name = 'Registration Materials'), 1200.00, '{"labor": 240, "materials": 840, "equipment": 60, "other": 60}'::jsonb, '500 registration packets with custom design', 'Accepted', '2024-06-10', 12);

-- Project 2 Quotes (competing quotes)
INSERT INTO quotes (supplier_id, asset_id, cost, cost_breakdown, notes_capacity, status, valid_until, response_time_hours) VALUES
((SELECT id FROM suppliers WHERE supplier_name = 'Dynamic Lighting Co'), (SELECT id FROM assets WHERE asset_name = 'Runway Setup' AND project_id = (SELECT id FROM projects WHERE project_name = 'Eco-Friendly Apparel Launch')), 6500.00, '{"labor": 1950, "materials": 1300, "equipment": 2925, "other": 325}'::jsonb, 'Eco-friendly LED lighting system', 'Submitted', '2024-07-25', 24),
((SELECT id FROM suppliers WHERE supplier_name = 'Elite Event Productions'), (SELECT id FROM assets WHERE asset_name = 'Runway Setup' AND project_id = (SELECT id FROM projects WHERE project_name = 'Eco-Friendly Apparel Launch')), 7200.00, '{"labor": 2160, "materials": 1440, "equipment": 3240, "other": 360}'::jsonb, 'Premium runway with fashion expertise', 'Submitted', '2024-07-24', 18),
((SELECT id FROM suppliers WHERE supplier_name = 'Professional Audio Systems'), (SELECT id FROM assets WHERE asset_name = 'Panel Discussion Area'), 2200.00, '{"labor": 660, "materials": 220, "equipment": 1210, "other": 110}'::jsonb, 'Panel setup with recording equipment', 'Submitted', '2024-07-25', 12);

-- Project 4 Quotes
INSERT INTO quotes (supplier_id, asset_id, cost, cost_breakdown, notes_capacity, status, valid_until, response_time_hours) VALUES
((SELECT id FROM suppliers WHERE supplier_name = 'Gourmet Catering Plus'), (SELECT id FROM assets WHERE asset_name = 'VIP Reception'), 5500.00, '{"labor": 2750, "materials": 2200, "equipment": 275, "other": 275}'::jsonb, 'Premium VIP catering with champagne service', 'Accepted', '2024-09-12', 30);

-- Project 5 Quotes
INSERT INTO quotes (supplier_id, asset_id, cost, cost_breakdown, notes_capacity, status, valid_until, response_time_hours) VALUES
((SELECT id FROM suppliers WHERE supplier_name = 'Mega Event Productions'), (SELECT id FROM assets WHERE asset_name = 'Exhibition Hall Setup'), 25000.00, '{"labor": 10000, "materials": 7500, "equipment": 6250, "other": 1250}'::jsonb, 'Complete exhibition hall with 100 booths', 'Accepted', '2024-05-15', 24),
((SELECT id FROM suppliers WHERE supplier_name = 'Professional Audio Systems'), (SELECT id FROM assets WHERE asset_name = 'Conference Room AV' AND project_id = (SELECT id FROM projects WHERE project_name = 'HealthTech Innovation Expo')), 8500.00, '{"labor": 2550, "materials": 850, "equipment": 4675, "other": 425}'::jsonb, 'AV equipment with technician support', 'Accepted', '2024-05-15', 18);

-- Project 7 Quotes (competing quotes)
INSERT INTO quotes (supplier_id, asset_id, cost, cost_breakdown, notes_capacity, status, valid_until, response_time_hours) VALUES
((SELECT id FROM suppliers WHERE supplier_name = 'Elite Event Productions'), (SELECT id FROM assets WHERE asset_name = 'Awards Stage'), 6800.00, '{"labor": 2720, "materials": 2380, "equipment": 1360, "other": 340}'::jsonb, 'Professional awards ceremony stage', 'Submitted', '2024-10-18', 20),
((SELECT id FROM suppliers WHERE supplier_name = 'Gourmet Catering Plus'), (SELECT id FROM assets WHERE asset_name = 'Dinner Service'), 9500.00, '{"labor": 4750, "materials": 3800, "equipment": 475, "other": 475}'::jsonb, 'Premium gala dinner service', 'Submitted', '2024-10-18', 28),
((SELECT id FROM suppliers WHERE supplier_name = 'Fresh Bites Catering'), (SELECT id FROM assets WHERE asset_name = 'Dinner Service'), 8200.00, '{"labor": 4100, "materials": 3280, "equipment": 410, "other": 410}'::jsonb, 'Elegant dinner with local sourcing', 'Submitted', '2024-10-17', 16);

-- Project 8 Quotes
INSERT INTO quotes (supplier_id, asset_id, cost, cost_breakdown, notes_capacity, status, valid_until, response_time_hours) VALUES
((SELECT id FROM suppliers WHERE supplier_name = 'Dynamic Lighting Co'), (SELECT id FROM assets WHERE asset_name = 'Gallery Lighting'), 3400.00, '{"labor": 1020, "materials": 680, "equipment": 1530, "other": 170}'::jsonb, 'Professional gallery lighting system', 'Accepted', '2024-11-10', 14),
((SELECT id FROM suppliers WHERE supplier_name = 'Premier Print Solutions'), (SELECT id FROM assets WHERE asset_name = 'Event Signage'), 850.00, '{"labor": 170, "materials": 595, "equipment": 42.5, "other": 42.5}'::jsonb, 'Custom signage and labels', 'Accepted', '2024-11-08', 8);

-- Project 9 Quotes
INSERT INTO quotes (supplier_id, asset_id, cost, cost_breakdown, notes_capacity, status, valid_until, response_time_hours) VALUES
((SELECT id FROM suppliers WHERE supplier_name = 'Grand Stage Solutions'), (SELECT id FROM assets WHERE asset_name = 'Presentation Stage' AND project_id = (SELECT id FROM projects WHERE project_name = 'Startup Pitch Competition')), 1800.00, '{"labor": 720, "materials": 630, "equipment": 360, "other": 90}'::jsonb, 'Stage with projection screen', 'Accepted', '2024-04-25', 6),
((SELECT id FROM suppliers WHERE supplier_name = 'Fresh Bites Catering'), (SELECT id FROM assets WHERE asset_name = 'Networking Lounge'), 950.00, '{"labor": 475, "materials": 380, "equipment": 47.5, "other": 47.5}'::jsonb, 'Light refreshments and coffee', 'Accepted', '2024-04-26', 4);

-- Project 10 Quotes (multiple competing quotes)
INSERT INTO quotes (supplier_id, asset_id, cost, cost_breakdown, notes_capacity, status, valid_until, response_time_hours) VALUES
((SELECT id FROM suppliers WHERE supplier_name = 'Elite Event Productions'), (SELECT id FROM assets WHERE asset_name = 'Main Presentation Stage' AND project_id = (SELECT id FROM projects WHERE project_name = 'Global Marketing Summit')), 10500.00, '{"labor": 4200, "materials": 3675, "equipment": 2100, "other": 525}'::jsonb, 'Professional stage with full AV', 'Submitted', '2024-12-18', 18),
((SELECT id FROM suppliers WHERE supplier_name = 'Grand Stage Solutions'), (SELECT id FROM assets WHERE asset_name = 'Main Presentation Stage' AND project_id = (SELECT id FROM projects WHERE project_name = 'Global Marketing Summit')), 9800.00, '{"labor": 3920, "materials": 3430, "equipment": 1960, "other": 490}'::jsonb, 'Cost-effective stage solution', 'Submitted', '2024-12-19', 12),
((SELECT id FROM suppliers WHERE supplier_name = 'Banner Masters'), (SELECT id FROM assets WHERE asset_name = 'Exhibition Booths'), 16500.00, '{"labor": 5775, "materials": 8250, "equipment": 1650, "other": 825}'::jsonb, 'Premium exhibition booths', 'Submitted', '2024-12-17', 42),
((SELECT id FROM suppliers WHERE supplier_name = 'Gourmet Catering Plus'), (SELECT id FROM assets WHERE asset_name = 'Gala Dinner'), 8500.00, '{"labor": 4250, "materials": 3400, "equipment": 425, "other": 425}'::jsonb, 'Elegant dinner service', 'Submitted', '2024-12-18', 36),
((SELECT id FROM suppliers WHERE supplier_name = 'Fresh Bites Catering'), (SELECT id FROM assets WHERE asset_name = 'Gala Dinner'), 7200.00, '{"labor": 3600, "materials": 2880, "equipment": 360, "other": 360}'::jsonb, 'Quality dinner with local ingredients', 'Submitted', '2024-12-16', 24);

-- ============================================
-- 6. SEED AI PROCESSING LOGS
-- ============================================

INSERT INTO ai_processing_logs (project_id, processing_type, input_data, output_data, processing_time_ms, success) VALUES
((SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024'), 'asset_creation', '{"brief": "tech conference"}'::jsonb, '{"assets": 3}'::jsonb, 1250, true),
((SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024'), 'allocation', '{"method": "ai"}'::jsonb, '{"allocated": 2}'::jsonb, 890, true),
((SELECT id FROM projects WHERE project_name = 'HealthTech Innovation Expo'), 'asset_creation', '{"brief": "health expo"}'::jsonb, '{"assets": 2}'::jsonb, 1450, true),
((SELECT id FROM projects WHERE project_name = 'HealthTech Innovation Expo'), 'allocation', '{"method": "ai"}'::jsonb, '{"allocated": 2}'::jsonb, 1120, true),
((SELECT id FROM projects WHERE project_name = 'Startup Pitch Competition'), 'asset_creation', '{"brief": "pitch event"}'::jsonb, '{"assets": 2}'::jsonb, 980, true),
((SELECT id FROM projects WHERE project_name = 'Startup Pitch Competition'), 'allocation', '{"method": "ai"}'::jsonb, '{"allocated": 2}'::jsonb, 720, true);

-- ============================================
-- 7. SEED AI ALLOCATIONS
-- ============================================

INSERT INTO ai_allocations (project_id, asset_id, supplier_id, ai_confidence_score, ai_reasoning, allocation_method) VALUES
((SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024'), (SELECT id FROM assets WHERE asset_name = 'Main Stage Setup'), (SELECT id FROM suppliers WHERE supplier_name = 'Elite Event Productions'), 0.88, 'Best match for conference staging', 'ai'),
((SELECT id FROM projects WHERE project_name = 'TechCorp Annual Conference 2024'), (SELECT id FROM assets WHERE asset_name = 'Breakout Room AV'), (SELECT id FROM suppliers WHERE supplier_name = 'Professional Audio Systems'), 0.91, 'Specialized in multi-room AV', 'ai'),
((SELECT id FROM projects WHERE project_name = 'HealthTech Innovation Expo'), (SELECT id FROM assets WHERE asset_name = 'Exhibition Hall Setup'), (SELECT id FROM suppliers WHERE supplier_name = 'Mega Event Productions'), 0.95, 'Large scale event expertise', 'ai'),
((SELECT id FROM projects WHERE project_name = 'HealthTech Innovation Expo'), (SELECT id FROM assets WHERE asset_name = 'Conference Room AV' AND project_id = (SELECT id FROM projects WHERE project_name = 'HealthTech Innovation Expo')), (SELECT id FROM suppliers WHERE supplier_name = 'Professional Audio Systems'), 0.89, 'Reliable conference AV', 'ai'),
((SELECT id FROM projects WHERE project_name = 'Startup Pitch Competition'), (SELECT id FROM assets WHERE asset_name = 'Presentation Stage' AND project_id = (SELECT id FROM projects WHERE project_name = 'Startup Pitch Competition')), (SELECT id FROM suppliers WHERE supplier_name = 'Grand Stage Solutions'), 0.93, 'Perfect for pitch presentations', 'ai'),
((SELECT id FROM projects WHERE project_name = 'Startup Pitch Competition'), (SELECT id FROM assets WHERE asset_name = 'Networking Lounge'), (SELECT id FROM suppliers WHERE supplier_name = 'Fresh Bites Catering'), 0.87, 'Excellent for networking events', 'ai');

-- ============================================
-- 8. SUMMARY
-- ============================================

SELECT 
  'Seed Complete!' as status,
  (SELECT COUNT(*) FROM projects) as projects,
  (SELECT COUNT(*) FROM assets) as assets,
  (SELECT COUNT(*) FROM suppliers) as suppliers,
  (SELECT COUNT(*) FROM quotes) as quotes,
  (SELECT COUNT(*) FROM ai_allocations) as ai_allocations,
  (SELECT COUNT(*) FROM ai_processing_logs) as ai_logs;


/*
  # Comprehensive Seed Data for Action Items and Project Milestones
  
  This seed file populates:
  - Project milestones with realistic timeline checkpoints
  - Action items for producers and suppliers at various stages
  - Mix of pending, in_progress, and completed statuses
  - Proper linking to existing projects, assets, and quotes
  
  Run this AFTER your main seed data (seed.sql or seed-dev.js) to ensure
  projects, assets, and quotes exist.
*/

-- ============================================================================
-- HELPER: Get IDs from existing data
-- ============================================================================

DO $$
DECLARE
  v_project_ids UUID[];
  v_asset_ids UUID[];
  v_quote_ids UUID[];
  v_supplier_ids UUID[];
  v_project_id UUID;
  v_asset_id UUID;
  v_quote_id UUID;
  v_milestone_id UUID;
  v_action_id UUID;
BEGIN
  
  -- Get existing project IDs
  SELECT ARRAY_AGG(id) INTO v_project_ids FROM projects LIMIT 10;
  
  -- Get existing asset IDs
  SELECT ARRAY_AGG(id) INTO v_asset_ids FROM assets LIMIT 20;
  
  -- Get existing quote IDs
  SELECT ARRAY_AGG(id) INTO v_quote_ids FROM quotes LIMIT 20;
  
  -- Get existing supplier IDs
  SELECT ARRAY_AGG(id) INTO v_supplier_ids FROM suppliers LIMIT 10;
  
  RAISE NOTICE 'Found % projects, % assets, % quotes, % suppliers', 
    COALESCE(array_length(v_project_ids, 1), 0),
    COALESCE(array_length(v_asset_ids, 1), 0),
    COALESCE(array_length(v_quote_ids, 1), 0),
    COALESCE(array_length(v_supplier_ids, 1), 0);
  
  -- Exit if no data exists
  IF v_project_ids IS NULL OR array_length(v_project_ids, 1) = 0 THEN
    RAISE EXCEPTION 'No projects found. Please run main seed data first.';
  END IF;
  
END $$;

-- ============================================================================
-- PROJECT MILESTONES
-- ============================================================================

-- Milestones for Project 1: Early stage with upcoming milestones
INSERT INTO project_milestones (project_id, milestone_name, milestone_date, status, description)
SELECT 
  p.id,
  'Concept Approval',
  CURRENT_DATE - INTERVAL '15 days',
  'completed',
  'Initial concept and creative direction approved by client'
FROM projects p 
LIMIT 1 OFFSET 0;

INSERT INTO project_milestones (project_id, milestone_name, milestone_date, status, description)
SELECT 
  p.id,
  'Supplier Selection Complete',
  CURRENT_DATE - INTERVAL '5 days',
  'completed',
  'All suppliers assigned to assets'
FROM projects p 
LIMIT 1 OFFSET 0;

INSERT INTO project_milestones (project_id, milestone_name, milestone_date, status, description)
SELECT 
  p.id,
  'Production Kickoff',
  CURRENT_DATE + INTERVAL '3 days',
  'pending',
  'Begin production on all approved assets'
FROM projects p 
LIMIT 1 OFFSET 0;

INSERT INTO project_milestones (project_id, milestone_name, milestone_date, status, description)
SELECT 
  p.id,
  'First Draft Review',
  CURRENT_DATE + INTERVAL '14 days',
  'pending',
  'Review initial versions of all deliverables'
FROM projects p 
LIMIT 1 OFFSET 0;

INSERT INTO project_milestones (project_id, milestone_name, milestone_date, status, description)
SELECT 
  p.id,
  'Final Delivery',
  p.timeline_deadline,
  'pending',
  'Complete delivery of all project assets'
FROM projects p 
WHERE p.timeline_deadline IS NOT NULL
LIMIT 1 OFFSET 0;

-- Milestones for Project 2: Mid-stage project with mixed statuses
INSERT INTO project_milestones (project_id, milestone_name, milestone_date, status, description)
SELECT 
  p.id,
  'Brief Finalized',
  CURRENT_DATE - INTERVAL '30 days',
  'completed',
  'Project brief and requirements documented'
FROM projects p 
LIMIT 1 OFFSET 1;

INSERT INTO project_milestones (project_id, milestone_name, milestone_date, status, description)
SELECT 
  p.id,
  'Budget Approval',
  CURRENT_DATE - INTERVAL '20 days',
  'completed',
  'Client approved project budget and timeline'
FROM projects p 
LIMIT 1 OFFSET 1;

INSERT INTO project_milestones (project_id, milestone_name, milestone_date, status, description)
SELECT 
  p.id,
  'Asset Specifications Done',
  CURRENT_DATE - INTERVAL '10 days',
  'completed',
  'Detailed specifications created for all assets'
FROM projects p 
LIMIT 1 OFFSET 1;

INSERT INTO project_milestones (project_id, milestone_name, milestone_date, status, description)
SELECT 
  p.id,
  'Quote Review Meeting',
  CURRENT_DATE + INTERVAL '2 days',
  'pending',
  'Review and compare all supplier quotes'
FROM projects p 
LIMIT 1 OFFSET 1;

INSERT INTO project_milestones (project_id, milestone_name, milestone_date, status, description)
SELECT 
  p.id,
  'Production Start',
  CURRENT_DATE + INTERVAL '7 days',
  'pending',
  'Begin manufacturing/production phase'
FROM projects p 
LIMIT 1 OFFSET 1;

-- Milestones for Project 3: Late stage project
INSERT INTO project_milestones (project_id, milestone_name, milestone_date, status, description)
SELECT 
  p.id,
  'Pre-Production Complete',
  CURRENT_DATE - INTERVAL '45 days',
  'completed',
  'All planning and preparation complete'
FROM projects p 
LIMIT 1 OFFSET 2;

INSERT INTO project_milestones (project_id, milestone_name, milestone_date, status, description)
SELECT 
  p.id,
  'Production Complete',
  CURRENT_DATE - INTERVAL '7 days',
  'completed',
  'All assets manufactured and ready for delivery'
FROM projects p 
LIMIT 1 OFFSET 2;

INSERT INTO project_milestones (project_id, milestone_name, milestone_date, status, description)
SELECT 
  p.id,
  'Quality Check',
  CURRENT_DATE + INTERVAL '1 day',
  'pending',
  'Final quality assurance before client delivery'
FROM projects p 
LIMIT 1 OFFSET 2;

INSERT INTO project_milestones (project_id, milestone_name, milestone_date, status, description)
SELECT 
  p.id,
  'Client Handoff',
  CURRENT_DATE + INTERVAL '5 days',
  'pending',
  'Deliver all assets to client'
FROM projects p 
LIMIT 1 OFFSET 2;

-- Generic milestones for remaining projects
INSERT INTO project_milestones (project_id, milestone_name, milestone_date, status, description)
SELECT 
  p.id,
  'Project Kickoff',
  CURRENT_DATE - INTERVAL '10 days',
  'completed',
  'Initial project meeting and planning session'
FROM projects p 
OFFSET 3;

INSERT INTO project_milestones (project_id, milestone_name, milestone_date, status, description)
SELECT 
  p.id,
  'Requirements Gathering',
  CURRENT_DATE + INTERVAL '5 days',
  'pending',
  'Finalize all project requirements and specifications'
FROM projects p 
OFFSET 3;

INSERT INTO project_milestones (project_id, milestone_name, milestone_date, status, description)
SELECT 
  p.id,
  'Delivery',
  COALESCE(p.timeline_deadline, CURRENT_DATE + INTERVAL '30 days'),
  'pending',
  'Final project delivery'
FROM projects p 
OFFSET 3;

-- ============================================================================
-- ACTION ITEMS - PRODUCER ACTIONS
-- ============================================================================

-- Producer: Review quote actions (pending)
INSERT INTO action_items (project_id, asset_id, quote_id, action_type, action_description, assigned_to, status, priority, due_date)
SELECT 
  a.project_id,
  a.id,
  q.id,
  'producer_review_quote',
  'Review quote for ' || a.asset_name || ' from supplier',
  'producer',
  'pending',
  3,
  CURRENT_DATE + INTERVAL '2 days'
FROM assets a
JOIN quotes q ON q.asset_id = a.id
WHERE q.status = 'Submitted'
LIMIT 5;

-- Producer: Assign supplier actions (pending)
INSERT INTO action_items (project_id, asset_id, action_type, action_description, assigned_to, status, priority, due_date)
SELECT 
  a.project_id,
  a.id,
  'producer_assign_supplier',
  'Assign supplier for ' || a.asset_name,
  'producer',
  'pending',
  2,
  CURRENT_DATE + INTERVAL '3 days'
FROM assets a
WHERE a.assigned_supplier_id IS NULL
  AND a.status = 'Pending'
LIMIT 3;

-- Producer: Approve asset actions (pending - high priority)
INSERT INTO action_items (project_id, asset_id, action_type, action_description, assigned_to, status, priority, due_date)
SELECT 
  a.project_id,
  a.id,
  'producer_approve_asset',
  'Confirm and approve delivery of ' || a.asset_name,
  'producer',
  'pending',
  5,
  CURRENT_DATE + INTERVAL '1 day'
FROM assets a
WHERE a.status = 'Delivered'
LIMIT 2;

-- Producer: Completed review actions
INSERT INTO action_items (project_id, asset_id, quote_id, action_type, action_description, assigned_to, status, priority, completed_at)
SELECT 
  a.project_id,
  a.id,
  q.id,
  'producer_review_quote',
  'Review quote for ' || a.asset_name,
  'producer',
  'completed',
  3,
  CURRENT_DATE - INTERVAL '5 days'
FROM assets a
JOIN quotes q ON q.asset_id = a.id
WHERE q.status = 'Accepted'
LIMIT 4;

-- Producer: Completed assignment actions
INSERT INTO action_items (project_id, asset_id, action_type, action_description, assigned_to, status, priority, completed_at)
SELECT 
  a.project_id,
  a.id,
  'producer_assign_supplier',
  'Assign supplier for ' || a.asset_name,
  'producer',
  'completed',
  2,
  CURRENT_DATE - INTERVAL '8 days'
FROM assets a
WHERE a.assigned_supplier_id IS NOT NULL
LIMIT 3;

-- ============================================================================
-- ACTION ITEMS - SUPPLIER ACTIONS
-- ============================================================================

-- Supplier: Submit quote actions (pending)
INSERT INTO action_items (project_id, asset_id, quote_id, action_type, action_description, assigned_to, status, priority, due_date)
SELECT 
  a.project_id,
  a.id,
  q.id,
  'supplier_submit_quote',
  'Submit quote for ' || a.asset_name,
  'supplier',
  'pending',
  2,
  CURRENT_DATE + INTERVAL '4 days'
FROM assets a
JOIN quotes q ON q.asset_id = a.id
WHERE q.cost = 0
  AND q.status = 'Submitted'
LIMIT 6;

-- Supplier: Begin production actions (pending)
INSERT INTO action_items (project_id, asset_id, quote_id, action_type, action_description, assigned_to, status, priority, due_date)
SELECT 
  a.project_id,
  a.id,
  q.id,
  'supplier_revise_quote',
  'Begin production for ' || a.asset_name,
  'supplier',
  'pending',
  4,
  CURRENT_DATE + INTERVAL '7 days'
FROM assets a
JOIN quotes q ON q.asset_id = a.id
WHERE q.status = 'Accepted'
  AND a.status IN ('Approved', 'In Production')
LIMIT 4;

-- Supplier: Revise quote actions (pending - medium priority)
INSERT INTO action_items (project_id, asset_id, quote_id, action_type, action_description, assigned_to, status, priority, due_date)
SELECT 
  a.project_id,
  a.id,
  q.id,
  'supplier_revise_quote',
  'Revise and resubmit quote for ' || a.asset_name,
  'supplier',
  'pending',
  3,
  CURRENT_DATE + INTERVAL '3 days'
FROM assets a
JOIN quotes q ON q.asset_id = a.id
WHERE q.status = 'Rejected'
LIMIT 2;

-- Supplier: Completed quote submission actions
INSERT INTO action_items (project_id, asset_id, quote_id, action_type, action_description, assigned_to, status, priority, completed_at)
SELECT 
  a.project_id,
  a.id,
  q.id,
  'supplier_submit_quote',
  'Submit quote for ' || a.asset_name,
  'supplier',
  'completed',
  2,
  CURRENT_DATE - INTERVAL '7 days'
FROM assets a
JOIN quotes q ON q.asset_id = a.id
WHERE q.cost > 0
  AND q.status = 'Submitted'
LIMIT 5;

-- Supplier: Completed production actions
INSERT INTO action_items (project_id, asset_id, action_type, action_description, assigned_to, status, priority, completed_at)
SELECT 
  a.project_id,
  a.id,
  'supplier_revise_quote',
  'Complete production for ' || a.asset_name,
  'supplier',
  'completed',
  4,
  CURRENT_DATE - INTERVAL '2 days'
FROM assets a
WHERE a.status = 'Delivered'
LIMIT 3;

-- ============================================================================
-- ACTION ITEMS - CLIENT ACTIONS (Optional)
-- ============================================================================

-- Client approval actions (pending)
INSERT INTO action_items (project_id, action_type, action_description, assigned_to, status, priority, due_date)
SELECT 
  p.id,
  'client_approval',
  'Review and approve final project deliverables',
  'client',
  'pending',
  5,
  CURRENT_DATE + INTERVAL '3 days'
FROM projects p
WHERE p.project_status = 'In Progress'
LIMIT 2;

-- ============================================================================
-- ACTION ITEMS - MIXED STATUS (In Progress)
-- ============================================================================

-- Some actions currently in progress
INSERT INTO action_items (project_id, asset_id, action_type, action_description, assigned_to, status, priority, due_date)
SELECT 
  a.project_id,
  a.id,
  'producer_approve_asset',
  'Review and approve ' || a.asset_name || ' specifications',
  'producer',
  'in_progress',
  3,
  CURRENT_DATE + INTERVAL '1 day'
FROM assets a
WHERE a.status = 'Quoting'
LIMIT 2;

INSERT INTO action_items (project_id, asset_id, quote_id, action_type, action_description, assigned_to, status, priority, due_date)
SELECT 
  a.project_id,
  a.id,
  q.id,
  'supplier_submit_quote',
  'Finalize and submit quote for ' || a.asset_name,
  'supplier',
  'in_progress',
  3,
  CURRENT_DATE + INTERVAL '2 days'
FROM assets a
JOIN quotes q ON q.asset_id = a.id
WHERE a.status = 'Quoting'
LIMIT 2;

-- ============================================================================
-- SUMMARY REPORT
-- ============================================================================

DO $$
DECLARE
  v_milestone_count INTEGER;
  v_action_count INTEGER;
  v_producer_pending INTEGER;
  v_supplier_pending INTEGER;
  v_completed_actions INTEGER;
BEGIN
  
  -- Count milestones
  SELECT COUNT(*) INTO v_milestone_count FROM project_milestones;
  
  -- Count action items
  SELECT COUNT(*) INTO v_action_count FROM action_items;
  
  -- Count pending actions by assignee
  SELECT COUNT(*) INTO v_producer_pending 
  FROM action_items 
  WHERE assigned_to = 'producer' AND status = 'pending';
  
  SELECT COUNT(*) INTO v_supplier_pending 
  FROM action_items 
  WHERE assigned_to = 'supplier' AND status = 'pending';
  
  -- Count completed actions
  SELECT COUNT(*) INTO v_completed_actions 
  FROM action_items 
  WHERE status = 'completed';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SEED SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Project Milestones Created: %', v_milestone_count;
  RAISE NOTICE 'Action Items Created: %', v_action_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Action Item Breakdown:';
  RAISE NOTICE '  - Producer (Pending): %', v_producer_pending;
  RAISE NOTICE '  - Supplier (Pending): %', v_supplier_pending;
  RAISE NOTICE '  - Completed: %', v_completed_actions;
  RAISE NOTICE '';
  RAISE NOTICE 'Seeding completed successfully!';
  RAISE NOTICE '========================================';
  
END $$;

-- ============================================================================
-- VERIFICATION QUERIES (Optional - Comment out if not needed)
-- ============================================================================

-- View pending actions by project
-- SELECT 
--   p.project_name,
--   COUNT(*) FILTER (WHERE ai.assigned_to = 'producer' AND ai.status = 'pending') as producer_actions,
--   COUNT(*) FILTER (WHERE ai.assigned_to = 'supplier' AND ai.status = 'pending') as supplier_actions
-- FROM projects p
-- LEFT JOIN action_items ai ON ai.project_id = p.id
-- GROUP BY p.id, p.project_name
-- ORDER BY p.project_name;

-- View milestones by project
-- SELECT 
--   p.project_name,
--   COUNT(*) as milestone_count,
--   COUNT(*) FILTER (WHERE pm.status = 'completed') as completed,
--   COUNT(*) FILTER (WHERE pm.status = 'pending') as pending
-- FROM projects p
-- LEFT JOIN project_milestones pm ON pm.project_id = p.id
-- GROUP BY p.id, p.project_name
-- ORDER BY p.project_name;


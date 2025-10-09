# Project Tracking Data Seeding Guide

## Overview

The `seed-action-items-milestones.sql` file creates comprehensive test data for:
- **Project Milestones** - Timeline checkpoints with various statuses
- **Action Items** - Producer and supplier tasks at different stages

## Prerequisites

**IMPORTANT:** Run this seed file AFTER your main seed data!

The seed file expects existing data:
- ✅ Projects (from `seed.sql` or `seed-dev.js`)
- ✅ Assets (linked to projects)
- ✅ Quotes (linked to assets and suppliers)
- ✅ Suppliers

## How to Run

### Option 1: Supabase Dashboard (Recommended)

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Click **New query**
4. Copy and paste contents of `seed-action-items-milestones.sql`
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. Check the output panel for the summary report

### Option 2: Supabase CLI

```bash
# From project root
supabase db execute --file supabase/seed-action-items-milestones.sql
```

### Option 3: psql

```bash
psql <your-database-connection-string> -f supabase/seed-action-items-milestones.sql
```

## What Gets Created

### Project Milestones (~20-30 items)

**Project 1** (Early Stage):
- ✅ Concept Approval (completed)
- ✅ Supplier Selection Complete (completed)
- ⏳ Production Kickoff (pending, 3 days)
- ⏳ First Draft Review (pending, 14 days)
- ⏳ Final Delivery (pending, deadline)

**Project 2** (Mid Stage):
- ✅ Brief Finalized (completed)
- ✅ Budget Approval (completed)
- ✅ Asset Specifications Done (completed)
- ⏳ Quote Review Meeting (pending, 2 days)
- ⏳ Production Start (pending, 7 days)

**Project 3** (Late Stage):
- ✅ Pre-Production Complete (completed)
- ✅ Production Complete (completed)
- ⏳ Quality Check (pending, 1 day)
- ⏳ Client Handoff (pending, 5 days)

**Remaining Projects:**
- Generic milestones (kickoff, requirements, delivery)

### Action Items (~40-60 items)

#### Producer Actions ("Your Actions"):
- 🔍 **Review Quote** (pending, priority 3) - 5 items
- 👤 **Assign Supplier** (pending, priority 2) - 3 items
- ✅ **Approve Delivery** (pending, priority 5) - 2 items
- ✅ **Completed Reviews** - 4 items
- ✅ **Completed Assignments** - 3 items

#### Supplier Actions ("Their Actions"):
- 📝 **Submit Quote** (pending, priority 2) - 6 items
- 🏭 **Begin Production** (pending, priority 4) - 4 items
- 🔄 **Revise Quote** (pending, priority 3) - 2 items
- ✅ **Completed Submissions** - 5 items
- ✅ **Completed Production** - 3 items

#### Mixed Status:
- 🔄 **In Progress** - 4 items (both producer and supplier)
- 👥 **Client Approval** (pending) - 2 items

## Expected Output

After running, you should see:

```
NOTICE: Found 10 projects, 20 assets, 20 quotes, 10 suppliers
...
NOTICE: ========================================
NOTICE: SEED SUMMARY
NOTICE: ========================================
NOTICE: Project Milestones Created: 23
NOTICE: Action Items Created: 47
NOTICE: 
NOTICE: Action Item Breakdown:
NOTICE:   - Producer (Pending): 10
NOTICE:   - Supplier (Pending): 12
NOTICE:   - Completed: 15
NOTICE: 
NOTICE: Seeding completed successfully!
NOTICE: ========================================
```

## Verification

### Check Action Item Counts

```sql
-- View pending actions by assignee
SELECT 
  assigned_to,
  status,
  COUNT(*) as count
FROM action_items
GROUP BY assigned_to, status
ORDER BY assigned_to, status;
```

### Check Milestones by Project

```sql
-- View milestones with status breakdown
SELECT 
  p.project_name,
  COUNT(*) as total_milestones,
  COUNT(*) FILTER (WHERE pm.status = 'completed') as completed,
  COUNT(*) FILTER (WHERE pm.status = 'pending') as pending
FROM projects p
LEFT JOIN project_milestones pm ON pm.project_id = p.id
GROUP BY p.id, p.project_name
ORDER BY total_milestones DESC;
```

### Check Project Tracking Summary

```sql
-- View what the tracking widgets will show
SELECT 
  p.project_name,
  p.financial_parameters as budget,
  p.timeline_deadline,
  COUNT(DISTINCT pm.id) as milestones,
  COUNT(*) FILTER (WHERE ai.assigned_to = 'producer' AND ai.status = 'pending') as "Your Actions",
  COUNT(*) FILTER (WHERE ai.assigned_to = 'supplier' AND ai.status = 'pending') as "Their Actions"
FROM projects p
LEFT JOIN project_milestones pm ON pm.project_id = p.id
LEFT JOIN action_items ai ON ai.project_id = p.id
GROUP BY p.id, p.project_name, p.financial_parameters, p.timeline_deadline
ORDER BY p.project_name;
```

## Testing the Widgets

After seeding, visit any project detail page to see:

1. **Budget Tracking Bar**
   - Should show budget utilization based on accepted quotes
   - Color-coded status (green/yellow/red)

2. **Timeline Widget**
   - Should display all milestones in chronological order
   - Show completed vs pending checkpoints
   - Days remaining to deadline

3. **Your Actions Counter**
   - Should show count of pending producer actions
   - Click to see pending tasks

4. **Their Actions Counter**
   - Should show count of pending supplier actions
   - Tracks outstanding supplier responses

## Cleanup

To remove seeded data:

```sql
-- Remove all action items (keeps the table)
DELETE FROM action_items;

-- Remove all project milestones (keeps the table)
DELETE FROM project_milestones;

-- Reset auto-increment (if needed)
-- Not applicable for UUID primary keys
```

## Customization

To adjust the seed data:

1. **Change quantities:** Modify `LIMIT` clauses in INSERT statements
2. **Change dates:** Adjust `INTERVAL` values (e.g., `INTERVAL '5 days'`)
3. **Change priorities:** Modify priority values (1-5)
4. **Add more types:** Add more INSERT statements with different action_type values

## Troubleshooting

### Error: "No projects found"
**Solution:** Run your main seed data first (`seed.sql` or `seed-dev.js`)

### Error: Foreign key violation
**Solution:** Ensure assets, quotes, and suppliers exist before running

### No milestones showing up
**Solution:** Check that projects have `timeline_deadline` set

### Action counts show 0
**Solution:** Verify action_items were created with correct project_id and status values

## Integration with Automated Flows

Once action item automation is implemented, these seeded items will demonstrate:
- ✅ How completed actions are tracked
- ✅ How pending actions surface in the UI
- ✅ Timeline progression with milestones
- ✅ Budget tracking against project budget

This seed data provides a realistic state for a production management system with active projects at various stages.


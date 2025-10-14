const express = require('express');
const ProjectSummaryService = require('../services/projectSummaryService');
const router = express.Router();

/**
 * GET /api/project-summary/:projectId
 * Get comprehensive project tracking summary
 * Includes budget, timeline, milestones, and action counts
 */
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    // Validate projectId parameter
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETER',
          message: 'Project ID is required'
        }
      });
    }

    // Get tracking summary
    const summary = await ProjectSummaryService.getProjectTrackingSummary(projectId);

    res.status(200).json({
      success: true,
      data: summary,
      message: 'Project tracking summary retrieved successfully'
    });

  } catch (error) {
    console.error('Project summary endpoint error:', error);

    // Handle specific error types
    if (error.message.includes('Project not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: error.message
        }
      });
    }

    // Generic server error
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve project summary',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

/**
 * GET /api/project-summary/:projectId/milestones
 * Get all milestones for a project
 */
router.get('/:projectId/milestones', async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETER',
          message: 'Project ID is required'
        }
      });
    }

    const milestones = await ProjectSummaryService.getProjectMilestones(projectId);

    res.status(200).json({
      success: true,
      data: milestones,
      message: `Retrieved ${milestones.length} milestone(s)`
    });

  } catch (error) {
    console.error('Get milestones endpoint error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve milestones',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

/**
 * POST /api/project-summary/:projectId/milestones
 * Create a new milestone for a project
 */
router.post('/:projectId/milestones', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, date, description } = req.body;

    // Validate required fields
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETER',
          message: 'Project ID is required'
        }
      });
    }

    if (!name || !date) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Milestone name and date are required'
        }
      });
    }

    const milestone = await ProjectSummaryService.createMilestone(projectId, {
      name,
      date,
      description
    });

    res.status(201).json({
      success: true,
      data: milestone,
      message: 'Milestone created successfully'
    });

  } catch (error) {
    console.error('Create milestone endpoint error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create milestone',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

/**
 * PATCH /api/project-summary/milestones/:milestoneId
 * Update a milestone
 */
router.patch('/milestones/:milestoneId', async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const updates = req.body;

    if (!milestoneId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETER',
          message: 'Milestone ID is required'
        }
      });
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'At least one field to update is required'
        }
      });
    }

    const milestone = await ProjectSummaryService.updateMilestone(milestoneId, updates);

    res.status(200).json({
      success: true,
      data: milestone,
      message: 'Milestone updated successfully'
    });

  } catch (error) {
    console.error('Update milestone endpoint error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update milestone',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

/**
 * DELETE /api/project-summary/milestones/:milestoneId
 * Delete a milestone
 */
router.delete('/milestones/:milestoneId', async (req, res) => {
  try {
    const { milestoneId } = req.params;

    if (!milestoneId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETER',
          message: 'Milestone ID is required'
        }
      });
    }

    await ProjectSummaryService.deleteMilestone(milestoneId);

    res.status(200).json({
      success: true,
      message: 'Milestone deleted successfully'
    });

  } catch (error) {
    console.error('Delete milestone endpoint error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete milestone',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

/**
 * GET /api/project-summary/:projectId/actions
 * Get all action items for a project (with optional filters)
 */
router.get('/:projectId/actions', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, assignedTo } = req.query;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETER',
          message: 'Project ID is required'
        }
      });
    }

    const filters = {};
    if (status) filters.status = status;
    if (assignedTo) filters.assignedTo = assignedTo;

    const actions = await ProjectSummaryService.getActionItems(projectId, filters);

    res.status(200).json({
      success: true,
      data: actions,
      message: `Retrieved ${actions.length} action item(s)`
    });

  } catch (error) {
    console.error('Get action items endpoint error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve action items',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

/**
 * POST /api/project-summary/actions
 * Create a new action item
 */
router.post('/actions', async (req, res) => {
  try {
    const actionData = req.body;

    // Validate required fields
    if (!actionData.projectId || !actionData.type || !actionData.description || !actionData.assignedTo) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'projectId, type, description, and assignedTo are required'
        }
      });
    }

    const actionItem = await ProjectSummaryService.createActionItem(actionData);

    res.status(201).json({
      success: true,
      data: actionItem,
      message: 'Action item created successfully'
    });

  } catch (error) {
    console.error('Create action item endpoint error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create action item',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

/**
 * PATCH /api/project-summary/actions/:actionId/complete
 * Mark an action item as completed
 */
router.patch('/actions/:actionId/complete', async (req, res) => {
  try {
    const { actionId } = req.params;

    if (!actionId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETER',
          message: 'Action ID is required'
        }
      });
    }

    const actionItem = await ProjectSummaryService.completeActionItem(actionId);

    res.status(200).json({
      success: true,
      data: actionItem,
      message: 'Action item completed successfully'
    });

  } catch (error) {
    console.error('Complete action item endpoint error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to complete action item',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

module.exports = router;


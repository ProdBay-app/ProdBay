const { supabase } = require('../config/database');

/**
 * Project Summary Service
 * Handles fetching and aggregating project tracking data for health widgets
 */
class ProjectSummaryService {
  /**
   * Get comprehensive project tracking summary
   * Includes budget, timeline, milestones, and action counts
   * 
   * @param {string} projectId - UUID of the project
   * @returns {Promise<Object>} Aggregated tracking summary
   */
  static async getProjectTrackingSummary(projectId) {
    try {
      // Fetch all required data in parallel for performance
      const [
        projectResult,
        budgetResult,
        milestonesResult,
        actionsResult
      ] = await Promise.all([
        supabase
          .from('projects')
          .select('id, project_name, financial_parameters, timeline_deadline')
          .eq('id', projectId)
          .single(),
        this.calculateProjectBudget(projectId),
        this.getProjectMilestones(projectId),
        this.getActionCounts(projectId)
      ]);

      if (projectResult.error) {
        throw new Error(`Failed to fetch project: ${projectResult.error.message}`);
      }

      const project = projectResult.data;
      if (!project) {
        throw new Error('Project not found');
      }

      // Calculate days remaining to deadline
      const daysRemaining = project.timeline_deadline 
        ? Math.ceil((new Date(project.timeline_deadline) - new Date()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        projectId: project.id,
        budget: budgetResult,
        timeline: {
          deadline: project.timeline_deadline,
          daysRemaining,
          milestones: milestonesResult
        },
        actions: actionsResult
      };
    } catch (error) {
      console.error('Error in getProjectTrackingSummary:', error);
      throw error;
    }
  }

  /**
   * Calculate project budget summary
   * Aggregates accepted quote costs vs project budget
   * 
   * @param {string} projectId - UUID of the project
   * @returns {Promise<Object>} Budget breakdown
   */
  static async calculateProjectBudget(projectId) {
    try {
      // Use the budget summary view we created
      const { data: budgetData, error } = await supabase
        .from('project_budget_summary')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (error) {
        console.error('Error fetching budget summary:', error);
        // Fallback: calculate manually if view fails
        return this.calculateBudgetManually(projectId);
      }

      return {
        total: parseFloat(budgetData.total_budget || 0),
        spent: parseFloat(budgetData.total_spent || 0),
        remaining: parseFloat(budgetData.budget_remaining || 0),
        percentageUsed: parseFloat(budgetData.budget_used_percentage || 0)
      };
    } catch (error) {
      console.error('Error in calculateProjectBudget:', error);
      // Return safe defaults on error
      return {
        total: 0,
        spent: 0,
        remaining: 0,
        percentageUsed: 0
      };
    }
  }

  /**
   * Manual budget calculation fallback
   * Used if the database view is unavailable
   * 
   * @param {string} projectId - UUID of the project
   * @returns {Promise<Object>} Budget breakdown
   */
  static async calculateBudgetManually(projectId) {
    try {
      // Get project budget
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('financial_parameters')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      const totalBudget = parseFloat(project?.financial_parameters || 0);

      // Get all accepted quotes for this project
      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select('cost, asset_id')
        .eq('status', 'Accepted')
        .in('asset_id', 
          supabase
            .from('assets')
            .select('id')
            .eq('project_id', projectId)
        );

      if (quotesError) throw quotesError;

      const totalSpent = quotes?.reduce((sum, quote) => sum + parseFloat(quote.cost || 0), 0) || 0;
      const remaining = totalBudget - totalSpent;
      const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

      return {
        total: totalBudget,
        spent: totalSpent,
        remaining,
        percentageUsed: Math.round(percentageUsed * 100) / 100 // Round to 2 decimals
      };
    } catch (error) {
      console.error('Error in calculateBudgetManually:', error);
      return {
        total: 0,
        spent: 0,
        remaining: 0,
        percentageUsed: 0
      };
    }
  }

  /**
   * Get project milestones sorted by date
   * 
   * @param {string} projectId - UUID of the project
   * @returns {Promise<Array>} Array of milestone objects
   */
  static async getProjectMilestones(projectId) {
    try {
      const { data: milestones, error } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('milestone_date', { ascending: true });

      if (error) {
        console.error('Error fetching milestones:', error);
        return [];
      }

      return milestones || [];
    } catch (error) {
      console.error('Error in getProjectMilestones:', error);
      return [];
    }
  }

  /**
   * Count pending actions by assignee type
   * 
   * @param {string} projectId - UUID of the project
   * @returns {Promise<Object>} Action counts by assignee
   */
  static async getActionCounts(projectId) {
    try {
      const { data: actions, error } = await supabase
        .from('action_items')
        .select('assigned_to, status')
        .eq('project_id', projectId)
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching action counts:', error);
        return { producerActions: 0, supplierActions: 0 };
      }

      const producerActions = actions?.filter(a => a.assigned_to === 'producer').length || 0;
      const supplierActions = actions?.filter(a => a.assigned_to === 'supplier').length || 0;

      return {
        producerActions,
        supplierActions
      };
    } catch (error) {
      console.error('Error in getActionCounts:', error);
      return { producerActions: 0, supplierActions: 0 };
    }
  }

  /**
   * Create a new milestone for a project
   * 
   * @param {string} projectId - UUID of the project
   * @param {Object} milestoneData - Milestone data (name, date, description)
   * @returns {Promise<Object>} Created milestone
   */
  static async createMilestone(projectId, milestoneData) {
    try {
      const { data: milestone, error } = await supabase
        .from('project_milestones')
        .insert({
          project_id: projectId,
          milestone_name: milestoneData.name,
          milestone_date: milestoneData.date,
          description: milestoneData.description || '',
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating milestone:', error);
        throw new Error(`Failed to create milestone: ${error.message}`);
      }

      return milestone;
    } catch (error) {
      console.error('Error in createMilestone:', error);
      throw error;
    }
  }

  /**
   * Update a milestone (status, date, etc.)
   * 
   * @param {string} milestoneId - UUID of the milestone
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated milestone
   */
  static async updateMilestone(milestoneId, updates) {
    try {
      const updateData = {};
      
      if (updates.name !== undefined) updateData.milestone_name = updates.name;
      if (updates.date !== undefined) updateData.milestone_date = updates.date;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.description !== undefined) updateData.description = updates.description;

      const { data: milestone, error } = await supabase
        .from('project_milestones')
        .update(updateData)
        .eq('id', milestoneId)
        .select()
        .single();

      if (error) {
        console.error('Error updating milestone:', error);
        throw new Error(`Failed to update milestone: ${error.message}`);
      }

      return milestone;
    } catch (error) {
      console.error('Error in updateMilestone:', error);
      throw error;
    }
  }

  /**
   * Create a new action item
   * 
   * @param {Object} actionData - Action item data
   * @returns {Promise<Object>} Created action item
   */
  static async createActionItem(actionData) {
    try {
      const { data: actionItem, error } = await supabase
        .from('action_items')
        .insert({
          project_id: actionData.projectId,
          asset_id: actionData.assetId || null,
          quote_id: actionData.quoteId || null,
          action_type: actionData.type,
          action_description: actionData.description,
          assigned_to: actionData.assignedTo,
          priority: actionData.priority || 1,
          due_date: actionData.dueDate || null,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating action item:', error);
        throw new Error(`Failed to create action item: ${error.message}`);
      }

      return actionItem;
    } catch (error) {
      console.error('Error in createActionItem:', error);
      throw error;
    }
  }

  /**
   * Complete an action item
   * 
   * @param {string} actionId - UUID of the action item
   * @returns {Promise<Object>} Updated action item
   */
  static async completeActionItem(actionId) {
    try {
      const { data: actionItem, error } = await supabase
        .from('action_items')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', actionId)
        .select()
        .single();

      if (error) {
        console.error('Error completing action item:', error);
        throw new Error(`Failed to complete action item: ${error.message}`);
      }

      return actionItem;
    } catch (error) {
      console.error('Error in completeActionItem:', error);
      throw error;
    }
  }

  /**
   * Get all action items for a project (optionally filtered)
   * 
   * @param {string} projectId - UUID of the project
   * @param {Object} filters - Optional filters (status, assignedTo)
   * @returns {Promise<Array>} Array of action items
   */
  static async getActionItems(projectId, filters = {}) {
    try {
      let query = supabase
        .from('action_items')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }

      const { data: actions, error } = await query;

      if (error) {
        console.error('Error fetching action items:', error);
        throw new Error(`Failed to fetch action items: ${error.message}`);
      }

      return actions || [];
    } catch (error) {
      console.error('Error in getActionItems:', error);
      throw error;
    }
  }
}

module.exports = ProjectSummaryService;


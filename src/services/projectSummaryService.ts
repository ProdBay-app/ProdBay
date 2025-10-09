/**
 * Project Summary Service
 * Handles communication with the Railway backend for project tracking data
 */

import type { ProjectTrackingSummary, ProjectMilestone, ActionItem } from '@/types/database';

const RAILWAY_API_URL = import.meta.env.VITE_RAILWAY_API_URL || '';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

export interface CreateMilestoneRequest {
  name: string;
  date: string;
  description?: string;
}

export interface UpdateMilestoneRequest {
  name?: string;
  date?: string;
  status?: 'pending' | 'completed' | 'cancelled';
  description?: string;
}

export interface CreateActionItemRequest {
  projectId: string;
  assetId?: string;
  quoteId?: string;
  type: string;
  description: string;
  assignedTo: 'producer' | 'supplier' | 'client';
  priority?: number;
  dueDate?: string;
}

export class ProjectSummaryService {
  /**
   * Get comprehensive project tracking summary
   * Includes budget, timeline, milestones, and action counts
   * 
   * @param projectId - UUID of the project
   * @returns Promise with the tracking summary
   */
  static async getProjectTrackingSummary(projectId: string): Promise<ProjectTrackingSummary> {
    if (!RAILWAY_API_URL) {
      throw new Error('Railway API URL not configured. Please set VITE_RAILWAY_API_URL environment variable.');
    }

    if (!projectId) {
      throw new Error('Project ID is required');
    }

    try {
      const response = await fetch(`${RAILWAY_API_URL.replace(/\/$/, '')}/api/project-summary/${projectId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data: ApiResponse<ProjectTrackingSummary> = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch project tracking summary');
      }

      if (!data.success || !data.data) {
        throw new Error('Invalid response from server');
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching project tracking summary:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while fetching project tracking summary');
    }
  }

  /**
   * Get all milestones for a project
   * 
   * @param projectId - UUID of the project
   * @returns Promise with array of milestones
   */
  static async getProjectMilestones(projectId: string): Promise<ProjectMilestone[]> {
    if (!RAILWAY_API_URL) {
      throw new Error('Railway API URL not configured');
    }

    if (!projectId) {
      throw new Error('Project ID is required');
    }

    try {
      const response = await fetch(`${RAILWAY_API_URL.replace(/\/$/, '')}/api/project-summary/${projectId}/milestones`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data: ApiResponse<ProjectMilestone[]> = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch milestones');
      }

      return data.data || [];
    } catch (error) {
      console.error('Error fetching milestones:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while fetching milestones');
    }
  }

  /**
   * Create a new milestone for a project
   * 
   * @param projectId - UUID of the project
   * @param milestoneData - Milestone data (name, date, description)
   * @returns Promise with the created milestone
   */
  static async createMilestone(projectId: string, milestoneData: CreateMilestoneRequest): Promise<ProjectMilestone> {
    if (!RAILWAY_API_URL) {
      throw new Error('Railway API URL not configured');
    }

    if (!projectId) {
      throw new Error('Project ID is required');
    }

    try {
      const response = await fetch(`${RAILWAY_API_URL.replace(/\/$/, '')}/api/project-summary/${projectId}/milestones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(milestoneData),
      });

      const data: ApiResponse<ProjectMilestone> = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create milestone');
      }

      if (!data.data) {
        throw new Error('Invalid response from server');
      }

      return data.data;
    } catch (error) {
      console.error('Error creating milestone:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while creating milestone');
    }
  }

  /**
   * Update a milestone
   * 
   * @param milestoneId - UUID of the milestone
   * @param updates - Fields to update
   * @returns Promise with the updated milestone
   */
  static async updateMilestone(milestoneId: string, updates: UpdateMilestoneRequest): Promise<ProjectMilestone> {
    if (!RAILWAY_API_URL) {
      throw new Error('Railway API URL not configured');
    }

    if (!milestoneId) {
      throw new Error('Milestone ID is required');
    }

    try {
      const response = await fetch(`${RAILWAY_API_URL.replace(/\/$/, '')}/api/project-summary/milestones/${milestoneId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data: ApiResponse<ProjectMilestone> = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to update milestone');
      }

      if (!data.data) {
        throw new Error('Invalid response from server');
      }

      return data.data;
    } catch (error) {
      console.error('Error updating milestone:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while updating milestone');
    }
  }

  /**
   * Get action items for a project (with optional filters)
   * 
   * @param projectId - UUID of the project
   * @param filters - Optional filters (status, assignedTo)
   * @returns Promise with array of action items
   */
  static async getActionItems(
    projectId: string,
    filters?: { status?: string; assignedTo?: string }
  ): Promise<ActionItem[]> {
    if (!RAILWAY_API_URL) {
      throw new Error('Railway API URL not configured');
    }

    if (!projectId) {
      throw new Error('Project ID is required');
    }

    try {
      const queryParams = new URLSearchParams();
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.assignedTo) queryParams.append('assignedTo', filters.assignedTo);
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

      const response = await fetch(
        `${RAILWAY_API_URL.replace(/\/$/, '')}/api/project-summary/${projectId}/actions${queryString}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data: ApiResponse<ActionItem[]> = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch action items');
      }

      return data.data || [];
    } catch (error) {
      console.error('Error fetching action items:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while fetching action items');
    }
  }

  /**
   * Create a new action item
   * 
   * @param actionData - Action item data
   * @returns Promise with the created action item
   */
  static async createActionItem(actionData: CreateActionItemRequest): Promise<ActionItem> {
    if (!RAILWAY_API_URL) {
      throw new Error('Railway API URL not configured');
    }

    try {
      const response = await fetch(`${RAILWAY_API_URL.replace(/\/$/, '')}/api/project-summary/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(actionData),
      });

      const data: ApiResponse<ActionItem> = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create action item');
      }

      if (!data.data) {
        throw new Error('Invalid response from server');
      }

      return data.data;
    } catch (error) {
      console.error('Error creating action item:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while creating action item');
    }
  }

  /**
   * Complete an action item
   * 
   * @param actionId - UUID of the action item
   * @returns Promise with the updated action item
   */
  static async completeActionItem(actionId: string): Promise<ActionItem> {
    if (!RAILWAY_API_URL) {
      throw new Error('Railway API URL not configured');
    }

    if (!actionId) {
      throw new Error('Action ID is required');
    }

    try {
      const response = await fetch(`${RAILWAY_API_URL.replace(/\/$/, '')}/api/project-summary/actions/${actionId}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data: ApiResponse<ActionItem> = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to complete action item');
      }

      if (!data.data) {
        throw new Error('Invalid response from server');
      }

      return data.data;
    } catch (error) {
      console.error('Error completing action item:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while completing action item');
    }
  }

  /**
   * Health check for the project summary service
   * 
   * @returns Promise with health status
   */
  static async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    if (!RAILWAY_API_URL) {
      return { healthy: false, message: 'Railway API URL not configured' };
    }

    try {
      const response = await fetch(`${RAILWAY_API_URL.replace(/\/$/, '')}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return { healthy: response.ok };
    } catch (error) {
      console.error('Health check failed:', error);
      return { healthy: false, message: 'Failed to reach Railway API' };
    }
  }
}


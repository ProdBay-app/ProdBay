import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, Archive } from 'lucide-react';
import { ProducerService } from '@/services/producerService';
import { useNotification } from '@/hooks/useNotification';
import ProjectCard from './ProjectCard';
import type { Project } from '@/lib/supabase';

/**
 * ActiveProjectsGrid - Container component for the producer projects page
 * 
 * Responsibilities:
 * - Fetches all projects from Supabase
 * - Filters projects into "Active" and "Archived" groups
 * - Renders projects in a responsive grid layout
 * - Handles navigation to project details
 * - Manages loading and error states
 */
const ActiveProjectsGrid: React.FC = () => {
  const navigate = useNavigate();
  const { showError } = useNotification();
  
  // State management
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter projects by status
  const activeProjects = projects.filter(p => 
    ['New', 'In Progress', 'Quoting'].includes(p.project_status)
  );
  
  const archivedProjects = projects.filter(p => 
    ['Completed', 'Cancelled'].includes(p.project_status)
  );

  // Load projects from Supabase
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const projectsData = await ProducerService.loadProjects();
      setProjects(projectsData);
    } catch (err) {
      console.error('Error loading projects:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load projects';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Handle project card click - navigate to producer dashboard with selected project
  const handleProjectClick = useCallback((project: Project) => {
    // Navigate to the producer dashboard with the selected project
    // We'll pass the project ID as state so the dashboard can auto-select it
    navigate('/producer', { state: { selectedProjectId: project.id } });
  }, [navigate]);

  // Handle create new project
  const handleCreateProject = useCallback(() => {
    navigate('/producer', { state: { openCreateProjectModal: true } });
  }, [navigate]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Projects</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadProjects}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
              <p className="text-gray-600 mt-1">
                Manage and track all your production projects
              </p>
            </div>
            <button
              onClick={handleCreateProject}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              New Project
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Active Projects Section */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <FolderOpen className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">Active</h2>
            <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full">
              {activeProjects.length}
            </span>
          </div>

          {activeProjects.length === 0 ? (
            <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No active projects</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first project</p>
              <button
                onClick={handleCreateProject}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={handleProjectClick}
                />
              ))}
            </div>
          )}
        </section>

        {/* Archived Projects Section */}
        {archivedProjects.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Archive className="w-6 h-6 text-gray-600" />
              <h2 className="text-2xl font-bold text-gray-900">Archived</h2>
              <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 text-sm font-semibold rounded-full">
                {archivedProjects.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {archivedProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={handleProjectClick}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ActiveProjectsGrid;


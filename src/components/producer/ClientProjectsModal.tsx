import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, FolderOpen, Calendar, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { ProducerService } from '@/services/producerService';
import type { Project } from '@/lib/supabase';

interface ClientProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
  currentProjectId: string;
}

/**
 * ClientProjectsModal - Display all projects for a specific client
 * 
 * Features:
 * - Fetches and displays all projects associated with a client
 * - Highlights the currently viewed project
 * - Shows loading, error, and empty states
 * - Allows navigation between client projects with one click
 * - Follows the established modal design pattern
 */
const ClientProjectsModal: React.FC<ClientProjectsModalProps> = ({
  isOpen,
  onClose,
  clientName,
  currentProjectId
}) => {
  // Hooks
  const navigate = useNavigate();

  // State management
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects when modal opens or client name changes
  useEffect(() => {
    const fetchClientProjects = async () => {
      // Only fetch if modal is open and we have a client name
      if (!isOpen || !clientName) {
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const fetchedProjects = await ProducerService.getProjectsByClientName(clientName);
        setProjects(fetchedProjects);
      } catch (err) {
        console.error('Error fetching client projects:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load projects';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchClientProjects();
  }, [isOpen, clientName]);

  // Handle backdrop click - close modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Handle navigation to a project
  const handleNavigate = (projectId: string) => {
    // Navigate to the project detail page
    navigate(`/producer/projects/${projectId}`);
    // Close the modal immediately after navigation
    onClose();
  };

  // Format date helper
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get status badge color
  const getStatusBadgeColor = (status: Project['project_status']): string => {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'In Progress':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Quoting':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
        {/* Header with close button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <FolderOpen className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Client Projects</h3>
              <p className="text-sm text-gray-600">{clientName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-teal-600 animate-spin mb-4" />
              <p className="text-gray-600 text-lg">Loading projects...</p>
              <p className="text-gray-500 text-sm mt-2">Fetching all projects for {clientName}</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-red-50 rounded-full p-4 mb-4">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Projects</h4>
              <p className="text-gray-600 text-center mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Reload Page
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && projects.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-gray-50 rounded-full p-4 mb-4">
                <FolderOpen className="w-10 h-10 text-gray-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No Projects Found</h4>
              <p className="text-gray-600 text-center">
                No projects found for <span className="font-medium">{clientName}</span>
              </p>
            </div>
          )}

          {/* Success State - Project List */}
          {!loading && !error && projects.length > 0 && (
            <div className="space-y-3">
              {/* Header info */}
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Found <span className="font-semibold text-gray-900">{projects.length}</span> {projects.length === 1 ? 'project' : 'projects'}
                </p>
              </div>

              {/* Project list */}
              {projects.map((project) => {
                const isCurrentProject = project.id === currentProjectId;
                
                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => handleNavigate(project.id)}
                    disabled={isCurrentProject}
                    className={`
                      relative rounded-lg border-2 p-4 transition-all text-left w-full
                      ${isCurrentProject 
                        ? 'border-teal-500 bg-teal-50 shadow-md cursor-default' 
                        : 'border-gray-200 bg-white hover:border-teal-300 hover:shadow-sm cursor-pointer'
                      }
                      ${!isCurrentProject && 'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2'}
                    `}
                  >
                    {/* Current project badge */}
                    {isCurrentProject && (
                      <div className="absolute top-3 right-3">
                        <div className="flex items-center gap-1 px-2 py-1 bg-teal-600 text-white rounded-full text-xs font-semibold">
                          <CheckCircle className="w-3 h-3" />
                          <span>Current</span>
                        </div>
                      </div>
                    )}

                    {/* Project info */}
                    <div className="pr-20">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {project.project_name}
                      </h4>
                      
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        {/* Status badge */}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(project.project_status)}`}>
                          {project.project_status}
                        </span>

                        {/* Created date */}
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Created {formatDate(project.created_at)}</span>
                        </div>
                      </div>

                      {/* Brief description preview (first 100 chars) */}
                      {project.brief_description && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {project.brief_description.length > 100 
                            ? project.brief_description.substring(0, 100) + '...' 
                            : project.brief_description
                          }
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with info */}
        {!loading && !error && projects.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              Click on a project to view its details
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientProjectsModal;


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

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-lg w-full max-w-2xl overflow-hidden">
        {/* Header with close button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/20 rounded-lg">
              <FolderOpen className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Client Projects</h3>
              <p className="text-sm text-gray-300">{clientName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-300 hover:text-white transition-colors p-1 rounded-lg"
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
              <Loader2 className="w-12 h-12 text-teal-400 animate-spin mb-4" />
              <p className="text-gray-200 text-lg">Loading projects...</p>
              <p className="text-gray-400 text-sm mt-2">Fetching all projects for {clientName}</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-red-500/20 rounded-full p-4 mb-4">
                <AlertCircle className="w-10 h-10 text-red-400" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Failed to Load Projects</h4>
              <p className="text-gray-300 text-center mb-4">{error}</p>
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
              <div className="bg-gray-500/20 rounded-full p-4 mb-4">
                <FolderOpen className="w-10 h-10 text-gray-400" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">No Projects Found</h4>
              <p className="text-gray-300 text-center">
                No projects found for <span className="font-medium">{clientName}</span>
              </p>
            </div>
          )}

          {/* Success State - Project List */}
          {!loading && !error && projects.length > 0 && (
            <div className="space-y-3">
              {/* Header info */}
              <div className="mb-4">
                <p className="text-sm text-gray-300">
                  Found <span className="font-semibold text-white">{projects.length}</span> {projects.length === 1 ? 'project' : 'projects'}
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
                        ? 'border-teal-400/50 bg-teal-500/10 shadow-md cursor-default' 
                        : 'border-white/10 bg-white/5 hover:border-teal-400/50 hover:bg-white/10 cursor-pointer'
                      }
                      ${!isCurrentProject && 'focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-gray-900'}
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
                      <h4 className="text-lg font-semibold text-white mb-2">
                        {project.project_name}
                      </h4>
                      
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        {/* Created date */}
                        <div className="flex items-center gap-1 text-gray-300">
                          <Calendar className="w-4 h-4" />
                          <span>Created {formatDate(project.created_at)}</span>
                        </div>
                      </div>

                      {/* Brief description preview (first 100 chars) */}
                      {project.brief_description && (
                        <p className="mt-2 text-sm text-gray-400 line-clamp-2">
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
          <div className="px-6 py-4 border-t border-white/20 bg-black/10">
            <p className="text-xs text-gray-400 text-center">
              Click on a project to view its details
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientProjectsModal;


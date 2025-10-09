import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, FolderOpen, Archive, ArrowRight } from 'lucide-react';
import { ProducerService } from '@/services/producerService';
import { useNotification } from '@/hooks/useNotification';
import ProjectCard from './ProjectCard';
import ProjectSummaryStats, { type ProjectStats } from './ProjectSummaryStats';
import DashboardFilterControls, { type ProjectSortOption } from './DashboardFilterControls';
import SearchBar from '@/components/shared/SearchBar';
import StatusFilter from '@/components/shared/StatusFilter';
import type { Project } from '@/lib/supabase';

export interface ActiveProjectsGridProps {
  /** 
   * Optional limit on number of active projects to display.
   * When provided, only the first N active projects are shown.
   * Archived projects are limited to 3 when projectLimit is provided.
   */
  projectLimit?: number;
  
  /** 
   * Whether to show the project summary statistics section.
   * Default: true
   */
  showStats?: boolean;
}

/**
 * ActiveProjectsGrid - Reusable component for displaying projects in a grid layout
 * 
 * Responsibilities:
 * - Fetches all projects from Supabase
 * - Filters projects into "Active" and "Archived" groups
 * - Renders projects in a responsive grid layout
 * - Handles navigation to project details
 * - Manages loading and error states
 * - Supports limited view (dashboard) and full view (all projects)
 */
const ActiveProjectsGrid: React.FC<ActiveProjectsGridProps> = ({ 
  projectLimit,
  showStats = true 
}) => {
  const navigate = useNavigate();
  const { showError } = useNotification();
  
  // State management
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<ProjectSortOption>('mostRecent');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Filter projects by status group (active vs archived)
  const allActiveProjects = projects.filter(p => 
    ['New', 'In Progress', 'Quoting'].includes(p.project_status)
  );
  
  const allArchivedProjects = projects.filter(p => 
    ['Completed', 'Cancelled'].includes(p.project_status)
  );

  // Apply status filter (specific status or 'all')
  const statusFilteredActiveProjects = useMemo(() => {
    if (selectedStatus === 'all') return allActiveProjects;
    
    return allActiveProjects.filter(project => 
      project.project_status === selectedStatus
    );
  }, [allActiveProjects, selectedStatus]);

  const statusFilteredArchivedProjects = useMemo(() => {
    if (selectedStatus === 'all') return allArchivedProjects;
    
    return allArchivedProjects.filter(project => 
      project.project_status === selectedStatus
    );
  }, [allArchivedProjects, selectedStatus]);

  // Apply search filter (case-insensitive, multi-field)
  const searchFilteredActiveProjects = useMemo(() => {
    if (!searchQuery.trim()) return statusFilteredActiveProjects;
    
    const query = searchQuery.toLowerCase().trim();
    
    return statusFilteredActiveProjects.filter(project => 
      project.project_name.toLowerCase().includes(query) ||
      project.client_name.toLowerCase().includes(query) ||
      project.brief_description.toLowerCase().includes(query)
    );
  }, [statusFilteredActiveProjects, searchQuery]);

  const searchFilteredArchivedProjects = useMemo(() => {
    if (!searchQuery.trim()) return statusFilteredArchivedProjects;
    
    const query = searchQuery.toLowerCase().trim();
    
    return statusFilteredArchivedProjects.filter(project => 
      project.project_name.toLowerCase().includes(query) ||
      project.client_name.toLowerCase().includes(query) ||
      project.brief_description.toLowerCase().includes(query)
    );
  }, [statusFilteredArchivedProjects, searchQuery]);

  // Sort active projects based on selected option (only when in dashboard mode)
  const sortedActiveProjects = useMemo(() => {
    // If not in dashboard mode (no limit), return search-filtered array unsorted
    if (!projectLimit) return searchFilteredActiveProjects;
    
    // Create a copy to avoid mutating the original array
    const sorted = [...searchFilteredActiveProjects];
    
    switch (sortBy) {
      case 'mostRecent':
        // Sort by created_at descending (newest first)
        sorted.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      
      case 'nearingDeadline':
        // Sort by timeline_deadline ascending (closest deadline first)
        // Projects without deadlines appear at the end
        sorted.sort((a, b) => {
          if (!a.timeline_deadline) return 1;  // a goes to end
          if (!b.timeline_deadline) return -1; // b goes to end
          
          return new Date(a.timeline_deadline).getTime() - 
                 new Date(b.timeline_deadline).getTime();
        });
        break;
    }
    
    return sorted;
  }, [searchFilteredActiveProjects, sortBy, projectLimit]);

  // Apply limits if specified (for dashboard view)
  const activeProjects = projectLimit 
    ? sortedActiveProjects.slice(0, projectLimit)
    : searchFilteredActiveProjects;
  
  const archivedProjects = projectLimit 
    ? allArchivedProjects.slice(0, 3) // Always limit to 3 on dashboard
    : searchFilteredArchivedProjects;

  // Track if there are more projects than displayed
  const hasMoreActive = projectLimit && sortedActiveProjects.length > projectLimit;
  const hasMoreArchived = projectLimit && allArchivedProjects.length > 3;

  // Calculate project statistics (always use full dataset)
  const projectStats: ProjectStats = useMemo(() => {
    // Total active projects (from full dataset)
    const totalActive = allActiveProjects.length;

    // Projects awaiting quotes (from full dataset)
    const awaitingQuote = allActiveProjects.filter(p => 
      p.project_status === 'Quoting'
    ).length;

    // Projects nearing deadline (within 7 days, from full dataset)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day for accurate comparison

    const nearingDeadline = allActiveProjects.filter(p => {
      if (!p.timeline_deadline) return false;
      
      const deadline = new Date(p.timeline_deadline);
      deadline.setHours(0, 0, 0, 0); // Reset to start of day
      
      // Check if deadline is between today and 7 days from now
      return deadline >= today && deadline <= sevenDaysFromNow;
    }).length;

    return {
      totalActive,
      awaitingQuote,
      nearingDeadline
    };
  }, [allActiveProjects]);

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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {projectLimit ? 'Dashboard' : 'Projects'}
              </h1>
              <p className="text-gray-600 mt-1">
                {projectLimit 
                  ? 'Your active projects at a glance'
                  : 'Manage and track all your production projects'
                }
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
          
          {/* Search and Filter Controls - only show on All Projects page */}
          {!projectLimit && (
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Bar - takes up more space */}
              <div className="flex-1">
                <SearchBar 
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search by project name, client, or keywords..."
                />
              </div>
              
              {/* Status Filter - fixed width */}
              <div className="sm:w-64">
                <StatusFilter 
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Project Summary Statistics - only show if showStats is true */}
        {showStats && <ProjectSummaryStats stats={projectStats} loading={loading} />}
        
        {/* Dashboard Filter Controls - only show on dashboard */}
        {projectLimit && (
          <DashboardFilterControls 
            sortBy={sortBy} 
            onSortChange={setSortBy}
          />
        )}
        
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
              {searchQuery || selectedStatus !== 'all' ? (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No active projects found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery && selectedStatus !== 'all' ? (
                      <>No active projects match "<span className="font-medium">{searchQuery}</span>" with status "<span className="font-medium">{selectedStatus}</span>"</>
                    ) : searchQuery ? (
                      <>No active projects match "<span className="font-medium">{searchQuery}</span>"</>
                    ) : (
                      <>No active projects with status "<span className="font-medium">{selectedStatus}</span>"</>
                    )}
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedStatus('all');
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Clear Filters
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No active projects</h3>
                  <p className="text-gray-600 mb-4">Get started by creating your first project</p>
                  <button
                    onClick={handleCreateProject}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Create Project
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={handleProjectClick}
                  />
                ))}
              </div>
              
              {/* View All link when projects are limited */}
              {hasMoreActive && (
                <div className="mt-6 text-center">
                  <Link
                    to="/producer/projects"
                    className="inline-flex items-center gap-2 px-4 py-2 text-teal-600 hover:text-teal-700 font-medium transition-colors"
                  >
                    View All {allActiveProjects.length} Active Projects
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </>
          )}
        </section>

        {/* Archived Projects Section */}
        {(archivedProjects.length > 0 || (!projectLimit && (searchQuery || selectedStatus !== 'all'))) && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Archive className="w-6 h-6 text-gray-600" />
              <h2 className="text-2xl font-bold text-gray-900">Archived</h2>
              <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 text-sm font-semibold rounded-full">
                {archivedProjects.length}
              </span>
            </div>

            {archivedProjects.length === 0 && (searchQuery || selectedStatus !== 'all') ? (
              <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                <Archive className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No archived projects found
                </h3>
                <p className="text-gray-600">
                  {searchQuery && selectedStatus !== 'all' ? (
                    <>No archived projects match "<span className="font-medium">{searchQuery}</span>" with status "<span className="font-medium">{selectedStatus}</span>"</>
                  ) : searchQuery ? (
                    <>No archived projects match "<span className="font-medium">{searchQuery}</span>"</>
                  ) : (
                    <>No archived projects with status "<span className="font-medium">{selectedStatus}</span>"</>
                  )}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {archivedProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={handleProjectClick}
                    />
                  ))}
                </div>
                
                {/* View All link when archived projects are limited */}
                {hasMoreArchived && (
                  <div className="mt-6 text-center">
                    <Link
                      to="/producer/projects"
                      className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-700 font-medium transition-colors"
                    >
                      View All {allArchivedProjects.length} Archived Projects
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default ActiveProjectsGrid;


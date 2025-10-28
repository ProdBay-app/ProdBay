import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Plus, FolderOpen, Archive, ArrowRight } from 'lucide-react';
import { ProducerService, type ProjectFormData } from '@/services/producerService';
import { RailwayApiService } from '@/services/railwayApiService';
import { useNotification } from '@/hooks/useNotification';
import ProjectCard from './ProjectCard';
import ProjectSummaryStats, { type ProjectStats } from './ProjectSummaryStats';
import DashboardFilterControls, { type ProjectSortOption } from './DashboardFilterControls';
import SearchBar from '@/components/shared/SearchBar';
import StatusFilter from '@/components/shared/StatusFilter';
import SortControl from '@/components/shared/SortControl';
import ProjectModal from './ProjectModal';
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
  const location = useLocation();
  const { showError, showSuccess, showWarning } = useNotification();
  
  // State management - Projects list
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<ProjectSortOption>('mostRecent');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // State management - Project creation modal
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);
  const [projectForm, setProjectForm] = useState<ProjectFormData>({
    project_name: '',
    client_name: '',
    brief_description: '',
    physical_parameters: '',
    financial_parameters: undefined,
    timeline_deadline: ''
  });
  const [allocationMethod, setAllocationMethod] = useState<'static' | 'ai'>('static');
  
  // State management - PDF upload
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);
  const [uploadedPdfFile, setUploadedPdfFile] = useState<File | null>(null);
  
  // State management - AI brief analysis
  const [isAnalyzingBrief, setIsAnalyzingBrief] = useState(false);

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

  // Sort active projects based on selected option (applies to all views)
  const sortedActiveProjects = useMemo(() => {
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
  }, [searchFilteredActiveProjects, sortBy]);

  // Sort archived projects based on selected option (applies to all views)
  const sortedArchivedProjects = useMemo(() => {
    // Create a copy to avoid mutating the original array
    const sorted = [...searchFilteredArchivedProjects];
    
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
  }, [searchFilteredArchivedProjects, sortBy]);

  // Apply limits if specified (for dashboard view)
  const activeProjects = projectLimit 
    ? sortedActiveProjects.slice(0, projectLimit)
    : sortedActiveProjects;
  
  const archivedProjects = projectLimit 
    ? sortedArchivedProjects.slice(0, 3) // Always limit to 3 on dashboard
    : sortedArchivedProjects;

  // Track if there are more projects than displayed
  const hasMoreActive = projectLimit && sortedActiveProjects.length > projectLimit;
  const hasMoreArchived = projectLimit && sortedArchivedProjects.length > 3;

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

  // Handle navigation state - open modal if requested via navigation
  useEffect(() => {
    const state = location.state as { openCreateProjectModal?: boolean } | null;
    
    // Only trigger if the flag is present and modal is not already open
    if (state?.openCreateProjectModal && !showProjectModal) {
      // Initialize the form for creating a new project
      setIsEditingProject(false);
      setProjectForm({
        project_name: '',
        client_name: '',
        brief_description: '',
        physical_parameters: '',
        financial_parameters: undefined,
        timeline_deadline: ''
      });
      setAllocationMethod('static');
      setShowProjectModal(true);
      
      // Clear the navigation state to prevent re-opening modal on subsequent renders
      // We use replace to avoid adding to browser history
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, showProjectModal, navigate]);

  // Handle project card click - navigate to project detail page
  const handleProjectClick = useCallback((project: Project) => {
    // Navigate to the dedicated project detail page
    navigate(`/producer/projects/${project.id}`);
  }, [navigate]);

  // ========================================
  // PROJECT MODAL HANDLERS
  // ========================================

  /**
   * Opens the project creation modal with a clean form state.
   * This is called when user clicks "New Project" button.
   */
  const openCreateProject = useCallback(() => {
    setIsEditingProject(false);
    setProjectForm({
      project_name: '',
      client_name: '',
      brief_description: '',
      physical_parameters: '',
      financial_parameters: undefined,
      timeline_deadline: ''
    });
    setAllocationMethod('static');
    setShowProjectModal(true);
  }, []);

  /**
   * Closes the project modal and resets all related state.
   * Cleans up form data and submission states to prevent stale data.
   */
  const closeProjectModal = useCallback(() => {
    setShowProjectModal(false);
    setIsEditingProject(false);
    setIsSubmittingProject(false);
    // Reset PDF upload state
    setIsUploadingPdf(false);
    setUploadError(null);
    setUploadedFilename(null);
    // Optional: Reset form to prevent showing old data if modal reopens
    setProjectForm({
      project_name: '',
      client_name: '',
      brief_description: '',
      physical_parameters: '',
      financial_parameters: undefined,
      timeline_deadline: ''
    });
  }, []);

  /**
   * Updates a single field in the project form.
   * Handles special case for financial_parameters which needs number conversion.
   * 
   * @param field - The field name to update
   * @param value - The new value (string, number, or undefined)
   */
  const updateProjectForm = useCallback((field: keyof ProjectFormData, value: string | number | undefined) => {
    setProjectForm(prev => ({
      ...prev,
      [field]: field === 'financial_parameters' 
        ? (value === '' ? undefined : Number(value))
        : value
    }));
  }, []);

  /**
   * Handles PDF brief upload and text extraction.
   * 
   * Flow:
   * 1. Uploads PDF to Railway backend
   * 2. Backend extracts text using pdf-parse
   * 3. Updates brief_description field with extracted text
   * 4. Shows success/error notifications
   * 
   * @param file - The PDF file to upload
   */
  const handlePdfUpload = useCallback(async (file: File) => {
    setIsUploadingPdf(true);
    setUploadError(null);
    
    try {
      // Create FormData for multipart/form-data upload
      const formData = new FormData();
      formData.append('pdf', file);
      
      // Get Railway backend URL from environment
      const railwayUrl = import.meta.env.VITE_RAILWAY_API_URL || 'http://localhost:3000';
      
      // Send PDF to Railway backend
      const response = await fetch(`${railwayUrl}/api/extract-text-from-pdf`, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to extract text from PDF');
      }
      
      // Extract the text from the response
      const extractedText = result.data?.text;
      
      if (!extractedText) {
        throw new Error('No text was extracted from the PDF');
      }
      
      // Update the brief description field with extracted text
      updateProjectForm('brief_description', extractedText);
      
      // Update success state
      setUploadedFilename(file.name);
      setUploadedPdfFile(file); // Store the original PDF file for download
      showSuccess(`Text extracted from ${file.name}!`);
      
    } catch (error) {
      console.error('PDF upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process PDF';
      setUploadError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsUploadingPdf(false);
    }
  }, [updateProjectForm, showSuccess, showError]);

  /**
   * Handles PDF download functionality.
   * 
   * Uses native browser APIs to trigger a file download of the original PDF.
   * 
   * @param file - The PDF file to download
   */
  const handlePdfDownload = useCallback((file: File) => {
    try {
      // Create a blob URL from the file
      const blobUrl = URL.createObjectURL(file);
      
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = file.name; // Use the original filename
      
      // Append to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL to prevent memory leaks
      URL.revokeObjectURL(blobUrl);
      
      showSuccess(`Downloaded ${file.name}`);
    } catch (error) {
      console.error('PDF download error:', error);
      showError('Failed to download PDF file');
    }
  }, [showSuccess, showError]);

  /**
   * Handles AI-powered brief analysis to extract project highlights.
   * 
   * Flow:
   * 1. Sends brief text to Railway AI endpoint
   * 2. AI analyzes and extracts: project name, client name, budget, deadline, physical parameters
   * 3. Auto-populates form fields with extracted data
   * 4. Shows success/error notifications
   */
  const handleAnalyzeBrief = useCallback(async () => {
    // Validate that there's a brief to analyze
    if (!projectForm.brief_description || projectForm.brief_description.trim().length === 0) {
      showWarning('Please enter a project brief first');
      return;
    }

    setIsAnalyzingBrief(true);
    
    try {
      // Get Railway backend URL from environment
      const railwayUrl = import.meta.env.VITE_RAILWAY_API_URL || 'http://localhost:3000';
      
      // Send brief to AI endpoint
      const response = await fetch(`${railwayUrl}/api/ai/extract-highlights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          briefText: projectForm.brief_description
        })
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to analyze brief');
      }
      
      // Extract the highlights from the response
      const highlights = result.data;
      
      if (!highlights) {
        throw new Error('No highlights were extracted from the brief');
      }
      
      // Count how many fields we're populating
      let populatedCount = 0;
      
      // Update form fields with extracted data (only if not null)
      if (highlights.projectName) {
        updateProjectForm('project_name', highlights.projectName);
        populatedCount++;
      }
      
      if (highlights.clientName) {
        updateProjectForm('client_name', highlights.clientName);
        populatedCount++;
      }
      
      if (highlights.budget !== null && highlights.budget !== undefined) {
        updateProjectForm('financial_parameters', highlights.budget);
        populatedCount++;
      }
      
      if (highlights.deadline) {
        updateProjectForm('timeline_deadline', highlights.deadline);
        populatedCount++;
      }
      
      if (highlights.physicalParameters) {
        updateProjectForm('physical_parameters', highlights.physicalParameters);
        populatedCount++;
      }
      
      // Show success message
      if (populatedCount > 0) {
        showSuccess(`AI analysis complete! ${populatedCount} field${populatedCount !== 1 ? 's' : ''} auto-populated.`);
      } else {
        showWarning('AI analysis complete, but no specific information could be extracted. Please fill in the fields manually.');
      }
      
    } catch (error) {
      console.error('AI brief analysis error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze brief';
      showError(errorMessage);
    } finally {
      setIsAnalyzingBrief(false);
    }
  }, [projectForm.brief_description, updateProjectForm, showSuccess, showWarning, showError]);

  /**
   * Handles project form submission (create new project).
   * 
   * Flow:
   * 1. Creates project in Supabase
   * 2. If brief is provided, sends to Railway API for processing
   * 3. Railway API creates assets based on allocation method (static or AI)
   * 4. Redirects user to the new project's dedicated page
   * 
   * @param e - Form submit event
   */
  const submitProjectForm = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProject(true);
    
    try {
      // Step 1: Create the project in Supabase
      const createdProject = await ProducerService.createProject(projectForm);
      
      // Step 2: Process the brief if provided (optional but recommended)
      if (projectForm.brief_description.trim()) {
        try {
          const briefResult = await RailwayApiService.processBrief(
            createdProject.id,
            projectForm.brief_description,
            {
              allocationMethod: allocationMethod,
              projectContext: {
                financial_parameters: projectForm.financial_parameters,
                timeline_deadline: projectForm.timeline_deadline,
                physical_parameters: projectForm.physical_parameters
              }
            }
          );
          
          // Check if brief processing succeeded
          if (!briefResult.success) {
            console.warn('Brief processing failed:', briefResult.error?.message);
            showWarning(
              `Project created successfully, but brief processing failed: ${briefResult.error?.message}. You can manually create assets later.`
            );
          }
          // Note: Success notifications removed - redirect provides better feedback
        } catch (briefError) {
          // Brief processing failed but project was created
          console.error('Brief processing error:', briefError);
          showWarning('Project created successfully, but brief processing failed. You can manually create assets later.');
        }
      }
      
      // Step 3: Redirect to the new project's dedicated page
      // This provides immediate, actionable feedback and completes the creation-to-management flow
      navigate(`/producer/projects/${createdProject.id}`);
      // Note: Modal closes automatically as component unmounts during navigation
      
    } catch (err) {
      // Failed to create project in Supabase
      console.error('Failed to create project:', err);
      showError('Failed to create project. Please try again.');
    } finally {
      setIsSubmittingProject(false);
    }
  }, [projectForm, allocationMethod, navigate, showWarning, showError]);

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
              onClick={openCreateProject}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              New Project
            </button>
          </div>
          
          {/* Search, Filter, and Sort Controls - only show on All Projects page */}
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
              
              {/* Status Filter and Sort Control - side by side on desktop */}
              <div className="flex flex-col sm:flex-row gap-4 sm:w-auto">
                <div className="sm:w-48">
                  <StatusFilter 
                    value={selectedStatus}
                    onChange={setSelectedStatus}
                  />
                </div>
                <div className="sm:w-48">
                  <SortControl 
                    value={sortBy}
                    onChange={setSortBy}
                  />
                </div>
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
                    onClick={openCreateProject}
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

      {/* Project Creation Modal */}
      <ProjectModal
        isOpen={showProjectModal}
        isEditing={isEditingProject}
        isSubmitting={isSubmittingProject}
        projectForm={projectForm}
        allocationMethod={allocationMethod}
        onClose={closeProjectModal}
        onSubmit={submitProjectForm}
        onFormChange={updateProjectForm}
        onAllocationMethodChange={setAllocationMethod}
        onPdfUpload={handlePdfUpload}
        isUploadingPdf={isUploadingPdf}
        uploadError={uploadError}
        uploadedFilename={uploadedFilename}
        uploadedPdfFile={uploadedPdfFile}
        onPdfDownload={handlePdfDownload}
        onAnalyzeBrief={handleAnalyzeBrief}
        isAnalyzingBrief={isAnalyzingBrief}
      />
    </div>
  );
};

export default ActiveProjectsGrid;


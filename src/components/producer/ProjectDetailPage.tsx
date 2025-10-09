import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  DollarSign, 
  Clock,
  AlertCircle 
} from 'lucide-react';
import { ProducerService } from '@/services/producerService';
import { useNotification } from '@/hooks/useNotification';
import AssetList from './AssetList';
import EditableBrief from './EditableBrief';
import type { Project } from '@/lib/supabase';

/**
 * ProjectDetailPage - Comprehensive page for displaying and managing project information
 * 
 * Features:
 * - Route structure (/producer/projects/:projectId)
 * - Dynamic two-column responsive layout with expand/collapse
 * - Data fetching for a single project
 * - Editable project brief with auto-save
 * - Asset management (Kanban board)
 * - Quote management integration
 */
const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { showError } = useNotification();

  // State management
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBriefExpanded, setIsBriefExpanded] = useState(false);

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) {
        setError('No project ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const projectData = await ProducerService.getProjectById(projectId);
        
        if (!projectData) {
          setError('Project not found');
          showError('Project not found');
        } else {
          setProject(projectData);
        }
      } catch (err) {
        console.error('Error fetching project:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load project';
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId, showError]);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Not set';
    
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading project details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'Project Not Found'}
          </h2>
          <p className="text-gray-600 mb-6">
            The project you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/producer/projects')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <>
      {/* Header with breadcrumbs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Link 
              to="/producer/dashboard" 
              className="hover:text-teal-600 transition-colors"
            >
              Dashboard
            </Link>
            <span>/</span>
            <Link 
              to="/producer/projects" 
              className="hover:text-teal-600 transition-colors"
            >
              Projects
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{project.project_name}</span>
          </nav>

          {/* Page title and back button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/producer/projects')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Back to projects"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {project.project_name}
                </h1>
                <p className="text-gray-600 mt-1">Project Details</p>
              </div>
            </div>
            
            {/* Status badge */}
            <span 
              className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusBadgeColor(project.project_status)}`}
            >
              {project.project_status}
            </span>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dynamic grid: 66/33 split (collapsed) or 50/50 split (expanded) */}
        <div className={`grid grid-cols-1 gap-8 transition-all duration-300 ${isBriefExpanded ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}`}>
          
          {/* LEFT COLUMN - Main content (Overview & Assets) */}
          <div className={`space-y-6 ${isBriefExpanded ? 'lg:col-span-1' : 'lg:col-span-2'}`}>
            
            {/* Overview Section */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Overview</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Client Name */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Client</p>
                    <p className="text-lg font-semibold text-gray-900">{project.client_name}</p>
                  </div>
                </div>

                {/* Budget */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Budget</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(project.financial_parameters ?? 0)}
                    </p>
                  </div>
                </div>

                {/* Deadline */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Deadline</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(project.timeline_deadline ?? null)}
                    </p>
                  </div>
                </div>

                {/* Created Date */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Clock className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Created</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(project.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Assets Section - Kanban Board */}
            <AssetList projectId={project.id} />
          </div>

          {/* RIGHT COLUMN - Brief */}
          <div className="lg:col-span-1">
            <EditableBrief
              projectId={project.id}
              briefDescription={project.brief_description}
              physicalParameters={project.physical_parameters ?? ''}
              isExpanded={isBriefExpanded}
              onToggleExpand={() => setIsBriefExpanded(prev => !prev)}
              onBriefUpdate={(briefDesc, physicalParams) => {
                // Optimistically update local project state
                setProject(prev => prev ? {
                  ...prev,
                  brief_description: briefDesc,
                  physical_parameters: physicalParams
                } : null);
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectDetailPage;


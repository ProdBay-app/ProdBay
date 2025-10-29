import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  DollarSign, 
  Clock,
  AlertCircle,
  CheckSquare,
  Users as UsersIcon
} from 'lucide-react';
import { ProducerService } from '@/services/producerService';
import { ProjectSummaryService } from '@/services/projectSummaryService';
import { useNotification } from '@/hooks/useNotification';
import AssetList from './AssetList';
import EditableBrief from './EditableBrief';
import BudgetTrackingBar from './widgets/BudgetTrackingBar';
import TimelineWidget from './widgets/TimelineWidget';
import ActionCounter from './widgets/ActionCounter';
import ClientProjectsModal from './ClientProjectsModal';
import BudgetAssetsModal from './BudgetAssetsModal';
import MilestoneFormModal from './MilestoneFormModal';
import AssetDetailModal from './AssetDetailModal';
import AssetFormModal from './AssetFormModal';
import ConfirmationModal from '@/components/shared/ConfirmationModal';
import SummaryCard from '@/components/shared/SummaryCard';
import DetailView from '@/components/shared/DetailView';
import type { Project, Asset } from '@/lib/supabase';
import type { ProjectTrackingSummary, ProjectMilestone } from '@/types/database';
import type { MilestoneFormData } from './MilestoneFormModal';

/**
 * ProjectDetailPage - Comprehensive page for displaying and managing project information
 * 
 * Features:
 * - Route structure (/producer/projects/:projectId)
 * - Interactive expandable card layout with four main sections
 * - Summary cards for Overview, Budget, Timeline, and Actions
 * - Detailed views that expand based on user selection
 * - Data fetching for a single project with real-time tracking
 * - Editable project brief with auto-save
 * - Asset management (Kanban board)
 * - Quote management integration
 * - Milestone management with CRUD operations
 * - Responsive design with mobile-first approach
 */
const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { showError, showSuccess } = useNotification();

  // State management
  const [project, setProject] = useState<Project | null>(null);
  const [trackingSummary, setTrackingSummary] = useState<ProjectTrackingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTracking, setLoadingTracking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBriefExpanded, setIsBriefExpanded] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  // Active section state for expandable card layout
  type ActiveSection = 'Overview' | 'Budget' | 'Timeline' | 'Actions';
  const [activeSection, setActiveSection] = useState<ActiveSection>('Overview');
  
  // Mobile detection and touch gesture state
  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Animation variants for staggered content animations - disabled for expanded sections
  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: { duration: 0 }
    }
  };

  const itemVariants = {
    hidden: {
      opacity: 1,
      y: 0
    },
    visible: {
      opacity: 1,
      y: 0
    }
  };

  // Milestone management state
  const [isMilestoneFormOpen, setIsMilestoneFormOpen] = useState(false);
  const [milestoneFormMode, setMilestoneFormMode] = useState<'create' | 'edit'>('create');
  const [editingMilestone, setEditingMilestone] = useState<ProjectMilestone | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingMilestone, setDeletingMilestone] = useState<ProjectMilestone | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Interactive brief state
  const [hoveredAssetId, setHoveredAssetId] = useState<string | null>(null);
  const [viewingAsset, setViewingAsset] = useState<Asset | null>(null);
  const [isAssetDetailModalOpen, setIsAssetDetailModalOpen] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Ref for measuring Assets block height
  const assetsBlockRef = useRef<HTMLDivElement>(null);
  const [assetsBlockHeight, setAssetsBlockHeight] = useState<number>(0);

  // Mobile detection and reduced motion preference
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    const checkReducedMotion = () => {
      setPrefersReducedMotion(
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      );
    };
    
    checkMobile();
    checkReducedMotion();
    
    window.addEventListener('resize', checkMobile);
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', checkReducedMotion);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      mediaQuery.removeEventListener('change', checkReducedMotion);
    };
  }, []);

  // Touch gesture handlers for mobile navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!isMobile || !touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe || isRightSwipe) {
      const sections: ActiveSection[] = ['Overview', 'Budget', 'Timeline', 'Actions'];
      const currentIndex = sections.indexOf(activeSection);
      
      if (isLeftSwipe && currentIndex < sections.length - 1) {
        setActiveSection(sections[currentIndex + 1]);
      } else if (isRightSwipe && currentIndex > 0) {
        setActiveSection(sections[currentIndex - 1]);
      }
    }
  };

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

  // Fetch tracking summary data
  useEffect(() => {
    const fetchTrackingSummary = async () => {
      if (!projectId) {
        setLoadingTracking(false);
        return;
      }

      try {
        setLoadingTracking(true);
        const summary = await ProjectSummaryService.getProjectTrackingSummary(projectId);
        setTrackingSummary(summary);
      } catch (err) {
        console.error('Error fetching tracking summary:', err);
        // Don't show error to user - tracking widgets are non-critical
        // Just fail silently and show empty state
        setTrackingSummary(null);
      } finally {
        setLoadingTracking(false);
      }
    };

    fetchTrackingSummary();
  }, [projectId]);

  // Fetch assets for interactive brief
  useEffect(() => {
    const fetchAssets = async () => {
      if (!projectId) return;

      try {
        const assetsData = await ProducerService.getAssetsByProjectId(projectId);
        setAssets(assetsData);
      } catch (err) {
        console.error('Error fetching assets for brief:', err);
        // Silently fail - brief will just not have interactive highlights
        setAssets([]);
      }
    };

    fetchAssets();
  }, [projectId]);

  // Measure Assets block height when brief is expanded
  useEffect(() => {
    if (isBriefExpanded && assetsBlockRef.current) {
      const height = assetsBlockRef.current.offsetHeight;
      setAssetsBlockHeight(height);
    }
  }, [isBriefExpanded, assets]);

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

  // ========================================
  // INTERACTIVE BRIEF FUNCTIONS
  // ========================================

  /**
   * Handle clicking on highlighted asset text in brief
   * Opens the asset detail modal with the clicked asset
   */
  const handleAssetClick = (asset: Asset) => {
    setViewingAsset(asset);
    setIsAssetDetailModalOpen(true);
  };

  // Handle filter toggle
  const handleToggleFilters = () => {
    setShowFilters(prev => !prev);
  };

  // Handle add asset button
  const handleAddAsset = () => {
    setIsAddModalOpen(true);
  };

  // Handle asset creation from modal
  const handleCreateAsset = async (assetData: { 
    asset_name: string; 
    specifications: string;
    quantity?: number;
    tags?: string[];
  }) => {
    try {
      // Create asset via API
      if (!project) return;
      const newAsset = await ProducerService.createAsset(project.id, {
        asset_name: assetData.asset_name,
        specifications: assetData.specifications,
        status: 'Pending',
        timeline: '',
        assigned_supplier_id: undefined,
        quantity: assetData.quantity,
        tags: assetData.tags || []
      });

      // Add to local assets state
      setAssets(prev => [...prev, newAsset]);

      // Close modal
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Error creating asset:', err);
      // Error handling could be improved with a notification system
    }
  };

  /**
   * Handle asset updates from the detail modal
   * Refreshes the asset in the local assets array
   */
  const handleAssetUpdate = (updatedAsset: Asset) => {
    setAssets(prevAssets =>
      prevAssets.map(a => (a.id === updatedAsset.id ? updatedAsset : a))
    );
    // Also update viewingAsset if it's the same asset
    if (viewingAsset?.id === updatedAsset.id) {
      setViewingAsset(updatedAsset);
    }
  };

  // ========================================
  // END INTERACTIVE BRIEF
  // ========================================

  // ========================================
  // MILESTONE MANAGEMENT FUNCTIONS
  // ========================================

  /**
   * Refresh tracking summary data after milestone operations
   * Re-fetches the entire tracking summary to ensure all widgets update
   */
  const refreshTrackingSummary = async () => {
    if (!projectId) return;
    
    try {
      const summary = await ProjectSummaryService.getProjectTrackingSummary(projectId);
      setTrackingSummary(summary);
    } catch (err) {
      console.error('Error refreshing tracking summary:', err);
      // Don't show error to user - it's a background refresh
    }
  };

  /**
   * Open milestone form modal in create mode
   */
  const handleAddMilestoneClick = () => {
    setMilestoneFormMode('create');
    setEditingMilestone(null);
    setIsMilestoneFormOpen(true);
  };

  /**
   * Open milestone form modal in edit mode with pre-populated data
   */
  const handleEditMilestoneClick = (milestone: ProjectMilestone) => {
    setMilestoneFormMode('edit');
    setEditingMilestone(milestone);
    setIsMilestoneFormOpen(true);
  };

  /**
   * Open delete confirmation modal
   */
  const handleDeleteMilestoneClick = (milestone: ProjectMilestone) => {
    setDeletingMilestone(milestone);
    setIsDeleteModalOpen(true);
  };

  /**
   * Handle milestone form submission (create or update)
   */
  const handleMilestoneFormSubmit = async (formData: MilestoneFormData) => {
    if (!projectId) return;

    setIsSubmitting(true);
    try {
      if (milestoneFormMode === 'edit' && editingMilestone) {
        // Update existing milestone
        await ProjectSummaryService.updateMilestone(editingMilestone.id, {
          name: formData.milestone_name,
          date: formData.milestone_date,
          description: formData.description,
          status: formData.status
        });
        showSuccess(`Milestone "${formData.milestone_name}" updated successfully!`);
      } else {
        // Create new milestone
        await ProjectSummaryService.createMilestone(projectId, {
          name: formData.milestone_name,
          date: formData.milestone_date,
          description: formData.description
        });
        showSuccess(`Milestone "${formData.milestone_name}" created successfully!`);
      }

      // Refresh the timeline to show updated data
      await refreshTrackingSummary();

      // Close modal on success
      setIsMilestoneFormOpen(false);
      setEditingMilestone(null);
    } catch (err) {
      console.error('Error saving milestone:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save milestone';
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle delete confirmation
   */
  const handleConfirmDelete = async () => {
    if (!deletingMilestone) return;

    setIsDeleting(true);
    try {
      // Delete milestone from database
      await ProjectSummaryService.deleteMilestone(deletingMilestone.id);

      // Refresh the timeline to remove deleted milestone
      await refreshTrackingSummary();

      // Close modal and show success
      setIsDeleteModalOpen(false);
      showSuccess(`Milestone "${deletingMilestone.milestone_name}" deleted successfully!`);
    } catch (err) {
      console.error('Error deleting milestone:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete milestone';
      showError(errorMessage);
    } finally {
      setIsDeleting(false);
      setDeletingMilestone(null);
    }
  };

  // ========================================
  // END MILESTONE MANAGEMENT
  // ========================================

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
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Page title */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {project.project_name}
              </h1>
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

      {/* Expandable Card Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Summary Cards Row */}
        <div className={`grid gap-4 mb-8 ${
          isMobile 
            ? 'grid-cols-2 gap-3' 
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
        }`}>
          <SummaryCard
            title="Overview"
            isActive={activeSection === 'Overview'}
            onClick={() => setActiveSection('Overview')}
            isMobile={isMobile}
            prefersReducedMotion={prefersReducedMotion}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-medium">{project.client_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-xs">
                  {formatDate(project.timeline_deadline ?? null)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-xs">{formatCurrency(project.financial_parameters ?? 0)}</span>
              </div>
            </div>
          </SummaryCard>

          <SummaryCard
            title="Budget"
            isActive={activeSection === 'Budget'}
            onClick={() => setActiveSection('Budget')}
            isMobile={isMobile}
            prefersReducedMotion={prefersReducedMotion}
          >
            <div className="space-y-3">
              {/* Total Budget */}
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium">
                  {trackingSummary ? formatCurrency(trackingSummary.budget.total) : 'Loading...'}
                </span>
              </div>
              
              {/* Progress Bar */}
              {trackingSummary && (
                <div className="w-full">
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ease-out rounded-full ${
                        trackingSummary.budget.percentageUsed >= 90
                          ? 'bg-red-500'
                          : trackingSummary.budget.percentageUsed >= 70
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(trackingSummary.budget.percentageUsed, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-600">
                      {trackingSummary.budget.percentageUsed.toFixed(1)}% used
                    </span>
                    <span className={`text-xs font-medium ${
                      trackingSummary.budget.remaining < 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {formatCurrency(trackingSummary.budget.remaining)} remaining
                    </span>
                  </div>
                </div>
              )}
              
              {/* Loading State */}
              {!trackingSummary && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="h-full bg-gray-300 rounded-full animate-pulse" style={{ width: '30%' }} />
                </div>
              )}
            </div>
          </SummaryCard>

          <SummaryCard
            title="Timeline"
            isActive={activeSection === 'Timeline'}
            onClick={() => setActiveSection('Timeline')}
            isMobile={isMobile}
            prefersReducedMotion={prefersReducedMotion}
          >
            <div className="space-y-2">
              {/* Start Date */}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-600" />
                <span className="text-xs font-medium">Started</span>
                <span className="text-xs text-gray-600">
                  {formatDate(project.created_at)}
                </span>
              </div>
              
              {/* Deadline */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium">Deadline</span>
                <span className="text-xs text-gray-600">
                  {formatDate(project.timeline_deadline ?? null)}
                </span>
              </div>
              
              {/* Days Remaining */}
              {trackingSummary?.timeline.daysRemaining !== null && trackingSummary?.timeline.daysRemaining !== undefined && (
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${
                    trackingSummary.timeline.daysRemaining < 0 
                      ? 'text-red-600' 
                      : trackingSummary.timeline.daysRemaining <= 7 
                      ? 'text-orange-600' 
                      : 'text-green-600'
                  }`}>
                    {trackingSummary.timeline.daysRemaining < 0 
                      ? `${Math.abs(trackingSummary.timeline.daysRemaining)} days overdue`
                      : `${trackingSummary.timeline.daysRemaining} days left`
                    }
                  </span>
                </div>
              )}
              
              {/* Milestone Count */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {trackingSummary?.timeline.milestones.length || 0} milestones
                </span>
              </div>
            </div>
          </SummaryCard>

          <SummaryCard
            title="Actions"
            isActive={activeSection === 'Actions'}
            onClick={() => setActiveSection('Actions')}
            isMobile={isMobile}
            prefersReducedMotion={prefersReducedMotion}
          >
            <div className="space-y-2">
              {/* Your Actions */}
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium">Your Actions</span>
                <span className={`text-xs font-bold ${
                  trackingSummary && trackingSummary.actions.producerActions > 0 
                    ? 'text-orange-600' 
                    : 'text-gray-600'
                }`}>
                  {trackingSummary ? trackingSummary.actions.producerActions : '0'}
                </span>
              </div>
              
              {/* Their Actions */}
              <div className="flex items-center gap-2">
                <UsersIcon className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-medium">Their Actions</span>
                <span className={`text-xs font-bold ${
                  trackingSummary && trackingSummary.actions.supplierActions > 0 
                    ? 'text-orange-600' 
                    : 'text-gray-600'
                }`}>
                  {trackingSummary ? trackingSummary.actions.supplierActions : '0'}
                </span>
              </div>
              
              {/* Total Pending Actions */}
              <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                <AlertCircle className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-600">Total Pending</span>
                <span className={`text-xs font-bold ${
                  trackingSummary && (trackingSummary.actions.producerActions + trackingSummary.actions.supplierActions) > 0 
                    ? 'text-orange-600' 
                    : 'text-gray-600'
                }`}>
                  {trackingSummary 
                    ? trackingSummary.actions.producerActions + trackingSummary.actions.supplierActions 
                    : '0'
                  }
                </span>
              </div>
            </div>
          </SummaryCard>
        </div>

        {/* Mobile Navigation Indicator */}
        {isMobile && (
          <div className="flex justify-center mb-4">
            <div className="flex space-x-2">
              {['Overview', 'Budget', 'Timeline', 'Actions'].map((section) => (
                <div
                  key={section}
                  className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                    activeSection === section 
                      ? 'bg-teal-500' 
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 ml-3 mt-0.5">Swipe to navigate</p>
          </div>
        )}

        {/* Detail View Area - Unified expanded block container */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="touch-pan-y"
        >
          {/* Single DetailView container - always rendered for consistent sizing */}
          <DetailView isMobile={isMobile} prefersReducedMotion={true}>
            <AnimatePresence mode="wait">
              {activeSection === 'Overview' && (
                <motion.div 
                  key="overview"
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  {/* Client Name */}
                  <motion.div 
                    className="flex items-start gap-3"
                    variants={itemVariants}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <User className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-1">Client</p>
                      <button
                        onClick={() => setIsClientModalOpen(true)}
                        className="text-lg font-semibold text-teal-600 hover:text-teal-700 hover:underline transition-colors text-left"
                        title={`View all projects for ${project.client_name}`}
                      >
                        {project.client_name}
                      </button>
                    </div>
                  </motion.div>

                  {/* Budget */}
                  <motion.div 
                    className="flex items-start gap-3"
                    variants={itemVariants}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-1">Budget</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(project.financial_parameters ?? 0)}
                      </p>
                    </div>
                  </motion.div>

                  {/* Deadline */}
                  <motion.div 
                    className="flex items-start gap-3"
                    variants={itemVariants}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-1">Deadline</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatDate(project.timeline_deadline ?? null)}
                      </p>
                    </div>
                  </motion.div>

                  {/* Created Date */}
                  <motion.div 
                    className="flex items-start gap-3"
                    variants={itemVariants}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Clock className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-1">Created</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatDate(project.created_at)}
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {activeSection === 'Budget' && (
                <motion.div
                  key="budget"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  {!loadingTracking && trackingSummary ? (
                    <div className="space-y-6">
                      <BudgetTrackingBar
                        total={trackingSummary.budget.total}
                        spent={trackingSummary.budget.spent}
                        remaining={trackingSummary.budget.remaining}
                        percentageUsed={trackingSummary.budget.percentageUsed}
                        onClick={() => setIsBudgetModalOpen(true)}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-500 border-t-transparent mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading budget information...</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeSection === 'Timeline' && (
                <motion.div
                  key="timeline"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  {!loadingTracking && trackingSummary ? (
                    <TimelineWidget
                      deadline={trackingSummary.timeline.deadline}
                      daysRemaining={trackingSummary.timeline.daysRemaining}
                      milestones={trackingSummary.timeline.milestones}
                      onAddMilestone={handleAddMilestoneClick}
                      onEditMilestone={handleEditMilestoneClick}
                      onDeleteMilestone={handleDeleteMilestoneClick}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-500 border-t-transparent mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading timeline information...</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeSection === 'Actions' && (
                <motion.div
                  key="actions"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  {!loadingTracking && trackingSummary ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ActionCounter
                        label="Your Actions"
                        count={trackingSummary.actions.producerActions}
                        icon={CheckSquare}
                        iconColor="text-blue-600"
                        bgColor="bg-blue-100"
                        description="Tasks requiring your attention"
                      />
                      
                      <ActionCounter
                        label="Their Actions"
                        count={trackingSummary.actions.supplierActions}
                        icon={UsersIcon}
                        iconColor="text-purple-600"
                        bgColor="bg-purple-100"
                        description="Pending supplier responses"
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-500 border-t-transparent mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading action items...</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </DetailView>
        </div>

        {/* Assets and Brief Section - Layout matching reference image */}
        <div className="mt-8">
          
          {/* Top Row - Asset Headers & Filters + Brief Header (always visible) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            
            {/* Asset Headers & Filters Section */}
            <div className="lg:col-span-2">
              <div className="bg-orange-100 border border-orange-200 rounded-lg p-6 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-orange-800">Assets ({assets.length})</h3>
                  </div>
                  
                  {/* Filters and Add Asset buttons moved here */}
                  <div className="flex items-center gap-3">
                    {/* Filter Toggle Button */}
                    <button
                      onClick={handleToggleFilters}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-white border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      Filters
                    </button>

                    {/* Add Asset Button */}
                    <button 
                      onClick={handleAddAsset}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm font-medium"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Asset
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Brief Header - Always visible in top row */}
            <div className="lg:col-span-1">
              <EditableBrief
                projectId={project.id}
                briefDescription={project.brief_description}
                physicalParameters={project.physical_parameters ?? ''}
                isExpanded={false} // Always show header only in top row
                onToggleExpand={() => setIsBriefExpanded(prev => !prev)}
                onBriefUpdate={(briefDesc, physicalParams) => {
                  // Optimistically update local project state
                  setProject(prev => prev ? {
                    ...prev,
                    brief_description: briefDesc,
                    physical_parameters: physicalParams
                  } : null);
                }}
                assets={assets}
                hoveredAssetId={hoveredAssetId}
                onAssetHover={setHoveredAssetId}
                onAssetClick={handleAssetClick}
              />
            </div>
          </div>

          {/* Main Content Area - Side by side layout when brief expanded */}
          <div className={`grid gap-6 ${isBriefExpanded ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
            
            {/* Assets Section - 2/3 width when brief expanded, full width when collapsed */}
            <div ref={assetsBlockRef} className={isBriefExpanded ? 'lg:col-span-2' : 'col-span-1'}>
            <AssetList 
              projectId={project.id}
              hoveredAssetId={hoveredAssetId}
              onAssetHover={setHoveredAssetId}
              isBriefExpanded={isBriefExpanded}
              onAddAsset={handleAddAsset}
              onToggleFilters={handleToggleFilters}
              showFilters={showFilters}
            />
            </div>
            
            {/* Brief Expanded Content - 1/3 width when expanded, hidden when collapsed */}
            {isBriefExpanded && (
              <div className="lg:col-span-1">
                <EditableBrief
                  projectId={project.id}
                  briefDescription={project.brief_description}
                  physicalParameters={project.physical_parameters ?? ''}
                  isExpanded={true} // Always expanded in main content area
                  onToggleExpand={() => setIsBriefExpanded(prev => !prev)}
                  onBriefUpdate={(briefDesc, physicalParams) => {
                    // Optimistically update local project state
                    setProject(prev => prev ? {
                      ...prev,
                      brief_description: briefDesc,
                      physical_parameters: physicalParams
                    } : null);
                  }}
                  assets={assets}
                  hoveredAssetId={hoveredAssetId}
                  onAssetHover={setHoveredAssetId}
                  onAssetClick={handleAssetClick}
                  maxHeight={assetsBlockHeight}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Client Projects Modal */}
      <ClientProjectsModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        clientName={project.client_name}
        currentProjectId={project.id}
      />

      {/* Budget Assets Modal */}
      <BudgetAssetsModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        projectId={project.id}
      />

      {/* Milestone Create/Edit Modal */}
      <MilestoneFormModal
        isOpen={isMilestoneFormOpen}
        onClose={() => setIsMilestoneFormOpen(false)}
        onSubmit={handleMilestoneFormSubmit}
        isSubmitting={isSubmitting}
        mode={milestoneFormMode}
        milestoneToEdit={editingMilestone}
      />

      {/* Delete Milestone Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isConfirming={isDeleting}
        title="Delete Milestone"
        message={`Are you sure you want to permanently delete the milestone "${deletingMilestone?.milestone_name}"? This action cannot be undone.`}
        variant="danger"
      />

      {/* Asset Detail Modal (for clicking highlighted brief text) */}
      <AssetDetailModal
        isOpen={isAssetDetailModalOpen}
        asset={viewingAsset}
        onClose={() => {
          setIsAssetDetailModalOpen(false);
          setViewingAsset(null);
        }}
        onAssetUpdate={handleAssetUpdate}
      />

      {/* Asset Form Modal (for adding new assets) */}
      <AssetFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateAsset}
        mode="create"
        isSubmitting={false}
      />
    </>
  );
};

export default ProjectDetailPage;


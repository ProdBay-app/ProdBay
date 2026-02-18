import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  DollarSign, 
  Clock,
  AlertCircle,
  Download,
  Edit3,
  Eye,
  EyeOff,
  Highlighter,
  Pencil,
  Trash2,
  X,
  Loader2
} from 'lucide-react';
import { ProducerService } from '@/services/producerService';
import { useNotification } from '@/hooks/useNotification';
import Button from '@/components/ui/Button';
import AssetList from './AssetList';
import EditableBrief from './EditableBrief';
import ClientProjectsModal from './ClientProjectsModal';
import AssetDetailModal from './AssetDetailModal';
import AssetFormModal from './AssetFormModal';
import ConfirmationModal from '@/components/shared/ConfirmationModal';
import { toTitleCase } from '@/utils/textFormatters';
import type { Project, Asset } from '@/lib/supabase';

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

  // State management - ALL hooks must be declared before any conditional returns
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'assets' | 'brief'>('assets');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  // Interactive brief state
  const [hoveredAssetId, setHoveredAssetId] = useState<string | null>(null);
  const [viewingAsset, setViewingAsset] = useState<Asset | null>(null);
  const [isAssetDetailModalOpen, setIsAssetDetailModalOpen] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreatingAsset, setIsCreatingAsset] = useState(false);

  // Track current edited brief values for PDF download
  const [currentEditedBriefDescription, setCurrentEditedBriefDescription] = useState<string>('');
  const [currentEditedPhysicalParameters, setCurrentEditedPhysicalParameters] = useState<string>('');

  // Brief mode state (view/edit) - MOVED UP to ensure hooks are called before early returns
  const [briefMode, setBriefMode] = useState<'view' | 'edit'>('view');
  const [briefIsDirty, setBriefIsDirty] = useState(false);
  const [briefIsSaving, setBriefIsSaving] = useState(false);
  const [showHighlights, setShowHighlights] = useState(true);

  // Overview edit state
  const [isOverviewEditModalOpen, setIsOverviewEditModalOpen] = useState(false);
  const [isOverviewSaving, setIsOverviewSaving] = useState(false);
  const [overviewEditForm, setOverviewEditForm] = useState({
    project_name: '',
    client_name: '',
    financial_parameters: 0,
    timeline_deadline: '',
  });

  // Delete project state
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);



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
          // Initialize edited values with project data
          setCurrentEditedBriefDescription(projectData.brief_description);
          setCurrentEditedPhysicalParameters(projectData.physical_parameters ?? '');
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


  // Fetch assets for interactive brief
  useEffect(() => {
    const fetchAssets = async () => {
      if (!projectId) return;

      try {
        setAssetsLoading(true);
        const assetsData = await ProducerService.getAssetsByProjectId(projectId);
        setAssets(assetsData);
      } catch (err) {
        console.error('Error fetching assets for brief:', err);
        // Silently fail - brief will just not have interactive highlights
        setAssets([]);
      } finally {
        setAssetsLoading(false);
      }
    };

    fetchAssets();
  }, [projectId]);


  // Log activeView changes for verification
  useEffect(() => {
    console.log('[ProjectDetailPage] activeView changed to:', activeView);
  }, [activeView]);

  // Clear hover state when highlights are disabled
  useEffect(() => {
    if (!showHighlights) {
      setHoveredAssetId(null);
    }
  }, [showHighlights]);

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
    if (!project || isCreatingAsset) return;

    try {
      setIsCreatingAsset(true);
      // Create asset via API
      const newAsset = await ProducerService.createAsset(project.id, {
        asset_name: toTitleCase(assetData.asset_name),
        specifications: assetData.specifications,
        status: 'Pending',
        timeline: '',
        assigned_supplier_id: undefined,
        quantity: assetData.quantity,
        tags: assetData.tags || []
      });

      // Add to local assets state
      setAssets(prev => [...prev, newAsset]);

      // Show success feedback before closing modal
      showSuccess(`Asset "${newAsset.asset_name}" created successfully!`);

      // Close modal
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Error creating asset:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create asset';
      showError(errorMessage);
    } finally {
      setIsCreatingAsset(false);
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

  const handleAssetDelete = (assetId: string) => {
    setAssets(prevAssets => prevAssets.filter(a => a.id !== assetId));
  };

  // ========================================
  // BRIEF ACTION HANDLERS
  // ========================================
  
  /**
   * Handle Brief PDF download
   */
  const handleBriefDownloadPdf = () => {
    if (!project) return;
    
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        showError('Unable to open print window. Please check your popup blocker.');
        return;
      }

      // Use edited values if in edit mode, otherwise use saved values
      const currentBriefDescription = briefMode === 'edit' && currentEditedBriefDescription
        ? currentEditedBriefDescription
        : project.brief_description;
      const currentPhysicalParameters = briefMode === 'edit' && currentEditedPhysicalParameters !== undefined
        ? currentEditedPhysicalParameters
        : (project.physical_parameters ?? '');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Project Brief - ${project.id}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 10px;
            }
            .project-id {
              color: #6b7280;
              font-size: 14px;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              font-size: 18px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 20px;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 5px;
            }
            .content {
              white-space: pre-wrap;
              line-height: 1.7;
              margin-top: 10px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 12px;
              text-align: center;
            }
            @media print {
              body { margin: 0; padding: 15px; }
              .header { page-break-after: avoid; }
              .section { page-break-inside: avoid; }
              .section-title { margin-bottom: 25px; }
              .content { margin-top: 12px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Project Brief</div>
            <div class="project-id">Project ID: ${project.id}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Description</div>
            <div class="content">${currentBriefDescription || 'No description provided.'}</div>
          </div>
          
          ${currentPhysicalParameters ? `
          <div class="section">
            <div class="section-title">Physical Parameters</div>
            <div class="content">${currentPhysicalParameters}</div>
          </div>
          ` : ''}
          
          <div class="footer">
            Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        }, 500);
      };

      showSuccess('PDF download initiated');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showError('Failed to generate PDF');
    }
  };

  // ========================================
  // END INTERACTIVE BRIEF
  // ========================================

  // ========================================
  // OVERVIEW EDIT & DELETE HANDLERS
  // ========================================

  const openOverviewEditModal = () => {
    if (!project) return;
    const deadline = project.timeline_deadline ?? '';
    const deadlineForInput = deadline ? deadline.split('T')[0] : '';
    setOverviewEditForm({
      project_name: project.project_name,
      client_name: project.client_name,
      financial_parameters: project.financial_parameters ?? 0,
      timeline_deadline: deadlineForInput,
    });
    setIsOverviewEditModalOpen(true);
  };

  const handleOverviewSave = async () => {
    if (!project || !projectId) return;

    const trimmedName = overviewEditForm.project_name.trim();
    if (!trimmedName) {
      showError('Project name is required');
      return;
    }

    setIsOverviewSaving(true);
    try {
      await ProducerService.updateProject(projectId, {
        project_name: trimmedName,
        client_name: overviewEditForm.client_name.trim(),
        brief_description: project.brief_description,
        physical_parameters: project.physical_parameters ?? '',
        financial_parameters: overviewEditForm.financial_parameters || undefined,
        timeline_deadline: overviewEditForm.timeline_deadline.trim() || '',
        event_date: project.event_date ?? '',
      });

      setProject((prev) =>
        prev
          ? {
              ...prev,
              project_name: trimmedName,
              client_name: overviewEditForm.client_name.trim(),
              financial_parameters: overviewEditForm.financial_parameters || undefined,
              timeline_deadline: overviewEditForm.timeline_deadline.trim() || null,
            }
          : null,
      );

      showSuccess('Overview updated');
      setIsOverviewEditModalOpen(false);
    } catch (err) {
      console.error('Failed to update overview:', err);
      showError(err instanceof Error ? err.message : 'Failed to update overview');
    } finally {
      setIsOverviewSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectId) return;

    setIsDeleting(true);
    try {
      await ProducerService.deleteProject(projectId);
      showSuccess('Project deleted');
      setIsDeleteConfirmOpen(false);
      navigate('/producer/projects');
    } catch (err) {
      console.error('Failed to delete project:', err);
      showError(err instanceof Error ? err.message : 'Failed to delete project');
    } finally {
      setIsDeleting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-400 mx-auto mb-4"></div>
          <p className="text-gray-200 text-lg">Loading project details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !project) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-500/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {error || 'Project Not Found'}
          </h2>
          <p className="text-gray-200 mb-6">
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
      <div className="bg-transparent border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Page title */}
          <div>
            <h1 className="text-3xl font-bold text-white">
              {project.project_name}
            </h1>
          </div>
        </div>
      </div>

      {/* Overview Section - Full Width Glass Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Overview</h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={openOverviewEditModal}
                className="p-2 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="p-2 text-red-200 hover:text-white bg-red-500/20 hover:bg-red-600/30 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client Name */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <User className="w-5 h-5 text-purple-300" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-300 mb-1">Client</p>
                <button
                  onClick={() => setIsClientModalOpen(true)}
                  className="text-lg font-semibold text-teal-300 hover:text-teal-200 hover:underline transition-colors text-left"
                  title={`View all projects for ${project.client_name}`}
                >
                  {project.client_name}
                </button>
              </div>
            </div>

            {/* Budget */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-300" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-300 mb-1">Budget</p>
                <p className="text-lg font-semibold text-white">
                  {formatCurrency(project.financial_parameters ?? 0)}
                </p>
                </div>
            </div>

            {/* Deadline */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-300" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-300 mb-1">Deadline</p>
                <p className="text-lg font-semibold text-white">
                  {formatDate(project.timeline_deadline ?? null)}
                </p>
              </div>
              </div>
              
            {/* Created Date */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <Clock className="w-5 h-5 text-gray-300" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-300 mb-1">Created</p>
                <p className="text-lg font-semibold text-white">
                  {formatDate(project.created_at)}
                </p>
              </div>
            </div>
          </div>
        </div>


        {/* Assets and Brief Section - Unified Tabbed Interface */}
        <div className="mt-8">
          
          {/* Tab Header - Tabs on left, Actions on right */}
          <div className="mb-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-sm p-1">
              <div className="flex items-center justify-between gap-4">
                {/* Tabs Section */}
                <div className="flex items-center gap-2 flex-1">
                  {/* Assets Tab */}
                  <button
                    onClick={() => setActiveView('assets')}
                    className={`
                      flex-1 px-6 py-3 rounded-md font-semibold text-sm transition-all duration-200
                      ${
                        activeView === 'assets'
                          ? 'bg-teal-600/30 text-white border border-teal-400/50 shadow-sm'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    Assets ({assets.length})
                  </button>
                  
                  {/* Brief Tab */}
                  <button
                    onClick={() => setActiveView('brief')}
                    className={`
                      flex-1 px-6 py-3 rounded-md font-semibold text-sm transition-all duration-200
                      ${
                        activeView === 'brief'
                          ? 'bg-teal-600/30 text-white border border-teal-400/50 shadow-sm'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    Brief
                  </button>
                </div>

                {/* Actions Section - Show different actions based on active view */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {activeView === 'assets' && (
                    <>
                      {/* Filter Toggle Button */}
                      <Button
                        onClick={handleToggleFilters}
                        variant={showFilters ? 'secondary' : 'outline'}
                        icon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                          </svg>
                        }
                      >
                        Filters
                      </Button>

                      {/* Add Asset Button */}
                      <Button 
                        onClick={handleAddAsset}
                        variant="primary"
                        icon={
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        }
                      >
                        Add Asset
                      </Button>
                    </>
                  )}

                  {activeView === 'brief' && (
                    <>
                      {/* Unsaved Changes Indicator */}
                      {briefIsDirty && (
                        <span className="text-xs bg-amber-500/30 text-amber-200 px-2 py-1 rounded-full font-medium">
                          Unsaved Changes
                        </span>
                      )}

                      {/* Highlights Toggle - Only visible in view mode */}
                      {briefMode === 'view' && (
                        <Button
                          onClick={() => setShowHighlights(prev => !prev)}
                          variant={showHighlights ? 'secondary' : 'outline'}
                          icon={showHighlights ? <Highlighter className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          title={showHighlights ? 'Hide asset highlights' : 'Show asset highlights'}
                        >
                          {showHighlights ? 'Highlights' : 'Hide'}
                        </Button>
                      )}

                      {/* Download PDF Button */}
                      <Button
                        onClick={handleBriefDownloadPdf}
                        variant="teal"
                        icon={<Download className="w-4 h-4" />}
                        title="Download brief as PDF"
                      >
                        Download PDF
                      </Button>

                      {/* Mode Toggle Button */}
                      <Button
                        onClick={() => setBriefMode(prev => prev === 'view' ? 'edit' : 'view')}
                        disabled={briefIsSaving}
                        variant="secondary"
                        icon={briefMode === 'view' ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        title={briefMode === 'view' ? 'Switch to edit mode' : 'Switch to view mode'}
                      >
                        {briefMode === 'view' ? 'Edit' : 'View'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content Area - Conditional Rendering */}
          <div className="w-full">
            {activeView === 'assets' && (
              <AssetList 
                assets={assets}
                isLoading={assetsLoading}
                hoveredAssetId={hoveredAssetId}
                onAssetHover={setHoveredAssetId}
                showFilters={showFilters}
                onDelete={handleAssetDelete}
                onAssetUpdate={handleAssetUpdate}
              />
            )}

            {activeView === 'brief' && (
              <EditableBrief
                projectId={project.id}
                briefDescription={project.brief_description}
                physicalParameters={project.physical_parameters ?? ''}
                isExpanded={true}
                onToggleExpand={() => {}} // No-op since we're always expanded now
                onBriefUpdate={(briefDesc, physicalParams) => {
                  // Optimistically update local project state
                  setProject(prev => prev ? {
                    ...prev,
                    brief_description: briefDesc,
                    physical_parameters: physicalParams
                  } : null);
                }}
                assets={assets}
                hoveredAssetId={showHighlights ? hoveredAssetId : null}
                onAssetHover={showHighlights ? setHoveredAssetId : undefined}
                onAssetClick={handleAssetClick}
                mode={briefMode}
                onModeChange={setBriefMode}
                onDirtyChange={setBriefIsDirty}
                onSavingChange={setBriefIsSaving}
                onEditedValuesChange={(briefDesc, physicalParams) => {
                  // Track current edited values for PDF download
                  setCurrentEditedBriefDescription(briefDesc);
                  setCurrentEditedPhysicalParameters(physicalParams);
                }}
                showHighlights={showHighlights}
              />
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
        isSubmitting={isCreatingAsset}
      />

      {/* Overview Edit Modal - Project Name, Client, Budget, Deadline */}
      {isOverviewEditModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => e.target === e.currentTarget && !isOverviewSaving && setIsOverviewEditModalOpen(false)}
        >
          <div
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Edit Overview</h3>
              <button
                type="button"
                onClick={() => !isOverviewSaving && setIsOverviewEditModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Project Name</label>
                <input
                  type="text"
                  value={overviewEditForm.project_name}
                  onChange={(e) =>
                    setOverviewEditForm((prev) => ({ ...prev, project_name: e.target.value }))
                  }
                  className="w-full px-4 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Project name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Client</label>
                <input
                  type="text"
                  value={overviewEditForm.client_name}
                  onChange={(e) =>
                    setOverviewEditForm((prev) => ({ ...prev, client_name: e.target.value }))
                  }
                  className="w-full px-4 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Client name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Budget</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={overviewEditForm.financial_parameters || ''}
                  onChange={(e) =>
                    setOverviewEditForm((prev) => ({
                      ...prev,
                      financial_parameters: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-4 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Deadline</label>
                <input
                  type="date"
                  value={overviewEditForm.timeline_deadline}
                  onChange={(e) =>
                    setOverviewEditForm((prev) => ({ ...prev, timeline_deadline: e.target.value }))
                  }
                  className="w-full px-4 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => !isOverviewSaving && setIsOverviewEditModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-200 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleOverviewSave}
                disabled={isOverviewSaving}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {isOverviewSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Project Confirmation */}
      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.project_name}"? This will also delete all assets and quotes associated with this project.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        onConfirm={handleDeleteProject}
        onCancel={() => !isDeleting && setIsDeleteConfirmOpen(false)}
        isConfirming={isDeleting}
        variant="danger"
      />
    </>
  );
};

export default ProjectDetailPage;


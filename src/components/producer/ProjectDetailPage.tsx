import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import Button from '@/components/ui/Button';
import AssetList from './AssetList';
import EditableBrief from './EditableBrief';
import ClientProjectsModal from './ClientProjectsModal';
import AssetDetailModal from './AssetDetailModal';
import AssetFormModal from './AssetFormModal';
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

  // State management
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
  const [showFilters, setShowFilters] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Ref for measuring Assets block height
  const assetsBlockRef = useRef<HTMLDivElement>(null);
  const [assetsBlockHeight, setAssetsBlockHeight] = useState<number>(0);



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
  // TODO: Remove this useEffect in Step 2 when we migrate to tabs
  useEffect(() => {
    if (assetsBlockRef.current) {
      const height = assetsBlockRef.current.offsetHeight;
      setAssetsBlockHeight(height);
    }
  }, [assets]);

  // Log activeView changes for verification
  useEffect(() => {
    console.log('[ProjectDetailPage] activeView changed to:', activeView);
  }, [activeView]);

  // Temporary backward compatibility: derive isBriefExpanded from activeView
  // TODO: Remove this in Step 2 when we migrate to conditional rendering
  const isBriefExpanded = activeView === 'brief';

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
        return 'bg-blue-500/30 text-blue-200 border-blue-400/50';
      case 'In Progress':
        return 'bg-purple-500/30 text-purple-200 border-purple-400/50';
      case 'Quoting':
        return 'bg-yellow-500/30 text-yellow-200 border-yellow-400/50';
      case 'Completed':
        return 'bg-green-500/30 text-green-200 border-green-400/50';
      case 'Cancelled':
        return 'bg-white/20 text-gray-200 border-white/30';
      default:
        return 'bg-white/20 text-gray-200 border-white/30';
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
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

      {/* Overview Section - Full Width Glass Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Overview</h2>
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


        {/* Assets and Brief Section - Layout matching reference image */}
        <div className="mt-8">
          
          {/* Tab Switcher - New unified interface */}
          <div className="mb-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-sm p-1">
              <div className="flex items-center gap-2">
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
            </div>
          </div>
          
          {/* Top Row - Asset Headers & Filters + Brief Header (always visible) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 items-stretch">
            
            {/* Asset Headers & Filters Section */}
            <div className="lg:col-span-2 h-full">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 shadow-sm rounded-lg p-6 pb-4 h-full flex flex-col">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white">Assets ({assets.length})</h3>
                  </div>
                  
                  {/* Filters and Add Asset buttons moved here */}
                  <div className="flex items-center gap-3">
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
                  </div>
                </div>
              </div>
            </div>

            {/* Brief Header - Always visible in top row */}
            <div className="lg:col-span-1 h-full">
              <EditableBrief
                projectId={project.id}
                briefDescription={project.brief_description}
                physicalParameters={project.physical_parameters ?? ''}
                isExpanded={false} // Always show header only in top row
                onToggleExpand={() => setActiveView(activeView === 'brief' ? 'assets' : 'brief')}
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
                  onToggleExpand={() => setActiveView(activeView === 'brief' ? 'assets' : 'brief')}
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


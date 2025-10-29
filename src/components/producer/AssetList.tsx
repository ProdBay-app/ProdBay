import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Package, AlertCircle, Plus, Search, Filter, ArrowUpDown, X } from 'lucide-react';
import { ProducerService } from '@/services/producerService';
import { useNotification } from '@/hooks/useNotification';
import AssetCard from './AssetCard';
import AssetFormModal from './AssetFormModal';
import AssetDetailModal from './AssetDetailModal';
import ConfirmationModal from '@/components/shared/ConfirmationModal';
import { getAvailableTagNames, getTagColor } from '@/utils/assetTags';
import type { Asset } from '@/lib/supabase';
import type { AssetStatus } from '@/types/database';

interface AssetListProps {
  projectId: string;
  
  // NEW: Props for bi-directional hover linking with brief
  hoveredAssetId?: string | null;
  onAssetHover?: (assetId: string | null) => void;
  
  // NEW: Prop to know when brief panel is expanded for optimized scrolling
  isBriefExpanded?: boolean;
}

/**
 * AssetList - Container component for displaying assets in a Kanban board layout
 * 
 * Features:
 * - Fetches assets for a specific project
 * - Groups assets by status into Kanban columns
 * - Horizontal scrolling layout with vertical status columns
 * - Loading and error state handling
 * - Empty state when no assets exist
 * - Bi-directional hover linking with project brief (highlights assets when brief text hovered)
 */
const AssetList: React.FC<AssetListProps> = ({ projectId, hoveredAssetId, onAssetHover, isBriefExpanded = false }) => {
  const { showError, showSuccess } = useNotification();

  // State management
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingAsset, setViewingAsset] = useState<Asset | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Search, filter, and sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<AssetStatus[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'date' | 'quantity'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Scroll indicator state
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Debug: Log sorting changes
  useEffect(() => {
    console.log('Sorting changed:', { sortBy, sortOrder });
  }, [sortBy, sortOrder]);

  // Check if content can scroll horizontally
  const checkScrollability = useCallback(() => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const canScroll = container.scrollWidth > container.clientWidth;
    const isAtEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 1;
    
    setCanScrollRight(canScroll && !isAtEnd);
    // Only show scroll indicator when brief is expanded AND content overflows
    setShowScrollIndicator(isBriefExpanded && canScroll);
  }, [isBriefExpanded]);

  // Check scrollability when assets change or brief expansion state changes
  useEffect(() => {
    checkScrollability();
  }, [assets, isBriefExpanded, checkScrollability]);

  // Handle scroll events to update indicators
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const isAtEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 1;
    setCanScrollRight(!isAtEnd);
  }, []);

  // Define the status order for Kanban columns (workflow order)
  const statusOrder: AssetStatus[] = [
    'Pending',
    'Quoting',
    'Approved',
    'In Production',
    'Delivered'
  ];

  // Get display color for each status column header
  const getStatusHeaderColor = (status: AssetStatus): string => {
    switch (status) {
      case 'Pending':
        return 'text-slate-700 bg-slate-50 border-slate-200';
      case 'Quoting':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Approved':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'In Production':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'Delivered':
        return 'text-purple-700 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  // Fetch assets from the backend
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true);
        setError(null);
        const assetData = await ProducerService.getAssetsByProjectId(projectId);
        setAssets(assetData);
      } catch (err) {
        console.error('Error fetching assets:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load assets';
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [projectId, showError]);

  // Handle adding a new asset
  const handleAddAsset = async (assetData: { 
    asset_name: string; 
    specifications: string;
    quantity?: number;
    tags?: string[];
  }) => {
    setIsSubmitting(true);
    try {
      // Create asset with default values
      const newAsset = await ProducerService.createAsset(projectId, {
        asset_name: assetData.asset_name,
        specifications: assetData.specifications,
        status: 'Pending',
        timeline: '',
        assigned_supplier_id: undefined,
        quantity: assetData.quantity,
        tags: assetData.tags || []
      });

      // Update local state to include new asset
      setAssets(prev => [...prev, newAsset]);

      // Close modal and show success
      setIsAddModalOpen(false);
      showSuccess(`Asset "${assetData.asset_name}" created successfully!`);
    } catch (err) {
      console.error('Error creating asset:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create asset';
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle opening the edit modal
  const handleOpenEditModal = (asset: Asset) => {
    setEditingAsset(asset);
    setIsEditModalOpen(true);
  };

  // Handle updating an existing asset
  const handleUpdateAsset = async (assetData: { 
    asset_name: string; 
    specifications: string;
    quantity?: number;
    tags?: string[];
  }) => {
    if (!editingAsset) return;

    setIsSubmitting(true);
    try {
      // Update asset while preserving other fields
      const updatedAsset = await ProducerService.updateAsset(editingAsset.id, {
        asset_name: assetData.asset_name,
        specifications: assetData.specifications,
        status: editingAsset.status,
        timeline: editingAsset.timeline ?? '',
        assigned_supplier_id: editingAsset.assigned_supplier_id,
        quantity: assetData.quantity,
        tags: assetData.tags || []
      });

      // Update local state by replacing the old asset with the updated one
      setAssets(prev => prev.map(a => a.id === updatedAsset.id ? updatedAsset : a));

      // Close modal and show success
      setIsEditModalOpen(false);
      setEditingAsset(null);
      showSuccess(`Asset "${assetData.asset_name}" updated successfully!`);
    } catch (err) {
      console.error('Error updating asset:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update asset';
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle opening the delete confirmation modal
  const handleOpenDeleteModal = (asset: Asset) => {
    setDeletingAsset(asset);
    setIsDeleteModalOpen(true);
  };

  // Handle confirming deletion
  const handleConfirmDelete = async () => {
    if (!deletingAsset) return;

    setIsDeleting(true);
    try {
      // Delete asset from database (cascade deletes related quotes)
      await ProducerService.deleteAsset(deletingAsset.id);

      // Remove from local state
      setAssets(prev => prev.filter(a => a.id !== deletingAsset.id));

      // Close modal and show success
      setIsDeleteModalOpen(false);
      setDeletingAsset(null);
      showSuccess(`Asset "${deletingAsset.asset_name}" deleted successfully!`);
    } catch (err) {
      console.error('Error deleting asset:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete asset';
      showError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle opening the detail view modal
  const handleViewAsset = (asset: Asset) => {
    setViewingAsset(asset);
    setIsDetailModalOpen(true);
  };

  // Handle asset updates from the detail modal
  const handleAssetUpdate = (updatedAsset: Asset) => {
    // Update the master assets array
    setAssets(prev => prev.map(a => a.id === updatedAsset.id ? updatedAsset : a));
    
    // Also update viewingAsset if it's the same asset
    if (viewingAsset?.id === updatedAsset.id) {
      setViewingAsset(updatedAsset);
    }
  };

  // Filter assets
  const filteredAssets = useMemo(() => {
    let filtered = assets;

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(asset =>
        asset.asset_name.toLowerCase().includes(term) ||
        asset.specifications?.toLowerCase().includes(term) ||
        asset.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Apply status filter
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(asset => selectedStatuses.includes(asset.status));
    }

    // Apply tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(asset =>
        asset.tags && asset.tags.some(tag => selectedTags.includes(tag))
      );
    }

    return filtered;
  }, [assets, searchTerm, selectedStatuses, selectedTags]);

  // Group filtered assets by status and apply sorting within each group
  const groupedAssets = useMemo(() => {
    const groups: Record<AssetStatus, Asset[]> = {
      'Pending': [],
      'Quoting': [],
      'Approved': [],
      'In Production': [],
      'Delivered': []
    };

    // Group assets by status
    filteredAssets.forEach(asset => {
      if (groups[asset.status]) {
        groups[asset.status].push(asset);
      }
    });

    // Apply sorting within each status group
    const sortFunction = (a: Asset, b: Asset) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.asset_name.localeCompare(b.asset_name);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'quantity':
          const aQty = a.quantity || 0;
          const bQty = b.quantity || 0;
          comparison = aQty - bQty;
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    };

    // Sort each group
    Object.keys(groups).forEach(status => {
      groups[status as AssetStatus].sort(sortFunction);
    });

    return groups;
  }, [filteredAssets, sortBy, sortOrder]);

  // For display purposes, get all filtered assets (used for count)
  const filteredAndSortedAssets = useMemo(() => {
    return Object.values(groupedAssets).flat();
  }, [groupedAssets]);

  // Filter out empty status groups for display
  const activeStatuses = useMemo(() => {
    return statusOrder.filter(status => groupedAssets[status].length > 0);
  }, [groupedAssets]);

  // Loading state
  if (loading) {
    return (
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Assets</h2>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading assets...</p>
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Assets</h2>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="bg-red-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-red-600 font-semibold mb-2">Error loading assets</p>
            <p className="text-gray-600 text-sm">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  // Empty state - no assets
  if (assets.length === 0) {
    return (
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Assets</h2>
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No assets yet</h3>
          <p className="text-gray-600">
            Assets will appear here once they are created for this project.
          </p>
        </div>
      </section>
    );
  }

  // Empty state - no assets match filters
  if (filteredAndSortedAssets.length === 0 && assets.length > 0) {
    return (
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Assets</h2>
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No assets match your filters</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search terms or filters to see more results.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedStatuses([]);
              setSelectedTags([]);
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      </section>
    );
  }

  // Main Kanban board display
  return (
    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Package className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">Assets</h2>
          <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full">
            {filteredAndSortedAssets.length}
            {filteredAndSortedAssets.length !== assets.length && ` of ${assets.length}`}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              showFilters || selectedStatuses.length > 0 || selectedTags.length > 0 || searchTerm
                ? 'bg-purple-50 border-purple-200 text-purple-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {(selectedStatuses.length > 0 || selectedTags.length > 0 || searchTerm) && (
              <span className="ml-1 px-1.5 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                {selectedStatuses.length + selectedTags.length + (searchTerm ? 1 : 0)}
              </span>
            )}
          </button>

          {/* Add Asset Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Asset
          </button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search assets by name, specifications, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="flex flex-wrap gap-2">
                {statusOrder.map(status => (
                  <button
                    key={status}
                    onClick={() => {
                      setSelectedStatuses(prev =>
                        prev.includes(status)
                          ? prev.filter(s => s !== status)
                          : [...prev, status]
                      );
                    }}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      selectedStatuses.includes(status)
                        ? `${getStatusHeaderColor(status)} border-current`
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Tag Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                {getAvailableTagNames().map(tagName => (
                  <button
                    key={tagName}
                    onClick={() => {
                      setSelectedTags(prev =>
                        prev.includes(tagName)
                          ? prev.filter(t => t !== tagName)
                          : [...prev, tagName]
                      );
                    }}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      selectedTags.includes(tagName)
                        ? 'text-white border-transparent'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    style={{
                      backgroundColor: selectedTags.includes(tagName) ? getTagColor(tagName) : undefined
                    }}
                  >
                    {tagName}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Controls */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
                <span className="ml-2 text-xs text-purple-600 font-normal">
                  ({sortBy === 'date' ? 'Date Added' : 
                    sortBy === 'name' ? 'Name' : 
                    sortBy === 'status' ? 'Status' : 
                    sortBy === 'quantity' ? 'Quantity' : 'Date Added'} - {sortOrder === 'asc' ? 'A→Z' : 'Z→A'})
                </span>
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                >
                  <option value="date">Date Added</option>
                  <option value="name">Name</option>
                  <option value="status">Status</option>
                  <option value="quantity">Quantity</option>
                </select>
                <button
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className={`p-2 border rounded-lg transition-colors ${
                    sortOrder === 'asc' 
                      ? 'border-purple-300 bg-purple-50 text-purple-700' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                  title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  <ArrowUpDown className={`w-4 h-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Clear All Filters */}
          {(selectedStatuses.length > 0 || selectedTags.length > 0 || searchTerm || sortBy !== 'date' || sortOrder !== 'desc') && (
            <div className="flex justify-between">
              <button
                onClick={() => {
                  setSortBy('date');
                  setSortOrder('desc');
                }}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Reset sort
              </button>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedStatuses([]);
                  setSelectedTags([]);
                }}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Kanban Board - Responsive Container with Conditional Scrolling */}
      <div className="relative">
        <div 
          ref={scrollContainerRef}
          className={`-mx-6 px-6 pb-4 ${
            isBriefExpanded 
              ? 'overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100' 
              : 'overflow-x-visible'
          }`}
          onScroll={handleScroll}
        >
          <div className={`flex gap-6 ${isBriefExpanded ? 'min-w-max' : 'justify-start'}`}>
          {/* Render each status column */}
          {activeStatuses.map((status) => {
            const assetsInStatus = groupedAssets[status];
            
            return (
              <div
                key={status}
                className={`flex-shrink-0 ${
                  isBriefExpanded ? 'w-80' : 'w-64'
                }`}
              >
                {/* Column Header */}
                <div className={`rounded-lg border px-4 py-3 mb-4 ${getStatusHeaderColor(status)}`}>
                  <h3 className="font-semibold text-sm">
                    {status} ({assetsInStatus.length})
                  </h3>
                </div>

                {/* Column Content - Vertical Stack of Asset Cards */}
                <div className="space-y-3">
                  {assetsInStatus.map((asset) => (
                    <AssetCard 
                      key={asset.id} 
                      asset={asset} 
                      onClick={handleViewAsset}
                      onEdit={handleOpenEditModal}
                      onDelete={handleOpenDeleteModal}
                      isHighlighted={hoveredAssetId === asset.id}
                      onMouseEnter={() => onAssetHover && onAssetHover(asset.id)}
                      onMouseLeave={() => onAssetHover && onAssetHover(null)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
          </div>
        </div>
        
        {/* Visual Scroll Indicator - Right Edge Gradient */}
        {showScrollIndicator && canScrollRight && (
          <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10 flex items-center justify-center">
            <div className="w-1 h-8 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full opacity-60 animate-pulse"></div>
          </div>
        )}
      </div>

      {/* Scroll hint for users (only show when brief is expanded and content overflows) */}
      {isBriefExpanded && showScrollIndicator && (
        <div className="mt-4 text-center text-sm text-purple-600 font-medium">
          ← Scroll to view all asset columns (brief panel expanded) →
        </div>
      )}

      {/* Add Asset Modal */}
      <AssetFormModal
        isOpen={isAddModalOpen}
        isSubmitting={isSubmitting}
        mode="create"
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddAsset}
      />

      {/* Edit Asset Modal */}
      <AssetFormModal
        isOpen={isEditModalOpen}
        isSubmitting={isSubmitting}
        mode="edit"
        assetToEdit={editingAsset}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingAsset(null);
        }}
        onSubmit={handleUpdateAsset}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete Asset"
        message={`Are you sure you want to delete "${deletingAsset?.asset_name}"? This action cannot be undone and will also remove any related quotes.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setDeletingAsset(null);
        }}
        isConfirming={isDeleting}
        variant="danger"
      />

      {/* Asset Detail Modal */}
      <AssetDetailModal
        isOpen={isDetailModalOpen}
        asset={viewingAsset}
        onClose={() => {
          setIsDetailModalOpen(false);
          setViewingAsset(null);
        }}
        onAssetUpdate={handleAssetUpdate}
      />
    </section>
  );
};

export default AssetList;


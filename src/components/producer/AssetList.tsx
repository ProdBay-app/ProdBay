import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Package, Search, ArrowUpDown, X, Pencil, Save, RotateCcw, Loader2 } from 'lucide-react';
import { ProducerService } from '@/services/producerService';
import { useNotification } from '@/hooks/useNotification';
import AssetTable from './AssetTable';
import AssetFormModal from './AssetFormModal';
import AssetDetailModal from './AssetDetailModal';
import ConfirmationModal from '@/components/shared/ConfirmationModal';
import { getTagColor } from '@/utils/assetTags';
import { toTitleCase } from '@/utils/textFormatters';
import type { Asset } from '@/lib/supabase';

/** Editable fields for inline table editing */
export type InlineEditFields = {
  asset_name?: string;
  quantity?: number;
  tags?: string[];
  specifications?: string;
};

interface AssetListProps {
  assets: Asset[];
  isLoading: boolean;
  
  // Props for bi-directional hover linking with brief
  hoveredAssetId?: string | null;
  onAssetHover?: (assetId: string | null) => void;
  
  showFilters?: boolean; // Filter visibility state
  onDelete?: (assetId: string) => void;
  onAssetUpdate?: (asset: Asset) => void;
}

/**
 * AssetList - Container component for displaying assets in a grid layout
 * 
 * Features:
 * - Fetches assets for a specific project
 * - Displays assets in a responsive grid
 * - Loading and error state handling
 * - Empty state when no assets exist
 * - Bi-directional hover linking with project brief (highlights assets when brief text hovered)
 */
const AssetList: React.FC<AssetListProps> = ({ 
  assets,
  isLoading,
  hoveredAssetId, 
  onAssetHover, 
  showFilters = false,
  onDelete,
  onAssetUpdate
}) => {
  const { showError, showSuccess } = useNotification();

  // State management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingAsset, setViewingAsset] = useState<Asset | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Inline edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [edits, setEdits] = useState<Record<string, InlineEditFields>>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [isSavingInlineEdits, setIsSavingInlineEdits] = useState(false);

  const hasEdits = Object.keys(edits).length > 0;

  // Handle edit mode toggle - prompt to discard if unsaved changes
  const handleEditModeToggle = useCallback(() => {
    if (isEditMode && hasEdits) {
      setShowDiscardConfirm(true);
    } else {
      setIsEditMode((prev) => !prev);
      if (!isEditMode) setEdits({});
    }
  }, [isEditMode, hasEdits]);

  // Confirm discard and exit edit mode
  const handleConfirmDiscard = useCallback(() => {
    setEdits({});
    setIsEditMode(false);
    setShowDiscardConfirm(false);
  }, []);

  // Discard edits (stay in edit mode)
  const handleDiscardEdits = useCallback(() => {
    setEdits({});
  }, []);

  // Save All - persist inline edits via ProducerService.updateAsset
  const handleSaveAll = useCallback(async () => {
    const entries = Object.entries(edits);
    if (entries.length === 0) return;

    setIsSavingInlineEdits(true);
    try {
      const promises = entries.map(([assetId, updates]) => {
        const asset = assets.find((a) => a.id === assetId);
        if (!asset) {
          return Promise.reject(new Error('Asset not found'));
        }
        const formData = {
          asset_name: toTitleCase(updates.asset_name ?? asset.asset_name ?? ''),
          specifications: updates.specifications ?? asset.specifications ?? '',
          timeline: asset.timeline ?? '',
          status: asset.status,
          assigned_supplier_id: asset.assigned_supplier_id,
          quantity: updates.quantity ?? asset.quantity,
          tags: updates.tags ?? asset.tags ?? []
        };
        return ProducerService.updateAsset(assetId, formData);
      });

      const results = await Promise.allSettled(promises);
      const fulfilledIndices = results
        .map((r, i) => (r.status === 'fulfilled' ? i : -1))
        .filter((i) => i >= 0);
      const rejectedCount = results.filter((r) => r.status === 'rejected').length;

      if (rejectedCount === 0) {
        setEdits({});
        setIsEditMode(false);
        fulfilledIndices.forEach((i) => {
          const r = results[i];
          if (r.status === 'fulfilled') onAssetUpdate?.(r.value);
        });
        showSuccess(
          `Updated ${fulfilledIndices.length} asset${fulfilledIndices.length === 1 ? '' : 's'} successfully`
        );
      } else {
        const successfulIds = new Set(fulfilledIndices.map((i) => entries[i][0]));
        setEdits((prev) => {
          const next = { ...prev };
          successfulIds.forEach((id) => delete next[id]);
          return next;
        });
        showError(
          `${rejectedCount} of ${entries.length} update${entries.length === 1 ? '' : 's'} failed. Successful changes were saved; failed assets remain in edit mode.`
        );
      }
    } finally {
      setIsSavingInlineEdits(false);
    }
  }, [edits, assets, onAssetUpdate, showSuccess, showError]);

  // Update a single asset's edits
  const handleEditChange = useCallback((assetId: string, updates: Partial<InlineEditFields>) => {
    setEdits((prev) => {
      const current = prev[assetId] || {};
      const next = { ...current, ...updates };
      return { ...prev, [assetId]: next };
    });
  }, []);

  // Search, filter, and sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'quantity'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  // showFilters is now passed as a prop

  // Debug: Log sorting changes
  useEffect(() => {
    console.log('Sorting changed:', { sortBy, sortOrder });
  }, [sortBy, sortOrder]);

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
      // Update asset while preserving other fields (Title Case formatting applied)
      const updatedAsset = await ProducerService.updateAsset(editingAsset.id, {
        asset_name: toTitleCase(assetData.asset_name),
        specifications: assetData.specifications,
        status: editingAsset.status,
        timeline: editingAsset.timeline ?? '',
        assigned_supplier_id: editingAsset.assigned_supplier_id,
        quantity: assetData.quantity,
        tags: assetData.tags || []
      });

      // Let parent own the source of truth
      onAssetUpdate?.(updatedAsset);

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

      // Let parent own the source of truth
      onDelete?.(deletingAsset.id);

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
    onAssetUpdate?.(updatedAsset);
    
    // Also update viewingAsset if it's the same asset
    if (viewingAsset?.id === updatedAsset.id) {
      setViewingAsset(updatedAsset);
    }
  };

  // Keep detail modal in sync with parent-owned asset list
  useEffect(() => {
    if (!viewingAsset) return;

    const currentAsset = assets.find(asset => asset.id === viewingAsset.id);
    if (!currentAsset) {
      setIsDetailModalOpen(false);
      setViewingAsset(null);
      return;
    }

    // Refresh modal data when parent sends updated asset values
    if (currentAsset !== viewingAsset) {
      setViewingAsset(currentAsset);
    }
  }, [assets, viewingAsset]);

  // Filter and sort assets
  const filteredAndSortedAssets = useMemo(() => {
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

    // Apply tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(asset =>
        asset.tags && asset.tags.some(tag => selectedTags.includes(tag))
      );
    }

    // Apply status filter
    if (selectedStatus) {
      filtered = filtered.filter(asset => asset.status === selectedStatus);
    }

    // Apply sorting
    const sortFunction = (a: Asset, b: Asset) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.asset_name.localeCompare(b.asset_name);
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

    return [...filtered].sort(sortFunction);
  }, [assets, searchTerm, selectedTags, selectedStatus, sortBy, sortOrder]);

  // Extract unique tags from the current project's assets (before filtering)
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    assets.forEach(asset => {
      if (asset.tags && Array.isArray(asset.tags)) {
        asset.tags.forEach(tag => {
          if (tag && tag.trim()) {
            tagSet.add(tag);
          }
        });
      }
    });
    // Convert Set to sorted array for consistent display
    return Array.from(tagSet).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  }, [assets]);

  // Extract unique status values from the current project's assets (before filtering)
  const availableStatuses = useMemo(() => {
    const statusSet = new Set<string>();
    assets.forEach(asset => {
      if (asset.status) {
        statusSet.add(asset.status);
      }
    });
    // Convert Set to sorted array for consistent display
    // Order: Pending, Quoting, Approved, In Production, Delivered
    const statusOrder: Record<string, number> = {
      'Pending': 1,
      'Quoting': 2,
      'Approved': 3,
      'In Production': 4,
      'Delivered': 5
    };
    return Array.from(statusSet).sort((a, b) => {
      const orderA = statusOrder[a] || 999;
      const orderB = statusOrder[b] || 999;
      return orderA - orderB;
    });
  }, [assets]);

  // Loading state
  if (isLoading) {
    return (
      <section className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Assets</h2>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
            <p className="text-gray-300">Loading assets...</p>
          </div>
        </div>
      </section>
    );
  }

  // Empty state - no assets
  if (assets.length === 0) {
    return (
      <section className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Assets</h2>
        <div className="bg-white/5 border-2 border-dashed border-white/30 rounded-lg p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No assets yet</h3>
          <p className="text-gray-300">
            Assets will appear here once they are created for this project.
          </p>
        </div>
      </section>
    );
  }

  // Main display - always show search/filter controls when there are assets
  return (
    <section className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
      {/* Section Header removed - now handled in top row */}

      {/* Search and Filter Controls - Always visible when assets exist, when explicitly toggled, or when any filters are active */}
      {assets.length > 0 && (showFilters || searchTerm || selectedTags.length > 0 || selectedStatus) && (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4 mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-300" />
            </div>
            <input
              type="text"
              placeholder="Search assets by name, specifications, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="h-4 w-4 text-gray-300 hover:text-white transition-colors" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tag Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                {availableTags.length > 0 ? (
                  availableTags.map(tagName => (
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
                        : 'bg-white/10 border-white/20 text-gray-200 hover:bg-white/20'
                    }`}
                    style={{
                      backgroundColor: selectedTags.includes(tagName) ? getTagColor(tagName) : undefined
                    }}
                  >
                    {tagName}
                  </button>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 italic">No tags used in this project</p>
                )}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              >
                <option value="">All Statuses</option>
                {availableStatuses.map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Controls */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Sort By
                <span className="ml-2 text-xs text-purple-300 font-normal">
                  ({sortBy === 'date' ? 'Date Added' : 
                    sortBy === 'name' ? 'Name' : 
                    sortBy === 'quantity' ? 'Quantity' : 'Date Added'} - {sortOrder === 'asc' ? 'A→Z' : 'Z→A'})
                </span>
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'quantity')}
                  className="flex-1 px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                >
                  <option value="date">Date Added</option>
                  <option value="name">Name</option>
                  <option value="quantity">Quantity</option>
                </select>
                <button
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className={`p-2 border rounded-lg transition-colors ${
                    sortOrder === 'asc' 
                      ? 'border-purple-400/50 bg-purple-500/20 text-purple-200' 
                      : 'border-white/20 hover:bg-white/10'
                  }`}
                  title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  <ArrowUpDown className={`w-4 h-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''} text-gray-300`} />
                </button>
              </div>
            </div>
          </div>

          {/* Clear All Filters */}
          {(selectedTags.length > 0 || searchTerm || selectedStatus || sortBy !== 'name' || sortOrder !== 'asc') && (
            <div className="flex justify-between">
              <button
                onClick={() => {
                  setSortBy('name');
                  setSortOrder('asc');
                }}
                className="text-sm text-gray-300 hover:text-gray-200 underline transition-colors"
              >
                Reset sort
              </button>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedTags([]);
                  setSelectedStatus('');
                }}
                className="text-sm text-gray-300 hover:text-gray-200 underline transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Asset Table View or Empty State */}
      {filteredAndSortedAssets.length === 0 && assets.length > 0 ? (
        // Empty state - no assets match filters (but search/filter controls remain visible above)
        <div className="bg-white/5 border-2 border-dashed border-white/30 rounded-lg p-12 text-center">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No assets match your filters</h3>
          <p className="text-gray-300 mb-4">
            Try adjusting your search terms or filters to see more results.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedTags([]);
              setSelectedStatus('');
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        // Asset Table View with Inline Edit Toolbar
        <>
          {/* Inline Edit Toolbar */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <button
              type="button"
              onClick={handleEditModeToggle}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isEditMode
                  ? 'bg-purple-600 text-white hover:bg-purple-500'
                  : 'bg-white/10 border border-white/20 text-gray-200 hover:bg-white/20'
              }`}
            >
              <Pencil className="w-4 h-4" />
              {isEditMode ? 'Exit Edit Mode' : 'Edit Mode'}
            </button>
            {isEditMode && hasEdits && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDiscardEdits}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white/10 border border-white/20 text-gray-200 hover:bg-white/20 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={isSavingInlineEdits}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-teal-600 text-white hover:bg-teal-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSavingInlineEdits ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save All
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <AssetTable
            assets={filteredAndSortedAssets}
            onEdit={handleOpenEditModal}
            onDelete={handleOpenDeleteModal}
            onView={handleViewAsset}
            hoveredAssetId={hoveredAssetId}
            onAssetHover={onAssetHover}
            isEditMode={isEditMode}
            edits={edits}
            onEditChange={handleEditChange}
          />
        </>
      )}

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

      {/* Discard changes confirmation (when exiting edit mode with unsaved edits) */}
      <ConfirmationModal
        isOpen={showDiscardConfirm}
        title="Discard changes?"
        message="You have unsaved changes. Are you sure you want to exit edit mode and discard them?"
        confirmText="Discard"
        cancelText="Keep Editing"
        onConfirm={handleConfirmDiscard}
        onCancel={() => setShowDiscardConfirm(false)}
        variant="danger"
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


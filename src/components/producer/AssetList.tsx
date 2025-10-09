import React, { useState, useEffect, useMemo } from 'react';
import { Package, AlertCircle, Plus } from 'lucide-react';
import { ProducerService } from '@/services/producerService';
import { useNotification } from '@/hooks/useNotification';
import AssetCard from './AssetCard';
import AssetFormModal from './AssetFormModal';
import ConfirmationModal from '@/components/shared/ConfirmationModal';
import type { Asset } from '@/lib/supabase';
import type { AssetStatus } from '@/types/database';

interface AssetListProps {
  projectId: string;
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
 */
const AssetList: React.FC<AssetListProps> = ({ projectId }) => {
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
  const handleAddAsset = async (assetData: { asset_name: string; specifications: string }) => {
    setIsSubmitting(true);
    try {
      // Create asset with default values
      const newAsset = await ProducerService.createAsset(projectId, {
        asset_name: assetData.asset_name,
        specifications: assetData.specifications,
        status: 'Pending',
        timeline: '',
        assigned_supplier_id: undefined
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
  const handleUpdateAsset = async (assetData: { asset_name: string; specifications: string }) => {
    if (!editingAsset) return;

    setIsSubmitting(true);
    try {
      // Update asset while preserving other fields
      const updatedAsset = await ProducerService.updateAsset(editingAsset.id, {
        asset_name: assetData.asset_name,
        specifications: assetData.specifications,
        status: editingAsset.status,
        timeline: editingAsset.timeline ?? '',
        assigned_supplier_id: editingAsset.assigned_supplier_id
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

  // Group assets by status
  const groupedAssets = useMemo(() => {
    const groups: Record<AssetStatus, Asset[]> = {
      'Pending': [],
      'Quoting': [],
      'Approved': [],
      'In Production': [],
      'Delivered': []
    };

    assets.forEach(asset => {
      if (groups[asset.status]) {
        groups[asset.status].push(asset);
      }
    });

    return groups;
  }, [assets]);

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

  // Main Kanban board display
  return (
    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Package className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">Assets</h2>
          <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full">
            {assets.length}
          </span>
        </div>
        
        {/* Add Asset Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Asset
        </button>
      </div>

      {/* Kanban Board - Horizontal Scrolling Container */}
      <div className="overflow-x-auto -mx-6 px-6 pb-4">
        <div className="flex gap-6 min-w-max">
          {/* Render each status column */}
          {activeStatuses.map((status) => {
            const assetsInStatus = groupedAssets[status];
            
            return (
              <div
                key={status}
                className="flex-shrink-0 w-80"
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
                      onEdit={handleOpenEditModal}
                      onDelete={handleOpenDeleteModal}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scroll hint for users (only show if there are multiple columns) */}
      {activeStatuses.length > 1 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          ← Scroll horizontally to view all status columns →
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
    </section>
  );
};

export default AssetList;


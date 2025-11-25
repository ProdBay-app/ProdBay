import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Calendar, Clock, Package, Hash, Tag, Copy, Edit2, Save } from 'lucide-react';
import { ProducerService } from '@/services/producerService';
import { useNotification } from '@/hooks/useNotification';
import QuotesList from './QuotesList';
import AssetSubdivisionModal from './AssetSubdivisionModal';
import AssetTimelineManager from './AssetTimelineManager';
import SupplierStatusTracker from './SupplierStatusTracker';
import { getTagColor } from '@/utils/assetTags';
import type { Asset } from '@/lib/supabase';

interface AssetDetailModalProps {
  isOpen: boolean;
  asset: Asset | null;
  onClose: () => void;
  onAssetUpdate: (updatedAsset: Asset) => void;
}

/**
 * AssetDetailModal - A comprehensive interactive modal for viewing and managing asset details
 * 
 * Features:
 * - Large, focused modal for deep dive into asset information
 * - Displays all asset fields in an organized, readable format
 * - Responsive layout (full-screen on mobile, large centered on desktop)
 * - Foundation for future interactive features (quotes, activity, etc.)
 */
const AssetDetailModal: React.FC<AssetDetailModalProps> = ({ isOpen, asset, onClose, onAssetUpdate }) => {
  const { showSuccess, showError } = useNotification();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubdivisionModalOpen, setIsSubdivisionModalOpen] = useState(false);
  
  // Initialize editing data directly from asset (before early return)
  const [editingData, setEditingData] = useState({
    asset_name: asset?.asset_name || '',
    specifications: asset?.specifications || '',
    quantity: asset?.quantity,
    tags: asset?.tags || []
  });

  // Debug logging
  console.log('AssetDetailModal render:', { isOpen, asset: asset?.id, isSubdivisionModalOpen });

  // Don't render if modal is closed or no asset is selected
  if (!isOpen || !asset) return null;

  // Handle field editing
  const handleFieldEdit = async () => {
    if (!asset) return;

    try {
      const updatedAsset = await ProducerService.updateAsset(asset.id, {
        asset_name: editingData.asset_name,
        specifications: editingData.specifications,
        timeline: asset.timeline || '',
        assigned_supplier_id: asset.assigned_supplier_id,
        quantity: editingData.quantity,
        tags: editingData.tags
      });

      onAssetUpdate(updatedAsset);
      setIsEditing(false);
      showSuccess('Asset updated successfully');
    } catch (err) {
      console.error('Error updating asset:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update asset';
      showError(errorMessage);
    }
  };

  // Handle asset subdivision
  const handleAssetsCreated = (newAssets: Asset[]) => {
    showSuccess(`Successfully created ${newAssets.length} sub-asset${newAssets.length > 1 ? 's' : ''}`);
    // Note: In a real implementation, you'd want to refresh the parent component's asset list
  };

  // Format dates for display
  const formattedTimeline = asset.timeline
    ? new Date(asset.timeline).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Not set';

  const formattedCreatedAt = new Date(asset.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const formattedUpdatedAt = new Date(asset.updated_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Render modal using React Portal to escape parent container constraints
  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity z-[99]"
        onClick={onClose}
        aria-hidden="true"
      />

          {/* Modal Content */}
          <div
        className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto z-[101]"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Header - Purple gradient matching brand */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-5 rounded-t-xl">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Package className="w-6 h-6 text-white" />
                    <h2 className="text-2xl font-bold text-white">
                      {asset.asset_name}
                    </h2>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      console.log('Subdivide button clicked, setting isSubdivisionModalOpen to true');
                      setIsSubdivisionModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors text-sm font-medium"
                    title="Subdivide this asset"
                  >
                    <Copy className="w-4 h-4" />
                    Subdivide
                  </button>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors text-sm font-medium"
                    title={isEditing ? "Cancel editing" : "Edit asset details"}
                  >
                    <Edit2 className="w-4 h-4" />
                    {isEditing ? 'Cancel' : 'Edit'}
                  </button>
                </div>
                
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="flex-shrink-0 p-2 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Body - Main Content */}
            <div className="p-6 space-y-6">
              {/* Overview Section */}
              <section>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-300" />
                  Overview
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Asset Name */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-200 mb-2">
                      Asset Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingData.asset_name}
                        onChange={(e) => setEditingData(prev => ({ ...prev, asset_name: e.target.value }))}
                        className="w-full px-3 py-2 bg-black/20 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="bg-black/20 rounded-lg p-4 border border-white/20">
                        <p className="text-white font-medium">{asset.asset_name}</p>
                      </div>
                    )}
                  </div>

                  {/* Specifications */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-200 mb-2">
                      Specifications
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editingData.specifications}
                        onChange={(e) => setEditingData(prev => ({ ...prev, specifications: e.target.value }))}
                        rows={4}
                        className="w-full px-3 py-2 bg-black/20 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter asset specifications"
                      />
                    ) : (
                      <div className="bg-black/20 rounded-lg p-4 border border-white/20">
                        {asset.specifications ? (
                          <p className="text-white whitespace-pre-wrap leading-relaxed">
                            {asset.specifications}
                          </p>
                        ) : (
                          <p className="text-gray-300 italic">No specifications provided</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Timeline */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1.5 text-purple-300" />
                      Timeline
                    </label>
                    <div className="bg-black/20 rounded-lg p-3 border border-white/20">
                      <p className="text-white">{formattedTimeline}</p>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-2">
                      <Hash className="w-4 h-4 inline mr-1.5 text-purple-300" />
                      Quantity
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        min="1"
                        value={editingData.quantity || ''}
                        onChange={(e) => setEditingData(prev => ({ 
                          ...prev, 
                          quantity: e.target.value ? parseInt(e.target.value, 10) : undefined 
                        }))}
                        className="w-full px-3 py-2 bg-black/20 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Optional"
                      />
                    ) : (
                      <div className="bg-black/20 rounded-lg p-3 border border-white/20">
                        <p className="text-white">
                          {asset.quantity ? asset.quantity.toLocaleString() : 'Not specified'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Status - Interactive Dropdown */}
                </div>

                {/* Tags Section */}
                {asset.tags && asset.tags.length > 0 && (
                  <div className="mt-6">
                    <label className="block text-sm font-semibold text-gray-200 mb-3">
                      <Tag className="w-4 h-4 inline mr-1.5 text-purple-300" />
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {asset.tags.map(tagName => (
                        <span
                          key={tagName}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white"
                          style={{ backgroundColor: getTagColor(tagName) }}
                        >
                          <Tag className="w-3 h-3" />
                          {tagName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Save Button for Editing */}
              {isEditing && (
                <div className="flex justify-end">
                  <button
                    onClick={handleFieldEdit}
                    disabled={isUpdatingStatus}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isUpdatingStatus ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}

              {/* Timeline Management Section */}
              <section>
                <AssetTimelineManager 
                  asset={asset}
                  onTimelineUpdate={() => {
                    // Refresh asset data if needed
                  }}
                />
              </section>

              {/* Supplier Status Tracking Section */}
              <section>
                <SupplierStatusTracker 
                  asset={asset}
                  onStatusUpdate={() => {
                    // Refresh data if needed
                  }}
                />
              </section>

        {/* Quotes Section */}
        <section>
          <QuotesList 
            assetId={asset.id} 
            assetName={asset.asset_name}
          />
        </section>

              {/* Metadata Section */}
              <section>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-300" />
                  Metadata
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-black/20 rounded-lg p-4 border border-white/20">
                    <label className="block text-sm font-semibold text-gray-200 mb-1">
                      Created
                    </label>
                    <p className="text-white">{formattedCreatedAt}</p>
                  </div>

                  <div className="bg-black/20 rounded-lg p-4 border border-white/20">
                    <label className="block text-sm font-semibold text-gray-200 mb-1">
                      Last Updated
                    </label>
                    <p className="text-white">{formattedUpdatedAt}</p>
                  </div>
                </div>
              </section>

              {/* Future Features - Placeholders */}
              <section className="border-t border-white/20 pt-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Coming Soon
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Quotes Placeholder */}
                  <div className="bg-white/5 rounded-lg p-5 border-2 border-dashed border-white/30 text-center">
                    <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-white font-medium text-sm">Quotes Comparison</p>
                    <p className="text-gray-300 text-xs mt-1">View and compare supplier quotes</p>
                  </div>

                  {/* Activity Placeholder */}
                  <div className="bg-white/5 rounded-lg p-5 border-2 border-dashed border-white/30 text-center">
                    <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-white font-medium text-sm">Activity Log</p>
                    <p className="text-gray-300 text-xs mt-1">Track changes and updates</p>
                  </div>

                  {/* Documents Placeholder */}
                  <div className="bg-white/5 rounded-lg p-5 border-2 border-dashed border-white/30 text-center">
                    <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-white font-medium text-sm">Documents</p>
                    <p className="text-gray-300 text-xs mt-1">Attach files and references</p>
                  </div>
                </div>
              </section>
            </div>

            {/* Footer - Optional action buttons area for future use */}
            <div className="sticky bottom-0 bg-white/10 backdrop-blur-md px-6 py-4 border-t border-white/20 rounded-b-xl">
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium shadow-sm"
                >
                  Close
                </button>
          </div>
        </div>
      </div>

      {/* Asset Subdivision Modal */}
      <AssetSubdivisionModal
        isOpen={isSubdivisionModalOpen}
        originalAsset={asset}
        onClose={() => setIsSubdivisionModalOpen(false)}
        onAssetsCreated={handleAssetsCreated}
      />
    </div>
  );

  // Render modal via portal to document.body to escape parent container constraints
  return createPortal(modalContent, document.body);
};

export default AssetDetailModal;
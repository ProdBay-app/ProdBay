import React, { useState } from 'react';
import { X, Copy, Plus, Trash2, Save } from 'lucide-react';
import { ProducerService } from '@/services/producerService';
import { useNotification } from '@/hooks/useNotification';
import { toTitleCase } from '@/utils/textFormatters';
import type { Asset } from '@/lib/supabase';
import type { AssetFormData } from '@/services/producerService';

interface AssetSubdivisionModalProps {
  isOpen: boolean;
  originalAsset: Asset | null;
  onClose: () => void;
  onAssetsCreated: (newAssets: Asset[]) => void;
}

interface SubAssetFormData {
  asset_name: string;
  specifications: string;
  quantity?: number;
  tags: string[];
}

/**
 * AssetSubdivisionModal - Allows users to split a single asset into multiple assets
 * 
 * Features:
 * - Create multiple sub-assets from a parent asset
 * - Copy specifications and tags from original
 * - Individual quantity and naming for each sub-asset
 * - Validation and error handling
 * - Batch creation with progress feedback
 */
const AssetSubdivisionModal: React.FC<AssetSubdivisionModalProps> = ({
  isOpen,
  originalAsset,
  onClose,
  onAssetsCreated
}) => {
  const { showSuccess, showError } = useNotification();
  const [subAssets, setSubAssets] = useState<SubAssetFormData[]>([
    {
      asset_name: '',
      specifications: '',
      quantity: undefined,
      tags: []
    }
  ]);
  const [isCreating, setIsCreating] = useState(false);

  // Debug logging
  console.log('AssetSubdivisionModal render:', { isOpen, originalAsset: originalAsset?.id });

  // Don't render if modal is closed or no asset is selected
  if (!isOpen || !originalAsset) return null;

  // Add a new sub-asset
  const addSubAsset = () => {
    setSubAssets(prev => [...prev, {
      asset_name: '',
      specifications: originalAsset.specifications || '',
      quantity: undefined,
      tags: originalAsset.tags || []
    }]);
  };

  // Remove a sub-asset
  const removeSubAsset = (index: number) => {
    if (subAssets.length > 1) {
      setSubAssets(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Update a specific sub-asset
  const updateSubAsset = (index: number, field: keyof SubAssetFormData, value: any) => {
    setSubAssets(prev => prev.map((asset, i) => 
      i === index ? { ...asset, [field]: value } : asset
    ));
  };

  // Copy original asset data to all sub-assets
  const copyOriginalToAll = () => {
    setSubAssets(prev => prev.map(asset => ({
      ...asset,
      specifications: originalAsset.specifications || '',
      tags: originalAsset.tags || []
    })));
  };

  // Validate form data
  const validateForm = (): boolean => {
    for (let i = 0; i < subAssets.length; i++) {
      const asset = subAssets[i];
      if (!asset.asset_name.trim()) {
        showError(`Service ${i + 1} must have a name`);
        return false;
      }
    }
    return true;
  };

  // Create all sub-assets
  const handleCreateAssets = async () => {
    if (!validateForm()) return;

    setIsCreating(true);
    try {
      const createdAssets: Asset[] = [];
      
      for (const subAsset of subAssets) {
        const assetData: AssetFormData = {
          asset_name: toTitleCase(subAsset.asset_name.trim()),
          specifications: subAsset.specifications,
          timeline: originalAsset.timeline || '',
          status: originalAsset.status,
          assigned_supplier_id: originalAsset.assigned_supplier_id,
          quantity: subAsset.quantity,
          tags: subAsset.tags
        };

        const newAsset = await ProducerService.createAsset(originalAsset.project_id, assetData);
        createdAssets.push(newAsset);
      }

      onAssetsCreated(createdAssets);
      showSuccess(`Successfully created ${createdAssets.length} sub-service${createdAssets.length > 1 ? 's' : ''}`);
      onClose();
    } catch (err) {
      console.error('Error creating sub-assets:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create sub-assets';
      showError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
        style={{ zIndex: 100000 }}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 overflow-y-auto" style={{ zIndex: 100001 }}>
        <div className="flex min-h-full items-center justify-center p-4 sm:p-6 lg:p-8">
          {/* Modal Content */}
          <div
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-wedding-primary to-wedding-primary-hover px-6 py-5 rounded-t-xl">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Copy className="w-6 h-6 text-white" />
                    <h2 className="text-2xl font-bold text-white">
                      Subdivide Service
                    </h2>
                  </div>
                  <p className="text-purple-100 text-sm">
                    Split "{originalAsset.asset_name}" into multiple services
                  </p>
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

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Original Asset Info */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Original Service</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Name:</span>
                    <span className="ml-2 text-gray-900">{originalAsset.asset_name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className="ml-2 text-gray-900">{originalAsset.status}</span>
                  </div>
                  {originalAsset.quantity && (
                    <div>
                      <span className="font-medium text-gray-700">Quantity:</span>
                      <span className="ml-2 text-gray-900">{originalAsset.quantity.toLocaleString()}</span>
                    </div>
                  )}
                  {originalAsset.tags && originalAsset.tags.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700">Tags:</span>
                      <span className="ml-2 text-gray-900">{originalAsset.tags.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sub-Assets */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Sub-Services ({subAssets.length})
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyOriginalToAll}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Original Data
                    </button>
                    <button
                      onClick={addSubAsset}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-wedding-primary text-white rounded-lg hover:bg-wedding-primary-hover transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Service
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {subAssets.map((subAsset, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">Service {index + 1}</h4>
                        {subAssets.length > 1 && (
                          <button
                            onClick={() => removeSubAsset(index)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Remove this service"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Asset Name */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Service Name *
                          </label>
                          <input
                            type="text"
                            value={subAsset.asset_name}
                            onChange={(e) => updateSubAsset(index, 'asset_name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wedding-primary focus:border-transparent"
                            placeholder="Enter service name"
                            required
                          />
                        </div>

                        {/* Quantity */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={subAsset.quantity || ''}
                            onChange={(e) => updateSubAsset(index, 'quantity', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wedding-primary focus:border-transparent"
                            placeholder="Optional"
                          />
                        </div>

                        {/* Specifications */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Specifications
                          </label>
                          <textarea
                            value={subAsset.specifications}
                            onChange={(e) => updateSubAsset(index, 'specifications', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wedding-primary focus:border-transparent"
                            placeholder="Service specifications"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-xl">
              <div className="flex justify-between">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAssets}
                  disabled={isCreating}
                  className="flex items-center gap-2 px-5 py-2.5 bg-wedding-primary text-white rounded-lg hover:bg-wedding-primary-hover transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Create {subAssets.length} Service{subAssets.length > 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AssetSubdivisionModal;

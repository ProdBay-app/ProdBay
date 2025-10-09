import React, { useState, useEffect } from 'react';
import { X, Package, Edit } from 'lucide-react';
import type { Asset } from '@/lib/supabase';

interface AssetFormModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  mode: 'create' | 'edit';
  assetToEdit?: Asset | null;
  onClose: () => void;
  onSubmit: (assetData: { asset_name: string; specifications: string }) => void;
}

/**
 * AssetFormModal - Reusable modal for creating and editing assets
 * 
 * Features:
 * - Dual mode: create new assets or edit existing ones
 * - Focused form with only essential fields (name + specifications)
 * - Clean, minimal design for quick operations
 * - Built-in form validation
 * - Manages its own form state
 * - Pre-populates form when editing
 * - Resets form when closed
 */
const AssetFormModal: React.FC<AssetFormModalProps> = ({
  isOpen,
  isSubmitting,
  mode,
  assetToEdit,
  onClose,
  onSubmit
}) => {
  // Form state
  const [formData, setFormData] = useState({
    asset_name: '',
    specifications: ''
  });

  // Pre-populate form when editing or reset when creating
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && assetToEdit) {
        // Pre-populate with asset data
        setFormData({
          asset_name: assetToEdit.asset_name,
          specifications: assetToEdit.specifications || ''
        });
      } else {
        // Reset for create mode
        setFormData({
          asset_name: '',
          specifications: ''
        });
      }
    }
  }, [isOpen, mode, assetToEdit]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate asset name is provided
    if (!formData.asset_name.trim()) {
      return;
    }
    
    // Submit the form data
    onSubmit(formData);
  };

  // Handle backdrop click to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              {mode === 'edit' ? (
                <Edit className="w-6 h-6 text-white" />
              ) : (
                <Package className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                {mode === 'edit' ? 'Edit Asset' : 'Add New Asset'}
              </h3>
              <p className="text-purple-100 text-sm">
                {mode === 'edit' 
                  ? 'Update asset name and specifications' 
                  : 'Create a new asset for this project'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Asset Name */}
          <div>
            <label htmlFor="asset_name" className="block text-sm font-semibold text-gray-700 mb-2">
              Asset Name <span className="text-red-500">*</span>
            </label>
            <input
              id="asset_name"
              name="asset_name"
              type="text"
              value={formData.asset_name}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="e.g., Exhibition Booth Design, Marketing Brochure"
              autoFocus
            />
            <p className="mt-1 text-xs text-gray-500">
              Provide a clear, descriptive name for this asset
            </p>
          </div>

          {/* Specifications */}
          <div>
            <label htmlFor="specifications" className="block text-sm font-semibold text-gray-700 mb-2">
              Specifications <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              id="specifications"
              name="specifications"
              value={formData.specifications}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="Describe the asset requirements, dimensions, materials, or any other specifications..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Add detailed specifications to help guide production
            </p>
          </div>

          {/* Info Box - Conditional based on mode */}
          {mode === 'create' && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-800">
                <span className="font-semibold">Note:</span> New assets are created with a "Pending" status. 
                You can update the status, timeline, and assign suppliers later.
              </p>
            </div>
          )}

          {mode === 'edit' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Note:</span> This will update the asset's name and specifications. 
                Status, timeline, and supplier assignments will remain unchanged.
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.asset_name.trim()}
              className="px-5 py-2.5 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  {mode === 'edit' ? 'Saving...' : 'Creating...'}
                </>
              ) : (
                <>
                  {mode === 'edit' ? (
                    <>
                      <Edit className="w-4 h-4" />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <Package className="w-4 h-4" />
                      Create Asset
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetFormModal;



import React, { useState, useEffect } from 'react';
import { X, Package } from 'lucide-react';

interface AddAssetModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (assetData: { asset_name: string; specifications: string }) => void;
}

/**
 * AddAssetModal - Simplified modal for creating new assets
 * 
 * Features:
 * - Focused form with only essential fields (name + specifications)
 * - Clean, minimal design for quick asset creation
 * - Built-in form validation
 * - Manages its own form state
 * - Resets form when closed
 */
const AddAssetModal: React.FC<AddAssetModalProps> = ({
  isOpen,
  isSubmitting,
  onClose,
  onSubmit
}) => {
  // Form state
  const [formData, setFormData] = useState({
    asset_name: '',
    specifications: ''
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        asset_name: '',
        specifications: ''
      });
    }
  }, [isOpen]);

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
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Add New Asset</h3>
              <p className="text-purple-100 text-sm">Create a new asset for this project</p>
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

          {/* Info Box */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-800">
              <span className="font-semibold">Note:</span> New assets are created with a "Pending" status. 
              You can update the status, timeline, and assign suppliers later.
            </p>
          </div>

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
                  Creating...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4" />
                  Create Asset
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAssetModal;


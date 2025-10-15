import React, { useState, useEffect } from 'react';
import { X, Package, Edit, Tag, Hash } from 'lucide-react';
import type { Asset } from '@/lib/supabase';
import { PREDEFINED_ASSET_TAGS, getTagColor } from '@/utils/assetTags';

interface AssetFormModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  mode: 'create' | 'edit';
  assetToEdit?: Asset | null;
  onClose: () => void;
  onSubmit: (assetData: { 
    asset_name: string; 
    specifications: string;
    quantity?: number;
    tags?: string[];
  }) => void;
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
    specifications: '',
    quantity: undefined as number | undefined,
    tags: [] as string[]
  });

  // Tag selection state
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [tagSearchTerm, setTagSearchTerm] = useState('');

  // Pre-populate form when editing or reset when creating
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && assetToEdit) {
        // Pre-populate with asset data
        setFormData({
          asset_name: assetToEdit.asset_name,
          specifications: assetToEdit.specifications || '',
          quantity: assetToEdit.quantity || undefined,
          tags: assetToEdit.tags || []
        });
      } else {
        // Reset for create mode
        setFormData({
          asset_name: '',
          specifications: '',
          quantity: undefined,
          tags: []
        });
      }
    }
  }, [isOpen, mode, assetToEdit]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseInt(value, 10) : undefined) : value
    }));
  };

  // Handle tag selection
  const handleTagToggle = (tagName: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagName)
        ? prev.tags.filter(t => t !== tagName)
        : [...prev.tags, tagName]
    }));
  };

  // Handle tag removal
  const handleTagRemove = (tagName: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagName)
    }));
  };

  // Filter available tags based on search
  const filteredTags = PREDEFINED_ASSET_TAGS.filter(tag =>
    tag.name.toLowerCase().includes(tagSearchTerm.toLowerCase()) ||
    tag.description.toLowerCase().includes(tagSearchTerm.toLowerCase())
  );

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

  // Close tag selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showTagSelector) {
        const target = event.target as Element;
        if (!target.closest('.tag-selector-container')) {
          setShowTagSelector(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTagSelector]);

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

          {/* Quantity */}
          <div>
            <label htmlFor="quantity" className="block text-sm font-semibold text-gray-700 mb-2">
              Quantity <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Hash className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                value={formData.quantity || ''}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Enter quantity (e.g., 100)"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Specify the quantity or amount needed for this asset
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tags <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            
            {/* Selected Tags Display */}
            {formData.tags.length > 0 && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tagName => (
                    <span
                      key={tagName}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: getTagColor(tagName) }}
                    >
                      {tagName}
                      <button
                        type="button"
                        onClick={() => handleTagRemove(tagName)}
                        className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                        disabled={isSubmitting}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tag Selector */}
            <div className="relative tag-selector-container">
              <button
                type="button"
                onClick={() => setShowTagSelector(!showTagSelector)}
                disabled={isSubmitting}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-500 text-left flex items-center gap-2"
              >
                <Tag className="w-5 h-5 text-gray-400" />
                <span className="text-gray-500">
                  {formData.tags.length > 0 ? `${formData.tags.length} tag(s) selected` : 'Select tags...'}
                </span>
              </button>

              {/* Tag Dropdown */}
              {showTagSelector && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
                  {/* Search */}
                  <div className="p-3 border-b border-gray-200">
                    <input
                      type="text"
                      placeholder="Search tags..."
                      value={tagSearchTerm}
                      onChange={(e) => setTagSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* Tag List */}
                  <div className="max-h-48 overflow-y-auto">
                    {filteredTags.length === 0 ? (
                      <div className="p-3 text-sm text-gray-500 text-center">
                        No tags found
                      </div>
                    ) : (
                      filteredTags.map(tag => (
                        <button
                          key={tag.name}
                          type="button"
                          onClick={() => handleTagToggle(tag.name)}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${
                            formData.tags.includes(tag.name) ? 'bg-purple-50' : ''
                          }`}
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          <div className="flex-1">
                            <div className="font-medium">{tag.name}</div>
                            <div className="text-xs text-gray-500">{tag.description}</div>
                          </div>
                          {formData.tags.includes(tag.name) && (
                            <div className="text-purple-600">✓</div>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Categorize your asset with predefined tags for better organization
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



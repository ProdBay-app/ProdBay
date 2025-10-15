import React, { useState, useMemo } from 'react';
import { Package, Search, Filter, CheckSquare, Square, X } from 'lucide-react';
import type { Asset, SuggestedSupplier } from '@/lib/supabase';

interface SupplierSelectionModalProps {
  isOpen: boolean;
  asset: Asset | null;
  suggestedSuppliers: SuggestedSupplier[];
  selectedSupplierIds: string[];
  loading: boolean;
  onClose: () => void;
  onSupplierToggle: (supplierId: string) => void;
  onConfirm: () => void;
}

const SupplierSelectionModal: React.FC<SupplierSelectionModalProps> = ({
  isOpen,
  asset,
  suggestedSuppliers,
  selectedSupplierIds,
  loading,
  onClose,
  onSupplierToggle,
  onConfirm
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Get all unique service categories from suppliers
  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    suggestedSuppliers.forEach(supplier => {
      if (supplier.service_categories) {
        supplier.service_categories.forEach(category => categories.add(category));
      }
    });
    return Array.from(categories).sort();
  }, [suggestedSuppliers]);

  // Filter suppliers based on search and category filters
  const filteredSuppliers = useMemo(() => {
    let filtered = suggestedSuppliers;

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(supplier =>
        supplier.supplier_name.toLowerCase().includes(term) ||
        supplier.contact_email.toLowerCase().includes(term) ||
        (supplier.service_categories && supplier.service_categories.some(cat => 
          cat.toLowerCase().includes(term)
        ))
      );
    }

    // Apply category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(supplier =>
        supplier.service_categories && 
        supplier.service_categories.some(cat => selectedCategories.includes(cat))
      );
    }

    return filtered;
  }, [suggestedSuppliers, searchTerm, selectedCategories]);

  // Smart select all - only selects visible suppliers after filtering
  const handleSelectAll = () => {
    const visibleSupplierIds = filteredSuppliers.map(s => s.id);
    const allVisibleSelected = visibleSupplierIds.every(id => selectedSupplierIds.includes(id));
    
    if (allVisibleSelected) {
      // Deselect all visible suppliers
      visibleSupplierIds.forEach(id => {
        if (selectedSupplierIds.includes(id)) {
          onSupplierToggle(id);
        }
      });
    } else {
      // Select all visible suppliers
      visibleSupplierIds.forEach(id => {
        if (!selectedSupplierIds.includes(id)) {
          onSupplierToggle(id);
        }
      });
    }
  };

  // Check if all visible suppliers are selected
  const allVisibleSelected = filteredSuppliers.length > 0 && 
    filteredSuppliers.every(s => selectedSupplierIds.includes(s.id));

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
  };

  // Toggle category filter
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="mb-4">
          <h3 className="text-xl font-semibold">Select Suppliers for Quote Requests</h3>
          <p className="text-gray-600 text-sm">
            Choose which suppliers should receive quote requests for "{asset?.asset_name}".
          </p>
        </div>

        {/* Search and Filter Controls */}
        <div className="mb-4 space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search suppliers by name, email, or service category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Toggle and Category Filters */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
              {(selectedCategories.length > 0) && (
                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                  {selectedCategories.length}
                </span>
              )}
            </button>

            {/* Smart Select All */}
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
            >
              {allVisibleSelected ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {allVisibleSelected ? 'Deselect All' : 'Select All'} ({filteredSuppliers.length})
            </button>
          </div>

          {/* Category Filters */}
          {showFilters && (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">Service Categories</h4>
                {selectedCategories.length > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-purple-600 hover:text-purple-700"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {allCategories.map(category => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      selectedCategories.includes(category)
                        ? 'bg-purple-100 text-purple-700 border-purple-300'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            <span className="ml-2 text-gray-600">Loading suppliers...</span>
          </div>
        ) : (
          <>
            <div className="mb-4">
              {/* Results Summary */}
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-gray-600">
                  {filteredSuppliers.length === suggestedSuppliers.length ? (
                    <span>{suggestedSuppliers.length} supplier{suggestedSuppliers.length !== 1 ? 's' : ''} available</span>
                  ) : (
                    <span>
                      {filteredSuppliers.length} of {suggestedSuppliers.length} supplier{filteredSuppliers.length !== 1 ? 's' : ''} shown
                    </span>
                  )}
                </div>
                {selectedSupplierIds.length > 0 && (
                  <div className="text-sm text-purple-600 font-medium">
                    {selectedSupplierIds.length} selected
                  </div>
                )}
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredSuppliers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    {suggestedSuppliers.length === 0 ? (
                      <>
                        <p>No relevant suppliers found for this asset.</p>
                        <p className="text-sm">Try adding more suppliers or check the asset specifications.</p>
                      </>
                    ) : (
                      <>
                        <p>No suppliers match your current filters.</p>
                        <p className="text-sm">Try adjusting your search or filter criteria.</p>
                        <button
                          onClick={clearFilters}
                          className="mt-2 px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                        >
                          Clear Filters
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  filteredSuppliers.map((supplier) => {
                    const isSelected = selectedSupplierIds.includes(supplier.id);
                    const isAlreadyContacted = supplier.already_contacted;
                    
                    return (
                      <div
                        key={supplier.id}
                        className={`border rounded-lg p-4 transition-colors ${
                          isSelected ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                        } ${isAlreadyContacted ? 'opacity-75' : ''}`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id={`supplier-${supplier.id}`}
                            checked={isSelected}
                            onChange={() => onSupplierToggle(supplier.id)}
                            disabled={isAlreadyContacted}
                            className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <label
                                htmlFor={`supplier-${supplier.id}`}
                                className="font-medium text-gray-900 cursor-pointer"
                              >
                                {supplier.supplier_name}
                              </label>
                              {isAlreadyContacted && (
                                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                  Already Contacted
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{supplier.contact_email}</p>
                            {supplier.service_categories && supplier.service_categories.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {supplier.service_categories.map((category, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                                  >
                                    {category}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-600">
                {selectedSupplierIds.length > 0 && (
                  <span>
                    {selectedSupplierIds.length} supplier{selectedSupplierIds.length !== 1 ? 's' : ''} selected
                  </span>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={selectedSupplierIds.length === 0}
                  className={`px-4 py-2 rounded text-white ${
                    selectedSupplierIds.length === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-teal-600 hover:bg-teal-700'
                  }`}
                >
                  Send Quote Requests{selectedSupplierIds.length > 0 ? ` (${selectedSupplierIds.length})` : ''}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SupplierSelectionModal;

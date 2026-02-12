import React, { useState, useMemo } from 'react';
import { Package, Search, CheckSquare, Square, X, Star, Trophy } from 'lucide-react';
import type { Asset, SuggestedSupplier } from '@/lib/supabase';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { getSupplierRelevanceMetadata } from '@/utils/supplierRelevance';
import { getSupplierPrimaryEmail } from '@/utils/supplierUtils';

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

  // Handle Escape key to close modal
  useEscapeKey(isOpen, onClose, loading);

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
  // Search prioritizes supplier name, with fallback to email and categories
  const filteredSuppliers = useMemo(() => {
    let filtered = suggestedSuppliers;

    // Apply search filter - prioritize name matching
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(supplier => {
        const primaryEmail = getSupplierPrimaryEmail(supplier);
        const emailMatch = primaryEmail ? primaryEmail.toLowerCase().includes(term) : false;
        // Primary: match supplier name
        if (supplier.supplier_name.toLowerCase().includes(term)) {
          return true;
        }
        // Fallback: match email or service categories
        return (
          emailMatch ||
          (supplier.service_categories && supplier.service_categories.some(cat => 
            cat.toLowerCase().includes(term)
          ))
        );
      });
    }

    // Apply category filter - show suppliers that have any selected category
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(supplier =>
        supplier.service_categories && 
        supplier.service_categories.some(cat => selectedCategories.includes(cat))
      );
    }

    return filtered;
  }, [suggestedSuppliers, searchTerm, selectedCategories]);

  // Calculate relevance metadata and split into recommended/other sections
  const { recommendedSuppliers, otherSuppliers, maxScore } = useMemo(() => {
    const assetTags = asset?.tags || [];
    
    // Calculate relevance for each filtered supplier
    const suppliersWithRelevance = filteredSuppliers.map(supplier => ({
      ...supplier,
      relevance: getSupplierRelevanceMetadata(supplier, assetTags)
    }));
    
    // Split into recommended (score > 0) and other (score = 0)
    const recommended = suppliersWithRelevance.filter(s => s.relevance.score > 0);
    const other = suppliersWithRelevance.filter(s => s.relevance.score === 0);
    
    // Calculate max score among recommended suppliers
    const max = recommended.length > 0
      ? Math.max(...recommended.map(s => s.relevance.score))
      : 0;
    
    return { recommendedSuppliers: recommended, otherSuppliers: other, maxScore: max };
  }, [filteredSuppliers, asset?.tags]);

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

  // Select all recommended suppliers only
  const handleSelectAllRecommended = () => {
    const recommendedIds = recommendedSuppliers.map(s => s.id);
    const allRecommendedSelected = recommendedIds.every(id => selectedSupplierIds.includes(id));
    
    if (allRecommendedSelected) {
      // Deselect all recommended suppliers
      recommendedIds.forEach(id => {
        if (selectedSupplierIds.includes(id)) {
          onSupplierToggle(id);
        }
      });
    } else {
      // Select all recommended suppliers
      recommendedIds.forEach(id => {
        if (!selectedSupplierIds.includes(id)) {
          onSupplierToggle(id);
        }
      });
    }
  };

  // Check if all recommended suppliers are selected
  const allRecommendedSelected = recommendedSuppliers.length > 0 && 
    recommendedSuppliers.every(s => selectedSupplierIds.includes(s.id));

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

  // Check if any filters are active
  const hasActiveFilters = searchTerm.trim().length > 0 || selectedCategories.length > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header - Purple gradient matching other modals */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-5 rounded-t-xl">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <h3 className="text-2xl font-bold text-white mb-1">Select Vendors</h3>
              <p className="text-purple-100 text-sm">
                Choose vendors to request quotes for "{asset?.asset_name}"
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Body - Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Prominent Search Bar - At the very top */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-300" />
              <input
                type="text"
                placeholder="Search vendors by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-12 py-3 text-base bg-black/20 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                autoFocus
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Tag Toggles - Always Visible, Below Search */}
          {allCategories.length > 0 && (
            <div className="mb-4 pb-4 border-b border-white/20">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-200">Filter by Service Category</h4>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-purple-300 hover:text-purple-200 font-medium transition-colors"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {allCategories.map(category => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                      selectedCategories.includes(category)
                        ? 'bg-purple-500/30 text-purple-200 border-purple-400/50 font-medium shadow-sm'
                        : 'bg-white/5 text-gray-300 border-white/20 hover:bg-white/10 hover:border-white/30'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Select All Button */}
          <div className="mb-4 flex justify-end">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-500/20 text-purple-200 border border-purple-400/50 rounded-lg hover:bg-purple-500/30 transition-colors font-medium"
            >
              {allVisibleSelected ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {allVisibleSelected ? 'Deselect All' : 'Select All'} ({filteredSuppliers.length})
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
              <span className="ml-2 text-gray-300">Loading vendors...</span>
            </div>
          ) : (
            <>
              <div className="mb-4">
                {/* Results Summary */}
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-gray-300">
                    {filteredSuppliers.length === suggestedSuppliers.length ? (
                      <span>{suggestedSuppliers.length} vendor{suggestedSuppliers.length !== 1 ? 's' : ''} available</span>
                    ) : (
                      <span>
                        {filteredSuppliers.length} of {suggestedSuppliers.length} vendor{filteredSuppliers.length !== 1 ? 's' : ''} shown
                      </span>
                    )}
                  </div>
                  {selectedSupplierIds.length > 0 && (
                    <div className="text-sm text-purple-300 font-medium">
                      {selectedSupplierIds.length} selected
                    </div>
                  )}
                </div>

                <div className="space-y-6 max-h-96 overflow-y-auto">
                  {filteredSuppliers.length === 0 ? (
                    <div className="text-center py-8 text-gray-300">
                      <Package className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      {suggestedSuppliers.length === 0 ? (
                        <>
                          <p>No relevant vendors found for this service.</p>
                          <p className="text-sm text-gray-400">Try adding more vendors or check the service specifications.</p>
                        </>
                      ) : (
                        <>
                          <p>No vendors match your current filters.</p>
                          <p className="text-sm text-gray-400">Try adjusting your search or filter criteria.</p>
                          <button
                            onClick={clearFilters}
                            className="mt-2 px-3 py-1 text-sm bg-purple-500/20 text-purple-200 border border-purple-400/50 rounded-lg hover:bg-purple-500/30 transition-colors"
                          >
                            Clear Filters
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                  <>
                    {/* Recommended Suppliers Section */}
                    {recommendedSuppliers.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-teal-400 fill-teal-400" />
                            <h4 className="text-sm font-semibold text-white">
                              Recommended for this Service ({recommendedSuppliers.length})
                            </h4>
                          </div>
                          <button
                            onClick={handleSelectAllRecommended}
                            className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-teal-500/20 text-teal-200 border border-teal-400/50 rounded-lg hover:bg-teal-500/30 transition-colors font-medium"
                          >
                            {allRecommendedSelected ? (
                              <>
                                <CheckSquare className="w-3.5 h-3.5" />
                                Deselect All
                              </>
                            ) : (
                              <>
                                <Square className="w-3.5 h-3.5" />
                                Select All
                              </>
                            )}
                          </button>
                        </div>
                        <div className="space-y-3">
                          {recommendedSuppliers.map((supplier) => {
                            const isSelected = selectedSupplierIds.includes(supplier.id);
                            const isAlreadyContacted = supplier.already_contacted;
                            const matchingCategories = supplier.relevance.matchingCategories;
                            
                            return (
                              <div
                                key={supplier.id}
                                className={`border rounded-lg p-4 transition-colors ${
                                  isSelected ? 'border-teal-400 bg-teal-500/20' : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30'
                                } ${isAlreadyContacted ? 'opacity-75' : ''}`}
                              >
                                <div className="flex items-center space-x-3">
                                  <input
                                    type="checkbox"
                                    id={`supplier-${supplier.id}`}
                                    checked={isSelected}
                                    onChange={() => onSupplierToggle(supplier.id)}
                                    disabled={isAlreadyContacted}
                                    className="h-4 w-4 text-teal-400 focus:ring-teal-400 border-white/30 rounded bg-black/20"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 flex-wrap">
                                      <label
                                        htmlFor={`supplier-${supplier.id}`}
                                        className="font-medium text-white cursor-pointer"
                                      >
                                        {supplier.supplier_name}
                                      </label>
                                      {supplier.relevance.score === maxScore && maxScore > 0 && (
                                        <span className="px-2 py-0.5 text-xs bg-teal-500/30 text-teal-200 rounded-full font-bold border border-teal-400/50 flex items-center gap-1">
                                          <Trophy className="w-3 h-3 fill-teal-200" />
                                          Best Match
                                        </span>
                                      )}
                                      {isAlreadyContacted && (
                                        <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-200 border border-yellow-400/50 rounded-full">
                                          Already Contacted
                                        </span>
                                      )}
                                    </div>
                                    {getSupplierPrimaryEmail(supplier) && (
                                      <p className="text-sm text-gray-300">{getSupplierPrimaryEmail(supplier)}</p>
                                    )}
                                    {supplier.service_categories && supplier.service_categories.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {supplier.service_categories.map((category, index) => {
                                          const isMatching = matchingCategories.includes(category);
                                          return (
                                            <span
                                              key={index}
                                              className={`px-2 py-1 text-xs rounded ${
                                                isMatching
                                                  ? 'bg-teal-500/30 text-teal-200 font-semibold border border-teal-400/50'
                                                  : 'bg-white/5 text-gray-300 border border-white/10'
                                              }`}
                                              aria-label={isMatching ? `Matching category: ${category}` : category}
                                            >
                                              {category}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Other Suppliers Section */}
                    {otherSuppliers.length > 0 && (
                      <div>
                        {recommendedSuppliers.length > 0 && (
                          <div className="border-t border-white/20 my-4"></div>
                        )}
                        <div className="flex items-center gap-2 mb-3">
                          <h4 className="text-sm font-medium text-gray-300">
                            Other Vendors ({otherSuppliers.length})
                          </h4>
                        </div>
                        <div className="space-y-3">
                          {otherSuppliers.map((supplier) => {
                            const isSelected = selectedSupplierIds.includes(supplier.id);
                            const isAlreadyContacted = supplier.already_contacted;
                            
                            return (
                              <div
                                key={supplier.id}
                                className={`border rounded-lg p-4 transition-colors ${
                                  isSelected ? 'border-teal-400 bg-teal-500/20' : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30'
                                } ${isAlreadyContacted ? 'opacity-75' : ''}`}
                              >
                                <div className="flex items-center space-x-3">
                                  <input
                                    type="checkbox"
                                    id={`supplier-${supplier.id}`}
                                    checked={isSelected}
                                    onChange={() => onSupplierToggle(supplier.id)}
                                    disabled={isAlreadyContacted}
                                    className="h-4 w-4 text-teal-400 focus:ring-teal-400 border-white/30 rounded bg-black/20"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <label
                                        htmlFor={`supplier-${supplier.id}`}
                                        className="font-medium text-white cursor-pointer"
                                      >
                                        {supplier.supplier_name}
                                      </label>
                                      {isAlreadyContacted && (
                                        <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-200 border border-yellow-400/50 rounded-full">
                                          Already Contacted
                                        </span>
                                      )}
                                    </div>
                                    {getSupplierPrimaryEmail(supplier) && (
                                      <p className="text-sm text-gray-300">{getSupplierPrimaryEmail(supplier)}</p>
                                    )}
                                    {supplier.service_categories && supplier.service_categories.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {supplier.service_categories.map((category, index) => (
                                          <span
                                            key={index}
                                            className="px-2 py-1 text-xs bg-white/5 text-gray-300 border border-white/10 rounded"
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
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer - Sticky at bottom */}
        <div className="sticky bottom-0 border-t border-white/20 bg-white/5 backdrop-blur-sm px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-300">
              {selectedSupplierIds.length > 0 && (
                <span>
                  {selectedSupplierIds.length} vendor{selectedSupplierIds.length !== 1 ? 's' : ''} selected
                </span>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded border border-white/20 text-gray-200 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={selectedSupplierIds.length === 0}
                className={`px-4 py-2 rounded text-white transition-colors ${
                  selectedSupplierIds.length === 0
                    ? 'bg-gray-500/50 cursor-not-allowed'
                    : 'bg-teal-600 hover:bg-teal-700'
                }`}
              >
                Send Quote Requests{selectedSupplierIds.length > 0 ? ` (${selectedSupplierIds.length})` : ''}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierSelectionModal;

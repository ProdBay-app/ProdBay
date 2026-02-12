import React from 'react';
import { X } from 'lucide-react';

interface ActiveFiltersProps {
  searchTerm: string;
  selectedCategories: string[];
  selectedRoles: string[];
  hasContactPersons: boolean | null;
  dateRange: { start: Date | null; end: Date | null };
  onClearSearch: () => void;
  onClearCategories: () => void;
  onClearRoles: () => void;
  onClearContactPersons: () => void;
  onClearDateRange: () => void;
  onClearAll: () => void;
}

const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  searchTerm,
  selectedCategories,
  selectedRoles,
  hasContactPersons,
  dateRange,
  onClearSearch,
  onClearCategories,
  onClearRoles,
  onClearContactPersons,
  onClearDateRange,
  onClearAll
}) => {
  const hasActiveFilters = searchTerm || 
    selectedCategories.length > 0 || 
    selectedRoles.length > 0 || 
    hasContactPersons !== null || 
    dateRange.start || 
    dateRange.end;

  if (!hasActiveFilters) {
    return null;
  }

  const formatDateRange = () => {
    if (!dateRange.start && !dateRange.end) return '';
    if (dateRange.start && dateRange.end) {
      return `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`;
    }
    if (dateRange.start) {
      return `From ${dateRange.start.toLocaleDateString()}`;
    }
    if (dateRange.end) {
      return `Until ${dateRange.end.toLocaleDateString()}`;
    }
    return '';
  };

  return (
    <div className="bg-white/5 border-b border-white/20 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-200">Active filters:</span>
          <div className="flex flex-wrap gap-2">
            {/* Search Term */}
            {searchTerm && (
              <span className="inline-flex items-center px-2 py-1 bg-wedding-primary/30 text-wedding-primary-light text-xs rounded-full">
                Name: "{searchTerm}"
                <button
                  onClick={onClearSearch}
                  className="ml-1 text-wedding-primary-light hover:text-wedding-primary-light transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {/* Categories */}
            {selectedCategories.length > 0 && (
              <span className="inline-flex items-center px-2 py-1 bg-wedding-primary/30 text-wedding-primary-light text-xs rounded-full">
                Categories: {selectedCategories.length}
                <button
                  onClick={onClearCategories}
                  className="ml-1 text-blue-300 hover:text-wedding-primary-light transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {/* Roles */}
            {selectedRoles.length > 0 && (
              <span className="inline-flex items-center px-2 py-1 bg-wedding-primary/30 text-wedding-primary-light text-xs rounded-full">
                Roles: {selectedRoles.length}
                <button
                  onClick={onClearRoles}
                  className="ml-1 text-purple-300 hover:text-wedding-primary-light transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {/* Has Contact Persons */}
            {hasContactPersons !== null && (
              <span className="inline-flex items-center px-2 py-1 bg-green-500/30 text-green-200 text-xs rounded-full">
                {hasContactPersons ? 'With contacts' : 'Without contacts'}
                <button
                  onClick={onClearContactPersons}
                  className="ml-1 text-green-300 hover:text-green-200 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {/* Date Range */}
            {formatDateRange() && (
              <span className="inline-flex items-center px-2 py-1 bg-orange-500/30 text-orange-200 text-xs rounded-full">
                {formatDateRange()}
                <button
                  onClick={onClearDateRange}
                  className="ml-1 text-orange-300 hover:text-orange-200 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Clear All Button */}
        <button
          onClick={onClearAll}
          className="text-sm text-gray-300 hover:text-gray-200 flex items-center space-x-1 transition-colors"
        >
          <X className="h-4 w-4" />
          <span>Clear all</span>
        </button>
      </div>
    </div>
  );
};

export default ActiveFilters;

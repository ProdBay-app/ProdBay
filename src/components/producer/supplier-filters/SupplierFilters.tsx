import React from 'react';
import SearchBar from './SearchBar';
import CategoryFilter from './CategoryFilter';
import RoleFilter from './RoleFilter';
import AdditionalFilters from './AdditionalFilters';
import ActiveFilters from './ActiveFilters';
import type { Supplier, ContactPerson } from '../../../lib/supabase';

export interface FilterState {
  searchTerm: string;
  selectedCategories: string[];
  selectedRoles: string[];
  hasContactPersons: boolean | null;
  dateRange: { start: Date | null; end: Date | null };
}

interface SupplierFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  suppliers: Supplier[];
  availableCategories: string[];
}

const SupplierFilters: React.FC<SupplierFiltersProps> = ({
  filters,
  onFiltersChange,
  suppliers,
  availableCategories
}) => {
  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      searchTerm: '',
      selectedCategories: [],
      selectedRoles: [],
      hasContactPersons: null,
      dateRange: { start: null, end: null }
    });
  };

  const clearSearch = () => updateFilter('searchTerm', '');
  const clearCategories = () => updateFilter('selectedCategories', []);
  const clearRoles = () => updateFilter('selectedRoles', []);
  const clearContactPersons = () => updateFilter('hasContactPersons', null);
  const clearDateRange = () => updateFilter('dateRange', { start: null, end: null });

  return (
    <div className="space-y-0">
      {/* Filter Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-3">
          <SearchBar
            searchTerm={filters.searchTerm}
            onSearchChange={(term) => updateFilter('searchTerm', term)}
          />
          
          <CategoryFilter
            selectedCategories={filters.selectedCategories}
            onCategoriesChange={(categories) => updateFilter('selectedCategories', categories)}
            availableCategories={availableCategories}
          />
          
          <RoleFilter
            selectedRoles={filters.selectedRoles}
            onRolesChange={(roles) => updateFilter('selectedRoles', roles)}
            suppliers={suppliers}
          />
          
          <AdditionalFilters
            hasContactPersons={filters.hasContactPersons}
            onHasContactPersonsChange={(value) => updateFilter('hasContactPersons', value)}
            dateRange={filters.dateRange}
            onDateRangeChange={(range) => updateFilter('dateRange', range)}
            onClearAll={clearAllFilters}
            hasActiveFilters={
              filters.searchTerm !== '' ||
              filters.selectedCategories.length > 0 ||
              filters.selectedRoles.length > 0 ||
              filters.hasContactPersons !== null ||
              filters.dateRange.start !== null ||
              filters.dateRange.end !== null
            }
          />
        </div>
      </div>

      {/* Active Filters Display */}
      <ActiveFilters
        searchTerm={filters.searchTerm}
        selectedCategories={filters.selectedCategories}
        selectedRoles={filters.selectedRoles}
        hasContactPersons={filters.hasContactPersons}
        dateRange={filters.dateRange}
        onClearSearch={clearSearch}
        onClearCategories={clearCategories}
        onClearRoles={clearRoles}
        onClearContactPersons={clearContactPersons}
        onClearDateRange={clearDateRange}
        onClearAll={clearAllFilters}
      />
    </div>
  );
};

export default SupplierFilters;

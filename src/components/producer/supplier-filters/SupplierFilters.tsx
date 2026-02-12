import React from 'react';
import { ChevronDown, MapPin } from 'lucide-react';
import SearchBar from './SearchBar';
import CategoryFilter from './CategoryFilter';
import RoleFilter from './RoleFilter';
import AdditionalFilters from './AdditionalFilters';
import ActiveFilters from './ActiveFilters';
import type { Supplier } from '@/lib/supabase';

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
  selectedCity: string;
  onSelectedCityChange: (city: string) => void;
  availableCities: string[];
}

const SupplierFilters: React.FC<SupplierFiltersProps> = ({
  filters,
  onFiltersChange,
  suppliers,
  availableCategories,
  selectedCity,
  onSelectedCityChange,
  availableCities
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
    onSelectedCityChange('');
  };

  const clearSearch = () => updateFilter('searchTerm', '');
  const clearCategories = () => updateFilter('selectedCategories', []);
  const clearRoles = () => updateFilter('selectedRoles', []);
  const clearContactPersons = () => updateFilter('hasContactPersons', null);
  const clearDateRange = () => updateFilter('dateRange', { start: null, end: null });

  return (
    <div className="space-y-0">
      {/* Filter Bar */}
      <div className="relative z-50 bg-white/10 backdrop-blur-md border-b border-white/20 px-6 py-4">
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

          <div className="relative flex items-center space-x-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 focus-within:ring-2 focus-within:ring-wedding-primary focus-within:border-transparent text-sm transition-colors md:cursor-pointer">
            <MapPin className="h-4 w-4 text-gray-300" />
            <select
              value={selectedCity}
              onChange={(e) => onSelectedCityChange(e.target.value)}
              className="appearance-none bg-transparent border-none text-sm text-gray-200 pr-5 focus:outline-none focus:ring-0 cursor-pointer"
              aria-label="Filter by region"
            >
              <option value="" className="text-black">All Regions</option>
              {availableCities.map((city) => (
                <option key={city} value={city} className="text-black">
                  {city}
                </option>
              ))}
            </select>
            <ChevronDown className="h-4 w-4 text-gray-300 pointer-events-none" />
          </div>
          
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
              selectedCity !== '' ||
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

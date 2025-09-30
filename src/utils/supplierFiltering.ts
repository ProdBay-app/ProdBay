import type { Supplier } from '../lib/supabase';
import type { FilterState } from '../components/producer/supplier-filters/SupplierFilters';
import { getUniqueNestedValues, filterBySearchTerm, filterByDateRange, debounce } from './arrayUtils';

/**
 * Filter suppliers based on the provided filter state
 */
export const filterSuppliers = (suppliers: Supplier[], filters: FilterState): Supplier[] => {
  return suppliers.filter(supplier => {
    // Search term filter (case-insensitive partial match on supplier name)
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const nameMatch = supplier.supplier_name.toLowerCase().includes(searchLower);
      const emailMatch = supplier.contact_email.toLowerCase().includes(searchLower);
      
      // Also search in contact person names
      const contactMatch = supplier.contact_persons?.some(person => 
        person.name.toLowerCase().includes(searchLower)
      ) || false;
      
      if (!nameMatch && !emailMatch && !contactMatch) {
        return false;
      }
    }

    // Service categories filter (array intersection)
    if (filters.selectedCategories.length > 0) {
      const hasMatchingCategory = filters.selectedCategories.some(category =>
        supplier.service_categories.includes(category)
      );
      if (!hasMatchingCategory) {
        return false;
      }
    }

    // Contact roles filter (check if supplier has any contact person with selected roles)
    if (filters.selectedRoles.length > 0) {
      const hasMatchingRole = supplier.contact_persons?.some(person =>
        filters.selectedRoles.includes(person.role)
      ) || false;
      if (!hasMatchingRole) {
        return false;
      }
    }

    // Has contact persons filter
    if (filters.hasContactPersons !== null) {
      const hasContacts = (supplier.contact_persons?.length || 0) > 0;
      if (filters.hasContactPersons !== hasContacts) {
        return false;
      }
    }

    // Date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      const supplierDate = new Date(supplier.created_at);
      
      if (filters.dateRange.start && supplierDate < filters.dateRange.start) {
        return false;
      }
      
      if (filters.dateRange.end) {
        // Set end date to end of day for inclusive comparison
        const endOfDay = new Date(filters.dateRange.end);
        endOfDay.setHours(23, 59, 59, 999);
        if (supplierDate > endOfDay) {
          return false;
        }
      }
    }

    return true;
  });
};

/**
 * Get unique service categories from all suppliers
 */
export const getUniqueCategories = (suppliers: Supplier[]): string[] => {
  return getUniqueNestedValues(suppliers, supplier => supplier.service_categories);
};

/**
 * Get unique contact roles from all suppliers
 */
export const getUniqueRoles = (suppliers: Supplier[]): string[] => {
  return getUniqueNestedValues(suppliers, supplier => 
    supplier.contact_persons?.map(person => person.role).filter(Boolean) || []
  );
};

/**
 * Get filter statistics for display
 */
export const getFilterStats = (suppliers: Supplier[], filteredSuppliers: Supplier[], filters: FilterState) => {
  const totalSuppliers = suppliers.length;
  const filteredCount = filteredSuppliers.length;
  
  const hasActiveFilters = 
    filters.searchTerm !== '' ||
    filters.selectedCategories.length > 0 ||
    filters.selectedRoles.length > 0 ||
    filters.hasContactPersons !== null ||
    filters.dateRange.start !== null ||
    filters.dateRange.end !== null;

  return {
    totalSuppliers,
    filteredCount,
    hasActiveFilters,
    isFiltered: hasActiveFilters && filteredCount !== totalSuppliers
  };
};

// Re-export debounce from arrayUtils for backward compatibility
export { debounce };

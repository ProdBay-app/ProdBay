/**
 * Barrel file for utility functions
 * Provides a single import point for all utility modules
 */

// Status utilities
export {
  getStatusIconProps,
  getStatusColor,
  getStatusPriority,
  type StatusIconProps
} from './statusUtils';

// Business calculation utilities
export {
  calculateTotalCost,
  getProgressPercentage,
  getAcceptedQuoteForAsset,
  calculateProjectStats
} from './businessCalculations';

// Array processing utilities
export {
  getUniqueValues,
  getUniqueNestedValues,
  filterBySearchTerm,
  filterByDateRange,
  debounce
} from './arrayUtils';

// Supplier filtering utilities
export {
  filterSuppliers,
  getUniqueCategories,
  getUniqueRoles,
  getFilterStats
} from './supplierFiltering';

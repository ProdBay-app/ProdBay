/**
 * Generic array utility functions
 * Provides reusable array processing logic across the application
 */

/**
 * Get unique values from an array of objects by extracting a specific property
 */
export const getUniqueValues = <T, K extends keyof T>(
  items: T[],
  property: K
): T[K][] => {
  const valueSet = new Set<T[K]>();
  items.forEach(item => {
    const value = item[property];
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => valueSet.add(v));
      } else {
        valueSet.add(value);
      }
    }
  });
  return Array.from(valueSet).sort();
};

/**
 * Get unique values from nested arrays (e.g., service_categories from suppliers)
 */
export const getUniqueNestedValues = <T>(
  items: T[],
  extractor: (item: T) => string[]
): string[] => {
  const valueSet = new Set<string>();
  items.forEach(item => {
    const values = extractor(item);
    values.forEach(value => {
      if (value && value.trim()) {
        valueSet.add(value.trim());
      }
    });
  });
  return Array.from(valueSet).sort();
};

/**
 * Filter items by search term across multiple properties
 */
export const filterBySearchTerm = <T>(
  items: T[],
  searchTerm: string,
  searchProperties: (keyof T)[]
): T[] => {
  if (!searchTerm.trim()) return items;
  
  const searchLower = searchTerm.toLowerCase();
  return items.filter(item => {
    return searchProperties.some(property => {
      const value = item[property];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(searchLower);
      }
      return false;
    });
  });
};

/**
 * Filter items by date range
 */
export const filterByDateRange = <T>(
  items: T[],
  dateProperty: keyof T,
  startDate?: Date | null,
  endDate?: Date | null
): T[] => {
  if (!startDate && !endDate) return items;
  
  return items.filter(item => {
    const itemDate = new Date(item[dateProperty] as string);
    
    if (startDate && itemDate < startDate) {
      return false;
    }
    
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (itemDate > endOfDay) {
        return false;
      }
    }
    
    return true;
  });
};

/**
 * Generic debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

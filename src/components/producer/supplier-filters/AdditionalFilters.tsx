import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Calendar, Users, X } from 'lucide-react';

interface AdditionalFiltersProps {
  hasContactPersons: boolean | null;
  onHasContactPersonsChange: (value: boolean | null) => void;
  dateRange: { start: Date | null; end: Date | null };
  onDateRangeChange: (range: { start: Date | null; end: Date | null }) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
}

const AdditionalFilters: React.FC<AdditionalFiltersProps> = ({
  hasContactPersons,
  onHasContactPersonsChange,
  dateRange,
  onDateRangeChange,
  onClearAll,
  hasActiveFilters
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handlePresetDateRange = (preset: string) => {
    const now = new Date();
    let start: Date | null = null;
    let end: Date | null = null;

    switch (preset) {
      case 'last30days':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        end = now;
        break;
      case 'last3months':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        end = now;
        break;
      case 'last6months':
        start = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        end = now;
        break;
      case 'thisyear':
        start = new Date(now.getFullYear(), 0, 1);
        end = now;
        break;
      case 'clear':
        start = null;
        end = null;
        break;
    }

    onDateRangeChange({ start, end });
  };

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasAdditionalFilters = hasContactPersons !== null || dateRange.start || dateRange.end;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
      >
        <span className="text-gray-700">
          More
          {hasAdditionalFilters && (
            <span className="ml-1 px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full text-xs">
              {[hasContactPersons !== null, dateRange.start, dateRange.end].filter(Boolean).length}
            </span>
          )}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 space-y-4">
            {/* Clear All Filters */}
            {hasActiveFilters && (
              <div className="pb-3 border-b border-gray-200">
                <button
                  onClick={() => {
                    onClearAll();
                    setIsOpen(false);
                  }}
                  className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-800"
                >
                  <X className="h-4 w-4" />
                  <span>Clear All Filters</span>
                </button>
              </div>
            )}

            {/* Has Contact Persons Filter */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Contact Information</span>
              </h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="hasContactPersons"
                    checked={hasContactPersons === null}
                    onChange={() => onHasContactPersonsChange(null)}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-700">All suppliers</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="hasContactPersons"
                    checked={hasContactPersons === true}
                    onChange={() => onHasContactPersonsChange(true)}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-700">With contact persons</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="hasContactPersons"
                    checked={hasContactPersons === false}
                    onChange={() => onHasContactPersonsChange(false)}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-700">Without contact persons</span>
                </label>
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Added Date</span>
              </h4>
              
              {/* Preset Date Ranges */}
              <div className="space-y-2 mb-3">
                <div className="text-xs text-gray-600 mb-2">Quick select:</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handlePresetDateRange('last30days')}
                    className="text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-50"
                  >
                    Last 30 days
                  </button>
                  <button
                    onClick={() => handlePresetDateRange('last3months')}
                    className="text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-50"
                  >
                    Last 3 months
                  </button>
                  <button
                    onClick={() => handlePresetDateRange('last6months')}
                    className="text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-50"
                  >
                    Last 6 months
                  </button>
                  <button
                    onClick={() => handlePresetDateRange('thisyear')}
                    className="text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-50"
                  >
                    This year
                  </button>
                </div>
              </div>

              {/* Custom Date Range */}
              <div className="space-y-2">
                <div className="text-xs text-gray-600">Custom range:</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">From</label>
                    <input
                      type="date"
                      value={dateRange.start ? dateRange.start.toISOString().split('T')[0] : ''}
                      onChange={(e) => onDateRangeChange({
                        ...dateRange,
                        start: e.target.value ? new Date(e.target.value) : null
                      })}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">To</label>
                    <input
                      type="date"
                      value={dateRange.end ? dateRange.end.toISOString().split('T')[0] : ''}
                      onChange={(e) => onDateRangeChange({
                        ...dateRange,
                        end: e.target.value ? new Date(e.target.value) : null
                      })}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>
                {formatDateRange() && (
                  <div className="text-xs text-gray-600">
                    Selected: {formatDateRange()}
                  </div>
                )}
                <button
                  onClick={() => handlePresetDateRange('clear')}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear date range
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdditionalFilters;

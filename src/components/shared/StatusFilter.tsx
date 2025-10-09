import React from 'react';
import { Filter } from 'lucide-react';
import type { ProjectStatus } from '@/types/database';

interface StatusFilterProps {
  value: string; // 'all' or a ProjectStatus value
  onChange: (value: string) => void;
  className?: string;
}

/**
 * StatusFilter - Reusable status dropdown component
 * 
 * Features:
 * - Dropdown select for filtering by project status
 * - "All Statuses" option to show everything
 * - Visual consistency with SearchBar
 * - Clean, accessible design
 * 
 * Usage:
 * <StatusFilter 
 *   value={selectedStatus}
 *   onChange={setSelectedStatus}
 * />
 */
const StatusFilter: React.FC<StatusFilterProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const statusOptions: Array<{ value: string; label: string }> = [
    { value: 'all', label: 'All Statuses' },
    { value: 'New', label: 'New' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Quoting', label: 'Quoting' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' }
  ];

  return (
    <div className={`relative ${className}`}>
      {/* Filter Icon */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Filter className="h-5 w-5 text-gray-400" />
      </div>

      {/* Select Dropdown */}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          block w-full pl-10 pr-10 py-2.5
          border border-gray-300 rounded-lg
          text-gray-900
          focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
          transition-all duration-200
          bg-white
          appearance-none
          cursor-pointer
        "
        aria-label="Filter by status"
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Custom Dropdown Arrow */}
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <svg
          className="h-5 w-5 text-gray-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  );
};

export default StatusFilter;


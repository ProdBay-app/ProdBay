import React from 'react';
import { ArrowUpDown } from 'lucide-react';

export type ProjectSortOption = 'mostRecent' | 'nearingDeadline';

interface SortControlProps {
  value: ProjectSortOption;
  onChange: (value: ProjectSortOption) => void;
  className?: string;
}

/**
 * SortControl - Reusable dropdown component for sorting projects
 * 
 * Features:
 * - Compact dropdown design for space-efficient layouts
 * - Two sort options: Most Recent and Nearing Deadline
 * - Styled to match SearchBar and StatusFilter components
 * - Fully accessible with ARIA labels
 * - Visual consistency across filter controls
 */
const SortControl: React.FC<SortControlProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const sortOptions: Array<{ value: ProjectSortOption; label: string }> = [
    { value: 'mostRecent', label: 'Most Recent' },
    { value: 'nearingDeadline', label: 'Nearing Deadline' }
  ];

  return (
    <div className={`relative flex items-center ${className}`}>
      <ArrowUpDown className="absolute left-3 h-5 w-5 text-gray-400 pointer-events-none" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ProjectSortOption)}
        className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 appearance-none bg-white cursor-pointer"
        aria-label="Sort projects"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  );
};

export default SortControl;


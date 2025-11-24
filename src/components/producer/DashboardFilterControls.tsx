import React from 'react';
import { Calendar, AlertCircle } from 'lucide-react';

export type ProjectSortOption = 'mostRecent' | 'nearingDeadline';

interface DashboardFilterControlsProps {
  sortBy: ProjectSortOption;
  onSortChange: (sortBy: ProjectSortOption) => void;
}

/**
 * DashboardFilterControls - Sort controls for the producer dashboard
 * 
 * Features:
 * - Segmented control design for sort option selection
 * - Two sort options: Most Recent and Nearing Deadline
 * - Visual feedback for active selection
 * - Clean, compact design that doesn't overwhelm the page
 */
const DashboardFilterControls: React.FC<DashboardFilterControlsProps> = ({
  sortBy,
  onSortChange
}) => {
  const sortOptions = [
    {
      value: 'mostRecent' as ProjectSortOption,
      label: 'Most Recent',
      icon: Calendar,
      description: 'Newest projects first'
    },
    {
      value: 'nearingDeadline' as ProjectSortOption,
      label: 'Nearing Deadline',
      icon: AlertCircle,
      description: 'Closest deadlines first'
    }
  ];

  return (
    <div className="mb-6">
      {/* Label */}
      <div className="mb-3">
        <label className="text-sm font-medium text-white">
          Sort by
        </label>
      </div>

      {/* Segmented Control */}
      <div className="inline-flex rounded-lg border border-white/20 bg-white/10 backdrop-blur-md shadow-sm">
        {sortOptions.map((option, index) => {
          const isActive = sortBy === option.value;
          const Icon = option.icon;
          
          return (
            <button
              key={option.value}
              onClick={() => onSortChange(option.value)}
              className={`
                relative inline-flex items-center gap-2 px-4 py-2.5
                text-sm font-medium transition-all duration-200
                ${index === 0 ? 'rounded-l-lg' : ''}
                ${index === sortOptions.length - 1 ? 'rounded-r-lg' : ''}
                ${index > 0 ? 'border-l border-white/20' : ''}
                ${isActive
                  ? 'bg-teal-600 text-white shadow-sm z-10'
                  : 'bg-transparent text-gray-200 hover:bg-white/10 hover:text-teal-300'
                }
              `}
              title={option.description}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-300'}`} />
              <span>{option.label}</span>
              
              {/* Active indicator dot */}
              {isActive && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-teal-400 rounded-full border-2 border-white" />
              )}
            </button>
          );
        })}
      </div>

      {/* Helper text showing active sort description */}
      <p className="mt-2 text-xs text-gray-300">
        {sortOptions.find(opt => opt.value === sortBy)?.description}
      </p>
    </div>
  );
};

export default DashboardFilterControls;


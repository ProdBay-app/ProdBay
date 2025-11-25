import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, ChevronDown } from 'lucide-react';

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
 * - Hybrid mobile/desktop pattern: Native select on mobile, custom dropdown on desktop
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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const sortOptions: Array<{ value: ProjectSortOption; label: string }> = [
    { value: 'mostRecent', label: 'Most Recent' },
    { value: 'nearingDeadline', label: 'Nearing Deadline' }
  ];

  const selectedOption = sortOptions.find(opt => opt.value === value) || sortOptions[0];

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

  return (
    <div className={`relative flex items-center ${className}`} ref={dropdownRef}>
      {/* 1. MOBILE ONLY: Hidden Native Select Overlay */}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ProjectSortOption)}
        className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer md:hidden"
        aria-label="Sort projects"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* 2. VISUAL TRIGGER BUTTON (Shared Look) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full pl-10 pr-10 py-2 bg-black/20 border border-white/20 rounded-lg text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors md:cursor-pointer"
      >
        <div className="flex items-center space-x-2 flex-1">
          {/* Sort Icon */}
          <ArrowUpDown className="h-5 w-5 text-gray-300 pointer-events-none" />
          {/* Selected Label */}
          <span className="text-sm">{selectedOption.label}</span>
        </div>
        {/* Chevron Icon */}
        <ChevronDown className={`h-5 w-5 text-gray-300 transition-transform pointer-events-none ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* 3. DESKTOP ONLY: Custom Dropdown Menu */}
      {isOpen && (
        <div className="hidden md:block absolute top-full left-0 mt-2 w-full bg-gray-900 border border-white/20 rounded-lg shadow-xl z-50 overflow-hidden">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                option.value === value
                  ? 'bg-teal-500/20 text-teal-200'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SortControl;


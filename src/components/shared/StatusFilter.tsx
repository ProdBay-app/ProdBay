import React, { useState, useRef, useEffect } from 'react';
import { Filter, ChevronDown } from 'lucide-react';
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
 * - Hybrid mobile/desktop pattern: Native select on mobile, custom dropdown on desktop
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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const statusOptions: Array<{ value: string; label: string }> = [
    { value: 'all', label: 'All Statuses' },
    { value: 'New', label: 'New' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Quoting', label: 'Quoting' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' }
  ];

  const selectedOption = statusOptions.find(opt => opt.value === value) || statusOptions[0];

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
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* 1. MOBILE ONLY: Hidden Native Select Overlay */}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer md:hidden"
        aria-label="Filter by status"
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* 2. VISUAL TRIGGER BUTTON (Shared Look) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full pl-10 pr-10 py-2.5 bg-black/20 border border-white/20 rounded-lg text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-wedding-primary focus:border-transparent transition-colors md:cursor-pointer"
      >
        <div className="flex items-center space-x-2 flex-1">
          {/* Filter Icon */}
          <Filter className="h-5 w-5 text-gray-300 pointer-events-none" />
          {/* Selected Label */}
          <span className="text-sm">{selectedOption.label}</span>
        </div>
        {/* Chevron Icon */}
        <ChevronDown className={`h-5 w-5 text-gray-300 transition-transform pointer-events-none ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* 3. DESKTOP ONLY: Custom Dropdown Menu */}
      {isOpen && (
        <div className="hidden md:block absolute top-full left-0 mt-2 w-full bg-black/80 backdrop-blur-xl border border-white/20 rounded-lg shadow-xl z-50 overflow-hidden">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                option.value === value
                  ? 'bg-wedding-primary/20 text-wedding-primary-light'
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

export default StatusFilter;


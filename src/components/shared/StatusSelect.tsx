import React from 'react';
import type { AssetStatus } from '@/types/database';

interface StatusSelectProps {
  value: AssetStatus;
  onChange: (newStatus: AssetStatus) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * StatusSelect - A reusable dropdown component for selecting asset status
 * 
 * Features:
 * - Displays all valid AssetStatus options
 * - Color-coded indicators for visual consistency
 * - Supports disabled state for loading/processing
 * - Fully accessible with proper ARIA attributes
 * - Consistent Tailwind styling matching app design
 * 
 * Usage:
 * <StatusSelect
 *   value={asset.status}
 *   onChange={handleStatusChange}
 *   disabled={isLoading}
 * />
 */
const StatusSelect: React.FC<StatusSelectProps> = ({
  value,
  onChange,
  disabled = false,
  className = ''
}) => {
  // Handle selection change
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as AssetStatus;
    onChange(newStatus);
  };

  // Get color indicator class for each status
  const getStatusIndicatorColor = (status: AssetStatus): string => {
    switch (status) {
      case 'Pending':
        return 'bg-slate-500';
      case 'Quoting':
        return 'bg-amber-500';
      case 'Approved':
        return 'bg-green-500';
      case 'In Production':
        return 'bg-blue-500';
      case 'Delivered':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  // All valid status options in workflow order
  const statusOptions: AssetStatus[] = [
    'Pending',
    'Quoting',
    'Approved',
    'In Production',
    'Delivered'
  ];

  // Base classes for the select element
  const baseClasses = `
    w-full px-3 py-2.5 
    border border-gray-300 rounded-lg 
    bg-white text-gray-900
    focus:ring-2 focus:ring-purple-500 focus:border-transparent
    transition-all duration-200
    ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:border-gray-400'}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className="relative">
      <select
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className={`${baseClasses} ${className}`}
        aria-label="Service status"
      >
        {statusOptions.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>

      {/* Optional: Visual indicator dot - currently hidden but can be shown via CSS */}
      <div className="pointer-events-none absolute right-10 top-1/2 -translate-y-1/2 hidden">
        <div className={`w-2 h-2 rounded-full ${getStatusIndicatorColor(value)}`} />
      </div>
    </div>
  );
};

export default StatusSelect;


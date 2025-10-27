import React, { ReactNode } from 'react';

interface SummaryData {
  primary: string | number;
  secondary?: string | number;
  status?: string;
  unit?: string;
}

interface HeaderCardProps {
  id: string;
  title: string;
  icon: ReactNode;
  summaryData: SummaryData;
  isActive: boolean;
  onClick: () => void;
  activeColor: string;
  bgColor: string;
  borderColor: string;
  hoverColor: string;
  isDisabled: boolean;
  zIndex?: string;
}

/**
 * HeaderCard - Data-rich overview card for project details
 * 
 * Features:
 * - Displays summary data with clear visual hierarchy
 * - Square, card-like aspect ratio
 * - Conditional styling for active/inactive states
 * - Seamless merge capability with content panel
 * - Accessibility support
 */
const HeaderCard: React.FC<HeaderCardProps> = ({
  title,
  icon,
  summaryData,
  isActive,
  onClick,
  activeColor,
  bgColor,
  borderColor,
  hoverColor,
  isDisabled,
  zIndex
}) => {
  
  // Format currency for display
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format number with unit
  const formatNumber = (value: number, unit?: string): string => {
    if (unit === '%') {
      return `${value.toFixed(1)}%`;
    }
    if (unit === 'days') {
      return `${value} days`;
    }
    return value.toString();
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Render summary data based on type
  const renderSummaryData = () => {
    const { primary, secondary, status, unit } = summaryData;
    
    return (
      <div className="space-y-1">
        {/* Primary data */}
        <div className="text-lg font-bold text-gray-900">
          {typeof primary === 'number' && unit === '$' 
            ? formatCurrency(primary)
            : typeof primary === 'number' && unit
            ? formatNumber(primary, unit)
            : typeof primary === 'string' && primary.includes('-') && !primary.includes('$')
            ? formatDate(primary)
            : primary
          }
        </div>
        
        {/* Secondary data */}
        {secondary && (
          <div className="text-sm text-gray-600">
            {typeof secondary === 'number' && unit === '$' 
              ? formatCurrency(secondary)
              : typeof secondary === 'number' && unit
              ? formatNumber(secondary, unit)
              : secondary
            }
          </div>
        )}
        
        {/* Status indicator */}
        {status && (
          <div className={`text-xs font-medium px-2 py-1 rounded-full ${
            status.includes('Healthy') || status.includes('On track') 
              ? 'bg-green-100 text-green-700'
              : status.includes('Warning') || status.includes('Pending')
              ? 'bg-yellow-100 text-yellow-700'
              : status.includes('Critical') || status.includes('Overdue')
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-700'
          }`}>
            {status}
          </div>
        )}
      </div>
    );
  };

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`
        flex flex-col items-center justify-center p-4 border-2 transition-all duration-300
        min-h-[120px] aspect-square
        ${isActive 
          ? `${activeColor} shadow-lg rounded-t-lg rounded-b-none border-t-2 border-l-2 border-r-2 border-b-0 ${borderColor}` 
          : `${bgColor} ${borderColor} ${hoverColor} hover:shadow-sm rounded-lg border-2`
        }
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2
        ${zIndex || ''}
      `}
      aria-pressed={isActive}
      aria-label={`${title} section`}
    >
      {/* Icon */}
      <div className={`p-2 ${bgColor} rounded-lg mb-3`}>
        {icon}
      </div>
      
      {/* Title */}
      <h3 className={`font-semibold text-sm mb-2 ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
        {title}
      </h3>
      
      {/* Summary Data */}
      {!isDisabled && (
        <div className="text-center">
          {renderSummaryData()}
        </div>
      )}
      
      {/* Loading state */}
      {isDisabled && (
        <div className="text-center">
          <div className="text-xs text-gray-500">Loading...</div>
        </div>
      )}
    </button>
  );
};

export default HeaderCard;

import React from 'react';
import { DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

interface BudgetTrackingBarProps {
  total: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
  onClick?: () => void;
}

/**
 * BudgetTrackingBar Component
 * 
 * Visual progress bar showing budget utilization with color-coded status:
 * - Green: < 70% used (healthy)
 * - Yellow: 70-90% used (warning)
 * - Red: > 90% used (critical)
 * 
 * Optionally clickable to show detailed budget breakdown modal
 */
const BudgetTrackingBar: React.FC<BudgetTrackingBarProps> = ({
  total,
  spent,
  remaining,
  percentageUsed,
  onClick
}) => {
  
  const isClickable = !!onClick;

  // Handle keyboard interaction for accessibility
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };
  
  // Format currency for display
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Determine status color based on percentage used
  const getStatusColor = (): { bg: string; text: string; bar: string; icon: string } => {
    if (percentageUsed >= 90) {
      return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        bar: 'bg-red-500',
        icon: 'text-red-600'
      };
    } else if (percentageUsed >= 70) {
      return {
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        bar: 'bg-yellow-500',
        icon: 'text-yellow-600'
      };
    } else {
      return {
        bg: 'bg-green-50',
        text: 'text-green-700',
        bar: 'bg-green-500',
        icon: 'text-green-600'
      };
    }
  };

  // Get status message
  const getStatusMessage = (): string => {
    if (percentageUsed >= 90) {
      return 'Critical: Budget nearly exhausted';
    } else if (percentageUsed >= 70) {
      return 'Warning: Approaching budget limit';
    } else {
      return 'Healthy: Budget on track';
    }
  };

  const statusColors = getStatusColor();
  const statusMessage = getStatusMessage();

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all ${
        isClickable ? 'cursor-pointer hover:shadow-lg hover:border-green-300' : ''
      }`}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${statusColors.bg} rounded-lg`}>
            <DollarSign className={`w-5 h-5 ${statusColors.icon}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Budget Tracking</h3>
            <p className="text-sm text-gray-600">{statusMessage}</p>
          </div>
        </div>
        
        {/* Status badge */}
        <div className={`flex items-center gap-2 px-3 py-1 ${statusColors.bg} rounded-full`}>
          {percentageUsed >= 70 && (
            percentageUsed >= 90 ? (
              <AlertCircle className={`w-4 h-4 ${statusColors.icon}`} />
            ) : (
              <TrendingUp className={`w-4 h-4 ${statusColors.icon}`} />
            )
          )}
          <span className={`text-sm font-semibold ${statusColors.text}`}>
            {percentageUsed.toFixed(1)}% Used
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className={`h-full ${statusColors.bar} transition-all duration-500 ease-out rounded-full`}
            style={{ width: `${Math.min(percentageUsed, 100)}%` }}
          />
        </div>
      </div>

      {/* Budget Details */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-gray-600 mb-1">Total Budget</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(total)}</p>
        </div>
        
        <div>
          <p className="text-xs text-gray-600 mb-1">Spent</p>
          <p className="text-lg font-bold text-blue-600">{formatCurrency(spent)}</p>
        </div>
        
        <div>
          <p className="text-xs text-gray-600 mb-1">Remaining</p>
          <p className={`text-lg font-bold ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(remaining)}
          </p>
        </div>
      </div>

      {/* Over-budget warning */}
      {remaining < 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Budget Exceeded</p>
            <p className="text-xs text-red-700">
              This project is over budget by {formatCurrency(Math.abs(remaining))}. 
              Review expenses and consider client consultation.
            </p>
          </div>
        </div>
      )}

      {/* Click prompt (if clickable) */}
      {isClickable && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 font-medium text-center">
            Click to view spending breakdown →
          </p>
        </div>
      )}
    </div>
  );
};

export default BudgetTrackingBar;


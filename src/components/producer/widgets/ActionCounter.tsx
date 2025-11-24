import React from 'react';
import { LucideIcon, AlertCircle } from 'lucide-react';

interface ActionCounterProps {
  label: string;
  count: number;
  icon: LucideIcon;
  iconColor?: string;
  bgColor?: string;
  description?: string;
  onClick?: () => void;
}

/**
 * ActionCounter Component
 * 
 * Reusable component for displaying action item counts
 * Can be used for "Your Actions", "Their Actions", or any count display
 * 
 * Features:
 * - Icon with customizable color
 * - Large count display
 * - Optional description
 * - Optional click handler
 * - Warning badge when count > 0
 */
const ActionCounter: React.FC<ActionCounterProps> = ({
  label,
  count,
  icon: Icon,
  iconColor = 'text-blue-300',
  bgColor = 'bg-blue-500/20',
  description,
  onClick
}) => {
  
  const isClickable = !!onClick;
  const hasActions = count > 0;

  return (
    <div 
      className={`bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6 transition-all ${
        isClickable ? 'cursor-pointer hover:shadow-md hover:border-white/30' : ''
      }`}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Header with icon and warning badge */}
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 ${bgColor} rounded-lg`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        
        {/* Warning badge if there are pending actions */}
        {hasActions && (
          <div className="flex items-center gap-1 bg-orange-500/30 text-orange-200 px-2 py-1 rounded-full">
            <AlertCircle className="w-3 h-3" />
            <span className="text-xs font-semibold">Pending</span>
          </div>
        )}
      </div>

      {/* Count and label */}
      <div className="mb-2">
        <p className={`text-4xl font-bold transition-colors ${
          hasActions ? 'text-orange-400' : 'text-white'
        }`}>
          {count}
        </p>
        <h3 className="text-lg font-semibold text-white mt-1">
          {label}
        </h3>
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-gray-300">
          {description}
        </p>
      )}

      {/* Action prompt (if clickable and has actions) */}
      {isClickable && hasActions && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-xs text-gray-300 font-medium">
            Click to view details →
          </p>
        </div>
      )}

      {/* No actions message */}
      {!hasActions && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-xs text-gray-300">
            All caught up! 🎉
          </p>
        </div>
      )}
    </div>
  );
};

export default ActionCounter;


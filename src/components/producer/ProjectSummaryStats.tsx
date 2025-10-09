import React from 'react';
import { FolderOpen, Clock, AlertCircle } from 'lucide-react';

export interface ProjectStats {
  totalActive: number;
  awaitingQuote: number;
  nearingDeadline: number;
}

interface ProjectSummaryStatsProps {
  stats: ProjectStats;
  loading?: boolean;
}

/**
 * ProjectSummaryStats - Displays high-level project portfolio statistics
 * 
 * Features:
 * - Three key metrics in responsive grid layout
 * - Color-coded cards for quick visual scanning
 * - Icons for metric identification
 * - Loading state support
 */
const ProjectSummaryStats: React.FC<ProjectSummaryStatsProps> = ({ 
  stats, 
  loading = false 
}) => {
  // Stat card configuration
  const statCards = [
    {
      id: 'total-active',
      label: 'Total Active Projects',
      value: stats.totalActive,
      icon: FolderOpen,
      iconColor: 'text-teal-600',
      bgColor: 'bg-teal-50',
      accentColor: 'border-teal-200',
      description: 'Projects in progress'
    },
    {
      id: 'awaiting-quote',
      label: 'Awaiting Quote',
      value: stats.awaitingQuote,
      icon: Clock,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      accentColor: 'border-orange-200',
      description: 'Pending supplier quotes'
    },
    {
      id: 'nearing-deadline',
      label: 'Nearing Deadline',
      value: stats.nearingDeadline,
      icon: AlertCircle,
      iconColor: 'text-red-600',
      bgColor: 'bg-red-50',
      accentColor: 'border-red-200',
      description: 'Due within 7 days'
    }
  ];

  return (
    <div className="mb-8">
      {/* Section Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-700">Portfolio Overview</h2>
        <p className="text-sm text-gray-500">Key metrics at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map(({ id, label, value, icon: Icon, iconColor, bgColor, accentColor, description }) => (
          <div
            key={id}
            className={`
              relative overflow-hidden rounded-lg border-2 ${accentColor} 
              bg-white shadow-sm hover:shadow-md transition-shadow duration-200
            `}
          >
            {/* Colored accent bar at top */}
            <div className={`h-1 ${bgColor}`} />
            
            {/* Card Content */}
            <div className="p-6">
              <div className="flex items-start justify-between">
                {/* Left side: Icon and label */}
                <div className="flex-1">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${bgColor} mb-3`}>
                    <Icon className={`w-6 h-6 ${iconColor}`} />
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
                  <p className="text-xs text-gray-400">{description}</p>
                </div>

                {/* Right side: Value */}
                <div className="text-right">
                  {loading ? (
                    <div className="w-16 h-10 bg-gray-200 animate-pulse rounded" />
                  ) : (
                    <div className="text-4xl font-bold text-gray-900">
                      {value}
                    </div>
                  )}
                </div>
              </div>

              {/* Urgency indicator for nearing deadline */}
              {id === 'nearing-deadline' && value > 0 && !loading && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Requires immediate attention
                  </p>
                </div>
              )}

              {/* Info indicator for awaiting quote */}
              {id === 'awaiting-quote' && value > 0 && !loading && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-orange-600 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Pending supplier responses
                  </p>
                </div>
              )}
            </div>

            {/* Background decoration */}
            <div className={`absolute -bottom-2 -right-2 w-24 h-24 ${bgColor} opacity-20 rounded-full blur-2xl`} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectSummaryStats;


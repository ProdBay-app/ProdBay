import React from 'react';
import { FolderOpen } from 'lucide-react';

export interface ProjectStats {
  totalActive: number;
}

interface ProjectSummaryStatsProps {
  stats: ProjectStats;
  loading?: boolean;
}

/**
 * ProjectSummaryStats - Displays high-level project portfolio statistics
 * 
 * Features:
 * - Single metric card showing total active projects
 * - Color-coded card for quick visual scanning
 * - Icon for metric identification
 * - Loading state support
 */
const ProjectSummaryStats: React.FC<ProjectSummaryStatsProps> = ({ 
  stats, 
  loading = false 
}) => {
  // Stat card configuration
  const { icon: Icon, iconColor, bgColor, label, description, value } = {
    icon: FolderOpen,
    iconColor: 'text-teal-600',
    bgColor: 'bg-teal-50',
    label: 'Total Active Projects',
    description: 'Projects in progress',
    value: stats.totalActive
  };

  return (
    <div className="mb-8">
      {/* Section Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">Portfolio Overview</h2>
      </div>

      {/* Stats Card */}
      <div className="w-full max-w-sm">
        <div
          className={`
            relative overflow-hidden rounded-lg border-2 border-white/20 
            bg-white/10 backdrop-blur-md shadow-sm hover:shadow-lg transition-shadow duration-200
          `}
        >
          {/* Colored accent bar at top */}
          <div className={`h-1 ${bgColor} opacity-60`} />
          
          {/* Card Content */}
          <div className="p-6">
            <div className="flex items-start justify-between">
              {/* Left side: Icon and label */}
              <div className="flex-1">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${bgColor} opacity-40 mb-3`}>
                  <Icon className={`w-6 h-6 ${iconColor.replace('600', '300')}`} />
                </div>
                <p className="text-sm font-medium text-gray-200 mb-1">{label}</p>
                <p className="text-xs text-gray-300">{description}</p>
              </div>

              {/* Right side: Value */}
              <div className="text-right">
                {loading ? (
                  <div className="w-16 h-10 bg-white/20 animate-pulse rounded" />
                ) : (
                  <div className="text-4xl font-bold text-white">
                    {value}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Background decoration */}
          <div className={`absolute -bottom-2 -right-2 w-24 h-24 ${bgColor} opacity-10 rounded-full blur-2xl`} />
        </div>
      </div>
    </div>
  );
};

export default ProjectSummaryStats;


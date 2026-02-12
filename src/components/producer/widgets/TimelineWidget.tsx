import React from 'react';
import { Calendar, CheckCircle2, Circle, Clock, AlertTriangle, Plus, Edit, Trash2 } from 'lucide-react';
import type { ProjectMilestone } from '@/types/database';

interface TimelineWidgetProps {
  deadline: string | null;
  daysRemaining: number | null;
  milestones: ProjectMilestone[];
  onAddMilestone?: () => void;
  onEditMilestone?: (milestone: ProjectMilestone) => void;
  onDeleteMilestone?: (milestone: ProjectMilestone) => void;
}

/**
 * TimelineWidget Component
 * 
 * Horizontal timeline showing:
 * - Completed milestones (green checkmark)
 * - Pending milestones (gray circle)
 * - Final deadline with days remaining indicator
 * - Interactive CRUD controls for managing milestones (optional)
 */
const TimelineWidget: React.FC<TimelineWidgetProps> = ({
  deadline,
  daysRemaining,
  milestones,
  onAddMilestone,
  onEditMilestone,
  onDeleteMilestone
}) => {
  
  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get deadline status color
  const getDeadlineStatus = (): { color: string; icon: React.ReactNode; message: string } => {
    if (!daysRemaining) {
      return {
        color: 'text-gray-300',
        icon: <Calendar className="w-5 h-5" />,
        message: 'No deadline set'
      };
    }

    if (daysRemaining < 0) {
      return {
        color: 'text-red-400',
        icon: <AlertTriangle className="w-5 h-5" />,
        message: `${Math.abs(daysRemaining)} days overdue`
      };
    } else if (daysRemaining <= 7) {
      return {
        color: 'text-orange-400',
        icon: <Clock className="w-5 h-5" />,
        message: `${daysRemaining} days remaining`
      };
    } else {
      return {
        color: 'text-green-400',
        icon: <Calendar className="w-5 h-5" />,
        message: `${daysRemaining} days remaining`
      };
    }
  };

  const deadlineStatus = getDeadlineStatus();
  const sortedMilestones = [...milestones].sort((a, b) => 
    new Date(a.milestone_date).getTime() - new Date(b.milestone_date).getTime()
  );

  const completedCount = milestones.filter(m => m.status === 'completed').length;
  const totalCount = milestones.length;

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-wedding-primary/20 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Wedding Timeline</h3>
            <p className="text-sm text-gray-300">
              {totalCount > 0 
                ? `${completedCount} of ${totalCount} milestones completed`
                : 'No milestones set'}
            </p>
          </div>
        </div>
        
        {/* Right side: Add button and deadline badge */}
        <div className="flex items-center gap-4">
          {/* Add Milestone Button */}
          {onAddMilestone && (
            <button
              type="button"
              onClick={onAddMilestone}
              className="flex items-center gap-2 px-3 py-2 bg-wedding-primary text-white rounded-lg hover:bg-wedding-primary-hover transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Add Milestone</span>
            </button>
          )}
          
          {/* Deadline badge */}
          {deadline && (
            <div className={`flex items-center gap-2 ${deadlineStatus.color}`}>
              {deadlineStatus.icon}
              <div className="text-right">
                <p className="text-xs font-medium">{deadlineStatus.message}</p>
                <p className="text-xs opacity-75">{formatDate(deadline)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      {sortedMilestones.length > 0 ? (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/20" />
          
          {/* Milestones */}
          <div className="space-y-6">
            {sortedMilestones.map((milestone) => {
              const isCompleted = milestone.status === 'completed';
              const isCancelled = milestone.status === 'cancelled';
              const isPending = milestone.status === 'pending';
              
              return (
                <div key={milestone.id} className="relative flex items-start gap-4 pl-10 group">
                  {/* Milestone icon */}
                  <div className="absolute left-0 z-10">
                    {isCompleted && (
                      <div className="bg-green-500 rounded-full p-1">
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      </div>
                    )}
                    {isCancelled && (
                      <div className="bg-gray-400 rounded-full p-1">
                        <Circle className="w-6 h-6 text-white" />
                      </div>
                    )}
                    {isPending && (
                      <div className="bg-white/10 border-2 border-white/30 rounded-full p-1">
                        <Circle className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons - Visible on hover */}
                  {(onEditMilestone || onDeleteMilestone) && (
                    <div className="absolute top-0 right-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-20">
                      {/* Edit Button */}
                      {onEditMilestone && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditMilestone(milestone);
                          }}
                          className="p-1.5 bg-white/10 border border-white/30 hover:bg-wedding-primary/20 hover:border-wedding-primary-light/50 rounded-lg transition-colors shadow-sm"
                          aria-label="Edit milestone"
                        >
                          <Edit className="w-4 h-4 text-gray-200 hover:text-blue-300" />
                        </button>
                      )}
                      
                      {/* Delete Button */}
                      {onDeleteMilestone && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteMilestone(milestone);
                          }}
                          className="p-1.5 bg-white/10 border border-white/30 hover:bg-red-500/20 hover:border-red-400/50 rounded-lg transition-colors shadow-sm"
                          aria-label="Delete milestone"
                        >
                          <Trash2 className="w-4 h-4 text-gray-200 hover:text-red-300" />
                        </button>
                      )}
                    </div>
                  )}
                  
                  {/* Milestone content */}
                  <div className="flex-1 pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className={`font-semibold ${
                          isCompleted ? 'text-white' : 
                          isCancelled ? 'text-gray-400 line-through' : 
                          'text-gray-200'
                        }`}>
                          {milestone.milestone_name}
                        </h4>
                        {milestone.description && (
                          <p className="text-sm text-gray-300 mt-1">
                            {milestone.description}
                          </p>
                        )}
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        isCompleted ? 'bg-green-500/30 text-green-200' :
                        isCancelled ? 'bg-white/20 text-gray-300' :
                        'bg-wedding-primary/30 text-wedding-primary-light'
                      }`}>
                        {formatDate(milestone.milestone_date)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Final deadline marker */}
          {deadline && (
            <div className="relative flex items-start gap-4 pl-10 mt-6 pt-6 border-t border-white/20">
              <div className="absolute left-0 z-10">
                <div className={`rounded-full p-1 ${
                  daysRemaining && daysRemaining < 0 
                    ? 'bg-red-500' 
                    : daysRemaining && daysRemaining <= 7 
                    ? 'bg-orange-500' 
                    : 'bg-wedding-primary'
                }`}>
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-white">Wedding Deadline</h4>
                    <p className="text-sm text-gray-300 mt-1">
                      Final delivery date
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    daysRemaining && daysRemaining < 0 
                      ? 'bg-red-500/30 text-red-200' 
                      : daysRemaining && daysRemaining <= 7 
                      ? 'bg-orange-500/30 text-orange-200' 
                      : 'bg-wedding-primary/30 text-wedding-primary-light'
                  }`}>
                    {formatDate(deadline)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty state */
        <div className="text-center py-8">
          <Circle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-300 font-medium">No milestones yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Add milestones to track wedding progress
          </p>
          {deadline && (
            <div className="mt-4 p-3 bg-wedding-primary/20 border border-wedding-primary-light/30 rounded-lg inline-block">
              <p className="text-sm text-gray-200">
                <span className="font-semibold">Deadline:</span> {formatDate(deadline)}
              </p>
              <p className="text-xs text-gray-300 mt-1">
                {deadlineStatus.message}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TimelineWidget;


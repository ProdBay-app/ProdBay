import React, { useState } from 'react';
import { 
  User, 
  DollarSign, 
  Calendar, 
  Clock,
  CheckSquare,
  Users as UsersIcon
} from 'lucide-react';
import BudgetTrackingBar from './widgets/BudgetTrackingBar';
import TimelineWidget from './widgets/TimelineWidget';
import ActionCounter from './widgets/ActionCounter';
import type { Project } from '@/lib/supabase';
import type { ProjectTrackingSummary, ProjectMilestone } from '@/types/database';

interface ProjectDetailTabsProps {
  project: Project;
  trackingSummary: ProjectTrackingSummary | null;
  loadingTracking: boolean;
  onClientClick: () => void;
  onBudgetClick: () => void;
  onAddMilestone: () => void;
  onEditMilestone: (milestone: ProjectMilestone) => void;
  onDeleteMilestone: (milestone: ProjectMilestone) => void;
}

type TabType = 'overview' | 'budget' | 'timeline' | 'actions';

/**
 * ProjectDetailTabs - Integrated 4-column expanding layout for project details
 * 
 * Features:
 * - Four self-contained columns with integrated headers and content
 * - Each column expands vertically when active
 * - Only one column can be expanded at a time
 * - Smooth vertical expansion animations
 * - Equal width columns regardless of expansion state
 * - Preserves all existing functionality
 */
const ProjectDetailTabs: React.FC<ProjectDetailTabsProps> = ({
  project,
  trackingSummary,
  loadingTracking,
  onClientClick,
  onBudgetClick,
  onAddMilestone,
  onEditMilestone,
  onDeleteMilestone
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  
  // Format currency for display
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date for display
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Tab configuration
  const tabs = [
    {
      id: 'overview' as TabType,
      title: 'Overview',
      icon: <User className="w-5 h-5 text-purple-600" />,
      bgColor: 'bg-purple-100',
      borderColor: 'border-purple-200',
      hoverColor: 'hover:bg-purple-50',
      activeColor: 'bg-purple-50 border-purple-300'
    },
    {
      id: 'budget' as TabType,
      title: 'Budget',
      icon: <DollarSign className="w-5 h-5 text-green-600" />,
      bgColor: 'bg-green-100',
      borderColor: 'border-green-200',
      hoverColor: 'hover:bg-green-50',
      activeColor: 'bg-green-50 border-green-300'
    },
    {
      id: 'timeline' as TabType,
      title: 'Timeline',
      icon: <Calendar className="w-5 h-5 text-blue-600" />,
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-200',
      hoverColor: 'hover:bg-blue-50',
      activeColor: 'bg-blue-50 border-blue-300'
    },
    {
      id: 'actions' as TabType,
      title: 'Actions',
      icon: <CheckSquare className="w-5 h-5 text-orange-600" />,
      bgColor: 'bg-orange-100',
      borderColor: 'border-orange-200',
      hoverColor: 'hover:bg-orange-50',
      activeColor: 'bg-orange-50 border-orange-300'
    }
  ];

  // Render content for each column based on tab type
  const renderColumnContent = (tabType: TabType) => {
    switch (tabType) {
      case 'overview':
        return (
          <div className="space-y-4">
            {/* Client Name */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <User className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Client</p>
                <button
                  onClick={onClientClick}
                  className="text-lg font-semibold text-teal-600 hover:text-teal-700 hover:underline transition-colors text-left"
                  title={`View all projects for ${project.client_name}`}
                >
                  {project.client_name}
                </button>
              </div>
            </div>

            {/* Budget */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Budget</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(project.financial_parameters ?? 0)}
                </p>
              </div>
            </div>

            {/* Deadline */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Deadline</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(project.timeline_deadline ?? null)}
                </p>
              </div>
            </div>

            {/* Created Date */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Created</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(project.created_at)}
                </p>
              </div>
            </div>
          </div>
        );

      case 'budget':
        if (!trackingSummary) {
          return (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Budget tracking not available</p>
              <p className="text-sm text-gray-500 mt-1">Loading tracking data...</p>
            </div>
          );
        }
        return (
          <BudgetTrackingBar
            total={trackingSummary.budget.total}
            spent={trackingSummary.budget.spent}
            remaining={trackingSummary.budget.remaining}
            percentageUsed={trackingSummary.budget.percentageUsed}
            onClick={onBudgetClick}
          />
        );

      case 'timeline':
        if (!trackingSummary) {
          return (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Timeline not available</p>
              <p className="text-sm text-gray-500 mt-1">Loading tracking data...</p>
            </div>
          );
        }
        return (
          <TimelineWidget
            deadline={trackingSummary.timeline.deadline}
            daysRemaining={trackingSummary.timeline.daysRemaining}
            milestones={trackingSummary.timeline.milestones}
            onAddMilestone={onAddMilestone}
            onEditMilestone={onEditMilestone}
            onDeleteMilestone={onDeleteMilestone}
          />
        );

      case 'actions':
        if (!trackingSummary) {
          return (
            <div className="text-center py-8">
              <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Actions not available</p>
              <p className="text-sm text-gray-500 mt-1">Loading tracking data...</p>
            </div>
          );
        }
        return (
          <div className="space-y-4">
            <ActionCounter
              label="Your Actions"
              count={trackingSummary.actions.producerActions}
              icon={CheckSquare}
              iconColor="text-blue-600"
              bgColor="bg-blue-100"
              description="Tasks requiring your attention"
            />
            
            <ActionCounter
              label="Their Actions"
              count={trackingSummary.actions.supplierActions}
              icon={UsersIcon}
              iconColor="text-purple-600"
              bgColor="bg-purple-100"
              description="Pending supplier responses"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mb-8">
      {/* Integrated 4-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tabs.map((tab, index) => {
          const isActive = activeIndex === index;
          const isDisabled = (tab.id === 'budget' || tab.id === 'timeline' || tab.id === 'actions') && loadingTracking;
          
          return (
            <div
              key={tab.id}
              className={`
                bg-white rounded-lg shadow-sm border-2 transition-all duration-300 overflow-hidden
                ${isActive 
                  ? `${tab.activeColor} shadow-lg` 
                  : `${tab.bgColor} ${tab.borderColor} ${tab.hoverColor} hover:shadow-md`
                }
                ${isDisabled ? 'opacity-50' : ''}
              `}
            >
              {/* Header - Always Visible */}
              <button
                onClick={() => !isDisabled && setActiveIndex(index)}
                disabled={isDisabled}
                className={`
                  w-full flex items-center gap-3 p-4 text-left transition-all duration-200
                  ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                  focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-inset
                `}
                aria-pressed={isActive}
                aria-label={`${tab.title} section`}
                aria-expanded={isActive}
                aria-controls={`content-${tab.id}`}
              >
                <div className={`p-2 ${tab.bgColor} rounded-lg`}>
                  {tab.icon}
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                    {tab.title}
                  </h3>
                  {isDisabled && (
                    <p className="text-xs text-gray-500 mt-1">Loading...</p>
                  )}
                </div>
              </button>

              {/* Content - Expandable */}
              <div
                id={`content-${tab.id}`}
                className={`
                  transition-all duration-300 ease-in-out overflow-hidden
                  ${isActive 
                    ? 'max-h-screen opacity-100' 
                    : 'max-h-0 opacity-0'
                  }
                `}
                aria-labelledby={`header-${tab.id}`}
              >
                <div className="px-4 pb-4">
                  {renderColumnContent(tab.id)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectDetailTabs;

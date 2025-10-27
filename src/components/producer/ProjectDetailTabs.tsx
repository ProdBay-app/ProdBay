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
import HeaderCard from './HeaderCard';
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
 * ProjectDetailTabs - Tetris-style expanding blocks for project details
 * 
 * Features:
 * - Four static header cards that remain always visible
 * - Single content panel that expands below the headers
 * - Only one content panel visible at a time
 * - Smooth transitions between content changes
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
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
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

  // Extract summary data for each card
  const getSummaryData = (tabId: TabType) => {
    switch (tabId) {
      case 'overview':
        return {
          primary: project.client_name,
          secondary: project.project_status,
          status: 'Active'
        };
      case 'budget':
        if (!trackingSummary) {
          return {
            primary: formatCurrency(project.financial_parameters ?? 0),
            secondary: 'Loading...',
            status: 'Loading'
          };
        }
        return {
          primary: formatCurrency(trackingSummary.budget.total),
          secondary: `${trackingSummary.budget.percentageUsed.toFixed(1)}% used`,
          status: trackingSummary.budget.percentageUsed >= 90 
            ? 'Critical' 
            : trackingSummary.budget.percentageUsed >= 70 
            ? 'Warning' 
            : 'Healthy'
        };
      case 'timeline':
        if (!trackingSummary) {
          return {
            primary: project.timeline_deadline ? formatDate(project.timeline_deadline) : 'Not set',
            secondary: 'Loading...',
            status: 'Loading'
          };
        }
        return {
          primary: trackingSummary.timeline.daysRemaining 
            ? `${trackingSummary.timeline.daysRemaining} days`
            : 'No deadline',
          secondary: trackingSummary.timeline.deadline 
            ? formatDate(trackingSummary.timeline.deadline)
            : 'Not set',
          status: trackingSummary.timeline.daysRemaining 
            ? (trackingSummary.timeline.daysRemaining < 0 
                ? 'Overdue' 
                : trackingSummary.timeline.daysRemaining <= 7 
                ? 'Due soon' 
                : 'On track')
            : 'No deadline'
        };
      case 'actions':
        if (!trackingSummary) {
          return {
            primary: 'Loading...',
            secondary: 'Loading...',
            status: 'Loading'
          };
        }
        const totalActions = trackingSummary.actions.producerActions + trackingSummary.actions.supplierActions;
        return {
          primary: totalActions,
          secondary: `${trackingSummary.actions.producerActions} yours, ${trackingSummary.actions.supplierActions} theirs`,
          status: totalActions === 0 ? 'All caught up!' : `${totalActions} pending`
        };
      default:
        return {
          primary: 'N/A',
          secondary: 'N/A',
          status: 'Unknown'
        };
    }
  };

  // Tab configuration with summary data
  const tabs = [
    {
      id: 'overview' as TabType,
      title: 'Overview',
      icon: <User className="w-5 h-5 text-purple-600" />,
      bgColor: 'bg-purple-100',
      borderColor: 'border-purple-200',
      hoverColor: 'hover:bg-purple-50',
      activeColor: 'bg-purple-50 border-purple-300',
      summaryData: getSummaryData('overview')
    },
    {
      id: 'budget' as TabType,
      title: 'Budget',
      icon: <DollarSign className="w-5 h-5 text-green-600" />,
      bgColor: 'bg-green-100',
      borderColor: 'border-green-200',
      hoverColor: 'hover:bg-green-50',
      activeColor: 'bg-green-50 border-green-300',
      summaryData: getSummaryData('budget')
    },
    {
      id: 'timeline' as TabType,
      title: 'Timeline',
      icon: <Calendar className="w-5 h-5 text-blue-600" />,
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-200',
      hoverColor: 'hover:bg-blue-50',
      activeColor: 'bg-blue-50 border-blue-300',
      summaryData: getSummaryData('timeline')
    },
    {
      id: 'actions' as TabType,
      title: 'Actions',
      icon: <CheckSquare className="w-5 h-5 text-orange-600" />,
      bgColor: 'bg-orange-100',
      borderColor: 'border-orange-200',
      hoverColor: 'hover:bg-orange-50',
      activeColor: 'bg-orange-50 border-orange-300',
      summaryData: getSummaryData('actions')
    }
  ];

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      {/* Header Cards Row */}
      <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isDisabled = (tab.id === 'budget' || tab.id === 'timeline' || tab.id === 'actions') && loadingTracking;
          
          return (
            <HeaderCard
              key={tab.id}
              id={tab.id}
              title={tab.title}
              icon={tab.icon}
              summaryData={tab.summaryData}
              isActive={isActive}
              onClick={() => !isDisabled && setActiveTab(tab.id)}
              activeColor={tab.activeColor}
              bgColor={tab.bgColor}
              borderColor={tab.borderColor}
              hoverColor={tab.hoverColor}
              isDisabled={isDisabled}
              zIndex={isActive ? '' : 'relative z-10'}
            />
          );
        })}
      </div>

      {/* Dynamic Content Panel */}
      <div 
        className={`
          overflow-hidden transition-all duration-300 transition-[max-height] duration-500 ease-in-out
          ${activeTab ? 'max-h-[1000px] rounded-b-lg rounded-t-none -mt-0.5 border-l-2 border-r-2 border-b-2 border-t-0 shadow-none' : 'max-h-0 rounded-lg shadow-sm border border-gray-200'}
          ${activeTab ? tabs.find(tab => tab.id === activeTab)?.activeColor || 'bg-white' : 'bg-white'}
          ${activeTab ? tabs.find(tab => tab.id === activeTab)?.borderColor || '' : ''}
        `}
      >
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailTabs;

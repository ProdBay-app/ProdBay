import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [activeTab, setActiveTab] = useState<TabType | null>('overview');
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeCardPosition, setActiveCardPosition] = useState({ x: 0, width: 0 });

  // Calculate card position for animation origin
  const calculateCardPosition = (tabId: TabType) => {
    const tabIndex = tabs.findIndex(tab => tab.id === tabId);
    const cardWidth = 25; // Approximate card width as percentage
    const cardSpacing = 1; // Approximate gap between cards as percentage
    const xOffset = (tabIndex * (cardWidth + cardSpacing)) + (cardWidth / 2);
    return {
      x: xOffset,
      width: cardWidth
    };
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

  // Handle tab switching with animation
  const handleTabClick = (tabId: TabType) => {
    if (isAnimating) return; // Prevent clicks during animation
    
    setIsAnimating(true);
    
    if (activeTab === tabId) {
      // If clicking the same tab, collapse it
      setActiveTab(null);
      setTimeout(() => setIsAnimating(false), 500);
    } else {
      // Calculate position for the new active card
      const newPosition = calculateCardPosition(tabId);
      setActiveCardPosition(newPosition);
      
      // Switch to new tab
      setActiveTab(tabId);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  // Initialize active card position on mount
  useEffect(() => {
    if (activeTab) {
      const initialPosition = calculateCardPosition(activeTab);
      setActiveCardPosition(initialPosition);
    }
  }, []);

  // Get active tab data for styling
  const activeTabData = activeTab ? tabs.find(tab => tab.id === activeTab) : null;

  return (
    <div className="mb-8">
      {/* Unified Card System */}
      <div className="relative">
        {/* Inactive Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isDisabled = (tab.id === 'budget' || tab.id === 'timeline' || tab.id === 'actions') && loadingTracking;
            
            if (isActive) return null; // Skip active card, it will be rendered as unified entity
            
            return (
              <HeaderCard
                key={tab.id}
                id={tab.id}
                title={tab.title}
                icon={tab.icon}
                summaryData={tab.summaryData}
                isActive={false}
                onClick={() => !isDisabled && handleTabClick(tab.id)}
                activeColor={tab.activeColor}
                bgColor={tab.bgColor}
                borderColor={tab.borderColor}
                hoverColor={tab.hoverColor}
                isDisabled={isDisabled}
                zIndex="relative z-10"
              />
            );
          })}
        </div>

        {/* Unified Active Card + Content Entity */}
        <AnimatePresence mode="wait">
          {activeTab && (
            <motion.div
              key={activeTab}
              initial={{ 
                height: 120, // Start as card height
                scaleX: 0.25, // Start as card width
                scaleY: 1,
                x: (activeCardPosition.x - 50) * 4, // Start from card position
                opacity: 1
              }}
              animate={{ 
                height: 520, // Expand to full height
                scaleX: 1, // Expand to full width
                scaleY: 1,
                x: 0, // Move to center
                opacity: 1
              }}
              exit={{ 
                height: 120,
                scaleX: 0.25,
                scaleY: 1,
                x: (activeCardPosition.x - 50) * 4,
                opacity: 1
              }}
              transition={{
                duration: 0.6,
                ease: [0.4, 0, 0.2, 1],
                scale: { duration: 0.5 },
                x: { duration: 0.5 }
              }}
              className={`
                absolute top-0 left-0 right-0 overflow-hidden
                ${activeTabData?.activeColor || 'bg-white'}
                ${activeTabData?.borderColor || ''}
                rounded-lg shadow-lg border-2
              `}
            >
              {/* Card Header - Always Visible */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 ${activeTabData?.bgColor || 'bg-gray-100'} rounded-lg`}>
                      {activeTabData?.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        {activeTabData?.title}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xl font-bold text-gray-900">
                          {activeTabData?.summaryData?.primary}
                        </span>
                        <span className="text-sm text-gray-600">
                          {activeTabData?.summaryData?.secondary}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {activeTabData?.summaryData?.status}
                    </span>
                    <button
                      onClick={() => handleTabClick(activeTab)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanding Content Area */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="p-6"
              >
                {renderContent()}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProjectDetailTabs;

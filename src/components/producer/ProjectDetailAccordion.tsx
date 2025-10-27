import React from 'react';
import { 
  User, 
  DollarSign, 
  Calendar, 
  Clock,
  CheckSquare,
  Users as UsersIcon
} from 'lucide-react';
import { Accordion, AccordionItem } from '@/components/shared/Accordion';
import BudgetTrackingBar from './widgets/BudgetTrackingBar';
import TimelineWidget from './widgets/TimelineWidget';
import ActionCounter from './widgets/ActionCounter';
import type { Project } from '@/lib/supabase';
import type { ProjectTrackingSummary, ProjectMilestone } from '@/types/database';

interface ProjectDetailAccordionProps {
  project: Project;
  trackingSummary: ProjectTrackingSummary | null;
  loadingTracking: boolean;
  onClientClick: () => void;
  onBudgetClick: () => void;
  onAddMilestone: () => void;
  onEditMilestone: (milestone: ProjectMilestone) => void;
  onDeleteMilestone: (milestone: ProjectMilestone) => void;
}

/**
 * ProjectDetailAccordion - Accordion-style layout for project details
 * 
 * Features:
 * - Four main accordion sections: Overview, Budget, Timeline, Actions
 * - Only one section can be expanded at a time
 * - Smooth animations and transitions
 * - Preserves all existing functionality
 */
const ProjectDetailAccordion: React.FC<ProjectDetailAccordionProps> = ({
  project,
  trackingSummary,
  loadingTracking,
  onClientClick,
  onBudgetClick,
  onAddMilestone,
  onEditMilestone,
  onDeleteMilestone
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

  // Format date for display
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Accordion className="mb-8">
      {/* Overview Section */}
      <AccordionItem
        id="overview"
        title="Overview"
        icon={
          <div className="p-2 bg-purple-100 rounded-lg">
            <User className="w-5 h-5 text-purple-600" />
          </div>
        }
        isExpanded={false}
        onToggle={() => {}} // Will be handled by Accordion context
      >
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
      </AccordionItem>

      {/* Budget Section */}
      {!loadingTracking && trackingSummary && (
        <AccordionItem
          id="budget"
          title="Budget"
          icon={
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          }
          isExpanded={false}
          onToggle={() => {}} // Will be handled by Accordion context
        >
          <BudgetTrackingBar
            total={trackingSummary.budget.total}
            spent={trackingSummary.budget.spent}
            remaining={trackingSummary.budget.remaining}
            percentageUsed={trackingSummary.budget.percentageUsed}
            onClick={onBudgetClick}
          />
        </AccordionItem>
      )}

      {/* Timeline Section */}
      {!loadingTracking && trackingSummary && (
        <AccordionItem
          id="timeline"
          title="Timeline"
          icon={
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
          }
          isExpanded={false}
          onToggle={() => {}} // Will be handled by Accordion context
        >
          <TimelineWidget
            deadline={trackingSummary.timeline.deadline}
            daysRemaining={trackingSummary.timeline.daysRemaining}
            milestones={trackingSummary.timeline.milestones}
            onAddMilestone={onAddMilestone}
            onEditMilestone={onEditMilestone}
            onDeleteMilestone={onDeleteMilestone}
          />
        </AccordionItem>
      )}

      {/* Actions Section */}
      {!loadingTracking && trackingSummary && (
        <AccordionItem
          id="actions"
          title="Actions"
          icon={
            <div className="p-2 bg-orange-100 rounded-lg">
              <CheckSquare className="w-5 h-5 text-orange-600" />
            </div>
          }
          isExpanded={false}
          onToggle={() => {}} // Will be handled by Accordion context
        >
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
        </AccordionItem>
      )}
    </Accordion>
  );
};

export default ProjectDetailAccordion;

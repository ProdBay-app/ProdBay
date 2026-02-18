import React from 'react';
import { Calendar, User } from 'lucide-react';
import type { Project } from '@/lib/supabase';

interface ProjectCardProps {
  project: Project;
  onClick: (project: Project) => void;
}

/**
 * ProjectCard - A presentational component for displaying project information in a card format
 * 
 * Design Features:
 * - Entire card is clickable for navigation
 * - Displays key project metadata at a glance
 * - Hover effects for better UX
 * - Responsive layout
 */
const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onClick
}) => {
  // Format the deadline date for display
  const formattedDeadline = project.timeline_deadline
    ? new Date(project.timeline_deadline).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'No deadline set';

  return (
    <div
      onClick={() => onClick(project)}
      className="group relative overflow-hidden rounded-lg shadow-md transition-all duration-300 cursor-pointer bg-purple-500/10 backdrop-blur-md border border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
    >
      {/* Card Content */}
      <div className="p-4">
        {/* Project Title */}
        <h3 className="text-lg font-bold text-white mb-1.5 line-clamp-2">
          {project.project_name}
        </h3>

        {/* Client & Deadline - compact row */}
        <div className="flex items-center gap-4 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <User className="w-3.5 h-3.5 flex-shrink-0 text-gray-300" />
            <p className="text-xs font-medium text-gray-300 truncate">{project.client_name}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <p className="text-xs text-gray-400">{formattedDeadline}</p>
          </div>
        </div>

        {/* Arrow indicator on hover */}
        <div className="flex items-center justify-end">
          <div className="text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-200">
            <svg 
              className="w-4 h-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 5l7 7-7 7" 
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;


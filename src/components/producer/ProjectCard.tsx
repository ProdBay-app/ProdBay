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
 * - Status badge for quick project state identification
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
      className="group relative overflow-hidden rounded-lg shadow-md transition-all duration-300 cursor-pointer bg-wedding-primary/10 backdrop-blur-md border border-wedding-primary/20 hover:bg-wedding-primary/20 hover:border-wedding-primary/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
    >
      {/* Card Content */}
      <div className="p-6">
        {/* Project Title */}
        <h3 className="text-2xl font-bold text-white mb-2 line-clamp-2">
          {project.project_name}
        </h3>

        {/* Client Name */}
        <div className="flex items-center gap-2 mb-3">
          <User className="w-4 h-4 text-gray-300" />
          <p className="text-sm font-medium text-gray-300 truncate">{project.client_name}</p>
        </div>

        {/* Deadline */}
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-gray-400" />
          <p className="text-xs text-gray-400">{formattedDeadline}</p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span 
            className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm border border-white/30 text-white"
          >
            {project.project_status}
          </span>
          
          {/* Arrow indicator on hover */}
          <div className="text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-200">
            <svg 
              className="w-5 h-5" 
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


import React from 'react';
import { Calendar, User, Package } from 'lucide-react';
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

  // Determine if this is an active or archived project for visual styling
  const isActive = ['New', 'In Progress', 'Quoting'].includes(project.project_status);
  
  return (
    <div
      onClick={() => onClick(project)}
      className={`
        group relative overflow-hidden rounded-lg shadow-md 
        transition-all duration-300 cursor-pointer
        ${isActive 
          ? 'bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700' 
          : 'bg-gradient-to-br from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600'
        }
        hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]
      `}
    >
      {/* Card Content */}
      <div className="p-6 text-white">
        {/* Project Image Placeholder - Top Section */}
        <div className="w-full h-32 bg-white/10 rounded-md mb-4 flex items-center justify-center backdrop-blur-sm">
          <Package className="w-12 h-12 text-white/40" />
        </div>

        {/* Project Title */}
        <h3 className="text-xl font-bold mb-2 line-clamp-2 min-h-[3.5rem]">
          {project.project_name}
        </h3>

        {/* Client Name */}
        <div className="flex items-center gap-2 mb-3 text-white/90">
          <User className="w-4 h-4" />
          <p className="text-sm font-medium truncate">{project.client_name}</p>
        </div>

        {/* Deadline */}
        <div className="flex items-center gap-2 mb-4 text-white/80">
          <Calendar className="w-4 h-4" />
          <p className="text-xs">{formattedDeadline}</p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span 
            className={`
              px-3 py-1 rounded-full text-xs font-semibold
              bg-white/20 backdrop-blur-sm border border-white/30
            `}
          >
            {project.project_status}
          </span>
          
          {/* Arrow indicator on hover */}
          <div className="text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all duration-200">
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

      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
    </div>
  );
};

export default ProjectCard;


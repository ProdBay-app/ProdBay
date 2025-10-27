import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, Package } from 'lucide-react';
import { useAccessibleAnimation } from '@/hooks/useReducedMotion';
import { TRANSITIONS } from '@/utils/animations';
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
  const { getAnimationVariant, getTransition } = useAccessibleAnimation();

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

  // Animation variants for the card
  const cardVariants = getAnimationVariant({
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    hover: { 
      scale: 1.02, 
      y: -2,
      transition: getTransition(TRANSITIONS.fast)
    },
    tap: { 
      scale: 0.98,
      transition: getTransition(TRANSITIONS.fast)
    },
  });

  // Animation variants for the arrow icon
  const arrowVariants = getAnimationVariant({
    initial: { x: 0, opacity: 0.6 },
    hover: { x: 4, opacity: 1 },
  });
  
  return (
    <motion.div
      onClick={() => onClick(project)}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      transition={getTransition(TRANSITIONS.normal)}
      className={`
        group relative overflow-hidden rounded-lg shadow-md cursor-pointer
        ${isActive 
          ? 'bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700' 
          : 'bg-gradient-to-br from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600'
        }
      `}
      style={{ willChange: 'transform' }}
    >
      {/* Card Content */}
      <motion.div 
        className="p-6 text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={getTransition({
          ...TRANSITIONS.normal,
          delay: 0.1
        })}
      >
        {/* Project Image Placeholder - Top Section */}
        <motion.div 
          className="w-full h-32 bg-white/10 rounded-md mb-4 flex items-center justify-center backdrop-blur-sm"
          whileHover={{ scale: 1.02 }}
          transition={getTransition(TRANSITIONS.fast)}
        >
          <Package className="w-12 h-12 text-white/40" />
        </motion.div>

        {/* Project Title */}
        <motion.h3 
          className="text-xl font-bold mb-2 line-clamp-2 min-h-[3.5rem]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={getTransition({
            ...TRANSITIONS.normal,
            delay: 0.2
          })}
        >
          {project.project_name}
        </motion.h3>

        {/* Client Name */}
        <motion.div 
          className="flex items-center gap-2 mb-3 text-white/90"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={getTransition({
            ...TRANSITIONS.normal,
            delay: 0.3
          })}
        >
          <User className="w-4 h-4" />
          <p className="text-sm font-medium truncate">{project.client_name}</p>
        </motion.div>

        {/* Deadline */}
        <motion.div 
          className="flex items-center gap-2 mb-4 text-white/80"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={getTransition({
            ...TRANSITIONS.normal,
            delay: 0.4
          })}
        >
          <Calendar className="w-4 h-4" />
          <p className="text-xs">{formattedDeadline}</p>
        </motion.div>

        {/* Status Badge */}
        <motion.div 
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={getTransition({
            ...TRANSITIONS.normal,
            delay: 0.5
          })}
        >
          <motion.span 
            className={`
              px-3 py-1 rounded-full text-xs font-semibold
              bg-white/20 backdrop-blur-sm border border-white/30
            `}
            whileHover={{ scale: 1.05 }}
            transition={getTransition(TRANSITIONS.fast)}
          >
            {project.project_status}
          </motion.span>
          
          {/* Arrow indicator on hover */}
          <motion.div 
            className="text-white/60"
            variants={arrowVariants}
            initial="initial"
            whileHover="hover"
            transition={getTransition(TRANSITIONS.fast)}
          >
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
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Subtle gradient overlay for depth */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={getTransition({
          ...TRANSITIONS.normal,
          delay: 0.6
        })}
      />
    </motion.div>
  );
};

export default ProjectCard;


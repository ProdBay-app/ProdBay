import React from 'react';
import { motion } from 'framer-motion';

interface SummaryCardProps {
  title: string;
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
  isMobile?: boolean;
  prefersReducedMotion?: boolean;
}

/**
 * SummaryCard Component
 * 
 * A reusable card component for displaying summary information in the expandable card layout.
 * Used in the project detail page to show condensed information for each section.
 * 
 * Features:
 * - Clickable card with hover and active states
 * - Accessibility support with keyboard navigation
 * - Consistent styling with teal accent colors
 * - Smooth transitions for state changes
 * - Responsive design
 * 
 * Usage:
 * <SummaryCard
 *   title="Overview"
 *   isActive={activeSection === 'Overview'}
 *   onClick={() => setActiveSection('Overview')}
 * >
 *   <div>Summary content here</div>
 * </SummaryCard>
 */
const SummaryCard: React.FC<SummaryCardProps> = ({ 
  title, 
  isActive, 
  onClick, 
  children,
  isMobile = false,
  prefersReducedMotion = false
}) => {
  return (
    <motion.div
      className={`rounded-lg shadow-sm border cursor-pointer transition-all duration-200 ${
        isMobile 
          ? 'p-3 min-h-[60px] touch-manipulation' 
          : 'p-4 hover:shadow-md'
      } ${
        isActive 
          ? 'bg-teal-50 border-teal-200 shadow-md' 
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      whileHover={!isMobile && !prefersReducedMotion ? { 
        scale: 1.03,
        transition: { duration: 0.2, ease: "easeOut" }
      } : {}}
      whileTap={!prefersReducedMotion ? { 
        scale: isMobile ? 0.95 : 0.98,
        transition: { duration: 0.1, ease: "easeInOut" }
      } : {}}
      animate={prefersReducedMotion ? {} : {
        rotateY: isActive ? 0 : 0,
        scale: isActive ? 1.05 : 1,
      }}
      transition={prefersReducedMotion ? { duration: 0 } : {
        duration: 0.4,
        ease: "easeInOut"
      }}
      style={{ 
        transformStyle: 'preserve-3d',
        perspective: '1000px'
      }}
    >
      {/* Card Header - Always visible */}
      <motion.h3 
        className={`font-semibold mb-2 transition-all duration-200 ${
          isMobile 
            ? 'text-base mb-1' 
            : 'text-lg mb-2'
        } ${
          isActive 
            ? 'text-center text-teal-700 font-bold' 
            : 'text-gray-900'
        }`}
        animate={prefersReducedMotion ? {} : {
          y: isActive ? -10 : 0,
          scale: isActive ? 1.1 : 1,
        }}
        transition={prefersReducedMotion ? { duration: 0 } : {
          duration: 0.3,
          ease: "easeOut"
        }}
      >
        {title}
      </motion.h3>
      
      {/* Card Content - Flips away when active */}
      <motion.div 
        className={`text-gray-600 ${
          isMobile ? 'text-xs space-y-1' : 'text-sm'
        }`}
        animate={prefersReducedMotion ? {} : {
          rotateX: isActive ? 90 : 0,
          opacity: isActive ? 0 : 1,
          y: isActive ? 20 : 0,
        }}
        transition={prefersReducedMotion ? { duration: 0 } : {
          duration: 0.4,
          ease: "easeInOut"
        }}
        style={{ 
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden'
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

export default SummaryCard;

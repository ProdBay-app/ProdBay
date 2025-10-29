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
    <div 
      className="relative w-full h-full"
      style={{ 
        transformStyle: 'preserve-3d',
        perspective: '1000px'
      }}
    >
      <motion.div
        className={`rounded-lg shadow-sm border cursor-pointer transition-all duration-200 w-full h-full ${
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
          scale: isActive ? 1.05 : 1,
        }}
        transition={prefersReducedMotion ? { duration: 0 } : {
          duration: 0.3,
          ease: "easeOut"
        }}
        style={{ 
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden'
        }}
      >
        {/* Card content - Always visible */}
        <div className="w-full h-full">
          <h3 className={`font-semibold mb-2 ${
            isMobile 
              ? 'text-base mb-1' 
              : 'text-lg mb-2'
          } text-gray-900`}>
            {title}
          </h3>
          <div className={`text-gray-600 ${
            isMobile ? 'text-xs space-y-1' : 'text-sm'
          }`}>
            {children}
          </div>
        </div>

        {/* Prominent header overlay - Appears on top when active */}
        <motion.div 
          className={`w-full h-full flex items-center justify-center absolute inset-0 ${
            isActive ? 'pointer-events-none' : 'pointer-events-none'
          }`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isActive ? {
            opacity: 1,
            scale: 1,
            y: 0
          } : {
            opacity: 0,
            scale: 0.8,
            y: 20
          }}
          transition={prefersReducedMotion ? { duration: 0 } : {
            duration: 0.4,
            ease: "easeOut"
          }}
          style={{
            background: 'rgba(240, 253, 250, 0.95)', // Semi-transparent teal background
            backdropFilter: 'blur(4px)',
            borderRadius: '0.5rem'
          }}
        >
          <h3 
            className={`font-bold text-center ${
              isMobile 
                ? 'text-2xl' 
                : 'text-4xl'
            } text-teal-700`}
          >
            {title}
          </h3>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SummaryCard;

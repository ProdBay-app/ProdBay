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
        className={`rounded-lg shadow-sm border cursor-pointer w-full h-full ${
          isMobile 
            ? 'p-3 min-h-[60px] touch-manipulation' 
            : 'p-4 hover:shadow-md'
        } ${
          isActive 
            ? 'bg-wedding-primary/20 border-wedding-primary-light/50 shadow-md backdrop-blur-md' 
            : 'bg-white/10 backdrop-blur-md border-white/20 hover:border-white/30'
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
          rotateX: isActive ? 180 : 0,
          scale: isActive ? 1.05 : 1,
        }}
        transition={prefersReducedMotion ? { duration: 0 } : {
          duration: 0.6,
          ease: [0.4, 0.0, 0.2, 1] // Custom cubic-bezier for polished feel
        }}
        style={{ 
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden'
        }}
      >
        {/* Front of card - Summary content */}
        <div 
          className="w-full h-full"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateX(0deg)'
          }}
        >
          <h3 className={`font-semibold mb-2 ${
            isMobile 
              ? 'text-base mb-1' 
              : 'text-lg mb-2'
          } text-white`}>
            {title}
          </h3>
          <div className={`text-gray-300 ${
            isMobile ? 'text-xs space-y-1' : 'text-sm'
          }`}>
            {children}
          </div>
        </div>

        {/* Back of card - Prominent header */}
        <div 
          className="w-full h-full flex items-center justify-center absolute inset-0"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateX(180deg)',
            background: 'rgba(20, 184, 166, 0.2)',
            borderRadius: '0.5rem',
            backdropFilter: 'blur(8px)'
          }}
        >
          <h3 
            className={`font-bold text-center ${
              isMobile 
                ? 'text-2xl' 
                : 'text-4xl'
            } text-wedding-primary-light`}
          >
            {title}
          </h3>
        </div>
      </motion.div>
    </div>
  );
};

export default SummaryCard;

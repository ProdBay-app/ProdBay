import React from 'react';
import { motion } from 'framer-motion';

interface DetailViewProps {
  title?: string;
  children: React.ReactNode;
  isMobile?: boolean;
  prefersReducedMotion?: boolean;
}

/**
 * DetailView Component
 * 
 * A reusable container component for displaying detailed information in the expandable card layout.
 * Used in the project detail page to show comprehensive content for the active section.
 * 
 * Features:
 * - Consistent styling with white background and border
 * - Clear section title with proper typography
 * - Flexible content area for any React children
 * - Responsive design
 * 
 * Usage:
 * <DetailView title="Overview">
 *   <div>Detailed content here</div>
 * </DetailView>
 */
const DetailView: React.FC<DetailViewProps> = ({ title, children, isMobile = false, prefersReducedMotion = false }) => {
  return (
    <motion.div 
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${
        isMobile ? 'p-4' : 'p-6'
      }`}
      initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
      transition={prefersReducedMotion ? { duration: 0 } : { 
        duration: 0.3, 
        ease: "easeOut",
        layout: { duration: 0.3 }
      }}
      layout
    >
      {/* Only render header if title is provided */}
      {title && (
        <h2 className={`font-bold text-gray-900 ${
          isMobile ? 'text-lg mb-4' : 'text-2xl mb-6'
        }`}>
          {title}
        </h2>
      )}
      <div className={isMobile ? 'space-y-4' : ''}>
        {children}
      </div>
    </motion.div>
  );
};

export default DetailView;

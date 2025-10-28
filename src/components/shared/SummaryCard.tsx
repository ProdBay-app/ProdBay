import React from 'react';
import { motion } from 'framer-motion';

interface SummaryCardProps {
  title: string;
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
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
  children 
}) => {
  return (
    <motion.div
      className={`rounded-lg shadow-sm border p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
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
      whileHover={{ 
        scale: 1.03,
        transition: { duration: 0.2, ease: "easeOut" }
      }}
      whileTap={{ 
        scale: 0.98,
        transition: { duration: 0.1, ease: "easeInOut" }
      }}
      transition={{
        duration: 0.2,
        ease: "easeOut"
      }}
    >
      <h3 className={`text-lg font-semibold mb-2 ${
        isActive ? 'text-teal-700' : 'text-gray-900'
      }`}>
        {title}
      </h3>
      <div className="text-sm text-gray-600">
        {children}
      </div>
    </motion.div>
  );
};

export default SummaryCard;

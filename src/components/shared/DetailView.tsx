import React from 'react';
import { motion } from 'framer-motion';

interface DetailViewProps {
  title: string;
  children: React.ReactNode;
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
const DetailView: React.FC<DetailViewProps> = ({ title, children }) => {
  return (
    <motion.div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ 
        duration: 0.3, 
        ease: "easeOut",
        layout: { duration: 0.3 }
      }}
      layout
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
      {children}
    </motion.div>
  );
};

export default DetailView;

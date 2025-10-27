import React, { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useAccessibleAnimation } from '@/hooks/useReducedMotion';
import { TRANSITIONS } from '@/utils/animations';

interface AccordionItemProps {
  id: string;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  className?: string;
}

interface AccordionProps {
  children: ReactNode;
  className?: string;
  allowMultiple?: boolean;
}

interface AccordionContextType {
  expandedItems: Set<string>;
  toggleItem: (id: string) => void;
  allowMultiple: boolean;
}

const AccordionContext = React.createContext<AccordionContextType | undefined>(undefined);

const useAccordion = () => {
  const context = React.useContext(AccordionContext);
  if (!context) {
    throw new Error('useAccordion must be used within an Accordion component');
  }
  return context;
};

/**
 * AccordionItem - Individual collapsible section within an accordion
 * 
 * Features:
 * - Smooth expand/collapse animations with Framer Motion
 * - Customizable icon and styling
 * - Keyboard navigation support
 * - Accessible ARIA attributes
 * - Respects user's motion preferences
 */
const AccordionItem: React.FC<AccordionItemProps> = ({
  id,
  title,
  icon,
  children,
  isExpanded,
  onToggle,
  className = ''
}) => {
  const { getAnimationVariant, getTransition } = useAccessibleAnimation();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle(id);
    }
  };

  // Animation variants for the content area
  const contentVariants = getAnimationVariant({
    initial: { height: 0, opacity: 0 },
    animate: { height: "auto", opacity: 1 },
    exit: { height: 0, opacity: 0 },
  });

  // Animation variants for the chevron icon
  const chevronVariants = getAnimationVariant({
    expanded: { rotate: 180 },
    collapsed: { rotate: 0 },
  });

  return (
    <motion.div 
      className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}
      layout
    >
      {/* Header - Clickable area */}
      <motion.button
        onClick={() => onToggle(id)}
        onKeyDown={handleKeyDown}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-inset"
        aria-expanded={isExpanded}
        aria-controls={`accordion-content-${id}`}
        id={`accordion-header-${id}`}
        whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.02)" }}
        whileTap={{ scale: 0.995 }}
        transition={getTransition(TRANSITIONS.fast)}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <motion.div 
              className="flex-shrink-0"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={getTransition(TRANSITIONS.spring)}
            >
              {icon}
            </motion.div>
          )}
          <h3 className="text-lg font-semibold text-gray-900">
            {title}
          </h3>
        </div>
        
        {/* Chevron icon with rotation animation */}
        <motion.div 
          className="flex-shrink-0 ml-4"
          variants={chevronVariants}
          animate={isExpanded ? "expanded" : "collapsed"}
          transition={getTransition(TRANSITIONS.normal)}
        >
          <ChevronDown className="w-5 h-5 text-gray-500" />
        </motion.div>
      </motion.button>

      {/* Content - Collapsible area with Framer Motion */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id={`accordion-content-${id}`}
            variants={contentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={getTransition(TRANSITIONS.normal)}
            style={{ overflow: "hidden" }}
            aria-labelledby={`accordion-header-${id}`}
          >
            <motion.div 
              className="px-6 pb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={getTransition({
                ...TRANSITIONS.normal,
                delay: 0.1
              })}
            >
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * Accordion - Container component for collapsible sections
 * 
 * Features:
 * - Single or multiple item expansion modes
 * - Smooth animations with Framer Motion
 * - Keyboard navigation
 * - Accessible design
 * - Staggered animations for multiple items
 */
const Accordion: React.FC<AccordionProps> = ({
  children,
  className = '',
  allowMultiple = false
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      
      if (allowMultiple) {
        // Toggle the item
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
      } else {
        // Single mode: close all others, toggle current
        if (newSet.has(id)) {
          newSet.clear();
        } else {
          newSet.clear();
          newSet.add(id);
        }
      }
      
      return newSet;
    });
  };

  const contextValue: AccordionContextType = {
    expandedItems,
    toggleItem,
    allowMultiple
  };

  return (
    <AccordionContext.Provider value={contextValue}>
      <motion.div 
        className={`space-y-4 ${className}`}
        initial="initial"
        animate="animate"
        variants={{
          initial: {},
          animate: {
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
      >
        {children}
      </motion.div>
    </AccordionContext.Provider>
  );
};

export { Accordion, AccordionItem, useAccordion };
export default Accordion;

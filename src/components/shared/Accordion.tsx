import React, { useState, ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
 * - Smooth expand/collapse animations
 * - Customizable icon and styling
 * - Keyboard navigation support
 * - Accessible ARIA attributes
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
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle(id);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Header - Clickable area */}
      <button
        onClick={() => onToggle(id)}
        onKeyDown={handleKeyDown}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-inset"
        aria-expanded={isExpanded}
        aria-controls={`accordion-content-${id}`}
        id={`accordion-header-${id}`}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex-shrink-0">
              {icon}
            </div>
          )}
          <h3 className="text-lg font-semibold text-gray-900">
            {title}
          </h3>
        </div>
        
        {/* Chevron icon */}
        <div className="flex-shrink-0 ml-4">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </div>
      </button>

      {/* Content - Collapsible area */}
      <div
        id={`accordion-content-${id}`}
        className={`transition-all duration-300 ease-in-out ${
          isExpanded 
            ? 'max-h-screen opacity-100' 
            : 'max-h-0 opacity-0 overflow-hidden'
        }`}
        aria-labelledby={`accordion-header-${id}`}
      >
        <div className="px-6 pb-6">
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * Accordion - Container component for collapsible sections
 * 
 * Features:
 * - Single or multiple item expansion modes
 * - Smooth animations
 * - Keyboard navigation
 * - Accessible design
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
      <div className={`space-y-4 ${className}`}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

export { Accordion, AccordionItem, useAccordion };
export default Accordion;

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useAccessibleAnimation } from '@/hooks/useReducedMotion';
import { TRANSITIONS } from '@/utils/animations';

interface AnimatedListProps {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
  itemClassName?: string;
}

/**
 * AnimatedList - Container for staggered list animations
 * 
 * Features:
 * - Staggered children animations
 * - Accessibility support
 * - Customizable stagger timing
 */
export const AnimatedList: React.FC<AnimatedListProps> = ({
  children,
  staggerDelay = 0.1,
  className = '',
  itemClassName = '',
}) => {
  const { getTransition } = useAccessibleAnimation();

  return (
    <motion.div
      className={className}
      initial="initial"
      animate="animate"
      variants={{
        initial: {},
        animate: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          className={itemClassName}
          variants={{
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
          }}
          transition={getTransition(TRANSITIONS.normal)}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

interface AnimatedGridProps {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
  itemClassName?: string;
  columns?: number;
}

/**
 * AnimatedGrid - Grid container with staggered animations
 */
export const AnimatedGrid: React.FC<AnimatedGridProps> = ({
  children,
  staggerDelay = 0.05,
  className = '',
  itemClassName = '',
  columns = 3,
}) => {
  const { getTransition } = useAccessibleAnimation();

  return (
    <motion.div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-6 ${className}`}
      initial="initial"
      animate="animate"
      variants={{
        initial: {},
        animate: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          className={itemClassName}
          variants={{
            initial: { opacity: 0, y: 20, scale: 0.95 },
            animate: { opacity: 1, y: 0, scale: 1 },
          }}
          transition={getTransition(TRANSITIONS.normal)}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

export default AnimatedList;

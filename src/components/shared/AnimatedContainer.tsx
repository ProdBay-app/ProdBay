import React, { ReactNode } from 'react';
import { motion, Variants } from 'framer-motion';
import { useAccessibleAnimation } from '@/hooks/useReducedMotion';
import { ANIMATION_VARIANTS, TRANSITIONS } from '@/utils/animations';

interface AnimatedContainerProps {
  children: ReactNode;
  variant?: keyof typeof ANIMATION_VARIANTS;
  delay?: number;
  duration?: number;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  staggerChildren?: boolean;
  staggerDelay?: number;
}

/**
 * AnimatedContainer - A reusable wrapper for consistent animations
 * 
 * Features:
 * - Predefined animation variants
 * - Accessibility support
 * - Staggered children animations
 * - Customizable timing
 */
export const AnimatedContainer: React.FC<AnimatedContainerProps> = ({
  children,
  variant = 'fadeInUp',
  delay = 0,
  duration,
  className = '',
  as = 'div',
  staggerChildren = false,
  staggerDelay = 0.1,
}) => {
  const { getAnimationVariant, getTransition } = useAccessibleAnimation();

  const baseVariants = ANIMATION_VARIANTS[variant];
  const customVariants = getAnimationVariant({
    ...baseVariants,
    transition: {
      ...(baseVariants as any).transition,
      delay,
      duration: duration || (baseVariants as any).transition?.duration,
    },
  });

  const containerVariants: Variants = staggerChildren
    ? {
        initial: {},
        animate: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }
    : customVariants;

  const MotionComponent = motion[as as keyof typeof motion] as any;

  return (
    <MotionComponent
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={getTransition(TRANSITIONS.normal)}
      className={className}
    >
      {children}
    </MotionComponent>
  );
};

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

/**
 * FadeIn - Simple fade-in animation component
 */
export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration,
  className = '',
}) => {
  const { getAnimationVariant, getTransition } = useAccessibleAnimation();

  const variants = getAnimationVariant({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  });

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={getTransition({
        ...TRANSITIONS.normal,
        delay,
        duration,
      })}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface SlideInProps {
  children: ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
}

/**
 * SlideIn - Slide-in animation component
 */
export const SlideIn: React.FC<SlideInProps> = ({
  children,
  direction = 'up',
  delay = 0,
  duration,
  className = '',
}) => {
  const { getAnimationVariant, getTransition } = useAccessibleAnimation();

  const getDirectionValues = () => {
    switch (direction) {
      case 'left':
        return { x: -100, y: 0 };
      case 'right':
        return { x: 100, y: 0 };
      case 'up':
        return { x: 0, y: -20 };
      case 'down':
        return { x: 0, y: 20 };
      default:
        return { x: 0, y: -20 };
    }
  };

  const { x, y } = getDirectionValues();

  const variants = getAnimationVariant({
    initial: { opacity: 0, x, y },
    animate: { opacity: 1, x: 0, y: 0 },
    exit: { opacity: 0, x, y },
  });

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={getTransition({
        ...TRANSITIONS.normal,
        delay,
        duration,
      })}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface ScaleInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  scale?: number;
}

/**
 * ScaleIn - Scale-in animation component
 */
export const ScaleIn: React.FC<ScaleInProps> = ({
  children,
  delay = 0,
  duration,
  className = '',
  scale = 0.95,
}) => {
  const { getAnimationVariant, getTransition } = useAccessibleAnimation();

  const variants = getAnimationVariant({
    initial: { opacity: 0, scale },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale },
  });

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={getTransition({
        ...TRANSITIONS.normal,
        delay,
        duration,
      })}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface ExpandableProps {
  children: ReactNode;
  isExpanded: boolean;
  duration?: number;
  className?: string;
}

/**
 * Expandable - Height-based expand/collapse animation
 */
export const Expandable: React.FC<ExpandableProps> = ({
  children,
  isExpanded,
  duration,
  className = '',
}) => {
  const { getAnimationVariant, getTransition } = useAccessibleAnimation();

  const variants = getAnimationVariant({
    initial: { height: 0, opacity: 0 },
    animate: { 
      height: isExpanded ? "auto" : 0, 
      opacity: isExpanded ? 1 : 0 
    },
    exit: { height: 0, opacity: 0 },
  });

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={getTransition({
        ...TRANSITIONS.normal,
        duration,
      })}
      style={{ overflow: "hidden" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedContainer;

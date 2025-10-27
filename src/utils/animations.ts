/**
 * Animation utilities and configuration for consistent animations across the application
 */

// Animation timing presets
export const ANIMATION_DURATION = {
  fast: 0.2,
  normal: 0.3,
  slow: 0.6,
  verySlow: 1.0,
} as const;

// Easing functions for natural motion
export const EASING = {
  easeInOut: [0.4, 0, 0.2, 1], // Custom cubic-bezier for smooth motion
  easeOut: [0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
} as const;

// Common animation variants
export const ANIMATION_VARIANTS = {
  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  
  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  
  // Scale animations
  scaleIn: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.95, opacity: 0 },
  },
  
  // Slide animations
  slideInLeft: {
    initial: { x: -100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -100, opacity: 0 },
  },
  
  slideInRight: {
    initial: { x: 100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 100, opacity: 0 },
  },
  
  // Height animations for expanding content
  expandHeight: {
    initial: { height: 0, opacity: 0 },
    animate: { height: "auto", opacity: 1 },
    exit: { height: 0, opacity: 0 },
  },
  
  // Card hover animations
  cardHover: {
    hover: { 
      scale: 1.02, 
      y: -2,
      transition: { duration: ANIMATION_DURATION.fast, ease: EASING.easeOut }
    },
    tap: { 
      scale: 0.98,
      transition: { duration: ANIMATION_DURATION.fast }
    },
  },
  
  // Modal animations
  modalBackdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  
  modalContent: {
    initial: { scale: 0.95, opacity: 0, y: 20 },
    animate: { scale: 1, opacity: 1, y: 0 },
    exit: { scale: 0.95, opacity: 0, y: 20 },
  },
} as const;

// Common transition configurations
export const TRANSITIONS = {
  fast: {
    duration: ANIMATION_DURATION.fast,
    ease: EASING.easeInOut,
  },
  normal: {
    duration: ANIMATION_DURATION.normal,
    ease: EASING.easeInOut,
  },
  slow: {
    duration: ANIMATION_DURATION.slow,
    ease: EASING.easeInOut,
  },
  spring: {
    type: "spring",
    stiffness: 300,
    damping: 30,
  },
  bounce: {
    duration: ANIMATION_DURATION.normal,
    ease: EASING.bounce,
  },
} as const;

// Layout animation configuration
export const LAYOUT_ANIMATION = {
  duration: ANIMATION_DURATION.normal,
  ease: EASING.easeInOut,
} as const;

// Stagger animation for lists
export const STAGGER_CONFIG = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
} as const;

// Utility function to create responsive animations
export const createResponsiveAnimation = (
  mobile: any,
  _desktop: any,
  _breakpoint: number = 768
) => {
  return {
    initial: mobile.initial,
    animate: mobile.animate,
    exit: mobile.exit,
    transition: {
      ...mobile.transition,
      // Add responsive behavior if needed
    },
  };
};

// Utility function to create reduced motion variants
export const createReducedMotionVariant = (variant: any) => ({
  ...variant,
  transition: {
    ...variant.transition,
    duration: 0.01, // Instant for reduced motion
  },
});

// Common animation props for consistency
export const COMMON_ANIMATION_PROPS = {
  initial: "initial",
  animate: "animate",
  exit: "exit",
  transition: TRANSITIONS.normal,
} as const;

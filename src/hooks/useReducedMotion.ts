import { useState, useEffect } from 'react';

/**
 * Hook to detect if the user prefers reduced motion
 * Respects the prefers-reduced-motion CSS media query
 */
export const useReducedMotion = (): boolean => {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);

  useEffect(() => {
    // Check if the browser supports the media query
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Set initial value
    setShouldReduceMotion(mediaQuery.matches);

    // Listen for changes
    const handler = (e: MediaQueryListEvent) => {
      setShouldReduceMotion(e.matches);
    };

    // Add event listener
    mediaQuery.addEventListener('change', handler);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, []);

  return shouldReduceMotion;
};

/**
 * Hook to get animation variants that respect user preferences
 * Returns reduced motion variants when user prefers reduced motion
 */
export const useAccessibleAnimation = () => {
  const shouldReduceMotion = useReducedMotion();

  const getAnimationVariant = (variant: any) => {
    if (shouldReduceMotion) {
      return {
        ...variant,
        transition: {
          ...variant.transition,
          duration: 0.01, // Instant for reduced motion
        },
      };
    }
    return variant;
  };

  const getTransition = (transition: any) => {
    if (shouldReduceMotion) {
      return {
        ...transition,
        duration: 0.01,
      };
    }
    return transition;
  };

  return {
    shouldReduceMotion,
    getAnimationVariant,
    getTransition,
  };
};

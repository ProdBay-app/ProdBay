import { useCallback, useEffect, useRef } from 'react';

/**
 * Custom hook that returns a debounced version of a callback function
 * 
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds (default: 800ms)
 * @returns A debounced version of the callback
 * 
 * @example
 * const debouncedSave = useDebouncedCallback((data) => {
 *   saveToDatabase(data);
 * }, 800);
 * 
 * // Call it normally - it will only execute after 800ms of inactivity
 * debouncedSave(formData);
 */
export const useDebouncedCallback = <T extends (...args: any[]) => void>(
  callback: T,
  delay: number = 800
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  return debouncedCallback;
};

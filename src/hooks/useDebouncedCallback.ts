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
  // Store the latest callback in a ref to avoid stale closures
  const callbackRef = useRef<T>(callback);

  // Always update the ref to the latest callback
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

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

      // Set new timeout - always use the latest callback from the ref
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay] // Only depend on delay, not callback (we use the ref instead)
  ) as T;

  return debouncedCallback;
};

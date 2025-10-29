import { useEffect } from 'react';

/**
 * Custom hook to handle Escape key press for closing modals
 * 
 * @param isOpen - Whether the modal is currently open
 * @param onClose - Function to call when Escape key is pressed
 * @param disabled - Optional flag to disable the escape key functionality
 */
export const useEscapeKey = (
  isOpen: boolean,
  onClose: () => void,
  disabled: boolean = false
) => {
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !disabled) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose, disabled]);
};

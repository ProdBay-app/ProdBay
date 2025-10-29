import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useEscapeKey } from '@/hooks/useEscapeKey';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isConfirming: boolean;
  variant?: 'danger' | 'warning' | 'info';
}

/**
 * ConfirmationModal - Generic, reusable modal for confirming destructive actions
 * 
 * Features:
 * - Highly reusable for any confirmation scenario
 * - Visual variants (danger, warning, info)
 * - Loading state during confirmation
 * - Prevents accidental actions with clear messaging
 * - Accessible with proper ARIA labels
 * - Prevents backdrop click during confirmation
 */
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isConfirming,
  variant = 'danger'
}) => {
  // Get colors based on variant
  const getVariantColors = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: 'text-red-600',
          iconBg: 'bg-red-100',
          button: 'bg-red-600 hover:bg-red-700',
          border: 'border-red-200'
        };
      case 'warning':
        return {
          icon: 'text-amber-600',
          iconBg: 'bg-amber-100',
          button: 'bg-amber-600 hover:bg-amber-700',
          border: 'border-amber-200'
        };
      case 'info':
        return {
          icon: 'text-blue-600',
          iconBg: 'bg-blue-100',
          button: 'bg-blue-600 hover:bg-blue-700',
          border: 'border-blue-200'
        };
      default:
        return {
          icon: 'text-red-600',
          iconBg: 'bg-red-100',
          button: 'bg-red-600 hover:bg-red-700',
          border: 'border-red-200'
        };
    }
  };

  const colors = getVariantColors();

  // Handle Escape key to close modal
  useEscapeKey(isOpen, onCancel, isConfirming);

  // Handle backdrop click - only allow closing if not confirming
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isConfirming) {
      onCancel();
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        {/* Header with close button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Warning Icon */}
          <div className="flex justify-center mb-4">
            <div className={`${colors.iconBg} rounded-full p-3`}>
              <AlertTriangle className={`w-8 h-8 ${colors.icon}`} />
            </div>
          </div>

          {/* Message */}
          <p className="text-gray-700 text-center leading-relaxed mb-6">
            {message}
          </p>

          {/* Warning Box for Danger Variant */}
          {variant === 'danger' && (
            <div className={`border ${colors.border} bg-red-50 rounded-lg p-3 mb-6`}>
              <p className="text-sm text-red-800 text-center">
                <span className="font-semibold">Warning:</span> This action cannot be undone.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isConfirming}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isConfirming}
              className={`flex-1 px-4 py-2.5 rounded-lg ${colors.button} text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {isConfirming ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  {variant === 'danger' ? 'Deleting...' : 'Confirming...'}
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;


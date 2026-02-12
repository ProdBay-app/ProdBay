import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'teal';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
}

/**
 * Button - Standardized, reusable button component
 * 
 * Features:
 * - Consistent styling across all button instances
 * - Multiple variants for different use cases
 * - Size options for different contexts
 * - Loading state with spinner
 * - Icon support
 * - Accessibility features
 * - TypeScript support with full IntelliSense
 * 
 * Variants:
 * - primary: Solid background with white text (for main actions)
 * - secondary: Light background with colored text (for secondary actions)
 * - outline: Transparent background with border (for filters, toggles)
 * - ghost: Transparent background, no border (for subtle actions)
 * - teal: Teal-themed secondary button (for download actions)
 * 
 * Sizes:
 * - sm: Small buttons (px-2 py-1, text-xs)
 * - md: Medium buttons (px-3 py-2, text-sm) - default
 * - lg: Large buttons (px-4 py-3, text-base)
 */
const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  onClick,
  className = '',
  type = 'button',
  title
}) => {
  // Base styles that are consistent across all variants and sizes
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-wedding transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  // Size-based styles
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'md':
        return 'px-3 py-2 text-sm';
      case 'lg':
        return 'px-4 py-3 text-base';
      default:
        return 'px-3 py-2 text-sm';
    }
  };

  // Variant-based styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-wedding-primary text-white hover:bg-wedding-primary-hover focus:ring-wedding-primary shadow-wedding';
      case 'secondary':
        return 'bg-wedding-secondary text-wedding-slate hover:bg-wedding-secondary/80 focus:ring-wedding-primary';
      case 'outline':
        return 'bg-white border border-wedding-secondary text-wedding-slate hover:bg-wedding-neutral focus:ring-wedding-primary';
      case 'ghost':
        return 'bg-transparent text-wedding-slate hover:bg-wedding-secondary/50 focus:ring-wedding-primary';
      case 'teal':
        return 'bg-wedding-primary/20 text-wedding-slate hover:bg-wedding-primary/30 focus:ring-wedding-primary';
      default:
        return 'bg-wedding-primary text-white hover:bg-wedding-primary-hover focus:ring-wedding-primary shadow-wedding';
    }
  };

  // Combine all styles
  const buttonStyles = `${baseStyles} ${getSizeStyles()} ${getVariantStyles()} ${className}`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={buttonStyles}
      title={title}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!loading && icon && <span className="flex-shrink-0">{icon}</span>}
      <span className={loading ? 'opacity-0' : ''}>{children}</span>
    </button>
  );
};

export default Button;

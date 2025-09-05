import React from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

// Common status badge component
export const StatusBadge: React.FC<{ status: string; className?: string }> = ({ 
  status, 
  className = '' 
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Accepted':
      case 'Approved':
      case 'Completed':
      case 'Delivered':
        return {
          className: 'bg-green-100 text-green-800',
          icon: CheckCircle,
          iconClassName: 'text-green-500'
        };
      case 'Rejected':
      case 'Cancelled':
        return {
          className: 'bg-red-100 text-red-800',
          icon: XCircle,
          iconClassName: 'text-red-500'
        };
      case 'Submitted':
      case 'Pending':
      case 'New':
        return {
          className: 'bg-yellow-100 text-yellow-800',
          icon: Clock,
          iconClassName: 'text-yellow-500'
        };
      case 'In Progress':
      case 'Quoting':
      case 'In Production':
        return {
          className: 'bg-blue-100 text-blue-800',
          icon: Clock,
          iconClassName: 'text-blue-500'
        };
      default:
        return {
          className: 'bg-gray-100 text-gray-800',
          icon: Clock,
          iconClassName: 'text-gray-500'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${config.className} ${className}`}>
      <Icon className={`h-3 w-3 ${config.iconClassName}`} />
      <span>{status}</span>
    </span>
  );
};

// Note: LoadingSpinner component has been moved to its own file: components/LoadingSpinner.tsx

// Common error message component
export const ErrorMessage: React.FC<{ message: string; className?: string }> = ({ 
  message, 
  className = '' 
}) => (
  <div className={`bg-red-50 border border-red-200 rounded-md p-4 ${className}`}>
    <div className="flex">
      <XCircle className="h-5 w-5 text-red-400" />
      <div className="ml-3">
        <p className="text-sm text-red-800">{message}</p>
      </div>
    </div>
  </div>
);

// Common success message component
export const SuccessMessage: React.FC<{ message: string; className?: string }> = ({ 
  message, 
  className = '' 
}) => (
  <div className={`bg-green-50 border border-green-200 rounded-md p-4 ${className}`}>
    <div className="flex">
      <CheckCircle className="h-5 w-5 text-green-400" />
      <div className="ml-3">
        <p className="text-sm text-green-800">{message}</p>
      </div>
    </div>
  </div>
);

// Common card component
export const Card: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}> = ({ 
  children, 
  className = '', 
  padding = 'md' 
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
};

// Common button variants
export const Button: React.FC<{
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  onClick,
  type = 'button'
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const disabledClasses = disabled || loading ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-white mr-2" />}
      {children}
    </button>
  );
};

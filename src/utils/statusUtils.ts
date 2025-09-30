/**
 * Centralized status utility functions
 * Provides consistent status handling across the application
 */

export interface StatusIconProps {
  icon: string;
  className: string;
}

/**
 * Get icon properties for a given status
 */
export const getStatusIconProps = (status: string): StatusIconProps => {
  switch (status) {
    case 'Completed':
    case 'Delivered':
    case 'Approved':
      return { icon: 'CheckCircle', className: 'h-5 w-5 text-green-500' };
    case 'In Progress':
    case 'In Production':
    case 'Quoting':
      return { icon: 'Clock', className: 'h-5 w-5 text-yellow-500' };
    case 'Cancelled':
      return { icon: 'XCircle', className: 'h-5 w-5 text-red-500' };
    default:
      return { icon: 'AlertCircle', className: 'h-5 w-5 text-gray-500' };
  }
};

/**
 * Get CSS classes for status styling
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Completed':
    case 'Delivered':
    case 'Approved':
      return 'bg-green-100 text-green-800';
    case 'In Progress':
    case 'In Production':
    case 'Quoting':
      return 'bg-yellow-100 text-yellow-800';
    case 'Cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get status priority for sorting (lower number = higher priority)
 */
export const getStatusPriority = (status: string): number => {
  switch (status) {
    case 'In Progress':
    case 'In Production':
      return 1;
    case 'Quoting':
      return 2;
    case 'Pending':
      return 3;
    case 'Approved':
      return 4;
    case 'Completed':
    case 'Delivered':
      return 5;
    case 'Cancelled':
      return 6;
    default:
      return 7;
  }
};

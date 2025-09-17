import React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, MessageSquare } from 'lucide-react';
import { NotificationItem as NotificationItemType } from '../../types/notification';

interface NotificationItemProps {
  notification: NotificationItemType;
  onRemove: (id: string) => void;
}

const getNotificationStyles = (type: string) => {
  switch (type) {
    case 'success':
      return {
        container: 'bg-green-50 border-green-200 text-green-800',
        icon: 'text-green-600',
        iconComponent: CheckCircle,
      };
    case 'error':
      return {
        container: 'bg-red-50 border-red-200 text-red-800',
        icon: 'text-red-600',
        iconComponent: AlertCircle,
      };
    case 'warning':
      return {
        container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        icon: 'text-yellow-600',
        iconComponent: AlertTriangle,
      };
    case 'info':
      return {
        container: 'bg-blue-50 border-blue-200 text-blue-800',
        icon: 'text-blue-600',
        iconComponent: Info,
      };
    case 'confirm':
      return {
        container: 'bg-gray-50 border-gray-200 text-gray-800',
        icon: 'text-gray-600',
        iconComponent: MessageSquare,
      };
    default:
      return {
        container: 'bg-gray-50 border-gray-200 text-gray-800',
        icon: 'text-gray-600',
        iconComponent: Info,
      };
  }
};

const getButtonStyles = (variant?: string) => {
  switch (variant) {
    case 'primary':
      return 'bg-teal-600 text-white hover:bg-teal-700';
    case 'danger':
      return 'bg-red-600 text-white hover:bg-red-700';
    case 'secondary':
      return 'bg-gray-200 text-gray-800 hover:bg-gray-300';
    default:
      return 'bg-teal-600 text-white hover:bg-teal-700';
  }
};

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onRemove }) => {
  const styles = getNotificationStyles(notification.type);
  const IconComponent = styles.iconComponent;

  return (
    <div
      className={`
        relative max-w-sm w-full bg-white shadow-lg rounded-lg border-l-4 border-t border-r border-b
        ${styles.container}
        transform transition-all duration-300 ease-in-out
        animate-in slide-in-from-right-full
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <IconComponent className={`h-5 w-5 ${styles.icon}`} aria-hidden="true" />
          </div>
          <div className="ml-3 w-0 flex-1">
            {notification.title && (
              <p className="text-sm font-medium mb-1">{notification.title}</p>
            )}
            <p className="text-sm">{notification.message}</p>
            
            {notification.actions && notification.actions.length > 0 && (
              <div className="mt-3 flex space-x-2">
                {notification.actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className={`
                      px-3 py-1 text-xs font-medium rounded-md transition-colors
                      ${getButtonStyles(action.variant)}
                    `}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              onClick={() => onRemove(notification.id)}
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

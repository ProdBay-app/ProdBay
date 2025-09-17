import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { NotificationContextType, NotificationItem, NotificationConfig, NotificationOptions, ConfirmConfig } from '../types/notification';
import { NotificationContainer } from '../components/notifications/NotificationContainer';
import { v4 as uuidv4 } from 'uuid';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [confirmResolvers, setConfirmResolvers] = useState<Map<string, (value: boolean) => void>>(new Map());

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const showNotification = useCallback((config: NotificationConfig) => {
    const id = config.id || uuidv4();
    const notification: NotificationItem = {
      ...config,
      id,
      timestamp: Date.now(),
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-remove notification after duration (default 5 seconds)
    const duration = config.duration || 5000;
    if (!config.persistent && duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  }, [removeNotification]);

  const showSuccess = useCallback((message: string, options?: NotificationOptions) => {
    showNotification({
      type: 'success',
      message,
      ...options,
    });
  }, [showNotification]);

  const showError = useCallback((message: string, options?: NotificationOptions) => {
    showNotification({
      type: 'error',
      message,
      duration: 7000, // Longer duration for errors
      ...options,
    });
  }, [showNotification]);

  const showWarning = useCallback((message: string, options?: NotificationOptions) => {
    showNotification({
      type: 'warning',
      message,
      duration: 6000,
      ...options,
    });
  }, [showNotification]);

  const showInfo = useCallback((message: string, options?: NotificationOptions) => {
    showNotification({
      type: 'info',
      message,
      ...options,
    });
  }, [showNotification]);

  const showConfirm = useCallback((config: ConfirmConfig): Promise<boolean> => {
    return new Promise((resolve) => {
      const id = uuidv4();
      
      // Store the resolver
      setConfirmResolvers(prev => new Map(prev).set(id, resolve));

      showNotification({
        id,
        type: 'confirm',
        title: config.title,
        message: config.message,
        persistent: true,
        actions: [
          {
            label: config.cancelText || 'Cancel',
            action: () => {
              const resolver = confirmResolvers.get(id);
              if (resolver) {
                resolver(false);
                setConfirmResolvers(prev => {
                  const newMap = new Map(prev);
                  newMap.delete(id);
                  return newMap;
                });
              }
              removeNotification(id);
            },
            variant: 'secondary',
          },
          {
            label: config.confirmText || 'Confirm',
            action: () => {
              const resolver = confirmResolvers.get(id);
              if (resolver) {
                resolver(true);
                setConfirmResolvers(prev => {
                  const newMap = new Map(prev);
                  newMap.delete(id);
                  return newMap;
                });
              }
              removeNotification(id);
            },
            variant: config.variant === 'danger' ? 'danger' : 'primary',
          },
        ],
      });
    });
  }, [showNotification, removeNotification, confirmResolvers]);

  const contextValue: NotificationContextType = {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    removeNotification,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  );
};


export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

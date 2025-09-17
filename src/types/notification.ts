export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface NotificationOptions {
  duration?: number;
  actions?: NotificationAction[];
  onClose?: () => void;
  persistent?: boolean;
}

export interface NotificationConfig {
  id?: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number;
  actions?: NotificationAction[];
  onClose?: () => void;
  persistent?: boolean;
}

export interface ConfirmConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export interface NotificationItem extends NotificationConfig {
  id: string;
  timestamp: number;
}

export interface NotificationContextType {
  showNotification: (notification: NotificationConfig) => void;
  showSuccess: (message: string, options?: NotificationOptions) => void;
  showError: (message: string, options?: NotificationOptions) => void;
  showWarning: (message: string, options?: NotificationOptions) => void;
  showInfo: (message: string, options?: NotificationOptions) => void;
  showConfirm: (config: ConfirmConfig) => Promise<boolean>;
  removeNotification: (id: string) => void;
}

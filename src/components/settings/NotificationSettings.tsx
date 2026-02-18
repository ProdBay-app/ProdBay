import React from 'react';
import SettingsSection from './SettingsSection';

/**
 * Placeholder for Notification settings.
 * Will be expanded with Marketing Emails, Security Alerts, Product Updates toggles.
 */
const NotificationSettings: React.FC = () => (
  <SettingsSection
    title="Notifications"
    description="Manage your email and in-app notifications."
  >
    <p className="text-gray-400 text-sm">Notification preferences coming soon.</p>
  </SettingsSection>
);

export default NotificationSettings;

import React from 'react';
import { User, Palette, Bell, CreditCard } from 'lucide-react';
import SettingsLayout, { SettingsTab } from '@/components/settings/SettingsLayout';
import ProfileSettings from '@/components/settings/ProfileSettings';
import AppearanceSettings from '@/components/settings/AppearanceSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import BillingSettings from '@/components/settings/BillingSettings';

const settingsTabs: SettingsTab[] = [
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    content: <ProfileSettings />,
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: Palette,
    content: <AppearanceSettings />,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    content: <NotificationSettings />,
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: CreditCard,
    content: <BillingSettings />,
  },
];

const ProducerSettings: React.FC = () => (
  <SettingsLayout tabs={settingsTabs} defaultTab="profile" />
);

export default ProducerSettings;

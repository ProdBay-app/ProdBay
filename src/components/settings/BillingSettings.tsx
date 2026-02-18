import React from 'react';
import SettingsSection from './SettingsSection';

/**
 * Placeholder for Billing settings (demo view).
 * Will be expanded with plan card, invoices, payment history.
 */
const BillingSettings: React.FC = () => (
  <SettingsSection
    title="Billing"
    description="Manage your subscription and payment history."
  >
    <p className="text-gray-400 text-sm">Billing and invoices coming soon.</p>
  </SettingsSection>
);

export default BillingSettings;

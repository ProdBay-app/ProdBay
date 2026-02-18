import React from 'react';
import SettingsSection from './SettingsSection';

/**
 * Placeholder for Appearance settings (theme, density).
 * Will be expanded with theme selection and font size toggles.
 */
const AppearanceSettings: React.FC = () => (
  <SettingsSection
    title="Appearance"
    description="Customize how the app looks and feels."
  >
    <p className="text-gray-400 text-sm">Theme and density options coming soon.</p>
  </SettingsSection>
);

export default AppearanceSettings;

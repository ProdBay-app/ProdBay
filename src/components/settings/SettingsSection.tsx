import React from 'react';

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Reusable section wrapper for settings pages.
 * Provides consistent card styling with glassmorphism.
 */
const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  description,
  children,
  className = '',
}) => (
  <section
    className={`bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-sm overflow-hidden transition-all duration-200 hover:border-white/30 ${className}`}
  >
    <div className="p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-gray-300">{description}</p>
        )}
      </div>
      {children}
    </div>
  </section>
);

export default SettingsSection;

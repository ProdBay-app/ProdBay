import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

export type SettingsTabId = 'profile' | 'appearance' | 'notifications' | 'billing';

export interface SettingsTab {
  id: SettingsTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
}

interface SettingsLayoutProps {
  tabs: SettingsTab[];
  defaultTab?: SettingsTabId;
}

/**
 * Settings page layout with vertical sidebar navigation and content area.
 * Handles tab switching with smooth transitions.
 */
const SettingsLayout: React.FC<SettingsLayoutProps> = ({
  tabs,
  defaultTab = 'profile',
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTabId>(defaultTab);

  const activeTabContent = tabs.find((t) => t.id === activeTab)?.content;

  return (
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <div className="bg-transparent border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-white drop-shadow-md">
            Settings
          </h1>
          <p className="text-gray-200 mt-1">
            Manage your account and preferences.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <nav
            className="lg:w-56 flex-shrink-0"
            aria-label="Settings sections"
          >
            <ul className="space-y-1 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-2">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;

                return (
                  <li key={tab.id}>
                    <button
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left
                        font-medium transition-all duration-200
                        ${
                          isActive
                            ? 'bg-teal-600/80 text-white shadow-md'
                            : 'text-gray-200 hover:bg-white/10 hover:text-white'
                        }
                      `}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="flex-1">{tab.label}</span>
                      <ChevronRight
                        className={`w-4 h-4 flex-shrink-0 transition-transform ${
                          isActive ? 'opacity-100' : 'opacity-50'
                        }`}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="w-full"
              >
                {activeTabContent}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsLayout;

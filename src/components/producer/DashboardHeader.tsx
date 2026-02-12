import React from 'react';
import { Plus } from 'lucide-react';

interface DashboardHeaderProps {
  onCreateProject: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onCreateProject }) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Planner Dashboard</h1>
        <p className="text-gray-600 mt-1">Plan weddings and coordinate vendors</p>
      </div>
      <button
        onClick={onCreateProject}
        className="flex items-center space-x-2 px-4 py-2 bg-wedding-primary text-white rounded hover:bg-wedding-primary-hover"
      >
        <Plus className="h-4 w-4" />
        <span>New Wedding</span>
      </button>
    </div>
  );
};

export default DashboardHeader;

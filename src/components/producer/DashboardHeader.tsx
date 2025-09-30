import React from 'react';
import { Plus } from 'lucide-react';

interface DashboardHeaderProps {
  onCreateProject: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onCreateProject }) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Producer Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage projects and coordinate suppliers</p>
      </div>
      <button
        onClick={onCreateProject}
        className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
      >
        <Plus className="h-4 w-4" />
        <span>New Project</span>
      </button>
    </div>
  );
};

export default DashboardHeader;

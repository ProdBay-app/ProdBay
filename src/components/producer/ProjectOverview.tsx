import React from 'react';
import { Package, DollarSign, Clock, Pencil, Trash } from 'lucide-react';
import type { Project, Asset } from '../../lib/supabase';

interface ProjectOverviewProps {
  project: Project;
  assets: Asset[];
  onEdit: () => void;
  onDelete: () => void;
  getStatusColor: (status: string) => string;
}

const ProjectOverview: React.FC<ProjectOverviewProps> = ({
  project,
  assets,
  onEdit,
  onDelete,
  getStatusColor
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{project.project_name}</h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.project_status)}`}>
          {project.project_status}
        </span>
      </div>
      <div className="flex items-center space-x-2 mb-4">
        <button
          onClick={onEdit}
          className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 text-sm"
        >
          <Pencil className="h-4 w-4" />
          <span>Edit</span>
        </button>
        <button
          onClick={onDelete}
          className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
        >
          <Trash className="h-4 w-4" />
          <span>Delete</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <Package className="h-5 w-5 text-gray-500" />
          <span className="text-sm text-gray-600">
            {assets.length} Assets
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <DollarSign className="h-5 w-5 text-gray-500" />
          <span className="text-sm text-gray-600">
            Budget: ${project.financial_parameters?.toFixed(2) || '0.00'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-gray-500" />
          <span className="text-sm text-gray-600">
            Due: {project.timeline_deadline 
              ? new Date(project.timeline_deadline).toLocaleDateString()
              : 'Not set'
            }
          </span>
        </div>
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-2">Project Brief</h3>
        <p className="text-gray-700 text-sm whitespace-pre-wrap">{project.brief_description}</p>
      </div>
    </div>
  );
};

export default ProjectOverview;

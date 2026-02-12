import React from 'react';
import type { Project } from '@/lib/supabase';

interface ProjectListProps {
  projects: Project[];
  selectedProject: Project | null;
  onProjectSelect: (project: Project) => void;
  getStatusColor: (status: string) => string;
}

const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  selectedProject,
  onProjectSelect,
  getStatusColor
}) => {
  return (
    <div className="lg:col-span-1">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Upcoming Weddings</h2>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => onProjectSelect(project)}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                selectedProject?.id === project.id
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900 truncate">
                  {project.project_name}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.project_status)}`}>
                  {project.project_status}
                </span>
              </div>
              <p className="text-sm text-gray-600">{project.client_name}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(project.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectList;

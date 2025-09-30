import React from 'react';
import { BarChart3, Clock, DollarSign, Package, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import type { Project, Asset, Quote } from '../../lib/supabase';

export interface ClientDashboardProps {
  // Data state
  projects: Project[];
  selectedProject: Project | null;
  assets: Asset[];
  quotes: Quote[];
  loading: boolean;
  
  // Calculated values
  totalCost: number;
  progressPercentage: number;
  
  // Utility functions
  getStatusIconProps: (status: string) => { icon: string; className: string };
  getStatusColor: (status: string) => string;
  getAcceptedQuoteForAsset: (assetId: string) => Quote | undefined;
  
  // Actions
  selectProject: (project: Project) => Promise<void>;
  refreshProjects: () => Promise<void>;
}

const ClientDashboard: React.FC<ClientDashboardProps> = ({
  projects,
  selectedProject,
  assets,
  quotes,
  loading,
  totalCost,
  progressPercentage,
  getStatusIconProps,
  getStatusColor,
  getAcceptedQuoteForAsset,
  selectProject
}) => {

  // Helper function to render status icons
  const renderStatusIcon = (status: string) => {
    const { icon, className } = getStatusIconProps(status);
    const iconMap = { CheckCircle, Clock, AlertCircle, XCircle };
    const IconComponent = iconMap[icon as keyof typeof iconMap];
    return <IconComponent className={className} />;
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor your project progress and costs</p>
        </div>
      </div>

      {/* Project Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Your Projects</h2>
        <div className="space-y-3">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => selectProject(project)}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                selectedProject?.id === project.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{project.project_name}</h3>
                  <p className="text-sm text-gray-600">{project.client_name}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {renderStatusIcon(project.project_status)}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.project_status)}`}>
                    {project.project_status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedProject && (
        <>
          {/* Project Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold">Progress</h3>
                  <p className="text-2xl font-bold text-blue-600">{progressPercentage}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold">Assets</h3>
                  <p className="text-2xl font-bold text-green-600">{assets.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold">Total Cost</h3>
                  <p className="text-2xl font-bold text-purple-600">
                    ${totalCost.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold">Deadline</h3>
                  <p className="text-sm font-medium text-orange-600">
                    {selectedProject.timeline_deadline 
                      ? new Date(selectedProject.timeline_deadline).toLocaleDateString()
                      : 'Not set'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Project Brief */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Project Brief</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{selectedProject.brief_description}</p>
            {selectedProject.physical_parameters && (
              <div className="mt-4">
                <h3 className="font-medium text-gray-900 mb-2">Physical Parameters</h3>
                <p className="text-gray-600">{selectedProject.physical_parameters}</p>
              </div>
            )}
          </div>

          {/* Asset Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Asset Status</h2>
            <div className="space-y-4">
              {assets.map((asset) => (
                <div key={asset.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">{asset.asset_name}</h3>
                    <div className="flex items-center space-x-2">
                      {renderStatusIcon(asset.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(asset.status)}`}>
                        {asset.status}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3">{asset.specifications}</p>
                  
                  {asset.assigned_supplier && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Assigned to:</span>
                      <span className="ml-2 text-blue-600">{asset.assigned_supplier.supplier_name}</span>
                    </div>
                  )}
                  
                  {/* Show accepted quote cost */}
                  {(() => {
                    const acceptedQuote = getAcceptedQuoteForAsset(asset.id);
                    return acceptedQuote ? (
                      <div className="text-sm mt-2">
                        <span className="font-medium text-gray-700">Cost:</span>
                        <span className="ml-2 text-green-600 font-semibold">
                          ${acceptedQuote.cost.toFixed(2)}
                        </span>
                      </div>
                    ) : null;
                  })()}
                </div>
              ))}
            </div>
          </div>

          {/* Producer Notes Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Producer Notes</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 italic">
                Project is being processed. Your assigned producer will update this section with progress notes and any important updates.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ClientDashboard;
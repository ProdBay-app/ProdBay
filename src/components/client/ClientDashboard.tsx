import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Project, Asset, Quote } from '../../lib/supabase';
import { BarChart3, Clock, DollarSign, Package, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

const ClientDashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedProjectId = searchParams.get('project');

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId && projects.length > 0) {
      const project = projects.find(p => p.id === selectedProjectId);
      if (project) {
        setSelectedProject(project);
        loadProjectDetails(selectedProjectId);
      }
    } else if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0]);
      loadProjectDetails(projects[0].id);
    }
  }, [selectedProjectId, projects]);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectDetails = async (projectId: string) => {
    try {
      // Load assets with assigned suppliers
      const { data: assetsData } = await supabase
        .from('assets')
        .select(`
          *,
          assigned_supplier:suppliers(*)
        `)
        .eq('project_id', projectId);

      setAssets(assetsData || []);

      // Load quotes for all assets in this project
      if (assetsData && assetsData.length > 0) {
        const assetIds = assetsData.map(asset => asset.id);
        const { data: quotesData } = await supabase
          .from('quotes')
          .select(`
            *,
            supplier:suppliers(*),
            asset:assets(*)
          `)
          .in('asset_id', assetIds);

        setQuotes(quotesData || []);
      }
    } catch (error) {
      console.error('Error loading project details:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Delivered':
      case 'Approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'In Progress':
      case 'In Production':
      case 'Quoting':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'Cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Delivered':
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
      case 'In Production':
      case 'Quoting':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateTotalCost = () => {
    return quotes
      .filter(quote => quote.status === 'Accepted')
      .reduce((total, quote) => total + (quote.cost || 0), 0);
  };

  const getProgressPercentage = () => {
    if (assets.length === 0) return 0;
    const completedAssets = assets.filter(asset => asset.status === 'Delivered').length;
    return Math.round((completedAssets / assets.length) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
              onClick={() => {
                setSelectedProject(project);
                loadProjectDetails(project.id);
              }}
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
                  {getStatusIcon(project.project_status)}
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
                  <p className="text-2xl font-bold text-blue-600">{getProgressPercentage()}%</p>
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
                    ${calculateTotalCost().toFixed(2)}
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
                      {getStatusIcon(asset.status)}
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
                    const acceptedQuote = quotes.find(
                      q => q.asset_id === asset.id && q.status === 'Accepted'
                    );
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
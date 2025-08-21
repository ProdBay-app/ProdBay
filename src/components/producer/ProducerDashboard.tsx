import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AutomationService } from '../../services/automationService';
import type { Project, Asset, Quote } from '../../lib/supabase';
import { 
  BarChart3, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Package, 
  DollarSign,
  Mail,
  Eye
} from 'lucide-react';

const ProducerDashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadProjectDetails(selectedProject.id);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const projectsData = data || [];
      setProjects(projectsData);
      
      if (projectsData.length > 0 && !selectedProject) {
        setSelectedProject(projectsData[0]);
      }
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

  const handleSendToSuppliers = async (asset: Asset) => {
    try {
      await AutomationService.sendQuoteRequestsForAsset(asset);
      await loadProjectDetails(selectedProject!.id);
      alert(`Quote requests sent for ${asset.asset_name}`);
    } catch (error) {
      console.error('Error sending to suppliers:', error);
      alert('Failed to send quote requests');
    }
  };

  const handleAcceptQuote = async (quoteId: string) => {
    try {
      await AutomationService.acceptQuote(quoteId);
      await loadProjectDetails(selectedProject!.id);
      await AutomationService.updateProjectStatus(selectedProject!.id);
      await loadProjects(); // Refresh project status
      alert('Quote accepted successfully');
    } catch (error) {
      console.error('Error accepting quote:', error);
      alert('Failed to accept quote');
    }
  };

  const handleRejectQuote = async (quoteId: string) => {
    try {
      await supabase
        .from('quotes')
        .update({ status: 'Rejected' })
        .eq('id', quoteId);
      
      await loadProjectDetails(selectedProject!.id);
      alert('Quote rejected');
    } catch (error) {
      console.error('Error rejecting quote:', error);
      alert('Failed to reject quote');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Delivered':
      case 'Approved':
      case 'Accepted':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
      case 'In Production':
      case 'Quoting':
      case 'Submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled':
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAssetQuotes = (assetId: string) => {
    return quotes.filter(quote => quote.asset_id === assetId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Producer Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage projects and coordinate suppliers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Active Projects</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
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

        {/* Project Details */}
        <div className="lg:col-span-2">
          {selectedProject ? (
            <div className="space-y-6">
              {/* Project Overview */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">{selectedProject.project_name}</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedProject.project_status)}`}>
                    {selectedProject.project_status}
                  </span>
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
                      Budget: ${selectedProject.financial_parameters?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Due: {selectedProject.timeline_deadline 
                        ? new Date(selectedProject.timeline_deadline).toLocaleDateString()
                        : 'Not set'
                      }
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Project Brief</h3>
                  <p className="text-gray-700 text-sm">{selectedProject.brief_description}</p>
                </div>
              </div>

              {/* Asset Management */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Asset Management</h2>
                <div className="space-y-6">
                  {assets.map((asset) => {
                    const assetQuotes = getAssetQuotes(asset.id);
                    const acceptedQuote = assetQuotes.find(q => q.status === 'Accepted');
                    
                    return (
                      <div key={asset.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-medium text-gray-900">{asset.asset_name}</h3>
                            <p className="text-sm text-gray-600">{asset.specifications}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(asset.status)}`}>
                              {asset.status}
                            </span>
                            {asset.status === 'Pending' && (
                              <button
                                onClick={() => handleSendToSuppliers(asset)}
                                className="flex items-center space-x-1 px-3 py-1 bg-teal-600 text-white rounded text-sm hover:bg-teal-700"
                              >
                                <Mail className="h-3 w-3" />
                                <span>Send to Suppliers</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Quotes for this asset */}
                        {assetQuotes.length > 0 && (
                          <div className="mt-4 bg-gray-50 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-3">
                              Quotes ({assetQuotes.length})
                            </h4>
                            <div className="space-y-3">
                              {assetQuotes.map((quote) => (
                                <div key={quote.id} className="bg-white rounded p-3 border">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium text-gray-900">
                                        {quote.supplier?.supplier_name}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        {quote.supplier?.contact_email}
                                      </p>
                                      <p className="text-lg font-semibold text-green-600 mt-1">
                                        ${quote.cost.toFixed(2)}
                                      </p>
                                      {quote.notes_capacity && (
                                        <p className="text-sm text-gray-700 mt-1">
                                          {quote.notes_capacity}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                                        {quote.status}
                                      </span>
                                      {quote.status === 'Submitted' && (
                                        <div className="flex space-x-1">
                                          <button
                                            onClick={() => handleAcceptQuote(quote.id)}
                                            className="p-1 bg-green-600 text-white rounded hover:bg-green-700"
                                            title="Accept Quote"
                                          >
                                            <CheckCircle className="h-4 w-4" />
                                          </button>
                                          <button
                                            onClick={() => handleRejectQuote(quote.id)}
                                            className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                                            title="Reject Quote"
                                          >
                                            <XCircle className="h-4 w-4" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {asset.assigned_supplier && acceptedQuote && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-sm font-medium text-green-800">
                              Assigned to: {asset.assigned_supplier.supplier_name}
                            </p>
                            <p className="text-sm text-green-700">
                              Accepted Cost: ${acceptedQuote.cost.toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Project</h3>
              <p className="text-gray-600">Choose a project from the list to view details and manage assets</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProducerDashboard;
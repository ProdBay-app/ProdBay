import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AutomationService } from '../../services/automationService';
import { RailwayApiService } from '../../services/railwayApiService';
import type { Project, Asset, Quote, Supplier } from '../../lib/supabase';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Package, 
  DollarSign,
  Mail,
  Eye,
  Plus,
  Pencil,
  Trash
} from 'lucide-react';

const ProducerDashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);
  const [projectForm, setProjectForm] = useState({
    project_name: '',
    client_name: '',
    brief_description: '',
    physical_parameters: '',
    financial_parameters: 0 as number | undefined,
    timeline_deadline: ''
  });
  const [autoCreateAssets, setAutoCreateAssets] = useState(true);

  // Asset CRUD state
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [isEditingAsset, setIsEditingAsset] = useState(false);
  const [isSubmittingAsset, setIsSubmittingAsset] = useState(false);
  const [assetForm, setAssetForm] = useState({
    id: '' as string | undefined,
    asset_name: '',
    specifications: '',
    timeline: '',
    status: 'Pending' as Asset['status'],
    assigned_supplier_id: '' as string | undefined
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagSelectionAsset, setTagSelectionAsset] = useState<Asset | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

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
      const projectsData = (data || []) as unknown as Project[];
      setProjects(projectsData);
      
      if (projectsData.length > 0 && !selectedProject) {
        setSelectedProject(projectsData[0] as Project);
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

      setAssets((assetsData || []) as unknown as Asset[]);

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

        setQuotes((quotesData || []) as unknown as Quote[]);
      }
    } catch (error) {
      console.error('Error loading project details:', error);
    }
  };

  const openCreateProject = () => {
    setIsEditingProject(false);
    setProjectForm({
      project_name: '',
      client_name: '',
      brief_description: '',
      physical_parameters: '',
      financial_parameters: undefined,
      timeline_deadline: ''
    });
    setAutoCreateAssets(true);
    setShowProjectModal(true);
  };

  const openEditProject = () => {
    if (!selectedProject) return;
    setIsEditingProject(true);
    setProjectForm({
      project_name: selectedProject.project_name || '',
      client_name: selectedProject.client_name || '',
      brief_description: selectedProject.brief_description || '',
      physical_parameters: selectedProject.physical_parameters || '',
      financial_parameters: selectedProject.financial_parameters,
      timeline_deadline: selectedProject.timeline_deadline || ''
    });
    setAutoCreateAssets(false);
    setShowProjectModal(true);
  };

  const handleProjectInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target as HTMLInputElement;
    setProjectForm(prev => ({
      ...prev,
      [name]: name === 'financial_parameters' ? (value === '' ? undefined : parseFloat(value)) : value
    }));
  };

  const submitProjectForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProject(true);
    try {
      if (isEditingProject && selectedProject) {
        const { error } = await supabase
          .from('projects')
          .update({
            project_name: projectForm.project_name,
            client_name: projectForm.client_name,
            brief_description: projectForm.brief_description,
            physical_parameters: projectForm.physical_parameters,
            financial_parameters: projectForm.financial_parameters ?? null,
            timeline_deadline: projectForm.timeline_deadline || null
          })
          .eq('id', selectedProject.id);
        if (error) throw error;
        await loadProjects();
      } else {
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .insert({
            project_name: projectForm.project_name,
            client_name: projectForm.client_name,
            brief_description: projectForm.brief_description,
            physical_parameters: projectForm.physical_parameters,
            financial_parameters: projectForm.financial_parameters ?? 0,
            timeline_deadline: projectForm.timeline_deadline || null,
            project_status: 'New'
          })
          .select()
          .single();
        if (projectError || !project) throw projectError || new Error('Failed to create project');
        const createdProject = project as unknown as Project;
        if (autoCreateAssets && projectForm.brief_description) {
          // Use Railway API for brief processing
          const briefResult = await RailwayApiService.processBrief(createdProject.id, projectForm.brief_description);
          if (!briefResult.success) {
            console.warn('Brief processing failed:', briefResult.error?.message);
            alert(`Project created successfully, but brief processing failed: ${briefResult.error?.message}. You can manually create assets later.`);
          } else {
            console.log('Brief processed successfully:', briefResult.data?.createdAssets.length, 'assets created');
            alert(`Project created successfully! ${briefResult.data?.createdAssets.length} assets were automatically generated from your brief.`);
          }
        }
        await loadProjects();
        setSelectedProject(createdProject);
      }
      setShowProjectModal(false);
    } catch (err) {
      console.error('Failed to submit project form', err);
      alert('Failed to save project');
    } finally {
      setIsSubmittingProject(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;
    const confirmDelete = window.confirm('Delete this project and all related assets/quotes? This cannot be undone.');
    if (!confirmDelete) return;
    try {
      // Delete quotes -> assets -> project (in case FK cascade not set)
      const { data: assetsToDelete, error: assetsFetchError } = await supabase
        .from('assets')
        .select('id')
        .eq('project_id', selectedProject.id);
      if (assetsFetchError) throw assetsFetchError;
      const assetIds = (assetsToDelete || []).map(a => a.id);
      if (assetIds.length > 0) {
        await supabase
          .from('quotes')
          .delete()
          .in('asset_id', assetIds);
        await supabase
          .from('assets')
          .delete()
          .in('id', assetIds);
      }
      const { error: deleteProjectError } = await supabase
        .from('projects')
        .delete()
        .eq('id', selectedProject.id);
      if (deleteProjectError) throw deleteProjectError;
      await loadProjects();
      setSelectedProject(null);
      setAssets([]);
      setQuotes([]);
    } catch (err) {
      console.error('Failed to delete project', err);
      alert('Failed to delete project');
    }
  };

  const handleSendToSuppliers = async (asset: Asset) => {
    await loadSuppliers();
    setTagSelectionAsset(asset);
    setSelectedTags([]);
    setShowTagModal(true);
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

  const loadSuppliers = async () => {
    try {
      const { data } = await supabase
        .from('suppliers')
        .select('*')
        .order('supplier_name');
      setSuppliers((data || []) as unknown as Supplier[]);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to load suppliers', e);
    }
  };

  const availableTags = Array.from(
    new Set(
      suppliers
        .flatMap(s => (s.service_categories || []).map(t => (t || '').trim()))
        .filter(Boolean)
    )
  ).sort();

  const openCreateAsset = async () => {
    if (!selectedProject) return;
    await loadSuppliers();
    setIsEditingAsset(false);
    setAssetForm({
      id: undefined,
      asset_name: '',
      specifications: '',
      timeline: '',
      status: 'Pending',
      assigned_supplier_id: undefined
    });
    setShowAssetModal(true);
  };

  const openEditAsset = async (asset: Asset) => {
    await loadSuppliers();
    setIsEditingAsset(true);
    setAssetForm({
      id: asset.id,
      asset_name: asset.asset_name,
      specifications: asset.specifications || '',
      timeline: asset.timeline || '',
      status: asset.status,
      assigned_supplier_id: asset.assigned_supplier_id
    });
    setShowAssetModal(true);
  };

  const handleAssetInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target as HTMLInputElement;
    setAssetForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const submitAssetForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    setIsSubmittingAsset(true);
    try {
      if (isEditingAsset && assetForm.id) {
        const { error } = await supabase
          .from('assets')
          .update({
            asset_name: assetForm.asset_name,
            specifications: assetForm.specifications || null,
            timeline: assetForm.timeline || null,
            status: assetForm.status,
            assigned_supplier_id: assetForm.assigned_supplier_id || null
          })
          .eq('id', assetForm.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('assets')
          .insert({
            project_id: selectedProject.id,
            asset_name: assetForm.asset_name,
            specifications: assetForm.specifications || null,
            timeline: assetForm.timeline || null,
            status: assetForm.status,
            assigned_supplier_id: assetForm.assigned_supplier_id || null
          });
        if (error) throw error;
      }
      await loadProjectDetails(selectedProject.id);
      setShowAssetModal(false);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to save asset', err);
      alert('Failed to save asset');
    } finally {
      setIsSubmittingAsset(false);
    }
  };

  const handleDeleteAsset = async (asset: Asset) => {
    const confirmDelete = window.confirm('Delete this asset and any related quotes?');
    if (!confirmDelete) return;
    try {
      await supabase
        .from('quotes')
        .delete()
        .eq('asset_id', asset.id);
      await supabase
        .from('assets')
        .delete()
        .eq('id', asset.id);
      if (selectedProject) {
        await loadProjectDetails(selectedProject.id);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to delete asset', err);
      alert('Failed to delete asset');
    }
  };

  const confirmSendWithTags = async () => {
    if (!tagSelectionAsset || !selectedProject) return;
    try {
      await AutomationService.sendQuoteRequestsForAsset(tagSelectionAsset, selectedTags);
      await loadProjectDetails(selectedProject.id);
      alert(`Quote requests sent for ${tagSelectionAsset.asset_name}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error sending to suppliers:', error);
      alert('Failed to send quote requests');
    } finally {
      setShowTagModal(false);
      setTagSelectionAsset(null);
      setSelectedTags([]);
    }
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
        <button
          onClick={openCreateProject}
          className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </button>
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
                <div className="flex items-center space-x-2 mb-4">
                  <button
                    onClick={openEditProject}
                    className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 text-sm"
                  >
                    <Pencil className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={handleDeleteProject}
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
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Asset Management</h2>
                  <button
                    onClick={openCreateAsset}
                    className="flex items-center space-x-2 px-3 py-1 bg-teal-600 text-white rounded text-sm hover:bg-teal-700"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New Asset</span>
                  </button>
                </div>
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
                            <button
                              onClick={() => openEditAsset(asset)}
                              className="px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAsset(asset)}
                              className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                            >
                              Delete
                            </button>
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

      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
            <div className="mb-4">
              <h3 className="text-xl font-semibold">
                {isEditingProject ? 'Edit Project' : 'Create New Project'}
              </h3>
              <p className="text-gray-600 text-sm">
                {isEditingProject ? 'Update project details and save changes.' : 'Fill in details to create a new project.'}
              </p>
            </div>

            <form onSubmit={submitProjectForm} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
                  <input
                    name="project_name"
                    value={projectForm.project_name}
                    onChange={handleProjectInputChange}
                    required
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label>
                  <input
                    name="client_name"
                    value={projectForm.client_name}
                    onChange={handleProjectInputChange}
                    required
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text.sm font-medium text-gray-700 mb-1">Project Brief *</label>
                <textarea
                  name="brief_description"
                  value={projectForm.brief_description}
                  onChange={handleProjectInputChange}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Physical Parameters</label>
                  <input
                    name="physical_parameters"
                    value={projectForm.physical_parameters}
                    onChange={handleProjectInputChange}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                  <input
                    name="financial_parameters"
                    value={projectForm.financial_parameters ?? ''}
                    onChange={handleProjectInputChange}
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                  <input
                    name="timeline_deadline"
                    value={projectForm.timeline_deadline}
                    onChange={handleProjectInputChange}
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
              </div>

              {!isEditingProject && (
                <label className="inline-flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={autoCreateAssets}
                    onChange={(e) => setAutoCreateAssets(e.target.checked)}
                  />
                  <span>Auto-create assets from brief</span>
                </label>
              )}

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProject}
                  className="px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  {isSubmittingProject ? (isEditingProject ? 'Saving...' : 'Creating...') : (isEditingProject ? 'Save Changes' : 'Create Project')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
            <div className="mb-4">
              <h3 className="text-xl font-semibold">
                {isEditingAsset ? 'Edit Asset' : 'Create New Asset'}
              </h3>
              <p className="text-gray-600 text-sm">
                {isEditingAsset ? 'Update asset details and save changes.' : 'Add an asset to this project.'}
              </p>
            </div>

            <form onSubmit={submitAssetForm} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asset Name *</label>
                  <input
                    name="asset_name"
                    value={assetForm.asset_name}
                    onChange={handleAssetInputChange}
                    required
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={assetForm.status}
                    onChange={handleAssetInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Quoting">Quoting</option>
                    <option value="Approved">Approved</option>
                    <option value="In Production">In Production</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specifications</label>
                <textarea
                  name="specifications"
                  value={assetForm.specifications}
                  onChange={handleAssetInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timeline</label>
                  <input
                    name="timeline"
                    value={assetForm.timeline}
                    onChange={handleAssetInputChange}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="e.g., 2 weeks"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Supplier</label>
                  <select
                    name="assigned_supplier_id"
                    value={assetForm.assigned_supplier_id || ''}
                    onChange={handleAssetInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    <option value="">Unassigned</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.supplier_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAssetModal(false)}
                  className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAsset}
                  className="px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  {isSubmittingAsset ? (isEditingAsset ? 'Saving...' : 'Creating...') : (isEditingAsset ? 'Save Changes' : 'Create Asset')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-6">
            <div className="mb-4">
              <h3 className="text-xl font-semibold">Filter Suppliers by Tags</h3>
              <p className="text-gray-600 text-sm">Select tags to filter suppliers who will receive this request.</p>
            </div>

            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {availableTags.length === 0 && (
                  <span className="text-sm text-gray-500">No tags available. All relevant suppliers will be selected.</span>
                )}
                {availableTags.map(tag => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setSelectedTags(prev =>
                          prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                        )
                      }
                      className={`px-3 py-1 rounded-full text-sm border ${active ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-800 border-gray-300'}`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <button
                type="button"
                onClick={() => { setShowTagModal(false); setSelectedTags([]); setTagSelectionAsset(null); }}
                className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmSendWithTags}
                className="px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-700"
              >
                Send Requests
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProducerDashboard;
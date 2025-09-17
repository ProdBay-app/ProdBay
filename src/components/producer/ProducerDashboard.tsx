import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AutomationService } from '../../services/automationService';
import { RailwayApiService } from '../../services/railwayApiService';
import { SupplierApiService, type SuggestedSupplier } from '../../services/supplierApiService';
import { AIAllocationService, type AIAssetSuggestion } from '../../services/aiAllocationService';
import { useNotification } from '../../hooks/useNotification';
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
  Trash,
  Brain,
  Sparkles,
  Target
} from 'lucide-react';

const ProducerDashboard: React.FC = () => {
  const { showSuccess, showError, showWarning, showConfirm } = useNotification();
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
  const [allocationMethod, setAllocationMethod] = useState<'static' | 'ai'>('static');

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
  
  // New supplier selection modal state
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierSelectionAsset, setSupplierSelectionAsset] = useState<Asset | null>(null);
  const [suggestedSuppliers, setSuggestedSuppliers] = useState<SuggestedSupplier[]>([]);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [sendingRequests, setSendingRequests] = useState(false);

  // AI Allocation state
  const [showAIAllocationModal, setShowAIAllocationModal] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    assets: AIAssetSuggestion[];
    reasoning: string;
    confidence: number;
  } | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiAllocationCompleted, setAiAllocationCompleted] = useState<boolean>(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadProjectDetails(selectedProject.id);
      // Check AI allocation completion status
      setAiAllocationCompleted(!!selectedProject.ai_allocation_completed_at);
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
    setAllocationMethod('static');
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
    setAllocationMethod('static');
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
        if (projectForm.brief_description) {
          // Use Railway API for brief processing with selected allocation method
          const briefResult = await RailwayApiService.processBrief(
            createdProject.id, 
            projectForm.brief_description,
            {
              allocationMethod: allocationMethod,
              projectContext: {
                financial_parameters: projectForm.financial_parameters,
                timeline_deadline: projectForm.timeline_deadline,
                physical_parameters: projectForm.physical_parameters
              }
            }
          );
          if (!briefResult.success) {
            console.warn('Brief processing failed:', briefResult.error?.message);
            showWarning(`Project created successfully, but brief processing failed: ${briefResult.error?.message}. You can manually create assets later.`);
          } else {
            console.log('Brief processed successfully:', briefResult.data?.createdAssets.length, 'assets created');
            const methodText = allocationMethod === 'ai' ? 'AI-powered' : 'static';
            showSuccess(`Project created successfully! ${briefResult.data?.createdAssets.length} assets were automatically generated using ${methodText} allocation.`, { duration: 6000 });
          }
        }
        await loadProjects();
        // Get the updated project with completion status from the refreshed projects list
        const { data: updatedProjects } = await supabase
          .from('projects')
          .select('*')
          .eq('id', createdProject.id)
          .single();
        if (updatedProjects) {
          setSelectedProject(updatedProjects as unknown as Project);
        } else {
          setSelectedProject(createdProject);
        }
      }
      setShowProjectModal(false);
    } catch (err) {
      console.error('Failed to submit project form', err);
      showError('Failed to save project');
    } finally {
      setIsSubmittingProject(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;
    const confirmDelete = await showConfirm({
      title: 'Delete Project',
      message: 'Delete this project and all related assets/quotes? This cannot be undone.',
      variant: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
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
      showError('Failed to delete project');
    }
  };

  const handleSendToSuppliers = async (asset: Asset) => {
    setSupplierSelectionAsset(asset);
    setSelectedSupplierIds([]);
    setShowSupplierModal(true);
    await loadSuggestedSuppliers(asset.id);
  };

  const loadSuggestedSuppliers = async (assetId: string) => {
    setLoadingSuppliers(true);
    try {
      const response = await SupplierApiService.getSuggestedSuppliers(assetId);
      setSuggestedSuppliers(response.suggestedSuppliers);
    } catch (error) {
      console.error('Failed to load suggested suppliers:', error);
      showError('Failed to load supplier suggestions');
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const handleSupplierSelection = (supplierId: string) => {
    setSelectedSupplierIds(prev => 
      prev.includes(supplierId) 
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    );
  };

  const confirmSendQuoteRequests = async () => {
    if (!supplierSelectionAsset || selectedSupplierIds.length === 0) return;
    
    setSendingRequests(true);
    try {
      // Get producer settings for email
      const { data: settings } = await supabase
        .from('producer_settings')
        .select('*')
        .limit(1)
        .single();

      const from = settings ? {
        name: settings.from_name,
        email: settings.from_email
      } : undefined;

      const result = await SupplierApiService.sendQuoteRequests(
        supplierSelectionAsset.id,
        selectedSupplierIds,
        from ? { name: String(from.name), email: String(from.email) } : undefined
      );

      await loadProjectDetails(selectedProject!.id);
      
      if (result.successful_requests > 0) {
        showSuccess(`Quote requests sent to ${result.successful_requests} supplier(s) for ${supplierSelectionAsset.asset_name}`);
      }
      
      if (result.failed_requests > 0) {
        showWarning(`Warning: ${result.failed_requests} request(s) failed to send`);
      }
    } catch (error) {
      console.error('Error sending quote requests:', error);
      showError('Failed to send quote requests');
    } finally {
      setSendingRequests(false);
      setShowSupplierModal(false);
      setSupplierSelectionAsset(null);
      setSelectedSupplierIds([]);
      setSuggestedSuppliers([]);
    }
  };

  const handleAcceptQuote = async (quoteId: string) => {
    try {
      await AutomationService.acceptQuote(quoteId);
      await loadProjectDetails(selectedProject!.id);
      await AutomationService.updateProjectStatus(selectedProject!.id);
      await loadProjects(); // Refresh project status
      showSuccess('Quote accepted successfully');
    } catch (error) {
      console.error('Error accepting quote:', error);
      showError('Failed to accept quote');
    }
  };

  const handleRejectQuote = async (quoteId: string) => {
    try {
      await supabase
        .from('quotes')
        .update({ status: 'Rejected' })
        .eq('id', quoteId);
      
      await loadProjectDetails(selectedProject!.id);
      showSuccess('Quote rejected');
    } catch (error) {
      console.error('Error rejecting quote:', error);
      showError('Failed to reject quote');
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
      showError('Failed to save asset');
    } finally {
      setIsSubmittingAsset(false);
    }
  };

  const handleDeleteAsset = async (asset: Asset) => {
    const confirmDelete = await showConfirm({
      title: 'Delete Asset',
      message: 'Delete this asset and any related quotes?',
      variant: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
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
      showError('Failed to delete asset');
    }
  };

  const confirmSendWithTags = async () => {
    if (!tagSelectionAsset || !selectedProject) return;
    try {
      await AutomationService.sendQuoteRequestsForAsset(tagSelectionAsset, selectedTags);
      await loadProjectDetails(selectedProject.id);
      showSuccess(`Quote requests sent for ${tagSelectionAsset.asset_name}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error sending to suppliers:', error);
      showError('Failed to send quote requests');
    } finally {
      setShowTagModal(false);
      setTagSelectionAsset(null);
      setSelectedTags([]);
    }
  };

  // AI Allocation Functions
  const openAIAllocation = () => {
    if (!selectedProject || aiAllocationCompleted) return;
    setShowAIAllocationModal(true);
    setAiSuggestions(null);
  };

  const performAIAnalysis = async () => {
    if (!selectedProject) return;
    
    setLoadingAI(true);
    try {
      let result;
      
      result = await AIAllocationService.analyzeBriefForAssets(
        selectedProject.brief_description,
        {
          financial_parameters: selectedProject.financial_parameters,
          timeline_deadline: selectedProject.timeline_deadline,
          physical_parameters: selectedProject.physical_parameters
        }
      );

      if (result.success && result.data) {
        setAiSuggestions({
          assets: result.data.assets || [],
          reasoning: result.data.reasoning || '',
          confidence: result.data.confidence || 0
        });
      } else {
        showError(`AI analysis failed: ${result.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      showError('AI analysis failed. Please try again.');
    } finally {
      setLoadingAI(false);
    }
  };

  const applyAISuggestions = async () => {
    if (!aiSuggestions || !selectedProject) return;
    
    try {
      // Apply asset suggestions
      if (aiSuggestions.assets.length > 0) {
        const result = await AIAllocationService.createAssetsFromAI(selectedProject.id, aiSuggestions.assets);
        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to create assets');
        }
      }


      // Reload project details
      await loadProjectDetails(selectedProject.id);
      setShowAIAllocationModal(false);
      setAiSuggestions(null);
      setAiAllocationCompleted(true);
      showSuccess('AI suggestions applied successfully! AI allocation is now complete.', { duration: 6000 });
    } catch (error) {
      console.error('Error applying AI suggestions:', error);
      showError('Failed to apply AI suggestions. Please try again.');
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
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{selectedProject.brief_description}</p>
                </div>
              </div>

              {/* Asset Management */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Asset Management</h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={openCreateAsset}
                      className="flex items-center space-x-2 px-3 py-1 bg-teal-600 text-white rounded text-sm hover:bg-teal-700"
                    >
                      <Plus className="h-4 w-4" />
                      <span>New Asset</span>
                    </button>
                    {aiAllocationCompleted ? (
                      <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded text-sm">
                        <CheckCircle className="h-4 w-4" />
                        <span>AI Allocation Applied</span>
                      </div>
                    ) : (
                      <div className="relative group">
                        <button
                          className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded text-sm hover:from-purple-700 hover:to-blue-700"
                        >
                          <Brain className="h-4 w-4" />
                          <span>AI Allocation</span>
                          <Sparkles className="h-3 w-3" />
                        </button>
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                          <div className="py-1">
                            <button
                              onClick={openAIAllocation}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                            >
                              <Target className="h-4 w-4" />
                              <span>AI Asset Analysis</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
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
                                <span>Select Suppliers</span>
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
                                        <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
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
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">Asset Allocation Method:</p>
                  
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="allocationMethod"
                        value="static"
                        checked={allocationMethod === 'static'}
                        onChange={(e) => setAllocationMethod(e.target.value as 'static' | 'ai')}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Static Allocation</span>
                        <p className="text-xs text-gray-500">Rule-based asset identification using keyword matching</p>
                      </div>
                    </label>
                    
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="allocationMethod"
                        value="ai"
                        checked={allocationMethod === 'ai'}
                        onChange={(e) => setAllocationMethod(e.target.value as 'static' | 'ai')}
                        className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 focus:ring-purple-500 focus:ring-2"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">AI-Powered Allocation</span>
                        <p className="text-xs text-gray-500">AI analyzes your brief to identify assets with detailed specifications</p>
                      </div>
                    </label>
                  </div>
                  
                  {allocationMethod === 'ai' && (
                    <div className="mt-3 p-3 bg-purple-100 rounded-lg">
                      <p className="text-sm text-purple-800">
                        ✨ AI will analyze your brief to identify assets, create detailed specifications, 
                        and suggest optimal supplier allocations with confidence scores.
                      </p>
                    </div>
                  )}
                </div>
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

      {/* New Supplier Selection Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="mb-4">
              <h3 className="text-xl font-semibold">Select Suppliers for Quote Requests</h3>
              <p className="text-gray-600 text-sm">
                Choose which suppliers should receive quote requests for "{supplierSelectionAsset?.asset_name}".
              </p>
            </div>

            {loadingSuppliers ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                <span className="ml-2 text-gray-600">Loading suppliers...</span>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {suggestedSuppliers.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        <p>No relevant suppliers found for this asset.</p>
                        <p className="text-sm">Try adding more suppliers or check the asset specifications.</p>
                      </div>
                    ) : (
                      suggestedSuppliers.map((supplier) => {
                        const isSelected = selectedSupplierIds.includes(supplier.id);
                        const isAlreadyContacted = supplier.already_contacted;
                        
                        return (
                          <div
                            key={supplier.id}
                            className={`border rounded-lg p-4 transition-colors ${
                              isSelected ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                            } ${isAlreadyContacted ? 'opacity-75' : ''}`}
                          >
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                id={`supplier-${supplier.id}`}
                                checked={isSelected}
                                onChange={() => handleSupplierSelection(supplier.id)}
                                disabled={isAlreadyContacted}
                                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                              />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <label
                                    htmlFor={`supplier-${supplier.id}`}
                                    className="font-medium text-gray-900 cursor-pointer"
                                  >
                                    {supplier.supplier_name}
                                  </label>
                                  {isAlreadyContacted && (
                                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                      Already Contacted
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">{supplier.contact_email}</p>
                                {supplier.service_categories && supplier.service_categories.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {supplier.service_categories.map((category, index) => (
                                      <span
                                        key={index}
                                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                                      >
                                        {category}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    {selectedSupplierIds.length > 0 && (
                      <span>
                        {selectedSupplierIds.length} supplier{selectedSupplierIds.length !== 1 ? 's' : ''} selected
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSupplierModal(false);
                        setSupplierSelectionAsset(null);
                        setSelectedSupplierIds([]);
                        setSuggestedSuppliers([]);
                      }}
                      className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmSendQuoteRequests}
                      disabled={selectedSupplierIds.length === 0 || sendingRequests}
                      className={`px-4 py-2 rounded text-white ${
                        selectedSupplierIds.length === 0 || sendingRequests
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-teal-600 hover:bg-teal-700'
                      }`}
                    >
                      {sendingRequests ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Sending...</span>
                        </div>
                      ) : (
                        `Send Quote Requests${selectedSupplierIds.length > 0 ? ` (${selectedSupplierIds.length})` : ''}`
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* AI Allocation Modal */}
      {showAIAllocationModal && !aiAllocationCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-2">
                <Brain className="h-6 w-6 text-purple-600" />
                <h3 className="text-xl font-semibold">
                  AI Asset Analysis
                </h3>
                <Sparkles className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-gray-600 text-sm">
                Analyze the project brief to identify and suggest optimal assets with detailed specifications.
              </p>
            </div>

            {!aiSuggestions ? (
              <div className="text-center py-8">
                {loadingAI ? (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    <p className="text-gray-600">AI is analyzing your project...</p>
                    <p className="text-sm text-gray-500">This may take a few moments</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-900 mb-2">Ready to analyze</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Click the button below to start AI analysis of your project.
                      </p>
                      <button
                        onClick={performAIAnalysis}
                        className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 mx-auto"
                      >
                        <Brain className="h-5 w-5" />
                        <span>Start AI Analysis</span>
                        <Sparkles className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* AI Results Summary */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">AI Analysis Complete</h4>
                      <p className="text-sm text-gray-600">
                        Confidence: {Math.round(aiSuggestions.confidence * 100)}%
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-700 font-medium">Ready</span>
                    </div>
                  </div>
                </div>

                {/* AI Reasoning */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">AI Reasoning</h4>
                  <p className="text-sm text-gray-700">{aiSuggestions.reasoning}</p>
                </div>

                {/* Asset Suggestions */}
                {aiSuggestions.assets.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Suggested Assets ({aiSuggestions.assets.length})</h4>
                    <div className="space-y-3">
                      {aiSuggestions.assets.map((asset, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-medium text-gray-900">{asset.asset_name}</h5>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                asset.priority === 'high' ? 'bg-red-100 text-red-800' :
                                asset.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {asset.priority} priority
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                asset.estimated_cost_range === 'high' ? 'bg-red-100 text-red-800' :
                                asset.estimated_cost_range === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {asset.estimated_cost_range} cost
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">{asset.specifications}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}


                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAIAllocationModal(false);
                      setAiSuggestions(null);
                    }}
                    className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={applyAISuggestions}
                    className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700"
                  >
                    <Brain className="h-4 w-4" />
                    <span>Apply AI Suggestions</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProducerDashboard;
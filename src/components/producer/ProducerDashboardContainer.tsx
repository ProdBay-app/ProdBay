import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { AutomationService } from '@/services/automationService';
import { SupplierApiService, type SuggestedSupplier } from '@/services/supplierApiService';
import { AIAllocationService, type AIAssetSuggestion } from '@/services/aiAllocationService';
import { QuoteRequestService, type CustomizedEmail } from '@/services/quoteRequestService';
import { ProducerService, type ProjectFormData, type AssetFormData } from '@/services/producerService';
import { RailwayApiService } from '@/services/railwayApiService';
import { useNotification } from '@/hooks/useNotification';
import { getSupabase } from '@/lib/supabase';
import ProducerDashboard from './ProducerDashboard';
import ProjectCreationLoadingOverlay from '@/components/ProjectCreationLoadingOverlay';
import type { Project, Asset, Quote, Supplier } from '@/lib/supabase';

export interface ProducerDashboardData {
  // Project data
  projects: Project[];
  selectedProject: Project | null;
  assets: Asset[];
  quotes: Quote[];
  suppliers: Supplier[];
  
  // Loading states
  loading: boolean;
  loadingSuppliers: boolean;
  loadingAI: boolean;
  
  // Modal states
  showProjectModal: boolean;
  showAssetModal: boolean;
  showTagModal: boolean;
  showSupplierModal: boolean;
  showPreviewModal: boolean;
  showAIAllocationModal: boolean;
  showQuoteComparisonModal: boolean;
  
  // Form states
  isEditingProject: boolean;
  isSubmittingProject: boolean;
  isEditingAsset: boolean;
  isSubmittingAsset: boolean;
  projectForm: ProjectFormData;
  assetForm: AssetFormData;
  allocationMethod: 'static' | 'ai';
  
  // AI and supplier states
  aiSuggestions: {
    assets: AIAssetSuggestion[];
    reasoning: string;
    confidence: number;
  } | null;
  aiAllocationCompleted: boolean;
  suggestedSuppliers: SuggestedSupplier[];
  selectedSupplierIds: string[];
  selectedTags: string[];
  
  // Selection states
  tagSelectionAsset: Asset | null;
  supplierSelectionAsset: Asset | null;
  previewAsset: Asset | null;
  previewSupplierIds: string[];
  comparisonAssetId: string | null;
}

export interface ProducerDashboardActions {
  // Project actions
  selectProject: (project: Project | null) => void;
  openCreateProject: () => void;
  openEditProject: () => void;
  closeProjectModal: () => void;
  updateProjectForm: (field: keyof ProjectFormData, value: string | number | undefined) => void;
  setAllocationMethod: (method: 'static' | 'ai') => void;
  submitProjectForm: (e: React.FormEvent) => Promise<void>;
  deleteProject: () => Promise<void>;
  
  // Asset actions
  openCreateAsset: () => Promise<void>;
  openEditAsset: (asset: Asset) => Promise<void>;
  closeAssetModal: () => void;
  updateAssetForm: (field: keyof AssetFormData, value: string | undefined) => void;
  submitAssetForm: (e: React.FormEvent) => Promise<void>;
  deleteAsset: (asset: Asset) => Promise<void>;
  
  // Supplier actions
  handleSendToSuppliers: (asset: Asset) => Promise<void>;
  handleSupplierSelection: (supplierId: string) => void;
  confirmSendQuoteRequests: () => Promise<void>;
  handleSendCustomizedEmails: (customizedEmails: CustomizedEmail[]) => Promise<void>;
  
  // Tag actions
  handleTagToggle: (tag: string) => void;
  confirmSendWithTags: () => Promise<void>;
  
  // AI actions
  openAIAllocation: () => void;
  performAIAnalysis: () => Promise<void>;
  applyAISuggestions: () => Promise<void>;
  
  // Quote comparison actions
  openQuoteComparison: (assetId: string) => void;
  closeQuoteComparison: () => void;
  handleQuoteUpdate: () => void;
  
  // Modal close actions
  closeTagModal: () => void;
  closeSupplierModal: () => void;
  closePreviewModal: () => void;
  closeAIAllocationModal: () => void;
}

export interface ProducerDashboardUtils {
  getStatusColor: (status: string) => string;
  getAssetQuotes: (assetId: string) => Quote[];
  hasMultipleQuotes: (assetId: string) => boolean;
  availableTags: string[];
}

export interface ProducerDashboardProps extends 
  ProducerDashboardData, 
  ProducerDashboardActions, 
  ProducerDashboardUtils {
  error: string | null;
}

const ProducerDashboardContainer: React.FC = () => {
  const { showSuccess, showError, showWarning, showConfirm } = useNotification();
  const location = useLocation();
  
  // Core data state
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showAIAllocationModal, setShowAIAllocationModal] = useState(false);
  const [showQuoteComparisonModal, setShowQuoteComparisonModal] = useState(false);
  
  // Form states
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isEditingAsset, setIsEditingAsset] = useState(false);
  const [isSubmittingAsset, setIsSubmittingAsset] = useState(false);
  const [projectForm, setProjectForm] = useState<ProjectFormData>({
    project_name: '',
    client_name: '',
    brief_description: '',
    physical_parameters: '',
    financial_parameters: 0 as number | undefined,
    timeline_deadline: '',
    event_date: ''
  });
  const [assetForm, setAssetForm] = useState<AssetFormData>({
    id: undefined,
    asset_name: '',
    specifications: '',
    timeline: '',
    status: 'Pending',
    assigned_supplier_id: undefined
  });
  const [allocationMethod, setAllocationMethod] = useState<'static' | 'ai'>('static');
  
  // AI and supplier states
  const [aiSuggestions, setAiSuggestions] = useState<{
    assets: AIAssetSuggestion[];
    reasoning: string;
    confidence: number;
  } | null>(null);
  const [aiAllocationCompleted, setAiAllocationCompleted] = useState<boolean>(false);
  const [suggestedSuppliers, setSuggestedSuppliers] = useState<SuggestedSupplier[]>([]);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  
  // Selection states
  const [tagSelectionAsset, setTagSelectionAsset] = useState<Asset | null>(null);
  const [supplierSelectionAsset, setSupplierSelectionAsset] = useState<Asset | null>(null);
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [previewSupplierIds, setPreviewSupplierIds] = useState<string[]>([]);
  const [comparisonAssetId, setComparisonAssetId] = useState<string | null>(null);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Check AI allocation completion status
  useEffect(() => {
    if (selectedProject) {
      setAiAllocationCompleted(!!selectedProject.ai_allocation_completed_at);
    }
  }, [selectedProject]);

  // Handle navigation state from projects grid
  useEffect(() => {
    const state = location.state as { 
      selectedProjectId?: string; 
      openCreateProjectModal?: boolean 
    } | null;
    
    if (state?.selectedProjectId && projects.length > 0) {
      // Find and select the project by ID
      const projectToSelect = projects.find(p => p.id === state.selectedProjectId);
      if (projectToSelect) {
        setSelectedProject(projectToSelect);
      }
    }
    
    if (state?.openCreateProjectModal && !showProjectModal) {
      // Open the create project modal
      setIsEditingProject(false);
      setProjectForm({
        project_name: '',
        client_name: '',
        brief_description: '',
        physical_parameters: '',
        financial_parameters: undefined,
        timeline_deadline: '',
        event_date: ''
      });
      setAllocationMethod('static');
      setShowProjectModal(true);
    }
  }, [location.state, projects, showProjectModal]);

  // Data fetching functions
  const loadProjects = useCallback(async () => {
    try {
      setError(null);
      const projectsData = await ProducerService.loadProjects();
      setProjects(projectsData);
      
      // Auto-select first project if none selected
      if (projectsData.length > 0 && !selectedProject) {
        setSelectedProject(projectsData[0]);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load projects';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedProject, showError]);

  const loadProjectDetails = useCallback(async (projectId: string) => {
    try {
      setError(null);
      const { assets: assetsData, quotes: quotesData } = await ProducerService.loadProjectDetails(projectId);
      setAssets(assetsData);
      setQuotes(quotesData);
    } catch (error) {
      console.error('Error loading project details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load project details';
      setError(errorMessage);
      showError(errorMessage);
    }
  }, [showError]);

  const loadSuppliers = useCallback(async () => {
    try {
      const data = await ProducerService.loadSuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error('Failed to load suppliers', error);
      showError('Failed to load suppliers');
    }
  }, [showError]);

  // Project actions
  const selectProject = useCallback((project: Project | null) => {
    setSelectedProject(project);
    if (project) {
      loadProjectDetails(project.id);
    } else {
      setAssets([]);
      setQuotes([]);
    }
  }, [loadProjectDetails]);

  const openCreateProject = useCallback(() => {
    setIsEditingProject(false);
    setProjectForm({
      project_name: '',
      client_name: '',
      brief_description: '',
      physical_parameters: '',
      financial_parameters: undefined,
      timeline_deadline: '',
      event_date: ''
    });
    setAllocationMethod('static');
    setShowProjectModal(true);
  }, []);

  const openEditProject = useCallback(() => {
    if (!selectedProject) return;
    setIsEditingProject(true);
    setProjectForm({
      project_name: selectedProject.project_name || '',
      client_name: selectedProject.client_name || '',
      brief_description: selectedProject.brief_description || '',
      physical_parameters: selectedProject.physical_parameters || '',
      financial_parameters: selectedProject.financial_parameters,
      timeline_deadline: selectedProject.timeline_deadline || '',
      event_date: selectedProject.event_date || ''
    });
    setAllocationMethod('static');
    setShowProjectModal(true);
  }, [selectedProject]);

  const closeProjectModal = useCallback(() => {
    setShowProjectModal(false);
    setIsEditingProject(false);
    setIsSubmittingProject(false);
  }, []);

  const updateProjectForm = useCallback((field: keyof ProjectFormData, value: string | number | undefined) => {
    setProjectForm(prev => ({
      ...prev,
      [field]: field === 'financial_parameters' ? (value === '' ? undefined : Number(value)) : value
    }));
  }, []);

  const setAllocationMethodHandler = useCallback((method: 'static' | 'ai') => {
    setAllocationMethod(method);
  }, []);

  const submitProjectForm = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProject(true);
    
    // Only show loading overlay for new project creation, not editing
    if (!isEditingProject) {
      setIsCreatingProject(true);
    }
    
    // Start timing for new project creation
    const startTime = performance.now();
    if (!isEditingProject) {
      console.log('🚀 [PROJECT CREATION] Starting project creation process (Dashboard)...');
    }
    
    // Initialize variables for timing
    let supabaseDuration = 0;
    let briefDuration = 0;
    let refreshDuration = 0;
    
    try {
      if (isEditingProject && selectedProject) {
        // Update existing project
        const updateStartTime = performance.now();
        console.log('📝 [PROJECT UPDATE] Updating existing project...');
        await ProducerService.updateProject(selectedProject.id, projectForm);
        await loadProjects();
        const updateEndTime = performance.now();
        const updateDuration = Math.round(updateEndTime - updateStartTime);
        console.log(`✅ [PROJECT UPDATE] Project update completed in ${updateDuration}ms`);
        showSuccess('Project updated successfully');
      } else {
        // Create new project
        const supabaseStartTime = performance.now();
        console.log('📊 [PROJECT CREATION] Step 1: Creating project in Supabase (Dashboard)...');
        const createdProject = await ProducerService.createProject(projectForm);
        const supabaseEndTime = performance.now();
        supabaseDuration = Math.round(supabaseEndTime - supabaseStartTime);
        console.log(`✅ [PROJECT CREATION] Step 1 Complete: Supabase project creation took ${supabaseDuration}ms`);
        
        // Process brief if provided
        if (projectForm.brief_description) {
          try {
            const briefStartTime = performance.now();
            console.log('🤖 [PROJECT CREATION] Step 2: Processing brief with Railway API (Dashboard)...');
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
            const briefEndTime = performance.now();
            briefDuration = Math.round(briefEndTime - briefStartTime);
            console.log(`✅ [PROJECT CREATION] Step 2 Complete: Railway API brief processing took ${briefDuration}ms`);
            
            if (!briefResult.success) {
              console.warn('Brief processing failed:', briefResult.error?.message);
              showWarning(`Project created successfully, but brief processing failed: ${briefResult.error?.message}. You can manually create assets later.`);
            } else {
              console.log('Brief processed successfully:', briefResult.data?.createdAssets.length, 'assets created');
              const methodText = allocationMethod === 'ai' ? 'smart' : 'static';
              showSuccess(`Project created successfully! ${briefResult.data?.createdAssets.length} assets were automatically generated using ${methodText} allocation.`, { duration: 6000 });
            }
          } catch (briefError) {
            console.error('Brief processing error:', briefError);
            showWarning('Project created successfully, but brief processing failed. You can manually create assets later.');
          }
        } else {
          showSuccess('Project created successfully');
        }
        
        // Refresh projects and select the new one
        const refreshStartTime = performance.now();
        console.log('🔄 [PROJECT CREATION] Step 3: Refreshing project data and selecting new project...');
        await loadProjects();
        const updatedProject = await ProducerService.loadProject(createdProject.id);
        if (updatedProject) {
          setSelectedProject(updatedProject);
        } else {
          setSelectedProject(createdProject);
        }
        const refreshEndTime = performance.now();
        refreshDuration = Math.round(refreshEndTime - refreshStartTime);
        console.log(`✅ [PROJECT CREATION] Step 3 Complete: Project refresh took ${refreshDuration}ms`);
        
        // Calculate and log total duration for new project creation
        const endTime = performance.now();
        const totalDuration = Math.round(endTime - startTime);
        console.log(`🎉 [PROJECT CREATION] SUCCESS! Total project creation time (Dashboard): ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`);
        console.log(`📈 [PROJECT CREATION] Performance Summary (Dashboard):`);
        console.log(`   - Supabase: ${supabaseDuration}ms`);
        if (projectForm.brief_description) {
          console.log(`   - Railway API: ${briefDuration}ms`);
          console.log(`   - Project Refresh: ${refreshDuration}ms`);
          console.log(`   - Total API calls: ${supabaseDuration + briefDuration}ms`);
          console.log(`   - Overhead: ${totalDuration - supabaseDuration - briefDuration - refreshDuration}ms`);
        } else {
          console.log(`   - No brief processing (skipped Railway API)`);
          console.log(`   - Project Refresh: ${refreshDuration}ms`);
          console.log(`   - Overhead: ${totalDuration - supabaseDuration - refreshDuration}ms`);
        }
      }
      
      closeProjectModal();
    } catch (err) {
      const endTime = performance.now();
      const totalDuration = Math.round(endTime - startTime);
      if (isEditingProject) {
        console.error(`❌ [PROJECT UPDATE] FAILED after ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s):`, err);
      } else {
        console.error(`❌ [PROJECT CREATION] FAILED after ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s):`, err);
      }
      showError('Failed to save project');
    } finally {
      setIsSubmittingProject(false);
      setIsCreatingProject(false);
    }
  }, [isEditingProject, selectedProject, projectForm, allocationMethod, loadProjects, showSuccess, showWarning, showError, closeProjectModal]);

  const deleteProject = useCallback(async () => {
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
      await ProducerService.deleteProject(selectedProject.id);
      await loadProjects();
      setSelectedProject(null);
      showSuccess('Project deleted successfully');
    } catch (err) {
      console.error('Failed to delete project', err);
      showError('Failed to delete project');
    }
  }, [selectedProject, loadProjects, showConfirm, showSuccess, showError]);

  // Asset actions
  const openCreateAsset = useCallback(async () => {
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
  }, [selectedProject, loadSuppliers]);

  const openEditAsset = useCallback(async (asset: Asset) => {
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
  }, [loadSuppliers]);

  const closeAssetModal = useCallback(() => {
    setShowAssetModal(false);
    setIsEditingAsset(false);
    setIsSubmittingAsset(false);
  }, []);

  const updateAssetForm = useCallback((field: keyof AssetFormData, value: string | undefined) => {
    setAssetForm(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const submitAssetForm = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    
    setIsSubmittingAsset(true);
    try {
      if (isEditingAsset && assetForm.id) {
        // Update existing asset
        await ProducerService.updateAsset(assetForm.id, assetForm);
        showSuccess('Asset updated successfully');
      } else {
        // Create new asset
        await ProducerService.createAsset(selectedProject.id, assetForm);
        showSuccess('Asset created successfully');
      }
      
      // Refresh project details
      await loadProjectDetails(selectedProject.id);
      closeAssetModal();
    } catch (err) {
      console.error('Failed to save asset', err);
      showError('Failed to save asset');
    } finally {
      setIsSubmittingAsset(false);
    }
  }, [isEditingAsset, assetForm, selectedProject, loadProjectDetails, showSuccess, showError, closeAssetModal]);

  const deleteAsset = useCallback(async (asset: Asset) => {
    const confirmDelete = await showConfirm({
      title: 'Delete Asset',
      message: 'Delete this asset and any related quotes?',
      variant: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });
    
    if (!confirmDelete) return;
    
    try {
      await ProducerService.deleteAsset(asset.id);
      if (selectedProject) {
        await loadProjectDetails(selectedProject.id);
      }
      showSuccess('Asset deleted successfully');
    } catch (err) {
      console.error('Failed to delete asset', err);
      showError('Failed to delete asset');
    }
  }, [selectedProject, loadProjectDetails, showConfirm, showSuccess, showError]);

  // Supplier actions
  const handleSendToSuppliers = useCallback(async (asset: Asset) => {
    setSupplierSelectionAsset(asset);
    setSelectedSupplierIds([]);
    setShowSupplierModal(true);
    await loadSuggestedSuppliers(asset.id);
  }, []);

  const loadSuggestedSuppliers = useCallback(async (assetId: string) => {
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
  }, [showError]);

  const handleSupplierSelection = useCallback((supplierId: string) => {
    setSelectedSupplierIds(prev => 
      prev.includes(supplierId) 
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    );
  }, []);

  const confirmSendQuoteRequests = useCallback(async () => {
    if (!supplierSelectionAsset || selectedSupplierIds.length === 0) return;
    
    // Open preview modal instead of sending directly
    setPreviewAsset(supplierSelectionAsset);
    setPreviewSupplierIds(selectedSupplierIds);
    setShowPreviewModal(true);
    
    // Close supplier selection modal
    setShowSupplierModal(false);
    setSupplierSelectionAsset(null);
    setSelectedSupplierIds([]);
    setSuggestedSuppliers([]);
  }, [supplierSelectionAsset, selectedSupplierIds]);

  const handleSendCustomizedEmails = useCallback(async (customizedEmails: CustomizedEmail[]) => {
    if (!previewAsset || previewSupplierIds.length === 0) return;
    
    try {
      // Get authenticated user's email for Reply-To header
      const supabase = await getSupabase();
      const { data: { user } } = await supabase.auth.getUser();

      // Require authenticated user - no fallback for production safety
      if (!user || !user.email) {
        showError('Authentication required. Please log in to send quote requests.');
        return;
      }

      const from = {
        name: user.user_metadata?.full_name || user.email.split('@')[0] || 'Producer',
        email: user.email
      };

      const result = await QuoteRequestService.sendQuoteRequests(
        previewAsset.id,
        previewSupplierIds,
        customizedEmails,
        from
      );

      await loadProjectDetails(selectedProject!.id);
      
      if (result.data.successful_requests > 0) {
        showSuccess(`Quote requests sent to ${result.data.successful_requests} supplier(s) for ${previewAsset.asset_name}`);
      }
      
      if (result.data.failed_requests > 0) {
        showWarning(`Warning: ${result.data.failed_requests} request(s) failed to send`);
      }
    } catch (error) {
      console.error('Error sending quote requests:', error);
      showError('Failed to send quote requests');
      throw error; // Re-throw to let the modal handle the error
    } finally {
      setPreviewAsset(null);
      setPreviewSupplierIds([]);
    }
  }, [previewAsset, previewSupplierIds, selectedProject, loadProjectDetails, showSuccess, showWarning, showError]);

  // Tag actions

  const handleTagToggle = useCallback((tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }, []);

  const confirmSendWithTags = useCallback(async () => {
    if (!tagSelectionAsset || !selectedProject) return;
    try {
      await AutomationService.sendQuoteRequestsForAsset(tagSelectionAsset, selectedTags);
      await loadProjectDetails(selectedProject.id);
      showSuccess(`Quote requests sent for ${tagSelectionAsset.asset_name}`);
    } catch (error) {
      console.error('Error sending to suppliers:', error);
      showError('Failed to send quote requests');
    } finally {
      setShowTagModal(false);
      setTagSelectionAsset(null);
      setSelectedTags([]);
    }
  }, [tagSelectionAsset, selectedProject, selectedTags, loadProjectDetails, showSuccess, showError]);

  // AI actions
  const openAIAllocation = useCallback(() => {
    if (!selectedProject || aiAllocationCompleted) return;
    setShowAIAllocationModal(true);
    setAiSuggestions(null);
  }, [selectedProject, aiAllocationCompleted]);

  const performAIAnalysis = useCallback(async () => {
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
        showError(`Analysis failed: ${result.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      showError('Analysis failed. Please try again.');
    } finally {
      setLoadingAI(false);
    }
  }, [selectedProject, showError]);

  const applyAISuggestions = useCallback(async () => {
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
      showSuccess('Suggestions applied successfully! Smart allocation is now complete.', { duration: 6000 });
    } catch (error) {
      console.error('Error applying AI suggestions:', error);
      showError('Failed to apply suggestions. Please try again.');
    }
  }, [aiSuggestions, selectedProject, loadProjectDetails, showSuccess, showError]);

  // Quote comparison actions
  const openQuoteComparison = useCallback((assetId: string) => {
    setComparisonAssetId(assetId);
    setShowQuoteComparisonModal(true);
  }, []);

  const closeQuoteComparison = useCallback(() => {
    setShowQuoteComparisonModal(false);
    setComparisonAssetId(null);
  }, []);

  const handleQuoteUpdate = useCallback(() => {
    // Reload project details when quotes are updated
    if (selectedProject) {
      loadProjectDetails(selectedProject.id);
    }
  }, [selectedProject, loadProjectDetails]);

  // Modal close actions
  const closeTagModal = useCallback(() => {
    setShowTagModal(false);
    setSelectedTags([]);
    setTagSelectionAsset(null);
  }, []);

  const closeSupplierModal = useCallback(() => {
    setShowSupplierModal(false);
    setSupplierSelectionAsset(null);
    setSelectedSupplierIds([]);
    setSuggestedSuppliers([]);
  }, []);

  const closePreviewModal = useCallback(() => {
    setShowPreviewModal(false);
    setPreviewAsset(null);
    setPreviewSupplierIds([]);
  }, []);

  const closeAIAllocationModal = useCallback(() => {
    setShowAIAllocationModal(false);
    setAiSuggestions(null);
  }, []);

  // Utility functions
  const getStatusColor = useCallback((status: string) => {
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
  }, []);

  const getAssetQuotes = useCallback((assetId: string) => {
    return quotes.filter(quote => quote.asset_id === assetId);
  }, [quotes]);

  const hasMultipleQuotes = useCallback((assetId: string): boolean => {
    const assetQuotes = getAssetQuotes(assetId);
    return assetQuotes.length > 1;
  }, [getAssetQuotes]);

  const availableTags = ProducerService.getAvailableTags(suppliers);

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Dashboard</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              loadProjects();
            }}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  // Pass all data and functions to the presentational component
  return (
    <>
      <ProjectCreationLoadingOverlay isVisible={isCreatingProject} />
      <ProducerDashboard
      // Data
      projects={projects}
      selectedProject={selectedProject}
      assets={assets}
      quotes={quotes}
      suppliers={suppliers}
      loadingSuppliers={loadingSuppliers}
      loadingAI={loadingAI}
      
      // Modal states
      showProjectModal={showProjectModal}
      showAssetModal={showAssetModal}
      showTagModal={showTagModal}
      showSupplierModal={showSupplierModal}
      showPreviewModal={showPreviewModal}
      showAIAllocationModal={showAIAllocationModal}
      showQuoteComparisonModal={showQuoteComparisonModal}
      
      // Form states
      isEditingProject={isEditingProject}
      isSubmittingProject={isSubmittingProject}
      isEditingAsset={isEditingAsset}
      isSubmittingAsset={isSubmittingAsset}
      projectForm={projectForm}
      assetForm={assetForm}
      allocationMethod={allocationMethod}
      
      // AI and supplier states
      aiSuggestions={aiSuggestions}
      aiAllocationCompleted={aiAllocationCompleted}
      suggestedSuppliers={suggestedSuppliers}
      selectedSupplierIds={selectedSupplierIds}
      selectedTags={selectedTags}
      
      // Selection states
      supplierSelectionAsset={supplierSelectionAsset}
      previewAsset={previewAsset}
      previewSupplierIds={previewSupplierIds}
      comparisonAssetId={comparisonAssetId}
      
      // Actions
      selectProject={selectProject}
      openCreateProject={openCreateProject}
      openEditProject={openEditProject}
      closeProjectModal={closeProjectModal}
      updateProjectForm={updateProjectForm}
      setAllocationMethod={setAllocationMethodHandler}
      submitProjectForm={submitProjectForm}
      deleteProject={deleteProject}
      
      openCreateAsset={openCreateAsset}
      openEditAsset={openEditAsset}
      closeAssetModal={closeAssetModal}
      updateAssetForm={updateAssetForm}
      submitAssetForm={submitAssetForm}
      deleteAsset={deleteAsset}
      
      handleSendToSuppliers={handleSendToSuppliers}
      handleSupplierSelection={handleSupplierSelection}
      confirmSendQuoteRequests={confirmSendQuoteRequests}
      handleSendCustomizedEmails={handleSendCustomizedEmails}
      
      handleTagToggle={handleTagToggle}
      confirmSendWithTags={confirmSendWithTags}
      
      openAIAllocation={openAIAllocation}
      performAIAnalysis={performAIAnalysis}
      applyAISuggestions={applyAISuggestions}
      
      openQuoteComparison={openQuoteComparison}
      closeQuoteComparison={closeQuoteComparison}
      handleQuoteUpdate={handleQuoteUpdate}
      
      closeTagModal={closeTagModal}
      closeSupplierModal={closeSupplierModal}
      closePreviewModal={closePreviewModal}
      closeAIAllocationModal={closeAIAllocationModal}
      
      // Utils
      getStatusColor={getStatusColor}
      getAssetQuotes={getAssetQuotes}
      hasMultipleQuotes={hasMultipleQuotes}
      availableTags={availableTags}
    />
    </>
  );
};

export default ProducerDashboardContainer;

import React, { useState, useEffect } from 'react';
import { AutomationService } from '../../services/automationService';
import { SupplierApiService, type SuggestedSupplier } from '../../services/supplierApiService';
import { AIAllocationService, type AIAssetSuggestion } from '../../services/aiAllocationService';
import { QuoteRequestService, type CustomizedEmail } from '../../services/quoteRequestService';
import { ProducerService } from '../../services/producerService';
import { useProjectManagement } from '../../hooks/useProjectManagement';
import { useAssetManagement } from '../../hooks/useAssetManagement';
import { useNotification } from '../../hooks/useNotification';
import type { Asset } from '../../lib/supabase';
import QuoteRequestPreviewModal from './QuoteRequestPreviewModal';
import QuoteComparisonModal from './QuoteComparisonModal';
import DashboardHeader from './DashboardHeader';
import ProjectList from './ProjectList';
import ProjectOverview from './ProjectOverview';
import AssetManagement from './AssetManagement';
import ProjectModal from './ProjectModal';
import AssetModal from './AssetModal';
import TagSelectionModal from './TagSelectionModal';
import SupplierSelectionModal from './SupplierSelectionModal';
import AIAllocationModal from './AIAllocationModal';
import { Eye } from 'lucide-react';

const ProducerDashboard: React.FC = () => {
  const { showSuccess, showError, showWarning } = useNotification();
  
  // Use project management hook
  const {
    projects,
    currentProject: selectedProject,
    isLoading: loading,
    showProjectModal,
    isEditingProject,
    isSubmittingProject,
    projectForm,
    allocationMethod,
    selectProject: setSelectedProject,
    openCreateProject,
    openEditProject,
    closeProjectModal,
    updateProjectForm,
    setAllocationMethod,
    submitProjectForm,
    deleteProject: handleDeleteProject,
  } = useProjectManagement();
  
  // Use asset management hook
  const {
    assets,
    quotes,
    suppliers,
    showAssetModal,
    isEditingAsset,
    isSubmittingAsset,
    assetForm,
    loadProjectDetails,
    openCreateAsset,
    openEditAsset,
    closeAssetModal,
    updateAssetForm,
    submitAssetForm,
    deleteAsset: handleDeleteAsset,
  } = useAssetManagement(selectedProject);
  
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagSelectionAsset, setTagSelectionAsset] = useState<Asset | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // New supplier selection modal state
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierSelectionAsset, setSupplierSelectionAsset] = useState<Asset | null>(null);
  const [suggestedSuppliers, setSuggestedSuppliers] = useState<SuggestedSupplier[]>([]);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  // New quote request preview modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [previewSupplierIds, setPreviewSupplierIds] = useState<string[]>([]);

  // AI Allocation state
  const [showAIAllocationModal, setShowAIAllocationModal] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    assets: AIAssetSuggestion[];
    reasoning: string;
    confidence: number;
  } | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiAllocationCompleted, setAiAllocationCompleted] = useState<boolean>(false);

  // Quote Comparison state
  const [showQuoteComparisonModal, setShowQuoteComparisonModal] = useState(false);
  const [comparisonAssetId, setComparisonAssetId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedProject) {
      // Check AI allocation completion status
      setAiAllocationCompleted(!!selectedProject.ai_allocation_completed_at);
    }
  }, [selectedProject]);






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
    
    // Open preview modal instead of sending directly
    setPreviewAsset(supplierSelectionAsset);
    setPreviewSupplierIds(selectedSupplierIds);
    setShowPreviewModal(true);
    
    // Close supplier selection modal
    setShowSupplierModal(false);
    setSupplierSelectionAsset(null);
    setSelectedSupplierIds([]);
    setSuggestedSuppliers([]);
  };

  const handleSendCustomizedEmails = async (customizedEmails: CustomizedEmail[]) => {
    if (!previewAsset || previewSupplierIds.length === 0) return;
    
    try {
      // Get producer settings for email
      const settings = await ProducerService.loadProducerSettings();

      const from = settings ? {
        name: settings.from_name,
        email: settings.from_email
      } : undefined;

      const result = await QuoteRequestService.sendQuoteRequests(
        previewAsset.id,
        previewSupplierIds,
        customizedEmails,
        from ? { name: String(from.name), email: String(from.email) } : undefined
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


  const availableTags = ProducerService.getAvailableTags(suppliers);






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

  // Quote Comparison Functions
  const hasMultipleQuotes = (assetId: string): boolean => {
    const assetQuotes = getAssetQuotes(assetId);
    return assetQuotes.length > 1;
  };

  const openQuoteComparison = (assetId: string) => {
    setComparisonAssetId(assetId);
    setShowQuoteComparisonModal(true);
  };

  const closeQuoteComparison = () => {
    setShowQuoteComparisonModal(false);
    setComparisonAssetId(null);
  };

  const handleQuoteUpdate = () => {
    // Reload project details when quotes are updated
    if (selectedProject) {
      loadProjectDetails(selectedProject.id);
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
      <DashboardHeader onCreateProject={openCreateProject} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ProjectList
          projects={projects}
          selectedProject={selectedProject}
          onProjectSelect={setSelectedProject}
          getStatusColor={getStatusColor}
        />

        <div className="lg:col-span-2">
          {selectedProject ? (
            <div className="space-y-6">
              <ProjectOverview
                project={selectedProject}
                assets={assets}
                onEdit={openEditProject}
                onDelete={handleDeleteProject}
                getStatusColor={getStatusColor}
              />

              <AssetManagement
                assets={assets}
                quotes={quotes}
                aiAllocationCompleted={aiAllocationCompleted}
                onCreateAsset={openCreateAsset}
                onEditAsset={openEditAsset}
                onDeleteAsset={handleDeleteAsset}
                onSendToSuppliers={handleSendToSuppliers}
                onCompareQuotes={openQuoteComparison}
                onOpenAIAllocation={openAIAllocation}
                getAssetQuotes={getAssetQuotes}
                hasMultipleQuotes={hasMultipleQuotes}
                getStatusColor={getStatusColor}
              />
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

      <ProjectModal
        isOpen={showProjectModal}
        isEditing={isEditingProject}
        isSubmitting={isSubmittingProject}
        projectForm={projectForm}
        allocationMethod={allocationMethod}
        onClose={closeProjectModal}
        onSubmit={submitProjectForm}
        onFormChange={updateProjectForm}
        onAllocationMethodChange={setAllocationMethod}
      />

      <AssetModal
        isOpen={showAssetModal}
        isEditing={isEditingAsset}
        isSubmitting={isSubmittingAsset}
        assetForm={assetForm}
        suppliers={suppliers}
        onClose={closeAssetModal}
        onSubmit={submitAssetForm}
        onFormChange={(field, value) => updateAssetForm(field as keyof typeof assetForm, value)}
      />

      <TagSelectionModal
        isOpen={showTagModal}
        availableTags={availableTags}
        selectedTags={selectedTags}
        onClose={() => { setShowTagModal(false); setSelectedTags([]); setTagSelectionAsset(null); }}
        onTagToggle={(tag) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
        onConfirm={confirmSendWithTags}
      />

      <SupplierSelectionModal
        isOpen={showSupplierModal}
        asset={supplierSelectionAsset}
        suggestedSuppliers={suggestedSuppliers}
        selectedSupplierIds={selectedSupplierIds}
        loading={loadingSuppliers}
        onClose={() => {
                        setShowSupplierModal(false);
                        setSupplierSelectionAsset(null);
                        setSelectedSupplierIds([]);
                        setSuggestedSuppliers([]);
                      }}
        onSupplierToggle={handleSupplierSelection}
        onConfirm={confirmSendQuoteRequests}
      />

      {/* Quote Request Preview Modal */}
      <QuoteRequestPreviewModal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setPreviewAsset(null);
          setPreviewSupplierIds([]);
        }}
        asset={previewAsset!}
        supplierIds={previewSupplierIds}
        onSend={handleSendCustomizedEmails}
      />

      <AIAllocationModal
        isOpen={showAIAllocationModal && !aiAllocationCompleted}
        aiSuggestions={aiSuggestions}
        loading={loadingAI}
        onClose={() => {
                      setShowAIAllocationModal(false);
                      setAiSuggestions(null);
                    }}
        onAnalyze={performAIAnalysis}
        onApply={applyAISuggestions}
      />

      {/* Quote Comparison Modal */}
      {showQuoteComparisonModal && comparisonAssetId && (
        <QuoteComparisonModal
          isOpen={showQuoteComparisonModal}
          onClose={closeQuoteComparison}
          assetId={comparisonAssetId}
          onQuoteUpdate={handleQuoteUpdate}
        />
      )}
    </div>
  );
};

export default ProducerDashboard;
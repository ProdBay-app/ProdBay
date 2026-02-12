import React from 'react';
import type { Project, Asset, Quote, Supplier } from '@/lib/supabase';
import type { ProjectFormData, AssetFormData } from '@/services/producerService';
import type { SuggestedSupplier } from '@/services/supplierApiService';
import type { AIAssetSuggestion } from '@/services/aiAllocationService';
import type { CustomizedEmail } from '@/services/quoteRequestService';
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

export interface ProducerDashboardProps {
  // Data
  projects: Project[];
  selectedProject: Project | null;
  assets: Asset[];
  quotes: Quote[];
  suppliers: Supplier[];
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
  supplierSelectionAsset: Asset | null;
  previewAsset: Asset | null;
  previewSupplierIds: string[];
  comparisonAssetId: string | null;
  
  // Actions
  selectProject: (project: Project | null) => void;
  openCreateProject: () => void;
  openEditProject: () => void;
  closeProjectModal: () => void;
  updateProjectForm: (field: keyof ProjectFormData, value: string | number | undefined) => void;
  setAllocationMethod: (method: 'static' | 'ai') => void;
  submitProjectForm: (e: React.FormEvent) => Promise<void>;
  deleteProject: () => Promise<void>;
  
  // PDF upload props
  onPdfUpload: (file: File) => void;
  isUploadingPdf: boolean;
  uploadError: string | null;
  uploadedFilename: string | null;
  uploadedPdfFile: File | null;
  onPdfDownload: (file: File) => void;
  
  openCreateAsset: () => Promise<void>;
  openEditAsset: (asset: Asset) => Promise<void>;
  closeAssetModal: () => void;
  updateAssetForm: (field: keyof AssetFormData, value: string | undefined) => void;
  submitAssetForm: (e: React.FormEvent) => Promise<void>;
  deleteAsset: (asset: Asset) => Promise<void>;
  
  handleSendToSuppliers: (asset: Asset) => Promise<void>;
  handleSupplierSelection: (supplierId: string) => void;
  confirmSendQuoteRequests: () => Promise<void>;
  handleSendCustomizedEmails: (customizedEmails: CustomizedEmail[]) => Promise<void>;
  
  handleTagToggle: (tag: string) => void;
  confirmSendWithTags: () => Promise<void>;
  
  openAIAllocation: () => void;
  performAIAnalysis: () => Promise<void>;
  applyAISuggestions: () => Promise<void>;
  
  openQuoteComparison: (assetId: string) => void;
  closeQuoteComparison: () => void;
  handleQuoteUpdate: () => void;
  
  closeTagModal: () => void;
  closeSupplierModal: () => void;
  closePreviewModal: () => void;
  closeAIAllocationModal: () => void;
  
  // Utils
  getStatusColor: (status: string) => string;
  getAssetQuotes: (assetId: string) => Quote[];
  hasMultipleQuotes: (assetId: string) => boolean;
  availableTags: string[];
}

const ProducerDashboard: React.FC<ProducerDashboardProps> = ({
  // Data
  projects,
  selectedProject,
  assets,
  quotes,
  suppliers,
  loadingSuppliers,
  loadingAI,
  
  // Modal states
  showProjectModal,
  showAssetModal,
  showTagModal,
  showSupplierModal,
  showPreviewModal,
  showAIAllocationModal,
  showQuoteComparisonModal,
  
  // Form states
  isEditingProject,
  isSubmittingProject,
  isEditingAsset,
  isSubmittingAsset,
  projectForm,
  assetForm,
  allocationMethod,
  
  // AI and supplier states
  aiSuggestions,
  aiAllocationCompleted,
  suggestedSuppliers,
  selectedSupplierIds,
  selectedTags,
  
  // Selection states
  supplierSelectionAsset,
  previewAsset,
  previewSupplierIds,
  comparisonAssetId,
  
  // Actions
  selectProject,
  openCreateProject,
  openEditProject,
  closeProjectModal,
  updateProjectForm,
  setAllocationMethod,
  submitProjectForm,
  deleteProject,
  
  onPdfUpload,
  isUploadingPdf,
  uploadError,
  uploadedFilename,
  uploadedPdfFile,
  onPdfDownload,
  
  openCreateAsset,
  openEditAsset,
  closeAssetModal,
  updateAssetForm,
  submitAssetForm,
  deleteAsset,
  
  handleSendToSuppliers,
  handleSupplierSelection,
  confirmSendQuoteRequests,
  handleSendCustomizedEmails,
  
  handleTagToggle,
  confirmSendWithTags,
  
  openAIAllocation,
  performAIAnalysis,
  applyAISuggestions,
  
  openQuoteComparison,
  closeQuoteComparison,
  handleQuoteUpdate,
  
  closeTagModal,
  closeSupplierModal,
  closePreviewModal,
  closeAIAllocationModal,
  
  // Utils
  getStatusColor,
  getAssetQuotes,
  hasMultipleQuotes,
  availableTags
}) => {
  return (
    <div className="space-y-6">
      <DashboardHeader onCreateProject={openCreateProject} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ProjectList
          projects={projects}
          selectedProject={selectedProject}
          onProjectSelect={selectProject}
          getStatusColor={getStatusColor}
        />

        <div className="lg:col-span-2">
          {selectedProject ? (
            <div className="space-y-6">
              <ProjectOverview
                project={selectedProject}
                assets={assets}
                onEdit={openEditProject}
                onDelete={deleteProject}
                getStatusColor={getStatusColor}
              />

              <AssetManagement
                assets={assets}
                quotes={quotes}
                aiAllocationCompleted={aiAllocationCompleted}
                onCreateAsset={openCreateAsset}
                onEditAsset={openEditAsset}
                onDeleteAsset={deleteAsset}
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
        onPdfUpload={onPdfUpload}
        isUploadingPdf={isUploadingPdf}
        uploadError={uploadError}
        uploadedFilename={uploadedFilename}
        uploadedPdfFile={uploadedPdfFile}
        onPdfDownload={onPdfDownload}
      />

      <AssetModal
        isOpen={showAssetModal}
        isEditing={isEditingAsset}
        isSubmitting={isSubmittingAsset}
        assetForm={assetForm}
        suppliers={suppliers}
        onClose={closeAssetModal}
        onSubmit={submitAssetForm}
        onFormChange={(field, value) => updateAssetForm(field as keyof AssetFormData, value)}
      />

      <TagSelectionModal
        isOpen={showTagModal}
        availableTags={availableTags}
        selectedTags={selectedTags}
        onClose={closeTagModal}
        onTagToggle={handleTagToggle}
        onConfirm={confirmSendWithTags}
      />

      <SupplierSelectionModal
        isOpen={showSupplierModal}
        asset={supplierSelectionAsset}
        suggestedSuppliers={suggestedSuppliers}
        selectedSupplierIds={selectedSupplierIds}
        loading={loadingSuppliers}
        onClose={closeSupplierModal}
        onSupplierToggle={handleSupplierSelection}
        onConfirm={confirmSendQuoteRequests}
      />

      {/* Quote Request Preview Modal */}
      <QuoteRequestPreviewModal
        isOpen={showPreviewModal}
        onClose={closePreviewModal}
        asset={previewAsset!}
        supplierIds={previewSupplierIds}
        onSend={handleSendCustomizedEmails}
      />

      <AIAllocationModal
        isOpen={showAIAllocationModal && !aiAllocationCompleted}
        aiSuggestions={aiSuggestions}
        loading={loadingAI}
        onClose={closeAIAllocationModal}
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
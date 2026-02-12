import { useState, useEffect, useCallback } from 'react';
import { ProducerService, type AssetFormData } from '@/services/producerService';
import { useNotification } from './useNotification';
import type { Asset, Quote, Supplier, Project } from '@/lib/supabase';

export interface UseAssetManagementReturn {
  // State
  assets: Asset[];
  quotes: Quote[];
  suppliers: Supplier[];
  isLoading: boolean;
  showAssetModal: boolean;
  isEditingAsset: boolean;
  isSubmittingAsset: boolean;
  assetForm: AssetFormData;
  
  // Actions
  loadProjectDetails: (projectId: string) => Promise<void>;
  openCreateAsset: () => Promise<void>;
  openEditAsset: (asset: Asset) => Promise<void>;
  closeAssetModal: () => void;
  updateAssetForm: (field: keyof AssetFormData, value: string | undefined) => void;
  submitAssetForm: (e: React.FormEvent) => Promise<void>;
  deleteAsset: (asset: Asset) => Promise<void>;
  refreshAssets: (projectId: string) => Promise<void>;
}

export const useAssetManagement = (currentProject: Project | null): UseAssetManagementReturn => {
  const { showSuccess, showError, showConfirm } = useNotification();
  
  // Core asset state
  const [assets, setAssets] = useState<Asset[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Asset modal state
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [isEditingAsset, setIsEditingAsset] = useState(false);
  const [isSubmittingAsset, setIsSubmittingAsset] = useState(false);
  
  // Asset form state
  const [assetForm, setAssetForm] = useState<AssetFormData>({
    id: undefined,
    asset_name: '',
    specifications: '',
    timeline: '',
    status: 'Pending',
    assigned_supplier_id: undefined
  });

  // Load suppliers for asset forms
  const loadSuppliers = useCallback(async () => {
    try {
      const data = await ProducerService.loadSuppliers();
      setSuppliers(data);
    } catch (e) {
      console.error('Failed to load suppliers', e);
    }
  }, []);

  // Load project details (assets and quotes)
  const loadProjectDetails = useCallback(async (projectId: string) => {
    setIsLoading(true);
    try {
      const { assets: assetsData, quotes: quotesData } = await ProducerService.loadProjectDetails(projectId);
      setAssets(assetsData);
      setQuotes(quotesData);
    } catch (error) {
      console.error('Error loading project details:', error);
      showError('Failed to load wedding details');
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  // Open create asset modal
  const openCreateAsset = useCallback(async () => {
    if (!currentProject) return;
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
  }, [currentProject, loadSuppliers]);

  // Open edit asset modal
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

  // Close asset modal
  const closeAssetModal = useCallback(() => {
    setShowAssetModal(false);
    setIsEditingAsset(false);
    setIsSubmittingAsset(false);
  }, []);

  // Update asset form field
  const updateAssetForm = useCallback((field: keyof AssetFormData, value: string | undefined) => {
    setAssetForm(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Submit asset form (create or update)
  const submitAssetForm = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;
    
    setIsSubmittingAsset(true);
    try {
      if (isEditingAsset && assetForm.id) {
        // Update existing asset
        await ProducerService.updateAsset(assetForm.id, assetForm);
        showSuccess('Service updated successfully');
      } else {
        // Create new asset
        await ProducerService.createAsset(currentProject.id, assetForm);
        showSuccess('Service created successfully');
      }
      
      // Refresh project details
      await loadProjectDetails(currentProject.id);
      closeAssetModal();
    } catch (err) {
      console.error('Failed to save asset', err);
      showError('Failed to save service');
    } finally {
      setIsSubmittingAsset(false);
    }
  }, [isEditingAsset, assetForm, currentProject, loadProjectDetails, showSuccess, showError, closeAssetModal]);

  // Delete asset
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
      if (currentProject) {
        await loadProjectDetails(currentProject.id);
      }
      showSuccess('Service deleted successfully');
    } catch (err) {
      console.error('Failed to delete asset', err);
      showError('Failed to delete service');
    }
  }, [currentProject, loadProjectDetails, showConfirm, showSuccess, showError]);

  // Refresh assets for current project
  const refreshAssets = useCallback(async (projectId: string) => {
    await loadProjectDetails(projectId);
  }, [loadProjectDetails]);

  // Auto-load project details when currentProject changes
  useEffect(() => {
    if (currentProject) {
      loadProjectDetails(currentProject.id);
    } else {
      setAssets([]);
      setQuotes([]);
    }
  }, [currentProject, loadProjectDetails]);

  return {
    // State
    assets,
    quotes,
    suppliers,
    isLoading,
    showAssetModal,
    isEditingAsset,
    isSubmittingAsset,
    assetForm,
    
    // Actions
    loadProjectDetails,
    openCreateAsset,
    openEditAsset,
    closeAssetModal,
    updateAssetForm,
    submitAssetForm,
    deleteAsset,
    refreshAssets
  };
};

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Clock, Package, Hash, Tag, Check, Loader2, Plus, ChevronDown, ChevronUp, Truck } from 'lucide-react';
import { ProducerService } from '@/services/producerService';
import { useNotification } from '@/hooks/useNotification';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';
import QuotesList from './QuotesList';
import SupplierStatusTracker from './SupplierStatusTracker';
import QuoteDetailModal from './QuoteDetailModal';
import EnhancedRequestQuoteFlow from './EnhancedRequestQuoteFlow';
import { getTagColor, PREDEFINED_ASSET_TAGS, filterTags } from '@/utils/assetTags';
import { toTitleCase } from '@/utils/textFormatters';
import type { Asset, Quote } from '@/lib/supabase';

interface AssetDetailModalProps {
  isOpen: boolean;
  asset: Asset | null;
  onClose: () => void;
  onAssetUpdate: (updatedAsset: Asset) => void;
}

/**
 * AssetDetailModal - A comprehensive interactive modal for viewing and managing asset details
 * 
 * Features:
 * - Large, focused modal for deep dive into asset information
 * - Displays all asset fields in an organized, readable format
 * - Responsive layout (full-screen on mobile, large centered on desktop)
 * - Autosave functionality: fields are always editable and save automatically
 * - Supplier status tracking and quotes management
 */
const AssetDetailModal: React.FC<AssetDetailModalProps> = ({ isOpen, asset, onClose, onAssetUpdate }) => {
  const { showError } = useNotification();
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [activeQuote, setActiveQuote] = useState<Quote | null>(null);
  const [quotesRefreshKey, setQuotesRefreshKey] = useState(0);
  const [activeAssetViewTab, setActiveAssetViewTab] = useState<'quotes' | 'status'>('quotes');
  const [isMetadataExpanded, setIsMetadataExpanded] = useState(false);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [tagSearchTerm, setTagSearchTerm] = useState('');
  
  // Request Quote Modal state (lifted from QuotesList to prevent unmounting)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [existingQuotes, setExistingQuotes] = useState<Quote[]>([]);
  
  // Track if this is the initial load (to prevent autosave on mount)
  const isInitialMount = useRef(true);
  
  // Bug 1 Fix: Track the previous asset ID and its editing data to save before switching
  const previousAssetIdRef = useRef<string | null>(null);
  const previousEditingDataRef = useRef<typeof editingData | null>(null);
  const pendingSaveAssetIdRef = useRef<string | null>(null);
  
  // Store timeout IDs for cleanup (for Bug 2 fix)
  const saveStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const errorStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize editing data directly from asset (before early return)
  const [editingData, setEditingData] = useState({
    asset_name: asset?.asset_name || '',
    specifications: asset?.specifications || '',
    quantity: asset?.quantity,
    tags: asset?.tags || [],
    supplier_context: asset?.supplier_context ?? ''
  });

  // Sync editingData when asset ID changes (switching to a different asset)
  // This won't trigger on saves because the asset ID stays the same
  useEffect(() => {
    if (asset && !isSaving && saveStatus !== 'saving') {
      const currentAssetId = asset.id;
      const previousAssetId = previousAssetIdRef.current;
      
      // Bug 1 Fix: If switching to a different asset, save the previous asset's changes first
      if (previousAssetId && previousAssetId !== currentAssetId && previousEditingDataRef.current) {
        // There are unsaved changes for the previous asset - save them immediately
        const previousData = previousEditingDataRef.current;
        const previousAssetIdToSave = previousAssetId;
        
        // Save the previous asset's changes asynchronously (don't block the UI)
        // Use a separate async function to avoid issues with useEffect cleanup
        (async () => {
          try {
            const previousAsset = await ProducerService.getAssetById(previousAssetIdToSave);
            const updatedAsset = await ProducerService.updateAsset(previousAssetIdToSave, {
              asset_name: toTitleCase(previousData.asset_name),
              specifications: previousData.specifications,
              timeline: previousAsset.timeline || '',
              status: previousAsset.status,
              assigned_supplier_id: previousAsset.assigned_supplier_id,
              quantity: previousData.quantity,
              tags: previousData.tags,
              supplier_context: previousData.supplier_context || null
            });
            // Notify parent of the update
            onAssetUpdate(updatedAsset);
          } catch (err) {
            console.error('Error saving previous asset before switch:', err);
            // Don't show error to user as they're switching assets - it's a background save
          }
        })();
      }
      
      // Update tracking refs
      previousAssetIdRef.current = currentAssetId;
      previousEditingDataRef.current = null; // Clear previous data
      
      setEditingData({
        asset_name: asset.asset_name || '',
        specifications: asset.specifications || '',
        quantity: asset.quantity,
        tags: asset.tags || [],
        supplier_context: asset.supplier_context ?? ''
      });
      setSaveStatus('idle');
      isInitialMount.current = true;
      pendingSaveAssetIdRef.current = null; // Reset pending save tracking
      setIsMetadataExpanded(false); // Always default metadata to collapsed on asset change
    }
  }, [asset?.id, onAssetUpdate]); // Only sync when asset ID changes (switching assets), not on saves

  // Save function that will be debounced (defined before early return to maintain hook order)
  const saveAsset = async () => {
    const currentAssetId = asset?.id;
    if (!currentAssetId || isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Bug 1 Fix: If this save is for a different asset (user switched), abort
    // The previous asset's changes should have been saved in the useEffect above
    if (pendingSaveAssetIdRef.current && pendingSaveAssetIdRef.current !== currentAssetId) {
      return;
    }

    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      // Bug 1 Fix: Fetch fresh asset data to avoid using stale properties from closure
      // The asset prop may have changed when the debounced callback executes asynchronously
      const currentAsset = await ProducerService.getAssetById(currentAssetId);
      
      const updatedAsset = await ProducerService.updateAsset(currentAssetId, {
        asset_name: toTitleCase(editingData.asset_name),
        specifications: editingData.specifications,
        timeline: currentAsset.timeline || '',
        status: currentAsset.status,
        assigned_supplier_id: currentAsset.assigned_supplier_id,
        quantity: editingData.quantity,
        tags: editingData.tags,
        supplier_context: editingData.supplier_context?.trim() || null
      });

      onAssetUpdate(updatedAsset);
      setSaveStatus('saved');
      pendingSaveAssetIdRef.current = null; // Clear pending save tracking
      
      // Bug 2 Fix: Clear any existing timeout and store the new one
      if (saveStatusTimeoutRef.current) {
        clearTimeout(saveStatusTimeoutRef.current);
      }
      // Reset saved status after 2 seconds
      saveStatusTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle');
        saveStatusTimeoutRef.current = null;
      }, 2000);
    } catch (err) {
      console.error('Error updating asset:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update asset';
      setSaveStatus('error');
      showError(errorMessage);
      pendingSaveAssetIdRef.current = null; // Clear pending save tracking
      
      // Bug 2 Fix: Clear any existing timeout and store the new one
      if (errorStatusTimeoutRef.current) {
        clearTimeout(errorStatusTimeoutRef.current);
      }
      // Reset error status after 3 seconds
      errorStatusTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle');
        errorStatusTimeoutRef.current = null;
      }, 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Debounced save function (2000ms delay) - MUST be called before early return to maintain hook order
  // Note: onBlur provides immediate save when clicking away, so debounce acts as a safety net
  const debouncedSave = useDebouncedCallback(saveAsset, 2000);
  
  // Bug 2 Fix: Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveStatusTimeoutRef.current) {
        clearTimeout(saveStatusTimeoutRef.current);
      }
      if (errorStatusTimeoutRef.current) {
        clearTimeout(errorStatusTimeoutRef.current);
      }
    };
  }, []);

  // Get available tags (predefined tags not already added)
  // Moved before early return to maintain hook order
  const getAvailableTags = () => {
    const currentTagsLower = editingData.tags.map(tag => tag.toLowerCase());
    return PREDEFINED_ASSET_TAGS.filter(
      tag => !currentTagsLower.includes(tag.name.toLowerCase())
    );
  };

  // Filter available tags based on search
  // Moved before early return to maintain hook order
  const filteredAvailableTags = useMemo(() => {
    const available = getAvailableTags();
    if (!tagSearchTerm.trim()) return available;
    return filterTags(tagSearchTerm).filter(tag => 
      available.some(availableTag => availableTag.name === tag.name)
    );
  }, [tagSearchTerm, editingData.tags]);

  // Close tag selector when clicking outside
  // Moved before early return to maintain hook order
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showTagSelector) {
        const target = event.target as Element;
        if (!target.closest('.tag-selector-container')) {
          setShowTagSelector(false);
          setTagSearchTerm('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTagSelector]);

  // Fetch existing quotes for the request modal (only when asset changes)
  useEffect(() => {
    if (asset?.id) {
      ProducerService.getQuotesForAsset(asset.id)
        .then(setExistingQuotes)
        .catch((err) => {
          console.error('Error fetching existing quotes:', err);
          setExistingQuotes([]);
        });
    }
  }, [asset?.id]);

  // Handler to open request quote modal (passed to QuotesList)
  const handleOpenRequestModal = useCallback(() => {
    setIsRequestModalOpen(true);
  }, []);

  // Handler for when quotes are requested (optimistically update local state)
  const handleQuotesRequested = useCallback((newQuotes: Quote[]) => {
    setExistingQuotes(prev => [...newQuotes, ...prev]);
    setIsRequestModalOpen(false);
  }, []);

  // Memoized callback for quote click (shared between SupplierStatusTracker and QuotesList)
  const handleQuoteClick = useCallback((quote: Quote) => {
    setActiveQuote(quote);
  }, []);

  // Memoized callback for status update (no-op but stable reference for SupplierStatusTracker)
  const handleStatusUpdate = useCallback(() => {
    // Refresh data if needed - currently no-op but keeps reference stable
  }, []);

  // Debug logging
  console.log('AssetDetailModal render:', { isOpen, asset: asset?.id });

  // Don't render if modal is closed or no asset is selected
  // IMPORTANT: All hooks must be declared BEFORE this early return
  if (!isOpen || !asset) return null;

  // Immediate save on blur
  const handleBlur = () => {
    if (!isInitialMount.current) {
      saveAsset();
    }
  };

  // Handle field changes with debounced autosave
  const handleFieldChange = (field: keyof typeof editingData, value: string | number | undefined | string[]) => {
    setEditingData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Bug 1 Fix: Store a snapshot of editing data for potential save before asset switch
      if (asset?.id) {
        previousEditingDataRef.current = updated;
        pendingSaveAssetIdRef.current = asset.id;
      }
      
      return updated;
    });
    isInitialMount.current = false;
    
    // Trigger debounced save
    debouncedSave();
  };

  // Handle tag removal
  const handleRemoveTag = (tagName: string) => {
    const updatedTags = editingData.tags.filter(tag => tag !== tagName);
    handleFieldChange('tags', updatedTags);
  };

  // Handle tag addition (only from predefined list)
  const handleAddTag = (tagName: string) => {
    // Prevent duplicates (case-insensitive check)
    const tagExists = editingData.tags.some(
      tag => tag.toLowerCase() === tagName.toLowerCase()
    );
    
    if (!tagExists) {
      const updatedTags = [...editingData.tags, tagName];
      handleFieldChange('tags', updatedTags);
    }
    
    // Close selector and reset search
    setShowTagSelector(false);
    setTagSearchTerm('');
  };

  // Format dates for display
  const formattedCreatedAt = new Date(asset.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const formattedUpdatedAt = new Date(asset.updated_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Render modal using React Portal to escape parent container constraints
  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity z-[99]"
        onClick={onClose}
        aria-hidden="true"
      />

          {/* Modal Content */}
          <div
        className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto z-[101]"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Header - Purple gradient matching brand */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-5 rounded-t-xl">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Package className="w-6 h-6 text-white" />
                    <h2 className="text-2xl font-bold text-white">
                      {toTitleCase(asset.asset_name)}
                    </h2>
                  </div>
                </div>

                {/* Save Status Indicator */}
                <div className="flex items-center gap-2">
                  {saveStatus === 'saving' && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-white rounded-lg text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </div>
                  )}
                  {saveStatus === 'saved' && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 text-green-200 rounded-lg text-sm">
                      <Check className="w-4 h-4" />
                      <span>Saved</span>
                    </div>
                  )}
                  {saveStatus === 'error' && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-200 rounded-lg text-sm">
                      <X className="w-4 h-4" />
                      <span>Error</span>
                    </div>
                  )}
                </div>
                
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="flex-shrink-0 p-2 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Body - Main Content */}
            <div className="p-6 space-y-6">
              {/* Overview Section */}
              <section>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-300" />
                  Overview
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Asset Name */}
                  <div className="lg:col-span-8">
                    <label className="block text-sm font-semibold text-gray-200 mb-1.5">
                      Asset Name
                    </label>
                    <input
                      type="text"
                      value={editingData.asset_name}
                      onChange={(e) => handleFieldChange('asset_name', e.target.value)}
                      onBlur={handleBlur}
                      className="w-full px-3 py-2 bg-black/20 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Enter asset name"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="lg:col-span-4">
                    <label className="block text-sm font-semibold text-gray-200 mb-1.5">
                      <Hash className="w-4 h-4 inline mr-1.5 text-purple-300" />
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editingData.quantity || ''}
                      onChange={(e) => handleFieldChange('quantity', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                      onBlur={handleBlur}
                      className="w-full px-3 py-2 bg-black/20 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Optional"
                    />
                  </div>

                  {/* Specifications */}
                  <div className="lg:col-span-12">
                    <label className="block text-sm font-semibold text-gray-200 mb-1.5">
                      Specifications
                    </label>
                    <textarea
                      value={editingData.specifications}
                      onChange={(e) => handleFieldChange('specifications', e.target.value)}
                      onBlur={handleBlur}
                      rows={3}
                      className="w-full px-3 py-2 bg-black/20 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-y"
                      placeholder="Enter asset specifications"
                    />
                  </div>
                </div>

                {/* Supplier & Logistics Context - Editable, included in quote requests to suppliers */}
                <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Truck className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <label className="block text-sm font-semibold text-amber-200 mb-1.5">
                        Supplier & Logistics Context
                      </label>
                      <textarea
                        value={editingData.supplier_context}
                        onChange={(e) => handleFieldChange('supplier_context', e.target.value)}
                        onBlur={handleBlur}
                        rows={3}
                        className="w-full px-3 py-2 bg-black/20 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-y"
                        placeholder="Indoor/outdoor use, installation requirements, delivery dates, operator needs, transport, etc. This is included in quote requests to suppliers."
                      />
                      <span className="inline-block mt-2 text-xs text-amber-300/80 italic">Included in quote request emails to suppliers</span>
                    </div>
                  </div>
                </div>

                {/* Tags Section */}
                <div className="mt-4 bg-black/10 border border-white/10 rounded-lg p-4">
                  <label className="block text-sm font-semibold text-gray-200 mb-2.5">
                    <Tag className="w-4 h-4 inline mr-1.5 text-purple-300" />
                    Tags
                  </label>
                  
                  {/* Existing Tags with Remove Buttons */}
                  {editingData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2.5">
                      {editingData.tags.map(tagName => (
                        <span
                          key={tagName}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white"
                          style={{ backgroundColor: getTagColor(tagName) }}
                        >
                          <Tag className="w-3 h-3" />
                          {tagName}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tagName)}
                            className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                            aria-label={`Remove ${tagName} tag`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Add Tag Selector */}
                  <div className="relative tag-selector-container">
                    <button
                      type="button"
                      onClick={() => setShowTagSelector(!showTagSelector)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 text-gray-200 rounded-lg hover:bg-white/20 transition-colors text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Add Tag
                    </button>

                    {/* Tag Dropdown */}
                    {showTagSelector && (
                      <div className="absolute z-50 mt-2 w-80 bg-gray-900 border border-white/20 rounded-lg shadow-xl max-h-96 overflow-hidden">
                        {/* Search */}
                        <div className="p-3 border-b border-white/20">
                          <input
                            type="text"
                            placeholder="Search predefined tags..."
                            value={tagSearchTerm}
                            onChange={(e) => setTagSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 bg-black/20 border border-white/20 text-white placeholder-gray-400 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            autoFocus
                          />
                        </div>

                        {/* Tag List */}
                        <div className="max-h-80 overflow-y-auto">
                          {filteredAvailableTags.length === 0 ? (
                            <div className="p-3 text-sm text-gray-300 text-center">
                              {tagSearchTerm.trim() 
                                ? 'No matching tags found' 
                                : 'All available tags have been added'}
                            </div>
                          ) : (
                            filteredAvailableTags.map((tag: { name: string; color: string; description: string }) => (
                              <button
                                key={tag.name}
                                type="button"
                                onClick={() => handleAddTag(tag.name)}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-2 transition-colors"
                              >
                                <div
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: tag.color }}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-white truncate">{tag.name}</div>
                                  <div className="text-xs text-gray-300 truncate">{tag.description}</div>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Supplier Status / Quote Requests - Tabbed Interface */}
              <section>
                <div className="mb-4">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-sm p-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveAssetViewTab('quotes')}
                        aria-selected={activeAssetViewTab === 'quotes'}
                        className={`
                          flex-1 px-6 py-3 rounded-md font-semibold text-sm transition-all duration-200
                          ${
                            activeAssetViewTab === 'quotes'
                              ? 'bg-teal-600/30 text-white border border-teal-400/50 shadow-sm'
                              : 'text-gray-300 hover:text-white hover:bg-white/5'
                          }
                        `}
                      >
                        Quote Requests
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveAssetViewTab('status')}
                        aria-selected={activeAssetViewTab === 'status'}
                        className={`
                          flex-1 px-6 py-3 rounded-md font-semibold text-sm transition-all duration-200
                          ${
                            activeAssetViewTab === 'status'
                              ? 'bg-teal-600/30 text-white border border-teal-400/50 shadow-sm'
                              : 'text-gray-300 hover:text-white hover:bg-white/5'
                          }
                        `}
                      >
                        Supplier Status
                      </button>
                    </div>
                  </div>
                </div>

                <div className={activeAssetViewTab === 'quotes' ? 'block' : 'hidden'}>
                  <QuotesList
                    assetId={asset.id}
                    assetName={asset.asset_name}
                    onQuoteClick={handleQuoteClick}
                    onOpenRequestModal={handleOpenRequestModal}
                    refreshTrigger={quotesRefreshKey}
                    isVisible={activeAssetViewTab === 'quotes'}
                  />
                </div>
                <div className={activeAssetViewTab === 'status' ? 'block' : 'hidden'}>
                  <SupplierStatusTracker
                    asset={asset}
                    onStatusUpdate={handleStatusUpdate}
                    onQuoteClick={handleQuoteClick}
                    isVisible={activeAssetViewTab === 'status'}
                    refreshTrigger={quotesRefreshKey}
                  />
                </div>
              </section>

              {/* Metadata Section */}
              <section>
                <button
                  type="button"
                  onClick={() => setIsMetadataExpanded(prev => !prev)}
                  className="w-full flex items-center justify-between text-left mb-2 px-1 py-1 rounded-lg hover:bg-white/5 transition-colors"
                  aria-expanded={isMetadataExpanded}
                >
                  <span className="text-lg font-semibold text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-300" />
                    Metadata
                  </span>
                  {isMetadataExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-300" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-300" />
                  )}
                </button>

                {isMetadataExpanded && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="bg-black/20 rounded-lg p-4 border border-white/20">
                      <label className="block text-sm font-semibold text-gray-200 mb-1">
                        Created
                      </label>
                      <p className="text-white">{formattedCreatedAt}</p>
                    </div>

                    <div className="bg-black/20 rounded-lg p-4 border border-white/20">
                      <label className="block text-sm font-semibold text-gray-200 mb-1">
                        Last Updated
                      </label>
                      <p className="text-white">{formattedUpdatedAt}</p>
                    </div>
                  </div>
                )}
              </section>

            </div>

            {/* Footer - Optional action buttons area for future use */}
            <div className="sticky bottom-0 bg-white/10 backdrop-blur-md px-6 py-4 border-t border-white/20 rounded-b-xl">
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium shadow-sm"
                >
                  Close
                </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render modal via portal to document.body to escape parent container constraints
  return (
    <>
      {createPortal(modalContent, document.body)}
      <QuoteDetailModal
        isOpen={activeQuote !== null}
        quote={activeQuote}
        onClose={() => setActiveQuote(null)}
        onQuoteUpdate={() => {
          setQuotesRefreshKey((prev) => prev + 1);
        }}
      />
      {/* Enhanced Request Quote Flow - Rendered at AssetDetailModal level to prevent unmounting */}
      {asset && (
        <EnhancedRequestQuoteFlow
          isOpen={isRequestModalOpen}
          assetId={asset.id}
          assetName={asset.asset_name}
          asset={asset}
          existingQuotes={existingQuotes}
          onClose={() => setIsRequestModalOpen(false)}
          onQuotesRequested={handleQuotesRequested}
        />
      )}
    </>
  );
};

export default AssetDetailModal;
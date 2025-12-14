import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Clock, Package, Hash, Tag, Check, Loader2 } from 'lucide-react';
import { ProducerService } from '@/services/producerService';
import { useNotification } from '@/hooks/useNotification';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';
import QuotesList from './QuotesList';
import SupplierStatusTracker from './SupplierStatusTracker';
import QuoteDetailModal from './QuoteDetailModal';
import { getTagColor } from '@/utils/assetTags';
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
  const { showSuccess, showError } = useNotification();
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [activeQuote, setActiveQuote] = useState<Quote | null>(null);
  
  // Track if this is the initial load (to prevent autosave on mount)
  const isInitialMount = useRef(true);
  
  // Initialize editing data directly from asset (before early return)
  const [editingData, setEditingData] = useState({
    asset_name: asset?.asset_name || '',
    specifications: asset?.specifications || '',
    quantity: asset?.quantity,
    tags: asset?.tags || []
  });

  // Sync editingData when asset ID changes (switching to a different asset)
  // This won't trigger on saves because the asset ID stays the same
  useEffect(() => {
    if (asset && !isSaving && saveStatus !== 'saving') {
      setEditingData({
        asset_name: asset.asset_name || '',
        specifications: asset.specifications || '',
        quantity: asset.quantity,
        tags: asset.tags || []
      });
      setSaveStatus('idle');
      isInitialMount.current = true;
    }
  }, [asset?.id]); // Only sync when asset ID changes (switching assets), not on saves

  // Save function that will be debounced (defined before early return to maintain hook order)
  const saveAsset = async () => {
    if (!asset || isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      const updatedAsset = await ProducerService.updateAsset(asset.id, {
        asset_name: toTitleCase(editingData.asset_name),
        specifications: editingData.specifications,
        timeline: asset.timeline || '',
        status: asset.status,
        assigned_supplier_id: asset.assigned_supplier_id,
        quantity: editingData.quantity,
        tags: editingData.tags
      });

      onAssetUpdate(updatedAsset);
      setSaveStatus('saved');
      
      // Reset saved status after 2 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (err) {
      console.error('Error updating asset:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update asset';
      setSaveStatus('error');
      showError(errorMessage);
      
      // Reset error status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Debounced save function (2000ms delay) - MUST be called before early return to maintain hook order
  // Note: onBlur provides immediate save when clicking away, so debounce acts as a safety net
  const debouncedSave = useDebouncedCallback(saveAsset, 2000);

  // Debug logging
  console.log('AssetDetailModal render:', { isOpen, asset: asset?.id });

  // Don't render if modal is closed or no asset is selected
  if (!isOpen || !asset) return null;

  // Immediate save on blur
  const handleBlur = () => {
    if (!isInitialMount.current) {
      saveAsset();
    }
  };

  // Handle field changes with debounced autosave
  const handleFieldChange = (field: keyof typeof editingData, value: string | number | undefined | string[]) => {
    setEditingData(prev => ({ ...prev, [field]: value }));
    isInitialMount.current = false;
    // Trigger debounced save
    debouncedSave();
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Asset Name */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-200 mb-2">
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

                  {/* Specifications */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-200 mb-2">
                      Specifications
                    </label>
                    <textarea
                      value={editingData.specifications}
                      onChange={(e) => handleFieldChange('specifications', e.target.value)}
                      onBlur={handleBlur}
                      rows={4}
                      className="w-full px-3 py-2 bg-black/20 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-y"
                      placeholder="Enter asset specifications"
                    />
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-2">
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

                  {/* Status - Interactive Dropdown */}
                </div>

                {/* Tags Section */}
                {asset.tags && asset.tags.length > 0 && (
                  <div className="mt-6">
                    <label className="block text-sm font-semibold text-gray-200 mb-3">
                      <Tag className="w-4 h-4 inline mr-1.5 text-purple-300" />
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {asset.tags.map(tagName => (
                        <span
                          key={tagName}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white"
                          style={{ backgroundColor: getTagColor(tagName) }}
                        >
                          <Tag className="w-3 h-3" />
                          {tagName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Supplier Status Tracking Section */}
              <section>
                <SupplierStatusTracker 
                  asset={asset}
                  onStatusUpdate={() => {
                    // Refresh data if needed
                  }}
                  onQuoteClick={(quote) => setActiveQuote(quote)}
                />
              </section>

        {/* Quotes Section */}
        <section>
          <QuotesList 
            assetId={asset.id} 
            assetName={asset.asset_name}
            onQuoteClick={(quote) => setActiveQuote(quote)}
          />
        </section>

              {/* Metadata Section */}
              <section>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-300" />
                  Metadata
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </section>

              {/* Future Features - Placeholders */}
              <section className="border-t border-white/20 pt-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Coming Soon
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Quotes Placeholder */}
                  <div className="bg-white/5 rounded-lg p-5 border-2 border-dashed border-white/30 text-center">
                    <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-white font-medium text-sm">Quotes Comparison</p>
                    <p className="text-gray-300 text-xs mt-1">View and compare supplier quotes</p>
                  </div>

                  {/* Activity Placeholder */}
                  <div className="bg-white/5 rounded-lg p-5 border-2 border-dashed border-white/30 text-center">
                    <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-white font-medium text-sm">Activity Log</p>
                    <p className="text-gray-300 text-xs mt-1">Track changes and updates</p>
                  </div>

                  {/* Documents Placeholder */}
                  <div className="bg-white/5 rounded-lg p-5 border-2 border-dashed border-white/30 text-center">
                    <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-white font-medium text-sm">Documents</p>
                    <p className="text-gray-300 text-xs mt-1">Attach files and references</p>
                  </div>
                </div>
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
          // Refresh quotes if needed
        }}
      />
    </>
  );
};

export default AssetDetailModal;
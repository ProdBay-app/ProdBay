import React, { useState, useEffect } from 'react';
import { X, Building2, Mail, Tag, Loader2 } from 'lucide-react';
import { ProducerService } from '@/services/producerService';
import { useNotification } from '@/hooks/useNotification';
import type { Supplier, Quote } from '@/lib/supabase';

interface RequestQuoteModalProps {
  isOpen: boolean;
  assetId: string;
  assetName: string;
  existingQuotes: Quote[];
  onClose: () => void;
  onQuoteRequested: (newQuote: Quote) => void;
}

/**
 * RequestQuoteModal - Modal for requesting quotes from suppliers
 * 
 * Features:
 * - Displays all available suppliers
 * - Disables suppliers who already have quotes for this asset
 * - Single supplier selection (radio buttons)
 * - Shows supplier details: name, email, service categories
 * - Creates new quote record with 'Pending' status
 * - Optimistic UI update on success
 */
const RequestQuoteModal: React.FC<RequestQuoteModalProps> = ({
  isOpen,
  assetId,
  assetName,
  existingQuotes,
  onClose,
  onQuoteRequested
}) => {
  const { showSuccess, showError } = useNotification();
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  // Fetch all suppliers when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchSuppliers();
      setSelectedSupplierId(null); // Reset selection
    }
  }, [isOpen]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const data = await ProducerService.loadSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load suppliers';
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Check if a supplier already has a quote for this asset
  const hasExistingQuote = (supplierId: string): boolean => {
    return existingQuotes.some(quote => quote.supplier_id === supplierId);
  };

  // Handle quote request submission
  const handleRequestQuote = async () => {
    if (!selectedSupplierId) return;

    setSubmitting(true);
    try {
      const newQuote = await ProducerService.requestQuote(assetId, selectedSupplierId);
      
      // Notify parent component
      onQuoteRequested(newQuote);
      
      // Show success message
      const supplier = suppliers.find(s => s.id === selectedSupplierId);
      showSuccess(`Quote requested from ${supplier?.supplier_name || 'supplier'}`);
      
      // Close modal
      onClose();
    } catch (err) {
      console.error('Error requesting quote:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to request quote';
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 sm:p-6 lg:p-8">
          {/* Modal Content */}
          <div
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <h2 className="text-2xl font-bold text-white mb-1">
                    Request Quote
                  </h2>
                  <p className="text-purple-100 text-sm">
                    Select a supplier to request a quote for "{assetName}"
                  </p>
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

            {/* Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
                  <p className="text-gray-600">Loading suppliers...</p>
                </div>
              ) : suppliers.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium mb-2">No suppliers available</p>
                  <p className="text-gray-500 text-sm">
                    Please add suppliers before requesting quotes.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {suppliers.map((supplier) => {
                    const alreadyContacted = hasExistingQuote(supplier.id);
                    const isSelected = selectedSupplierId === supplier.id;

                    return (
                      <div
                        key={supplier.id}
                        className={`
                          border rounded-lg p-4 transition-all duration-200
                          ${isSelected ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200' : 'border-gray-200'}
                          ${alreadyContacted ? 'opacity-60 cursor-not-allowed' : 'hover:border-purple-300 cursor-pointer'}
                        `}
                        onClick={() => !alreadyContacted && setSelectedSupplierId(supplier.id)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Radio Button */}
                          <div className="flex-shrink-0 mt-1">
                            <input
                              type="radio"
                              id={`supplier-${supplier.id}`}
                              name="supplier"
                              checked={isSelected}
                              onChange={() => setSelectedSupplierId(supplier.id)}
                              disabled={alreadyContacted}
                              className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                            />
                          </div>

                          {/* Supplier Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Building2 className="w-4 h-4 text-purple-600" />
                              <label
                                htmlFor={`supplier-${supplier.id}`}
                                className="font-semibold text-gray-900 cursor-pointer"
                              >
                                {supplier.supplier_name}
                              </label>
                              {alreadyContacted && (
                                <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full font-medium">
                                  Already Contacted
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-2">
                              <Mail className="w-3.5 h-3.5" />
                              <span>{supplier.contact_email}</span>
                            </div>

                            {supplier.service_categories && supplier.service_categories.length > 0 && (
                              <div className="flex items-start gap-1.5">
                                <Tag className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                                <div className="flex flex-wrap gap-1.5">
                                  {supplier.service_categories.map((category, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                                    >
                                      {category}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedSupplierId && (
                  <span>
                    1 supplier selected
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors font-medium"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestQuote}
                  disabled={!selectedSupplierId || submitting}
                  className={`
                    px-5 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2
                    ${!selectedSupplierId || submitting
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm hover:shadow'
                    }
                  `}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Requesting...
                    </>
                  ) : (
                    'Request Quote'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RequestQuoteModal;


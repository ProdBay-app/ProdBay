import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, DollarSign, FileText, Building2, Mail, Clock, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { QuoteService } from '@/services/quoteService';
import { ProducerService } from '@/services/producerService';
import { useNotification } from '@/hooks/useNotification';
import QuoteChat from '@/components/shared/QuoteChat';
import type { Quote } from '@/lib/supabase';

interface QuoteDetailModalProps {
  isOpen: boolean;
  quote: Quote | null;
  onClose: () => void;
  onQuoteUpdate?: () => void;
}

/**
 * QuoteDetailModal - Unified view for quote details and chat
 * 
 * Features:
 * - Two-column layout (desktop): Quote details left, Chat right
 * - Stacked layout (mobile): Quote details top, Chat bottom
 * - Displays all quote information (cost, notes, PDF, status, supplier)
 * - Integrated chat interface
 * - Portal rendering for proper z-index
 */
const QuoteDetailModal: React.FC<QuoteDetailModalProps> = ({
  isOpen,
  quote,
  onClose,
  onQuoteUpdate
}) => {
  const { showError, showSuccess } = useNotification();
  const [quoteData, setQuoteData] = useState<{
    quote: any;
    asset: any;
    supplier: any;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  // Load quote data when modal opens
  useEffect(() => {
    if (isOpen && quote?.id) {
      loadQuoteData();
    } else {
      // Reset state when modal closes
      setQuoteData(null);
      setError(null);
      setLoading(false);
      setAccepting(false);
    }
  }, [isOpen, quote?.id]);

  // Handle accept quote
  const handleAcceptQuote = async () => {
    if (!quote || quote.status !== 'Submitted') return;

    setAccepting(true);
    try {
      const result = await ProducerService.acceptQuote(quote.id);
      
      showSuccess('Quote accepted successfully! The asset has been updated and other quotes have been rejected.');
      
      // Reload quote data to reflect the new status
      await loadQuoteData();
      
      // Notify parent component to refresh asset data
      onQuoteUpdate?.();
    } catch (error) {
      console.error('Error accepting quote:', error);
      showError(error instanceof Error ? error.message : 'Failed to accept quote. Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  const loadQuoteData = async () => {
    if (!quote?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await QuoteService.getQuoteMessages(quote.id);
      
      if (!response.success || !response.data) {
        setError(response.error?.message || 'Failed to load quote data');
        return;
      }

      setQuoteData({
        quote: response.data.quote,
        asset: response.data.asset,
        supplier: response.data.supplier
      });
    } catch (err) {
      console.error('Error loading quote data:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Format cost as currency
  const formatCost = (cost: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cost);
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return {
          className: 'bg-amber-500/30 text-amber-200 border-amber-400/50',
          text: 'Pending Response',
          icon: <Clock className="w-3.5 h-3.5" />
        };
      case 'Submitted':
        return {
          className: 'bg-blue-500/30 text-blue-200 border-blue-400/50',
          text: 'Quote Submitted',
          icon: <FileText className="w-3.5 h-3.5" />
        };
      case 'Accepted':
        return {
          className: 'bg-green-500/30 text-green-200 border-green-400/50',
          text: 'Accepted',
          icon: <FileText className="w-3.5 h-3.5" />
        };
      case 'Rejected':
        return {
          className: 'bg-red-500/30 text-red-200 border-red-400/50',
          text: 'Rejected',
          icon: <FileText className="w-3.5 h-3.5" />
        };
      default:
        return {
          className: 'bg-gray-500/30 text-gray-200 border-gray-400/50',
          text: status,
          icon: <FileText className="w-3.5 h-3.5" />
        };
    }
  };

  // Don't render if modal is closed
  if (!isOpen || !quote) return null;

  const statusBadge = getStatusBadge(quote.status || 'Pending');

  // Render modal using React Portal
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
        className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden z-[101] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-5 rounded-t-xl">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-6 h-6 text-white" />
                <h2 className="text-2xl font-bold text-white">
                  Quote Details
                </h2>
              </div>
              {quoteData && (
                <p className="text-purple-100 text-sm">
                  {quoteData.asset?.asset_name || 'Asset'} • {quoteData.supplier?.supplier_name || 'Supplier'}
                </p>
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

        {/* Body - Two Column Layout */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Left Panel - Quote Details */}
          <div className="flex-1 lg:w-1/2 p-6 overflow-y-auto border-b lg:border-b-0 lg:border-r border-white/20">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
                <p className="text-gray-300">Loading quote details...</p>
              </div>
            ) : error ? (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                  <div>
                    <h3 className="text-red-400 font-semibold mb-1">Error loading quote</h3>
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            ) : quoteData ? (
              <div className="space-y-6">
                {/* Supplier Info */}
                <section>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-purple-300" />
                    Supplier Information
                  </h3>
                  <div className="bg-black/20 rounded-lg p-4 border border-white/20 space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-1">
                        Supplier Name
                      </label>
                      <p className="text-white">{quoteData.supplier?.supplier_name || 'Unknown'}</p>
                    </div>
                    {quoteData.supplier?.contact_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-300" />
                        <span className="text-white">{quoteData.supplier.contact_email}</span>
                      </div>
                    )}
                  </div>
                </section>

                {/* Quote Details */}
                <section>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-purple-300" />
                    Quote Information
                  </h3>
                  <div className="bg-black/20 rounded-lg p-4 border border-white/20 space-y-4">
                    {/* Status */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-2">
                        Status
                      </label>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusBadge.className}`}>
                        {statusBadge.icon}
                        {statusBadge.text}
                      </span>
                    </div>

                    {/* Cost */}
                    {quote.cost > 0 && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-200 mb-1">
                          Quote Amount
                        </label>
                        <p className="text-2xl font-bold text-white">
                          {formatCost(quote.cost)}
                        </p>
                      </div>
                    )}

                    {/* Notes */}
                    {quote.notes_capacity && quote.notes_capacity.trim() && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-200 mb-2">
                          Notes
                        </label>
                        <p className="text-white text-sm whitespace-pre-wrap leading-relaxed bg-black/30 rounded p-3">
                          {quote.notes_capacity}
                        </p>
                      </div>
                    )}

                    {/* PDF Document */}
                    {quote.quote_document_url && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-200 mb-2">
                          Quote Document
                        </label>
                        <a
                          href={quote.quote_document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          title="View quote PDF document"
                        >
                          <FileText className="w-4 h-4" />
                          <span>View Quote PDF</span>
                        </a>
                      </div>
                    )}

                    {/* Service Categories */}
                    {quoteData.supplier?.service_categories && quoteData.supplier.service_categories.length > 0 && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-200 mb-2">
                          Service Categories
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {quoteData.supplier.service_categories.map((category: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-1 text-xs bg-purple-500/20 text-purple-200 rounded border border-purple-400/50"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">
                          Created
                        </label>
                        <p className="text-white text-sm">{formatDate(quote.created_at)}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">
                          Updated
                        </label>
                        <p className="text-white text-sm">{formatDate(quote.updated_at)}</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Accept Quote Button */}
                {quote.status === 'Submitted' && (
                  <section>
                    <button
                      onClick={handleAcceptQuote}
                      disabled={accepting}
                      className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg px-6 py-4 font-semibold hover:from-purple-700 hover:to-purple-800 transition-all flex items-center justify-center space-x-2 disabled:bg-gray-600 disabled:cursor-not-allowed shadow-lg"
                    >
                      {accepting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Accepting Quote...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          <span>Accept Quote</span>
                        </>
                      )}
                    </button>
                  </section>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-300">
                <p>No quote data available</p>
              </div>
            )}
          </div>

          {/* Right Panel - Chat */}
          <div className="flex-1 lg:w-1/2 p-6 overflow-hidden flex flex-col min-h-0">
            {loading ? (
              <div className="flex items-center justify-center h-full text-gray-300">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <p>Loading chat...</p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              </div>
            ) : quoteData ? (
              <QuoteChat
                quoteId={quote.id}
                supplierName={quoteData.supplier?.supplier_name || quote.supplier?.supplier_name || 'Supplier'}
                assetName={quoteData.asset?.asset_name || 'Asset'}
                onMessageSent={onQuoteUpdate}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-300">
                <p>Unable to load chat</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default QuoteDetailModal;


import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FileText, Building2, Mail, DollarSign, Plus, Clock, AlertCircle, Loader2, BarChart3, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { ProducerService } from '@/services/producerService';
import { useNotification } from '@/hooks/useNotification';
import QuoteComparisonModal from './QuoteComparisonModal';
import type { Quote } from '@/lib/supabase';
import { getSupplierPrimaryEmail } from '@/utils/supplierUtils';

interface QuotesListProps {
  assetId: string;
  assetName: string;
  onQuoteClick?: (quote: Quote) => void;
  onOpenRequestModal: () => void;
  refreshTrigger?: number;
}

/**
 * QuotesList - Display and manage quotes for an asset
 * 
 * Features:
 * - Fetches and displays all quotes for the asset
 * - Shows supplier details for each quote
 * - Color-coded status badges
 * - Cost display (or "Pending Response" indicator)
 * - "Request Quote" button to add new suppliers
 * - Loading and error states
 * - Empty state when no quotes exist
 */
const QuotesList: React.FC<QuotesListProps> = ({ assetId, assetName, onQuoteClick, onOpenRequestModal, refreshTrigger }) => {
  const { showError } = useNotification();
  
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [showRejected, setShowRejected] = useState(false);
  
  // Polling refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const loadingRef = useRef(loading);

  // Fetch quotes with polling support
  const fetchQuotes = useCallback(async () => {
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const data = await ProducerService.getQuotesForAsset(assetId);
      setQuotes(data);
    } catch (err) {
      console.error('Error fetching quotes:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load quotes';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [assetId, showError]);

  // Update loading ref when loading state changes
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  // Set up polling interval for quotes (20 seconds)
  useEffect(() => {
    // Initial load
    fetchQuotes();

    // Set up polling interval (20 seconds)
    intervalRef.current = setInterval(() => {
      // Only poll if not currently loading to prevent overlapping requests
      if (!loadingRef.current) {
        fetchQuotes();
      }
    }, 20000); // 20 seconds

    // Cleanup: clear interval on unmount or when assetId changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchQuotes]);

  // Refresh on demand from parent (e.g., after accept in detail modal)
  useEffect(() => {
    if (refreshTrigger !== undefined && !loadingRef.current) {
      fetchQuotes();
    }
  }, [refreshTrigger, fetchQuotes]);

  // Handle quote updates from comparison modal (accepts/rejects)
  const handleQuoteUpdate = () => {
    // Refresh quotes list after accept/reject actions
    fetchQuotes();
  };

  const winnerQuote = quotes.find((quote) => quote.status === 'Accepted') || null;
  const activeQuotes = quotes.filter((quote) => quote.status === 'Pending' || quote.status === 'Submitted');
  const rejectedQuotes = quotes.filter((quote) => quote.status === 'Rejected');

  useEffect(() => {
    if (rejectedQuotes.length === 0 && showRejected) {
      setShowRejected(false);
    }
  }, [rejectedQuotes.length, showRejected]);

  // Check if we have multiple submitted quotes (for comparison button)
  const hasMultipleSubmittedQuotes = activeQuotes.filter(
    q => q.status === 'Submitted' && q.cost > 0
  ).length > 1;

  // Get status badge styling
  const getStatusBadge = (quote: Quote) => {
    const { status, cost } = quote;

    if (status === 'Pending' || (status === 'Submitted' && cost === 0)) {
      return {
        className: 'bg-amber-500/30 text-amber-200 border-amber-400/50',
        text: 'Pending Response',
        icon: <Clock className="w-3.5 h-3.5" />
      };
    } else if (status === 'Submitted') {
      return {
        className: 'bg-wedding-primary/30 text-wedding-primary-light border-wedding-primary-light/50',
        text: 'Quote Submitted',
        icon: <FileText className="w-3.5 h-3.5" />
      };
    } else if (status === 'Accepted') {
      return {
        className: 'bg-green-500/30 text-green-200 border-green-400/50',
        text: 'Accepted',
        icon: <FileText className="w-3.5 h-3.5" />
      };
    } else if (status === 'Rejected') {
      return {
        className: 'bg-red-500/30 text-red-200 border-red-400/50',
        text: 'Rejected',
        icon: <FileText className="w-3.5 h-3.5" />
      };
    }

    return {
      className: 'bg-gray-500/30 text-gray-200 border-gray-400/50',
      text: status,
      icon: <FileText className="w-3.5 h-3.5" />
    };
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
      year: 'numeric'
    });
  };

  const renderQuoteCard = (quote: Quote, options?: { isWinner?: boolean; dimmed?: boolean }) => {
    const { isWinner = false, dimmed = false } = options || {};
    const badge = getStatusBadge(quote);
    const isPending = quote.status === 'Pending' || (quote.status === 'Submitted' && quote.cost === 0);
    const hasResponseDetails = quote.status === 'Submitted' || quote.status === 'Accepted' || quote.status === 'Rejected';
    const supplierEmail = quote.supplier ? getSupplierPrimaryEmail(quote.supplier) : null;

    return (
      <div
        key={quote.id}
        className={[
          'bg-white/10 backdrop-blur-md border rounded-lg p-4 hover:bg-white/20 transition-colors',
          isWinner ? 'border-green-500/80 bg-green-500/10' : 'border-white/20',
          dimmed ? 'opacity-75' : ''
        ].join(' ')}
      >
        {/* Supplier Name and Status */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-1">
            <Building2 className="w-5 h-5 text-purple-300 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-white">
                  {quote.supplier?.supplier_name || 'Unknown Vendor'}
                </h4>
                {isWinner && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/30 text-green-200 border border-green-400/50">
                    Winner
                  </span>
                )}
              </div>
              {supplierEmail && (
                <div className="flex items-center gap-1.5 text-sm text-gray-300 mt-0.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{supplierEmail}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.className}`}>
            {badge.icon}
            {badge.text}
          </span>
        </div>

        {/* Cost or Pending Indicator */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div className="flex items-center gap-4">
            {/* Cost Display */}
            {isPending ? (
              <div className="flex items-center gap-2 text-amber-300">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Awaiting vendor response</span>
              </div>
            ) : quote.cost > 0 ? (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-300" />
                <span className="text-lg font-bold text-white">
                  {formatCost(quote.cost)}
                </span>
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            {/* Created Date */}
            <div className="text-xs text-gray-400">
              Requested {formatDate(quote.created_at)}
            </div>

            {/* View Details Button */}
            <button
              onClick={() => onQuoteClick?.(quote)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-wedding-primary text-white rounded-lg hover:bg-wedding-primary-hover transition-colors text-sm font-medium"
              title="View quote details and chat"
            >
              <MessageCircle className="w-4 h-4" />
              <span>View Details</span>
            </button>
          </div>
        </div>

        {/* Notes (for supplier responses) */}
        {hasResponseDetails && quote.notes_capacity && quote.notes_capacity.trim() && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-sm font-semibold text-gray-300 mb-2">Notes:</p>
            <p className="text-white text-sm whitespace-pre-wrap leading-relaxed">
              {quote.notes_capacity}
            </p>
          </div>
        )}

        {/* PDF Document Link (for supplier responses) */}
        {hasResponseDetails && quote.quote_document_url && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <a
              href={quote.quote_document_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 bg-wedding-primary text-white rounded-lg hover:bg-wedding-primary-hover transition-colors text-sm font-medium"
              title="View quote PDF document"
            >
              <FileText className="w-4 h-4" />
              <span>View Quote PDF</span>
            </a>
          </div>
        )}

        {/* Service Categories (if available) */}
        {quote.supplier?.service_categories && quote.supplier.service_categories.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex flex-wrap gap-1.5">
              {quote.supplier.service_categories.map((category, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 text-xs bg-wedding-primary/20 text-wedding-primary-light rounded border border-wedding-primary-light/50"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-10 h-10 text-purple-400 animate-spin mb-3" />
        <p className="text-gray-300">Loading quotes...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-red-500/20 rounded-full w-16 h-16 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-red-400 font-semibold mb-2">Error loading quotes</p>
        <p className="text-gray-300 text-sm mb-4">{error}</p>
        <button
          onClick={fetchQuotes}
          className="px-4 py-2 bg-wedding-primary text-white rounded-lg hover:bg-wedding-primary-hover transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-300" />
          <h3 className="text-lg font-semibold text-white">
            Quote Requests
          </h3>
          {quotes.length > 0 && (
            <span className="ml-2 px-2.5 py-0.5 bg-wedding-primary/30 text-wedding-primary-light text-sm font-semibold rounded-full">
              {quotes.length}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Compare Quotes Button - Only show when multiple submitted quotes exist */}
          {hasMultipleSubmittedQuotes && (
            <button
              onClick={() => setIsComparisonModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-wedding-primary text-white rounded-lg hover:bg-wedding-primary-hover transition-colors shadow-sm font-medium text-sm"
            >
              <BarChart3 className="w-4 h-4" />
              Compare Quotes
            </button>
          )}

          {/* Request Quote Button */}
          <button
            onClick={onOpenRequestModal}
            className="flex items-center gap-2 px-4 py-2 bg-wedding-primary text-white rounded-lg hover:bg-wedding-primary-hover transition-colors shadow-sm font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Request Quote
          </button>
        </div>
      </div>

      {/* Quotes List */}
      {quotes.length === 0 ? (
        // Empty state
        <div className="bg-white/5 rounded-lg p-8 border-2 border-dashed border-white/30 text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">No quote requests yet</p>
          <p className="text-gray-300 text-sm mb-4">
            Request quotes from vendors to get pricing for this service
          </p>
          <button
            onClick={onOpenRequestModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-wedding-primary text-white rounded-lg hover:bg-wedding-primary-hover transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Request Your First Quote
          </button>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {winnerQuote && renderQuoteCard(winnerQuote, { isWinner: true })}
          {activeQuotes.map((quote) => renderQuoteCard(quote))}
          {rejectedQuotes.length > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowRejected((prev) => !prev)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 transition-colors text-sm text-gray-200"
              >
                <span>{showRejected ? 'Hide' : 'Show'} {rejectedQuotes.length} rejected quote{rejectedQuotes.length > 1 ? 's' : ''}</span>
                {showRejected ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showRejected && (
                <div className="mt-3 space-y-3">
                  {rejectedQuotes.map((quote) => renderQuoteCard(quote, { dimmed: true }))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quote Comparison Modal */}
      <QuoteComparisonModal
        isOpen={isComparisonModalOpen}
        assetId={assetId}
        onClose={() => setIsComparisonModalOpen(false)}
        onQuoteUpdate={handleQuoteUpdate}
      />
    </>
  );
};

export default QuotesList;


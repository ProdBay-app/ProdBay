import React, { useState, useEffect } from 'react';
import { FileText, Building2, Mail, DollarSign, Plus, Clock, AlertCircle, Loader2, BarChart3 } from 'lucide-react';
import { ProducerService } from '@/services/producerService';
import { useNotification } from '@/hooks/useNotification';
import EnhancedRequestQuoteFlow from './EnhancedRequestQuoteFlow';
import QuoteComparisonModal from './QuoteComparisonModal';
import type { Quote, Asset } from '@/lib/supabase';

interface QuotesListProps {
  assetId: string;
  assetName: string;
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
const QuotesList: React.FC<QuotesListProps> = ({ assetId, assetName }) => {
  const { showError } = useNotification();
  
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [asset, setAsset] = useState<Asset | null>(null);

  // Fetch quotes and asset on component mount
  useEffect(() => {
    fetchQuotes();
    fetchAsset();
  }, [assetId]);

  const fetchQuotes = async () => {
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
      setLoading(false);
    }
  };

  const fetchAsset = async () => {
    try {
      const assetData = await ProducerService.getAssetById(assetId);
      setAsset(assetData);
    } catch (err) {
      console.error('Error fetching asset:', err);
      // Non-critical, just won't have full asset details
    }
  };

  // Handle new quote requests (now supports multiple quotes)
  const handleQuotesRequested = (newQuotes: Quote[]) => {
    // Add new quotes to the list (optimistic update)
    setQuotes(prev => [...newQuotes, ...prev]);
  };

  // Handle quote updates from comparison modal (accepts/rejects)
  const handleQuoteUpdate = () => {
    // Refresh quotes list after accept/reject actions
    fetchQuotes();
  };

  // Check if we have multiple submitted quotes (for comparison button)
  const hasMultipleSubmittedQuotes = quotes.filter(
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
        className: 'bg-blue-500/30 text-blue-200 border-blue-400/50',
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
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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
            <span className="ml-2 px-2.5 py-0.5 bg-purple-500/30 text-purple-200 text-sm font-semibold rounded-full">
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
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium text-sm"
            >
              <BarChart3 className="w-4 h-4" />
              Compare Quotes
            </button>
          )}

          {/* Request Quote Button */}
          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm font-medium text-sm"
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
            Request quotes from suppliers to get pricing for this asset
          </p>
          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Request Your First Quote
          </button>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {quotes.map((quote) => {
            const badge = getStatusBadge(quote);
            const isPending = quote.status === 'Pending' || (quote.status === 'Submitted' && quote.cost === 0);

            return (
              <div
                key={quote.id}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4 hover:bg-white/20 transition-colors"
              >
                {/* Supplier Name and Status */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1">
                    <Building2 className="w-5 h-5 text-purple-300 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">
                        {quote.supplier?.supplier_name || 'Unknown Supplier'}
                      </h4>
                      {quote.supplier?.contact_email && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-300 mt-0.5">
                          <Mail className="w-3.5 h-3.5" />
                          <span>{quote.supplier.contact_email}</span>
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
                        <span className="text-sm font-medium">Awaiting supplier response</span>
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

                  {/* Created Date */}
                  <div className="text-xs text-gray-400">
                    Requested {formatDate(quote.created_at)}
                  </div>
                </div>

                {/* Service Categories (if available) */}
                {quote.supplier?.service_categories && quote.supplier.service_categories.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="flex flex-wrap gap-1.5">
                      {quote.supplier.service_categories.map((category, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-200 rounded border border-purple-400/50"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Enhanced Request Quote Flow */}
      <EnhancedRequestQuoteFlow
        isOpen={isRequestModalOpen}
        assetId={assetId}
        assetName={assetName}
        asset={asset}
        existingQuotes={quotes}
        onClose={() => setIsRequestModalOpen(false)}
        onQuotesRequested={handleQuotesRequested}
      />

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


import React, { useState, useEffect } from 'react';
import { X, DollarSign, Clock, Calendar, ChevronDown, ChevronUp, CheckCircle, XCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { QuoteComparisonService, type Quote, type Asset, type ComparisonMetrics } from '@/services/quoteComparisonService';
import { useNotification } from '@/hooks/useNotification';
import { getSupabase } from '@/lib/supabase';
import { useEscapeKey } from '@/hooks/useEscapeKey';

interface QuoteComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetId: string;
  onQuoteUpdate: () => void;
}

const QuoteComparisonModal: React.FC<QuoteComparisonModalProps> = ({
  isOpen,
  onClose,
  assetId,
  onQuoteUpdate
}) => {
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [comparisonMetrics, setComparisonMetrics] = useState<ComparisonMetrics | null>(null);
  const [expandedQuotes, setExpandedQuotes] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'cost' | 'response_time' | 'validity'>('cost');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Handle Escape key to close modal
  useEscapeKey(isOpen, onClose, loading);

  useEffect(() => {
    if (isOpen && assetId) {
      loadQuoteComparison();
    }
  }, [isOpen, assetId]);

  const loadQuoteComparison = async () => {
    setLoading(true);
    try {
      const response = await QuoteComparisonService.getQuoteComparison(assetId);
      
      if (response.success && response.data) {
        setAsset(response.data.asset);
        setQuotes(response.data.quotes);
        setComparisonMetrics(response.data.comparison_metrics);
      } else {
        showError(`Failed to load quote comparison: ${response.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error loading quote comparison:', error instanceof Error ? error.message : String(error));
      showError('Failed to load quote comparison data');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptQuote = async (quoteId: string) => {
    try {
      const supabase = await getSupabase();
      const { error } = await supabase
        .from('quotes')
        .update({ status: 'Accepted' })
        .eq('id', quoteId);

      if (error) throw error;

      // Reject all other quotes for this asset
      const { error: rejectError } = await supabase
        .from('quotes')
        .update({ status: 'Rejected' })
        .eq('asset_id', assetId)
        .neq('id', quoteId);

      if (rejectError) throw rejectError;

      showSuccess('Quote accepted successfully');
      loadQuoteComparison(); // Reload data
      onQuoteUpdate(); // Update parent component
    } catch (error) {
      console.error('Error accepting quote:', error instanceof Error ? error.message : String(error));
      showError('Failed to accept quote');
    }
  };

  const handleRejectQuote = async (quoteId: string) => {
    try {
      const supabase = await getSupabase();
      const { error } = await supabase
        .from('quotes')
        .update({ status: 'Rejected' })
        .eq('id', quoteId);

      if (error) throw error;

      showSuccess('Quote rejected');
      loadQuoteComparison(); // Reload data
      onQuoteUpdate(); // Update parent component
    } catch (error) {
      console.error('Error rejecting quote:', error instanceof Error ? error.message : String(error));
      showError('Failed to reject quote');
    }
  };

  const toggleQuoteExpansion = (quoteId: string) => {
    const newExpanded = new Set(expandedQuotes);
    if (newExpanded.has(quoteId)) {
      newExpanded.delete(quoteId);
    } else {
      newExpanded.add(quoteId);
    }
    setExpandedQuotes(newExpanded);
  };

  const sortedQuotes = [...quotes].sort((a, b) => {
    let aValue: number | string;
    let bValue: number | string;

    switch (sortBy) {
      case 'cost':
        aValue = a.cost;
        bValue = b.cost;
        break;
      case 'response_time':
        aValue = a.response_time_hours;
        bValue = b.response_time_hours;
        break;
      case 'validity':
        aValue = new Date(a.valid_until).getTime();
        bValue = new Date(b.valid_until).getTime();
        break;
      default:
        aValue = a.cost;
        bValue = b.cost;
    }

    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const getCostComparisonIcon = (quote: Quote) => {
    if (!comparisonMetrics) return null;
    
    if (quote.cost === comparisonMetrics.lowest_cost) {
      return <TrendingDown className="h-4 w-4 text-green-600" />;
    } else if (quote.cost === comparisonMetrics.highest_cost) {
      return <TrendingUp className="h-4 w-4 text-red-600" />;
    } else {
      return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Quote Comparison</h2>
            {asset && (
              <p className="text-gray-600 mt-1">
                {asset.name} • {asset.project.project_name}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading quote comparison...</span>
            </div>
          ) : asset && quotes.length > 0 ? (
            <>
              {/* Asset Details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Asset Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Specifications:</span>
                    <p className="text-gray-600 mt-1">{asset.specifications}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Timeline:</span>
                    <p className="text-gray-600 mt-1">{asset.timeline}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Client:</span>
                    <p className="text-gray-600 mt-1">{asset.project.client_name}</p>
                  </div>
                </div>
              </div>

              {/* Comparison Metrics */}
              {comparisonMetrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <span className="ml-2 text-sm font-medium text-green-800">Lowest Cost</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900 mt-1">
                      ${comparisonMetrics.lowest_cost.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-red-600" />
                      <span className="ml-2 text-sm font-medium text-red-800">Highest Cost</span>
                    </div>
                    <p className="text-2xl font-bold text-red-900 mt-1">
                      ${comparisonMetrics.highest_cost.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                      <span className="ml-2 text-sm font-medium text-blue-800">Average Cost</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900 mt-1">
                      ${comparisonMetrics.average_cost.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      <span className="ml-2 text-sm font-medium text-purple-800">Quote Count</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900 mt-1">
                      {comparisonMetrics.quote_count}
                    </p>
                  </div>
                </div>
              )}

              {/* Sort Controls */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'cost' | 'response_time' | 'validity')}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                  >
                    <option value="cost">Cost</option>
                    <option value="response_time">Response Time</option>
                    <option value="validity">Validity Period</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {sortOrder === 'asc' ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Quotes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sortedQuotes.map((quote) => (
                  <div
                    key={quote.id}
                    className={`border rounded-lg p-4 transition-all ${
                      quote.cost === comparisonMetrics?.lowest_cost
                        ? 'border-green-300 bg-green-50'
                        : quote.status === 'Accepted'
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    {/* Quote Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {quote.supplier.supplier_name}
                          </h4>
                          {getCostComparisonIcon(quote)}
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {quote.supplier.contact_email}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${QuoteComparisonService.getStatusColor(quote.status)}`}>
                        {quote.status}
                      </span>
                    </div>

                    {/* Cost */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-gray-900">
                          ${quote.cost.toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500">
                          #{quote.cost_rank}
                        </span>
                      </div>
                      {quote.cost_percentage_of_lowest > 100 && (
                        <p className="text-xs text-gray-500 mt-1">
                          +{quote.cost_percentage_of_lowest - 100}% vs lowest
                        </p>
                      )}
                    </div>

                    {/* Quick Info */}
                    <div className="space-y-2 mb-3 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{QuoteComparisonService.formatResponseTime(quote.response_time_hours)}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{QuoteComparisonService.formatValidityPeriod(quote.valid_until)}</span>
                      </div>
                    </div>

                    {/* Expandable Details */}
                    <button
                      onClick={() => toggleQuoteExpansion(quote.id)}
                      className="w-full flex items-center justify-between text-sm text-blue-600 hover:text-blue-800 mb-3"
                    >
                      <span>Details</span>
                      {expandedQuotes.has(quote.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>

                    {expandedQuotes.has(quote.id) && (
                      <div className="border-t pt-3 mb-3">
                        {/* Cost Breakdown */}
                        <div className="mb-3">
                          <h5 className="font-medium text-gray-900 mb-2">Cost Breakdown</h5>
                          <div className="text-sm text-gray-600">
                            {QuoteComparisonService.formatCostBreakdown(quote.cost_breakdown)}
                          </div>
                        </div>

                        {/* Supplier Notes */}
                        {quote.notes_capacity && (
                          <div className="mb-3">
                            <h5 className="font-medium text-gray-900 mb-2">Notes</h5>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">
                              {quote.notes_capacity}
                            </p>
                          </div>
                        )}

                        {/* Service Categories */}
                        <div className="mb-3">
                          <h5 className="font-medium text-gray-900 mb-2">Services</h5>
                          <div className="flex flex-wrap gap-1">
                            {quote.supplier.service_categories.slice(0, 3).map((category) => (
                              <span
                                key={category}
                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                              >
                                {category}
                              </span>
                            ))}
                            {quote.supplier.service_categories.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                +{quote.supplier.service_categories.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {quote.status === 'Submitted' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAcceptQuote(quote.id)}
                          className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">Accept</span>
                        </button>
                        <button
                          onClick={() => handleRejectQuote(quote.id)}
                          className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                          <XCircle className="h-4 w-4" />
                          <span className="text-sm">Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Quotes Available</h3>
              <p className="text-gray-600">This asset doesn't have any quotes to compare yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuoteComparisonModal;

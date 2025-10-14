import React, { useState, useEffect } from 'react';
import { X, DollarSign, Package, Loader2, AlertCircle, TrendingUp } from 'lucide-react';
import { ProducerService } from '@/services/producerService';
import type { AssetWithAcceptedQuote } from '@/services/producerService';

interface BudgetAssetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

/**
 * BudgetAssetsModal - Display all assets with accepted quotes contributing to budget spending
 * 
 * Features:
 * - Fetches and displays assets that have accepted quotes
 * - Shows asset name, cost, supplier, and acceptance date
 * - Calculates and displays total verified spending
 * - Shows loading, error, and empty states
 * - Follows the established modal design pattern
 */
const BudgetAssetsModal: React.FC<BudgetAssetsModalProps> = ({
  isOpen,
  onClose,
  projectId
}) => {
  // State management
  const [assets, setAssets] = useState<AssetWithAcceptedQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch assets with accepted quotes when modal opens
  useEffect(() => {
    const fetchAssetsWithAcceptedQuotes = async () => {
      // Only fetch if modal is open and we have a project ID
      if (!isOpen || !projectId) {
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const fetchedAssets = await ProducerService.getAssetsWithAcceptedQuotes(projectId);
        setAssets(fetchedAssets);
      } catch (err) {
        console.error('Error fetching assets with accepted quotes:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load budget breakdown';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchAssetsWithAcceptedQuotes();
  }, [isOpen, projectId]);

  // Handle backdrop click - close modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Format currency helper
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date helper
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Calculate total spending from all assets
  const totalSpent = assets.reduce((sum, asset) => sum + asset.acceptedQuote.cost, 0);

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with close button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Budget Breakdown</h3>
              <p className="text-sm text-gray-600">Assets with accepted quotes</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - scrollable area */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
              <p className="text-gray-600 text-lg">Loading budget breakdown...</p>
              <p className="text-gray-500 text-sm mt-2">Fetching assets with accepted quotes</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-red-50 rounded-full p-4 mb-4">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Breakdown</h4>
              <p className="text-gray-600 text-center mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Reload Page
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && assets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-gray-50 rounded-full p-4 mb-4">
                <Package className="w-10 h-10 text-gray-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No Accepted Quotes</h4>
              <p className="text-gray-600 text-center">
                This project doesn't have any assets with accepted quotes yet.
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Once quotes are accepted, they'll appear here.
              </p>
            </div>
          )}

          {/* Success State - Asset List */}
          {!loading && !error && assets.length > 0 && (
            <div className="space-y-4">
              {/* Info header */}
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{assets.length}</span> {assets.length === 1 ? 'asset' : 'assets'} with accepted quotes
                </p>
              </div>

              {/* Asset cards */}
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="rounded-lg border-2 border-gray-200 bg-white p-5 hover:border-green-300 hover:shadow-sm transition-all"
                >
                  {/* Asset header with cost */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 mb-1">
                        {asset.asset_name}
                      </h4>
                      {asset.specifications && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {asset.specifications}
                        </p>
                      )}
                    </div>
                    <div className="ml-4 text-right flex-shrink-0">
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(asset.acceptedQuote.cost)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Quote Cost</p>
                    </div>
                  </div>

                  {/* Asset metadata */}
                  <div className="flex flex-wrap items-center gap-4 text-sm mt-3 pt-3 border-t border-gray-100">
                    {/* Supplier */}
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-gray-600">Supplier:</span>
                      <span className="font-medium text-gray-900">
                        {asset.acceptedQuote.supplier.supplier_name}
                      </span>
                    </div>

                    {/* Status badge */}
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-600">Status:</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {asset.status}
                      </span>
                    </div>

                    {/* Acceptance date */}
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-gray-600">Accepted:</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(asset.acceptedQuote.updated_at)}
                      </span>
                    </div>
                  </div>

                  {/* Cost breakdown (if available) */}
                  {asset.acceptedQuote.cost_breakdown && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-600 mb-2 font-medium">Cost Breakdown:</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        {asset.acceptedQuote.cost_breakdown.labor > 0 && (
                          <div>
                            <span className="text-gray-500">Labor: </span>
                            <span className="font-medium">{formatCurrency(asset.acceptedQuote.cost_breakdown.labor)}</span>
                          </div>
                        )}
                        {asset.acceptedQuote.cost_breakdown.materials > 0 && (
                          <div>
                            <span className="text-gray-500">Materials: </span>
                            <span className="font-medium">{formatCurrency(asset.acceptedQuote.cost_breakdown.materials)}</span>
                          </div>
                        )}
                        {asset.acceptedQuote.cost_breakdown.equipment > 0 && (
                          <div>
                            <span className="text-gray-500">Equipment: </span>
                            <span className="font-medium">{formatCurrency(asset.acceptedQuote.cost_breakdown.equipment)}</span>
                          </div>
                        )}
                        {asset.acceptedQuote.cost_breakdown.other > 0 && (
                          <div>
                            <span className="text-gray-500">Other: </span>
                            <span className="font-medium">{formatCurrency(asset.acceptedQuote.cost_breakdown.other)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary Footer - Always visible when data is loaded */}
        {!loading && !error && assets.length > 0 && (
          <div className="px-6 py-4 border-t-2 border-gray-200 bg-gradient-to-r from-green-50 to-gray-50 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Verified Spending</p>
                  <p className="text-xs text-gray-500">Sum of all {assets.length} accepted {assets.length === 1 ? 'quote' : 'quotes'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(totalSpent)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Matches budget bar "Spent" value
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetAssetsModal;


import React, { useState, useEffect } from 'react';
import { X, Clock, CheckCircle, XCircle, FileText, AlertCircle } from 'lucide-react';

interface QuoteHistoryEntry {
  id: string;
  status: 'Pending' | 'Submitted' | 'Accepted' | 'Rejected';
  created_at: string;
  notes?: string;
}

interface QuoteHistoryData {
  quote: {
    id: string;
    current_status: string;
    supplier: {
      id: string;
      supplier_name: string;
    };
    asset: {
      id: string;
      asset_name: string;
      project: {
        project_name: string;
        client_name: string;
      };
    };
  };
  history: QuoteHistoryEntry[];
  total_changes: number;
  message: string;
}

interface QuoteHistoryModalProps {
  quoteId: string | null;
  onClose: () => void;
}

const QuoteHistoryModal: React.FC<QuoteHistoryModalProps> = ({ quoteId, onClose }) => {
  const [historyData, setHistoryData] = useState<QuoteHistoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch quote history when modal opens
  useEffect(() => {
    if (quoteId) {
      fetchQuoteHistory(quoteId);
    }
  }, [quoteId]);

  const fetchQuoteHistory = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_RAILWAY_API_URL}/api/quotes/${id}/history`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status}: Failed to fetch quote history`);
      }

      if (data.success) {
        setHistoryData(data.data);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch quote history');
      }
    } catch (err) {
      console.error('Error fetching quote history:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch quote history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Accepted':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'Rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'Submitted':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'Pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'Accepted':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Accepted</span>;
      case 'Rejected':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>Rejected</span>;
      case 'Submitted':
        return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>Submitted</span>;
      case 'Pending':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Pending</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</span>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!quoteId) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Quote History</h2>
            {historyData && (
              <p className="text-sm text-gray-600 mt-1">
                {historyData.quote.asset.asset_name} • {historyData.quote.asset.project.client_name}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading quote history...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading History</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={() => quoteId && fetchQuoteHistory(quoteId)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {historyData && !loading && !error && (
            <div className="space-y-6">
              {/* Current Status */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Current Status</h3>
                    <p className="text-sm text-gray-600">As of {formatDate(new Date().toISOString())}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(historyData.quote.current_status)}
                    {getStatusBadge(historyData.quote.current_status)}
                  </div>
                </div>
              </div>

              {/* History Timeline */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Status History</h3>
                
                {historyData.history.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No status changes recorded for this quote.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {historyData.history.map((entry, index) => (
                      <div key={entry.id} className="flex items-start space-x-4">
                        {/* Timeline line */}
                        <div className="flex flex-col items-center">
                          <div className="flex items-center justify-center w-8 h-8 bg-white border-2 border-gray-300 rounded-full">
                            {getStatusIcon(entry.status)}
                          </div>
                          {index < historyData.history.length - 1 && (
                            <div className="w-0.5 h-8 bg-gray-300 mt-2"></div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getStatusBadge(entry.status)}
                              <span className="text-sm text-gray-500">
                                {formatDate(entry.created_at)}
                              </span>
                            </div>
                          </div>
                          
                          {entry.notes && (
                            <p className="mt-2 text-sm text-gray-700 bg-gray-50 rounded-md p-3">
                              {entry.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    {historyData.total_changes} status change{historyData.total_changes !== 1 ? 's' : ''} recorded
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuoteHistoryModal;

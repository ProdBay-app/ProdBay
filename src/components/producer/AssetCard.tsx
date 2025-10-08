import React from 'react';
import { Mail, BarChart3 } from 'lucide-react';
import type { Asset, Quote } from '@/lib/supabase';

interface AssetCardProps {
  asset: Asset;
  quotes: Quote[];
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  onSendToSuppliers: (asset: Asset) => void;
  onCompareQuotes: (assetId: string) => void;
  getStatusColor: (status: string) => string;
}

const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  quotes,
  onEdit,
  onDelete,
  onSendToSuppliers,
  onCompareQuotes,
  getStatusColor
}) => {
  const acceptedQuote = quotes.find(q => q.status === 'Accepted');
  const hasMultipleQuotes = quotes.length > 1;

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-medium text-gray-900">{asset.asset_name}</h3>
          <p className="text-sm text-gray-600">{asset.specifications}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(asset.status)}`}>
            {asset.status}
          </span>
          <button
            onClick={() => onEdit(asset)}
            className="px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(asset)}
            className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
          >
            Delete
          </button>
          {asset.status === 'Pending' && (
            <button
              onClick={() => onSendToSuppliers(asset)}
              className="flex items-center space-x-1 px-3 py-1 bg-teal-600 text-white rounded text-sm hover:bg-teal-700"
            >
              <Mail className="h-3 w-3" />
              <span>Select Suppliers</span>
            </button>
          )}
          {hasMultipleQuotes && (
            <button
              onClick={() => onCompareQuotes(asset.id)}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              <BarChart3 className="h-3 w-3" />
              <span>Compare Quotes</span>
            </button>
          )}
        </div>
      </div>

      {/* Quotes for this asset */}
      {quotes.length > 0 && (
        <div className="mt-4 bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">
            Quotes ({quotes.length})
          </h4>
          <div className="space-y-3">
            {quotes.map((quote) => (
              <div key={quote.id} className="bg-white rounded p-3 border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {quote.supplier?.supplier_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {quote.supplier?.contact_email}
                    </p>
                    <p className="text-lg font-semibold text-green-600 mt-1">
                      ${quote.cost.toFixed(2)}
                    </p>
                    {quote.notes_capacity && (
                      <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                        {quote.notes_capacity}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                      {quote.status}
                    </span>
                    {quote.status === 'Submitted' && (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => {/* Handle accept quote */}}
                          className="p-1 bg-green-600 text-white rounded hover:bg-green-700"
                          title="Accept Quote"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => {/* Handle reject quote */}}
                          className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                          title="Reject Quote"
                        >
                          ✗
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {asset.assigned_supplier && acceptedQuote && (
        <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm font-medium text-green-800">
            Assigned to: {asset.assigned_supplier.supplier_name}
          </p>
          <p className="text-sm text-green-700">
            Accepted Cost: ${acceptedQuote.cost.toFixed(2)}
          </p>
        </div>
      )}
    </div>
  );
};

export default AssetCard;

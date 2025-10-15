import React from 'react';
import { X } from 'lucide-react';
import type { Asset } from '@/lib/supabase';

interface AssetDetailModalTestProps {
  isOpen: boolean;
  asset: Asset | null;
  onClose: () => void;
}

/**
 * Simple test version of AssetDetailModal to debug the blank page issue
 */
const AssetDetailModalTest: React.FC<AssetDetailModalTestProps> = ({ isOpen, asset, onClose }) => {
  console.log('AssetDetailModalTest: isOpen:', isOpen, 'asset:', asset);

  if (!isOpen || !asset) {
    console.log('AssetDetailModalTest: Not rendering - isOpen:', isOpen, 'asset:', asset);
    return null;
  }

  console.log('AssetDetailModalTest: Rendering modal for asset:', asset.asset_name);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
        style={{ zIndex: 9998 }}
      />

      {/* Modal Container */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ zIndex: 9999 }}
      >
        {/* Modal Content */}
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6"
          onClick={(e) => e.stopPropagation()}
          style={{ zIndex: 10000 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {asset.asset_name}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-700">Asset Name:</h3>
              <p className="text-gray-900">{asset.asset_name}</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-700">Status:</h3>
              <p className="text-gray-900">{asset.status}</p>
            </div>

            {asset.specifications && (
              <div>
                <h3 className="font-semibold text-gray-700">Specifications:</h3>
                <p className="text-gray-900">{asset.specifications}</p>
              </div>
            )}

            {asset.quantity && (
              <div>
                <h3 className="font-semibold text-gray-700">Quantity:</h3>
                <p className="text-gray-900">{asset.quantity}</p>
              </div>
            )}

            {asset.tags && asset.tags.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700">Tags:</h3>
                <p className="text-gray-900">{asset.tags.join(', ')}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AssetDetailModalTest;

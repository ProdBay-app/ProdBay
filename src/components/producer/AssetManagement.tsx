import React from 'react';
import { Plus, CheckCircle, Brain, Sparkles, Target } from 'lucide-react';
import type { Asset, Quote } from '@/lib/supabase';
import AssetCard from './AssetCard';

interface AssetManagementProps {
  assets: Asset[];
  quotes: Quote[];
  aiAllocationCompleted: boolean;
  onCreateAsset: () => void;
  onEditAsset: (asset: Asset) => void;
  onDeleteAsset: (asset: Asset) => void;
  onSendToSuppliers: (asset: Asset) => void;
  onCompareQuotes: (assetId: string) => void;
  onOpenAIAllocation: () => void;
  getAssetQuotes: (assetId: string) => Quote[];
  hasMultipleQuotes: (assetId: string) => boolean;
  getStatusColor: (status: string) => string;
}

const AssetManagement: React.FC<AssetManagementProps> = ({
  assets,
  quotes,
  aiAllocationCompleted,
  onCreateAsset,
  onEditAsset,
  onDeleteAsset,
  onSendToSuppliers,
  onCompareQuotes,
  onOpenAIAllocation,
  getAssetQuotes,
  hasMultipleQuotes,
  getStatusColor
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Asset Management</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={onCreateAsset}
            className="flex items-center space-x-2 px-3 py-1 bg-teal-600 text-white rounded text-sm hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" />
            <span>New Asset</span>
          </button>
          {aiAllocationCompleted ? (
            <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded text-sm">
              <CheckCircle className="h-4 w-4" />
              <span>AI Allocation Applied</span>
            </div>
          ) : (
            <div className="relative group">
              <button
                className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded text-sm hover:from-purple-700 hover:to-blue-700"
              >
                <Brain className="h-4 w-4" />
                <span>AI Allocation</span>
                <Sparkles className="h-3 w-3" />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="py-1">
                  <button
                    onClick={onOpenAIAllocation}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <Target className="h-4 w-4" />
                    <span>AI Asset Analysis</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="space-y-6">
        {assets.map((asset) => (
          <AssetCard
            key={asset.id}
            asset={asset}
            quotes={getAssetQuotes(asset.id)}
            onEdit={onEditAsset}
            onDelete={onDeleteAsset}
            onSendToSuppliers={onSendToSuppliers}
            onCompareQuotes={onCompareQuotes}
            getStatusColor={getStatusColor}
          />
        ))}
      </div>
    </div>
  );
};

export default AssetManagement;

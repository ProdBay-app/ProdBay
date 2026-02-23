import React from 'react';
import { Brain, Sparkles, Truck } from 'lucide-react';
import type { AIAssetSuggestion } from '@/services/aiAllocationService';
import { useEscapeKey } from '@/hooks/useEscapeKey';

/** Format quantity for display: number, "TBC", or "Estimate" */
function formatQuantity(qty: string | number | undefined): string {
  if (qty === undefined || qty === null) return '1';
  if (typeof qty === 'number') return String(qty);
  return qty;
}

interface AIAllocationModalProps {
  isOpen: boolean;
  aiSuggestions: {
    assets: AIAssetSuggestion[];
    reasoning: string;
    confidence: number;
  } | null;
  loading: boolean;
  onClose: () => void;
  onAnalyze: () => void;
  onApply: () => void;
}

const AIAllocationModal: React.FC<AIAllocationModalProps> = ({
  isOpen,
  aiSuggestions,
  loading,
  onClose,
  onAnalyze,
  onApply
}) => {
  if (!isOpen) return null;

  // Handle Escape key to close modal
  useEscapeKey(isOpen, onClose, loading);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <Brain className="h-6 w-6 text-purple-600" />
            <h3 className="text-xl font-semibold">
              Asset Analysis
            </h3>
            <Sparkles className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-gray-600 text-sm">
            Analyze the project brief to identify and suggest optimal assets with detailed specifications.
          </p>
        </div>

        {!aiSuggestions ? (
          <div className="text-center py-8">
            {loading ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                <p className="text-gray-600">Analyzing your project...</p>
                <p className="text-sm text-gray-500">This may take a few moments</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Ready to analyze</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Click the button below to start analyzing your project.
                  </p>
                  <button
                    onClick={onAnalyze}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 mx-auto"
                  >
                    <Brain className="h-5 w-5" />
                    <span>Start Analysis</span>
                    <Sparkles className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* AI Results Summary */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">Analysis Complete</h4>
                  <p className="text-sm text-gray-600">
                    Confidence: {Math.round(aiSuggestions.confidence * 100)}%
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-700 font-medium">Ready</span>
                </div>
              </div>
            </div>

            {/* AI Reasoning */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Analysis Reasoning</h4>
              <p className="text-sm text-gray-700">{aiSuggestions.reasoning}</p>
            </div>

            {/* Asset Suggestions */}
            {aiSuggestions.assets.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Suggested Assets ({aiSuggestions.assets.length})</h4>
                <div className="space-y-3">
                  {aiSuggestions.assets.map((asset, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium text-gray-900">{asset.asset_name}</h5>
                        <span className="text-sm font-medium text-gray-500 px-2 py-0.5 bg-gray-100 rounded">
                          Qty: {formatQuantity(asset.quantity)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{asset.specifications}</p>
                      {(asset.supplier_context != null && asset.supplier_context.trim() !== '') && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-start gap-2">
                            <Truck className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Procurement Insights</span>
                              <p className="text-sm text-gray-600 mt-1">{asset.supplier_context}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onApply}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700"
              >
                <Brain className="h-4 w-4" />
                <span>Apply Suggestions</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAllocationModal;

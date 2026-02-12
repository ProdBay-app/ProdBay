import React from 'react';
import { Brain, Sparkles } from 'lucide-react';
import type { AIAssetSuggestion } from '@/services/aiAllocationService';
import { useEscapeKey } from '@/hooks/useEscapeKey';

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
            <Brain className="h-6 w-6 text-wedding-accent" />
            <h3 className="text-xl font-semibold">
              Service Analysis
            </h3>
            <Sparkles className="h-5 w-5 text-wedding-accent" />
          </div>
          <p className="text-gray-600 text-sm">
            Analyze the wedding brief to identify and suggest optimal services with detailed specifications.
          </p>
        </div>

        {!aiSuggestions ? (
          <div className="text-center py-8">
            {loading ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wedding-primary"></div>
                <p className="text-gray-600">Analyzing your wedding...</p>
                <p className="text-sm text-gray-500">This may take a few moments</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-wedding-secondary/50 to-wedding-neutral border border-wedding-primary/30 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Ready to analyze</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Click the button below to start analyzing your wedding.
                  </p>
                  <button
                    onClick={onAnalyze}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-wedding-primary to-wedding-accent text-white rounded-lg hover:from-wedding-primary-hover hover:to-wedding-accent-hover mx-auto"
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
            <div className="bg-gradient-to-r from-green-50 to-wedding-neutral border border-green-200 rounded-lg p-4">
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
                <h4 className="font-semibold text-gray-900 mb-3">Suggested Services ({aiSuggestions.assets.length})</h4>
                <div className="space-y-3">
                  {aiSuggestions.assets.map((asset, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium text-gray-900">{asset.asset_name}</h5>
                      </div>
                      <p className="text-sm text-gray-600">{asset.specifications}</p>
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
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-wedding-primary to-wedding-accent text-white rounded-lg hover:from-wedding-primary-hover hover:to-wedding-accent-hover"
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

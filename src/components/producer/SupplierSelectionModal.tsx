import React from 'react';
import { Package } from 'lucide-react';
import type { Asset, SuggestedSupplier } from '../../lib/supabase';

interface SupplierSelectionModalProps {
  isOpen: boolean;
  asset: Asset | null;
  suggestedSuppliers: SuggestedSupplier[];
  selectedSupplierIds: string[];
  loading: boolean;
  onClose: () => void;
  onSupplierToggle: (supplierId: string) => void;
  onConfirm: () => void;
}

const SupplierSelectionModal: React.FC<SupplierSelectionModalProps> = ({
  isOpen,
  asset,
  suggestedSuppliers,
  selectedSupplierIds,
  loading,
  onClose,
  onSupplierToggle,
  onConfirm
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
        <div className="mb-4">
          <h3 className="text-xl font-semibold">Select Suppliers for Quote Requests</h3>
          <p className="text-gray-600 text-sm">
            Choose which suppliers should receive quote requests for "{asset?.asset_name}".
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            <span className="ml-2 text-gray-600">Loading suppliers...</span>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {suggestedSuppliers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>No relevant suppliers found for this asset.</p>
                    <p className="text-sm">Try adding more suppliers or check the asset specifications.</p>
                  </div>
                ) : (
                  suggestedSuppliers.map((supplier) => {
                    const isSelected = selectedSupplierIds.includes(supplier.id);
                    const isAlreadyContacted = supplier.already_contacted;
                    
                    return (
                      <div
                        key={supplier.id}
                        className={`border rounded-lg p-4 transition-colors ${
                          isSelected ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                        } ${isAlreadyContacted ? 'opacity-75' : ''}`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id={`supplier-${supplier.id}`}
                            checked={isSelected}
                            onChange={() => onSupplierToggle(supplier.id)}
                            disabled={isAlreadyContacted}
                            className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <label
                                htmlFor={`supplier-${supplier.id}`}
                                className="font-medium text-gray-900 cursor-pointer"
                              >
                                {supplier.supplier_name}
                              </label>
                              {isAlreadyContacted && (
                                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                  Already Contacted
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{supplier.contact_email}</p>
                            {supplier.service_categories && supplier.service_categories.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {supplier.service_categories.map((category, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                                  >
                                    {category}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-600">
                {selectedSupplierIds.length > 0 && (
                  <span>
                    {selectedSupplierIds.length} supplier{selectedSupplierIds.length !== 1 ? 's' : ''} selected
                  </span>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={selectedSupplierIds.length === 0}
                  className={`px-4 py-2 rounded text-white ${
                    selectedSupplierIds.length === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-teal-600 hover:bg-teal-700'
                  }`}
                >
                  Send Quote Requests{selectedSupplierIds.length > 0 ? ` (${selectedSupplierIds.length})` : ''}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SupplierSelectionModal;

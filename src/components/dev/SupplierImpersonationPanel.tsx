import React from 'react';
import { useSupplierImpersonation } from '@/contexts/SupplierImpersonationContext';
import { getDevEnvironmentInfo } from '@/utils/devMode';
import { Users, UserCheck, X, RefreshCw, Info } from 'lucide-react';

const SupplierImpersonationPanel: React.FC = () => {
  const {
    isImpersonating,
    impersonatedSupplier,
    availableSuppliers,
    loading,
    startImpersonation,
    stopImpersonation,
    refreshSuppliers,
  } = useSupplierImpersonation();
  
  const envInfo = getDevEnvironmentInfo();

  const handleSupplierSelect = (supplierId: string) => {
    const supplier = availableSuppliers.find(s => s.id === supplierId);
    if (supplier) {
      startImpersonation(supplier);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-yellow-600" />
          <h3 className="text-lg font-semibold text-yellow-800">Developer: Supplier Impersonation</h3>
          <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs">
            <Info className="h-3 w-3" />
            <span>{envInfo.isStaging ? 'Staging' : 'Local'}</span>
          </div>
        </div>
        <button
          onClick={refreshSuppliers}
          disabled={loading}
          className="p-1 text-yellow-600 hover:text-yellow-700 disabled:opacity-50"
          title="Refresh suppliers list"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isImpersonating ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-yellow-100 rounded-lg">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-4 w-4 text-yellow-600" />
              <span className="font-medium text-yellow-800">Impersonating:</span>
              <span className="text-yellow-700">{impersonatedSupplier?.supplier_name}</span>
            </div>
            <button
              onClick={stopImpersonation}
              className="flex items-center space-x-1 px-2 py-1 text-sm bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300 transition-colors"
            >
              <X className="h-3 w-3" />
              <span>Stop</span>
            </button>
          </div>
          <div className="text-sm text-yellow-700">
            <strong>Note:</strong> You are viewing the supplier portal as "{impersonatedSupplier?.supplier_name}". 
            Quotes will be filtered to show only those assigned to this supplier.
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm text-yellow-700 mb-3">
            Select a supplier to impersonate and test the supplier portal experience:
          </div>
          <div className="flex items-center space-x-3">
            <select
              onChange={(e) => handleSupplierSelect(e.target.value)}
              disabled={loading || availableSuppliers.length === 0}
              className="flex-1 px-3 py-2 border border-yellow-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {loading ? 'Loading suppliers...' : availableSuppliers.length === 0 ? 'No suppliers available' : 'Select a supplier to impersonate'}
              </option>
              {availableSuppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.supplier_name} ({supplier.contact_email})
                </option>
              ))}
            </select>
          </div>
          {availableSuppliers.length === 0 && !loading && (
            <div className="text-sm text-yellow-600">
              No suppliers found. Make sure the database has supplier data.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SupplierImpersonationPanel;

import React from 'react';
import type { AssetFormData } from '@/services/producerService';
import type { Supplier } from '@/lib/supabase';
import { useEscapeKey } from '@/hooks/useEscapeKey';

interface AssetModalProps {
  isOpen: boolean;
  isEditing: boolean;
  isSubmitting: boolean;
  assetForm: AssetFormData;
  suppliers: Supplier[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFormChange: (field: string, value: string | undefined) => void;
}

const AssetModal: React.FC<AssetModalProps> = ({
  isOpen,
  isEditing,
  isSubmitting,
  assetForm,
  suppliers,
  onClose,
  onSubmit,
  onFormChange
}) => {
  if (!isOpen) return null;

  // Handle Escape key to close modal
  useEscapeKey(isOpen, onClose, isSubmitting);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    onFormChange(name, value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
        <div className="mb-4">
          <h3 className="text-xl font-semibold">
            {isEditing ? 'Edit Asset' : 'Create New Asset'}
          </h3>
          <p className="text-gray-600 text-sm">
            {isEditing ? 'Update asset details and save changes.' : 'Add an asset to this project.'}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asset Name *</label>
              <input
                name="asset_name"
                value={assetForm.asset_name}
                onChange={handleInputChange}
                required
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={assetForm.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="Pending">Pending</option>
                <option value="Quoting">Quoting</option>
                <option value="Approved">Approved</option>
                <option value="In Production">In Production</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Specifications</label>
            <textarea
              name="specifications"
              value={assetForm.specifications}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timeline</label>
              <input
                name="timeline"
                value={assetForm.timeline}
                onChange={handleInputChange}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="e.g., 2 weeks"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Supplier</label>
              <select
                name="assigned_supplier_id"
                value={assetForm.assigned_supplier_id || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="">Unassigned</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.supplier_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {isSubmitting ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create Asset')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetModal;

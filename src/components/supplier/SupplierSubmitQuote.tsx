import React, { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useSupplierImpersonation } from '@/contexts/SupplierImpersonationContext';
import type { Asset } from '@/lib/supabase';
import { useNotification } from '@/hooks/useNotification';
import { FileText, Send, Package, AlertCircle } from 'lucide-react';

const SupplierSubmitQuote: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const { isImpersonating, impersonatedSupplier } = useSupplierImpersonation();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [formData, setFormData] = useState({
    asset_id: '',
    cost: 0,
    notes_capacity: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      const supabase = await getSupabase();
      const { data } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });
      setAssets(data || []);
    } catch (e) {
      console.error('Failed to load assets', e instanceof Error ? e.message : String(e));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.asset_id || formData.cost <= 0) return;
    
    // Check if we have a valid supplier context
    if (!isImpersonating || !impersonatedSupplier) {
      showError('No supplier selected. Please use the supplier impersonation panel to select a supplier.');
      return;
    }
    
    setSubmitting(true);
    try {
      const supabase = await getSupabase();
      const { error } = await supabase
        .from('quotes')
        .insert({
          supplier_id: impersonatedSupplier.id,
          asset_id: formData.asset_id,
          cost: formData.cost,
          notes_capacity: formData.notes_capacity,
          status: 'Submitted'
        });

      if (error) {
        // Handle specific RLS policy violations
        if (error.message.includes('new row violates row-level security policy')) {
          throw new Error('You are not authorized to submit quotes for this asset. Please contact the administrator.');
        }
        throw error;
      }
      
      showSuccess(`Quote submitted successfully for ${impersonatedSupplier.supplier_name}`);
      setFormData({ asset_id: '', cost: 0, notes_capacity: '' });
    } catch (err) {
      console.error('Failed to submit quote', err instanceof Error ? err.message : String(err));
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit quote';
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex items-center space-x-3 mb-6">
          <FileText className="h-6 w-6 text-orange-600" />
          <h1 className="text-2xl font-bold text-gray-900">Submit Quote</h1>
        </div>

        {/* Supplier Context Indicator */}
        {isImpersonating && impersonatedSupplier ? (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Submitting quote as: <strong>{impersonatedSupplier.supplier_name}</strong>
              </span>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                No supplier selected. Please use the supplier impersonation panel to select a supplier.
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Asset *</label>
            <select
              value={formData.asset_id}
              onChange={(e) => setFormData((p) => ({ ...p, asset_id: e.target.value }))}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Select an asset</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>{a.asset_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Total Cost *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={formData.cost || ''}
                onChange={(e) => setFormData((p) => ({ ...p, cost: parseFloat(e.target.value) || 0 }))}
                min={0}
                step={0.01}
                required
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes & Capacity</label>
            <textarea
              value={formData.notes_capacity}
              onChange={(e) => setFormData((p) => ({ ...p, notes_capacity: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Include details about your capacity, timeline, terms, etc."
            />
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              type="submit"
              disabled={submitting || !formData.asset_id || formData.cost <= 0 || !isImpersonating || !impersonatedSupplier}
              className="flex items-center space-x-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>{submitting ? 'Submitting...' : 'Submit Quote'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierSubmitQuote;



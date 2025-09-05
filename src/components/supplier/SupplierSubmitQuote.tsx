import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Asset } from '../../lib/supabase';
import { FileText, Send } from 'lucide-react';
import { ErrorMessage, SuccessMessage } from '../../utils/ui';

const SupplierSubmitQuote: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [formData, setFormData] = useState({
    asset_id: '',
    cost: 0,
    notes_capacity: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      const { data } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });
      setAssets(data || []);
    } catch (e) {
      console.error('Failed to load assets', e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.asset_id || formData.cost <= 0) return;
    
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // In a real app, supplier_id is from auth. For MVP, pick first supplier or a placeholder.
      let supplierId: string | null = null;
      const { data: suppliers } = await supabase.from('suppliers').select('id').limit(1);
      supplierId = suppliers && suppliers.length > 0 ? suppliers[0].id : null;

      if (!supplierId) {
        throw new Error('No supplier found. Please ask admin to create a supplier entry.');
      }

      const { error } = await supabase
        .from('quotes')
        .insert({
          supplier_id: supplierId,
          asset_id: formData.asset_id,
          cost: formData.cost,
          notes_capacity: formData.notes_capacity,
          status: 'Submitted'
        });

      if (error) throw error;
      
      setSuccess('Quote submitted successfully!');
      setFormData({ asset_id: '', cost: 0, notes_capacity: '' });
    } catch (err) {
      console.error('Failed to submit quote', err);
      setError(err instanceof Error ? err.message : 'Failed to submit quote');
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

        {error && <ErrorMessage message={error} className="mb-6" />}
        {success && <SuccessMessage message={success} className="mb-6" />}
        
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
              disabled={submitting || !formData.asset_id || formData.cost <= 0}
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



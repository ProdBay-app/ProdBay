import React, { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useSupplierImpersonation } from '@/contexts/SupplierImpersonationContext';
import { useNotification } from '@/hooks/useNotification';
import { FileText, Send, Package, AlertCircle, Loader2 } from 'lucide-react';

// Interface for quotable assets returned by the backend
interface QuotableAsset {
  id: string;
  asset_name: string;
  specifications: string;
  timeline: string;
  status: string;
  created_at: string;
  project: {
    id: string;
    project_name: string;
    client_name: string;
    brief_description: string;
  };
  quote_request_id: string;
  quote_request_date: string;
}


const SupplierSubmitQuote: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const { isImpersonating, impersonatedSupplier } = useSupplierImpersonation();
  const [assets, setAssets] = useState<QuotableAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    asset_id: '',
    cost: 0,
    notes_capacity: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Load quotable assets when supplier impersonation changes
  useEffect(() => {
    if (isImpersonating && impersonatedSupplier) {
      loadQuotableAssets();
    } else {
      // Clear assets when no supplier is selected
      setAssets([]);
      setError(null);
    }
  }, [isImpersonating, impersonatedSupplier]);

  const loadQuotableAssets = async () => {
    if (!impersonatedSupplier) {
      setError('No supplier selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_RAILWAY_API_URL}/api/suppliers/${impersonatedSupplier.id}/quotable-assets`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status}: Failed to fetch quotable assets`);
      }

      if (data.success) {
        setAssets(data.data.assets || []);
        if (data.data.assets.length === 0) {
          setError('You have no pending quote requests.');
        }
      } else {
        throw new Error(data.error?.message || 'Failed to fetch quotable assets');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load quotable assets';
      console.error('Failed to load quotable assets:', errorMessage);
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
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
      
      // Check if a quote already exists for this asset + supplier pair
      const { data: existingQuote, error: findError } = await supabase
        .from('quotes')
        .select('id')
        .eq('asset_id', formData.asset_id)
        .eq('supplier_id', impersonatedSupplier.id)
        .maybeSingle();

      if (findError) {
        throw new Error(`Failed to check for existing quote: ${findError.message}`);
      }

      let error;

      if (existingQuote) {
        // Update existing quote
        const { error: updateError } = await supabase
          .from('quotes')
          .update({
            cost: formData.cost,
            notes_capacity: formData.notes_capacity,
            status: 'Submitted'
          })
          .eq('id', existingQuote.id);

        error = updateError;
      } else {
        // Insert new quote (for unsolicited quotes)
        const { error: insertError } = await supabase
          .from('quotes')
          .insert({
            supplier_id: impersonatedSupplier.id,
            asset_id: formData.asset_id,
            cost: formData.cost,
            notes_capacity: formData.notes_capacity,
            status: 'Submitted'
          });

        error = insertError;
      }

      if (error) {
        // Handle specific RLS policy violations
        if (error.message.includes('new row violates row-level security policy') || 
            error.message.includes('violates row-level security policy')) {
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

        {/* Loading State */}
        {loading && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
              <span className="text-sm font-medium text-blue-800">
                Loading your quotable assets...
              </span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium text-red-800">
                {error}
              </span>
            </div>
          </div>
        )}

        {/* No Assets State */}
        {!loading && !error && assets.length === 0 && isImpersonating && impersonatedSupplier && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-800">
                You have no pending quote requests. Check back later or contact the producer.
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
              disabled={loading || assets.length === 0}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {loading 
                  ? 'Loading assets...' 
                  : assets.length === 0 
                    ? 'No quotable assets available' 
                    : 'Select an asset'
                }
              </option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.asset_name} - {asset.project.client_name}
                </option>
              ))}
            </select>
            {assets.length > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                {assets.length} asset{assets.length !== 1 ? 's' : ''} available for quoting
              </p>
            )}
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
              disabled={
                submitting || 
                loading || 
                !formData.asset_id || 
                formData.cost <= 0 || 
                !isImpersonating || 
                !impersonatedSupplier ||
                assets.length === 0
              }
              className="flex items-center space-x-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Submit Quote</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierSubmitQuote;



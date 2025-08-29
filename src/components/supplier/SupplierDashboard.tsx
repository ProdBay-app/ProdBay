import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Quote, Asset, Project } from '../../lib/supabase';
import { FileText, CheckCircle, XCircle, Clock, Package, Eye } from 'lucide-react';

interface SupplierQuote extends Quote {
  asset?: Asset;
  project?: Project;
}

const SupplierDashboard: React.FC = () => {
  const [quotes, setQuotes] = useState<SupplierQuote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, supplier identity would come from auth. For MVP, load all quotes.
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select(`*, asset:assets(*, project:projects(*))`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const withProject: SupplierQuote[] = (data || []).map((q: any) => ({
        ...q,
        project: q.asset?.project,
      }));

      setQuotes(withProject);
    } catch (e) {
      console.error('Failed to load supplier quotes', e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Accepted':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Accepted</span>;
      case 'Rejected':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejected</span>;
      case 'Submitted':
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Submitted</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Quotes</h1>
          <p className="text-gray-600 mt-1">View quotes you have submitted and their status</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        {quotes.length === 0 ? (
          <div className="p-12 text-center">
            <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No quotes yet</h3>
            <p className="text-gray-600">Use the Submit Quote page to add your first quote.</p>
          </div>
        ) : (
          <div className="divide-y">
            {quotes.map((q) => (
              <div key={q.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <FileText className="h-4 w-4 text-orange-600" />
                      <span className="font-medium text-gray-900">{q.asset?.asset_name || 'Asset'}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {q.project?.project_name} {q.project?.client_name ? `• ${q.project?.client_name}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(q.status)}
                    {q.status === 'Accepted' && <CheckCircle className="h-5 w-5 text-green-600" />}
                    {q.status === 'Rejected' && <XCircle className="h-5 w-5 text-red-600" />}
                    {q.status === 'Submitted' && <Clock className="h-5 w-5 text-yellow-600" />}
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-700">
                  <span className="font-medium">Cost:</span> ${q.cost?.toFixed(2) || '0.00'}
                </div>
                {q.notes_capacity && (
                  <div className="mt-1 text-sm text-gray-700">
                    <span className="font-medium">Notes:</span> {q.notes_capacity}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierDashboard;



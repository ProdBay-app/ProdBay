import React from 'react';
import type { Quote, Asset, Project } from '../../lib/supabase';
import { FileText, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';

export interface SupplierQuote extends Quote {
  asset?: Asset;
  project?: Project;
}

export interface SupplierDashboardProps {
  // Data
  quotes: SupplierQuote[];
  loading: boolean;
  
  // Utils
  getStatusBadge: (status: string) => React.ReactElement;
  
  // Actions
  loadQuotes: () => Promise<void>;
  refreshQuotes: () => Promise<void>;
}

const SupplierDashboard: React.FC<SupplierDashboardProps> = ({
  quotes,
  loading,
  getStatusBadge,
  loadQuotes,
  refreshQuotes
}) => {

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
                    <span className="font-medium">Notes:</span> <span className="whitespace-pre-wrap">{q.notes_capacity}</span>
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



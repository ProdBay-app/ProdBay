import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useNotification } from '@/hooks/useNotification';
import SupplierDashboard from './SupplierDashboard';
import type { Quote, Asset, Project } from '@/lib/supabase';

export interface SupplierQuote extends Quote {
  asset?: Asset;
  project?: Project;
}

export interface QuoteWithNestedData extends Quote {
  asset?: Asset & {
    project?: Project;
  };
}

export interface SupplierDashboardData {
  quotes: SupplierQuote[];
  loading: boolean;
}

export interface SupplierDashboardUtils {
  getStatusBadge: (status: string) => React.ReactElement;
}

export interface SupplierDashboardActions {
  loadQuotes: () => Promise<void>;
  refreshQuotes: () => Promise<void>;
}

export interface SupplierDashboardProps extends 
  SupplierDashboardData, 
  SupplierDashboardUtils, 
  SupplierDashboardActions {
  error: string | null;
}

const SupplierDashboardContainer: React.FC = () => {
  const { showError } = useNotification();
  
  // State
  const [quotes, setQuotes] = useState<SupplierQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load quotes on mount
  useEffect(() => {
    loadQuotes();
  }, []);

  // Data fetching function
  const loadQuotes = useCallback(async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('quotes')
        .select(`*, asset:assets(*, project:projects(*))`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const withProject: SupplierQuote[] = (data || []).map((q: QuoteWithNestedData) => ({
        ...q,
        project: q.asset?.project,
      }));

      setQuotes(withProject);
    } catch (err) {
      console.error('Failed to load supplier quotes', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load quotes';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Refresh quotes data
  const refreshQuotes = useCallback(async () => {
    setLoading(true);
    await loadQuotes();
  }, [loadQuotes]);

  // Utility function for status badges
  const getStatusBadge = useCallback((status: string): React.ReactElement => {
    switch (status) {
      case 'Accepted':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Accepted</span>;
      case 'Rejected':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejected</span>;
      case 'Submitted':
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Submitted</span>;
    }
  }, []);

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Dashboard</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refreshQuotes}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  // Pass all data and functions to the presentational component
  return (
    <SupplierDashboard
      quotes={quotes}
      loading={loading}
      getStatusBadge={getStatusBadge}
      loadQuotes={loadQuotes}
      refreshQuotes={refreshQuotes}
    />
  );
};

export default SupplierDashboardContainer;

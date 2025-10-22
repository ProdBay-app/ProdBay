import React, { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useNotification } from '@/hooks/useNotification';
import { useSupplierImpersonation } from '@/contexts/SupplierImpersonationContext';
import SupplierDashboard from './SupplierDashboard';
import SupplierImpersonationPanel from '@/components/dev/SupplierImpersonationPanel';
import OwnershipTestPanel from '@/components/dev/OwnershipTestPanel';
import QuotableAssetsTestPanel from '@/components/dev/QuotableAssetsTestPanel';
import RealtimeTestPanel from '@/components/dev/RealtimeTestPanel';
import DevOnlyWrapper from '@/components/dev/DevOnlyWrapper';
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
  const { showError, showSuccess } = useNotification();
  const { isImpersonating, impersonatedSupplier } = useSupplierImpersonation();
  
  // State
  const [quotes, setQuotes] = useState<SupplierQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load quotes on mount and when impersonation state changes
  useEffect(() => {
    loadQuotes();
  }, [isImpersonating, impersonatedSupplier]);

  // Real-time subscription for quote status updates
  useEffect(() => {
    if (!isImpersonating || !impersonatedSupplier) {
      return; // Don't establish subscription if no supplier is selected
    }

    let channel: any = null;

    const setupRealtimeSubscription = async () => {
      try {
        const supabase = await getSupabase();
        
        // Create a channel for real-time updates
        channel = supabase
          .channel('quote-status-updates')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'quotes',
              filter: `supplier_id=eq.${impersonatedSupplier.id}`
            },
            (payload) => {
              console.log('Real-time quote update received:', payload);
              handleQuoteUpdate(payload);
            }
          )
          .subscribe((status) => {
            console.log('Real-time subscription status:', status);
            if (status === 'SUBSCRIBED') {
              console.log('Successfully subscribed to quote updates');
            } else if (status === 'CHANNEL_ERROR') {
              console.error('Real-time subscription error');
            }
          });
      } catch (error) {
        console.error('Failed to setup real-time subscription:', error);
      }
    };

    setupRealtimeSubscription();

    // Cleanup function
    return () => {
      if (channel) {
        console.log('Cleaning up real-time subscription');
        // Note: Supabase automatically handles channel cleanup on component unmount
        // but we can explicitly unsubscribe for better control
        channel.unsubscribe();
      }
    };
  }, [isImpersonating, impersonatedSupplier]);

  // Handle real-time quote updates
  const handleQuoteUpdate = useCallback((payload: any) => {
    console.log('Processing quote update:', payload);
    
    if (payload.eventType !== 'UPDATE' || !payload.new) {
      return; // Only process UPDATE events with new data
    }

    const updatedQuote = payload.new;
    
    // Update the quotes state with the new quote data
    setQuotes(prevQuotes => {
      return prevQuotes.map(quote => {
        if (quote.id === updatedQuote.id) {
          // Update the existing quote with new data
          return {
            ...quote,
            ...updatedQuote,
            // Preserve existing nested relationships
            asset: quote.asset,
            project: quote.project
          };
        }
        return quote;
      });
    });

    // Show a notification to the user about the status change
    if (updatedQuote.status !== payload.old?.status) {
      const statusMessages = {
        'Accepted': 'Your quote has been accepted! 🎉',
        'Rejected': 'Your quote has been rejected.',
        'Submitted': 'Your quote status has been updated.'
      };
      
      const message = statusMessages[updatedQuote.status as keyof typeof statusMessages] || 'Quote status updated';
      
      // Show success notification for accepted quotes, error for rejected
      if (updatedQuote.status === 'Accepted') {
        showSuccess(message);
      } else if (updatedQuote.status === 'Rejected') {
        showError(message);
      } else {
        showSuccess(message);
      }
    }
  }, [showSuccess, showError]);

  // Data fetching function
  const loadQuotes = useCallback(async () => {
    try {
      setError(null);
      const supabase = await getSupabase();
      
      // Build query based on impersonation state
      let query = supabase
        .from('quotes')
        .select(`*, asset:assets(*, project:projects(*))`);
      
      // If impersonating, filter by supplier_id
      if (isImpersonating && impersonatedSupplier) {
        query = query.eq('supplier_id', impersonatedSupplier.id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

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
  }, [showError, isImpersonating, impersonatedSupplier]);

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
    <div className="space-y-6">
      {/* Development-only supplier impersonation panel */}
      <DevOnlyWrapper>
        <SupplierImpersonationPanel />
      </DevOnlyWrapper>
      
      {/* Development-only ownership test panel */}
      <DevOnlyWrapper>
        <OwnershipTestPanel />
      </DevOnlyWrapper>
      
      {/* Development-only quotable assets test panel */}
      <DevOnlyWrapper>
        <QuotableAssetsTestPanel />
      </DevOnlyWrapper>
      
      {/* Development-only real-time test panel */}
      <DevOnlyWrapper>
        <RealtimeTestPanel />
      </DevOnlyWrapper>
      
      <SupplierDashboard
        quotes={quotes}
        getStatusBadge={getStatusBadge}
      />
    </div>
  );
};

export default SupplierDashboardContainer;

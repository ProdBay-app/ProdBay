import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Building2, Mail, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { ProducerService } from '@/services/producerService';
import { useNotification } from '@/hooks/useNotification';
import type { Asset, Quote, Supplier } from '@/lib/supabase';

interface SupplierStatusTrackerProps {
  asset: Asset;
  onStatusUpdate?: () => void;
  onQuoteClick?: (quote: Quote) => void;
}

interface SupplierWithStatus {
  supplier: Supplier;
  quote?: Quote;
  status: 'Requested' | 'Quoted' | 'Assigned';
  lastActivity: string;
}

/**
 * SupplierStatusTracker - Organized view of suppliers by status
 * 
 * Features:
 * - Groups suppliers by status (Requested, Quoted, Assigned)
 * - Dynamic status updates based on quote activity
 * - Visual status indicators and progress tracking
 * - Contact information and service categories
 * - Real-time status updates
 */
const SupplierStatusTracker: React.FC<SupplierStatusTrackerProps> = ({
  asset,
  onStatusUpdate,
  onQuoteClick
}) => {
  const { showError } = useNotification();
  const [suppliersWithStatus, setSuppliersWithStatus] = useState<SupplierWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSupplierStatus = useCallback(async () => {
    setLoading(true);
    try {
      // Get all quotes for this asset
      const quotes = await ProducerService.getQuotesForAsset(asset.id);
      
      // Get all suppliers who have been contacted for this asset
      const supplierMap = new Map<string, SupplierWithStatus>();
      
      // Process quotes to determine supplier status
      quotes.forEach(quote => {
        if (quote.supplier) {
          const status: 'Requested' | 'Quoted' | 'Assigned' = 
            asset.assigned_supplier_id === quote.supplier.id ? 'Assigned' :
            (quote.status === 'Submitted' && Number(quote.cost || 0) > 0) || quote.status === 'Accepted' ? 'Quoted' :
            'Requested';
          
          supplierMap.set(quote.supplier.id, {
            supplier: quote.supplier,
            quote: quote,
            status: status,
            lastActivity: quote.updated_at
          });
        }
      });

      // Convert to array and sort by last activity
      const suppliers = Array.from(supplierMap.values()).sort((a, b) => 
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      );

      setSuppliersWithStatus(suppliers);
    } catch (err) {
      console.error('Error loading supplier status:', err);
      showError('Failed to load supplier status');
    } finally {
      setLoading(false);
    }
  }, [asset.id, showError]);

  // Load suppliers and their status
  useEffect(() => {
    loadSupplierStatus();
  }, [loadSupplierStatus]);

  // Refresh supplier status
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSupplierStatus();
    setRefreshing(false);
    onStatusUpdate?.();
  };

  // Group suppliers by status
  const suppliersByStatus = useMemo(() => {
    const groups = {
      'Requested': [] as SupplierWithStatus[],
      'Quoted': [] as SupplierWithStatus[],
      'Assigned': [] as SupplierWithStatus[]
    };

    suppliersWithStatus.forEach(supplier => {
      groups[supplier.status].push(supplier);
    });

    return groups;
  }, [suppliersWithStatus]);

  // Get status icon and color
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'Requested':
        return {
          icon: <Clock className="w-4 h-4" />,
          color: 'text-amber-300',
          bgColor: 'bg-amber-500/20',
          borderColor: 'border-amber-400/50'
        };
      case 'Quoted':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          color: 'text-blue-300',
          bgColor: 'bg-blue-500/20',
          borderColor: 'border-blue-400/50'
        };
      case 'Assigned':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          color: 'text-green-300',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-400/50'
        };
      default:
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          color: 'text-gray-300',
          bgColor: 'bg-gray-500/20',
          borderColor: 'border-gray-400/50'
        };
    }
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
        <span className="ml-2 text-gray-300">Loading supplier status...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-purple-300" />
          <h3 className="text-lg font-semibold text-white">Supplier Status</h3>
          <span className="px-2 py-1 bg-purple-500/30 text-purple-200 text-sm font-semibold rounded-full">
            {suppliersWithStatus.length}
          </span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white/10 border border-white/20 text-gray-200 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Status Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(['Requested', 'Quoted', 'Assigned'] as const).map(status => {
          const suppliers = suppliersByStatus[status];
          const statusInfo = getStatusInfo(status);

          return (
            <div key={status} className="flex flex-col space-y-3 h-full">
              {/* Status Header */}
              <div className={`${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-lg p-3 h-24 flex flex-col`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={statusInfo.color}>
                    {statusInfo.icon}
                  </span>
                  <h4 className="font-semibold text-white">{status}</h4>
                  <span className="px-2 py-0.5 bg-white/10 text-gray-200 text-xs font-medium rounded-full">
                    {suppliers.length}
                  </span>
                </div>
                <p className="text-sm text-gray-300">
                  {status === 'Requested' && 'Quote requests sent, awaiting response'}
                  {status === 'Quoted' && 'Quotes received, under review'}
                  {status === 'Assigned' && 'Supplier selected for this asset'}
                </p>
              </div>

              {/* Suppliers List */}
              <div className="flex-1 space-y-2">
                {suppliers.length === 0 ? (
                  <div className="text-center py-6 text-gray-300">
                    <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No suppliers in this status</p>
                  </div>
                ) : (
                  suppliers.map(({ supplier, quote, lastActivity }) => (
                    <div
                      key={supplier.id}
                      className={`bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3 hover:bg-white/20 transition-colors ${
                        quote ? 'cursor-pointer' : ''
                      }`}
                      onClick={() => {
                        if (quote && onQuoteClick) {
                          onQuoteClick(quote);
                        }
                      }}
                    >
                      {/* Supplier Info */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-white text-sm">
                            {supplier.supplier_name}
                          </h5>
                          <div className="flex items-center gap-1 text-xs text-gray-300 mt-0.5">
                            <Mail className="w-3 h-3" />
                            <span>{supplier.contact_email}</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatDate(lastActivity)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {suppliersWithStatus.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-white mb-2">No suppliers contacted yet</h3>
          <p className="text-gray-300 mb-4">
            Start by requesting quotes from relevant suppliers for this asset.
          </p>
        </div>
      )}
    </div>
  );
};

export default SupplierStatusTracker;

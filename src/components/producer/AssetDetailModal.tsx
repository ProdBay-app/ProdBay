import React, { useState } from 'react';
import { X, FileText, Calendar, Building2, Clock, Package } from 'lucide-react';
import { ProducerService } from '@/services/producerService';
import { useNotification } from '@/hooks/useNotification';
import StatusSelect from '@/components/shared/StatusSelect';
import type { Asset } from '@/lib/supabase';
import type { AssetStatus } from '@/types/database';

interface AssetDetailModalProps {
  isOpen: boolean;
  asset: Asset | null;
  onClose: () => void;
  onAssetUpdate: (updatedAsset: Asset) => void;
}

/**
 * AssetDetailModal - A comprehensive interactive modal for viewing and managing asset details
 * 
 * Features:
 * - Large, focused modal for deep dive into asset information
 * - Displays all asset fields in an organized, readable format
 * - Interactive status dropdown for changing asset workflow state
 * - Color-coded status badges matching the card design
 * - Responsive layout (full-screen on mobile, large centered on desktop)
 * - Foundation for future interactive features (quotes, activity, etc.)
 */
const AssetDetailModal: React.FC<AssetDetailModalProps> = ({ isOpen, asset, onClose, onAssetUpdate }) => {
  const { showSuccess, showError } = useNotification();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Don't render if modal is closed or no asset is selected
  if (!isOpen || !asset) return null;

  // Handle status change
  const handleStatusChange = async (newStatus: AssetStatus) => {
    if (!asset || newStatus === asset.status) return;

    setIsUpdatingStatus(true);
    try {
      // Call the service to update the asset
      const updatedAsset = await ProducerService.updateAsset(asset.id, {
        asset_name: asset.asset_name,
        specifications: asset.specifications || '',
        timeline: asset.timeline || '',
        status: newStatus,
        assigned_supplier_id: asset.assigned_supplier_id
      });

      // Notify parent component of the update
      onAssetUpdate(updatedAsset);

      // Show success notification
      showSuccess(`Status updated to "${newStatus}"`);
    } catch (err) {
      console.error('Error updating status:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update status';
      showError(errorMessage);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Format dates for display
  const formattedTimeline = asset.timeline
    ? new Date(asset.timeline).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Not set';

  const formattedCreatedAt = new Date(asset.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const formattedUpdatedAt = new Date(asset.updated_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Get status badge color based on asset status
  const getStatusColor = (): string => {
    switch (asset.status) {
      case 'Pending':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'Quoting':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'In Production':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Delivered':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 sm:p-6 lg:p-8">
          {/* Modal Content */}
          <div
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Purple gradient matching brand */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-5 rounded-t-xl">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Package className="w-6 h-6 text-white" />
                    <h2 className="text-2xl font-bold text-white">
                      {asset.asset_name}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border-2 ${getStatusColor()}`}>
                      {asset.status}
                    </span>
                  </div>
                </div>
                
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="flex-shrink-0 p-2 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Body - Main Content */}
            <div className="p-6 space-y-6">
              {/* Overview Section */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Overview
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Specifications */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Specifications
                    </label>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      {asset.specifications ? (
                        <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                          {asset.specifications}
                        </p>
                      ) : (
                        <p className="text-gray-400 italic">No specifications provided</p>
                      )}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1.5 text-purple-600" />
                      Timeline
                    </label>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-gray-800">{formattedTimeline}</p>
                    </div>
                  </div>

                  {/* Status - Interactive Dropdown */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Status
                      {isUpdatingStatus && (
                        <span className="ml-2 text-xs text-purple-600 font-normal">
                          Updating...
                        </span>
                      )}
                    </label>
                    <StatusSelect
                      value={asset.status}
                      onChange={handleStatusChange}
                      disabled={isUpdatingStatus}
                    />
                  </div>
                </div>
              </section>

              {/* Supplier Section */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  Assigned Supplier
                </h3>
                
                {asset.assigned_supplier ? (
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-5 border border-purple-200">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-purple-900 mb-1">
                          Company Name
                        </label>
                        <p className="text-purple-800 font-medium text-lg">
                          {asset.assigned_supplier.supplier_name}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-purple-900 mb-1">
                          Contact Email
                        </label>
                        <p className="text-purple-800">
                          <a 
                            href={`mailto:${asset.assigned_supplier.contact_email}`}
                            className="hover:underline"
                          >
                            {asset.assigned_supplier.contact_email}
                          </a>
                        </p>
                      </div>

                      {asset.assigned_supplier.service_categories && 
                       asset.assigned_supplier.service_categories.length > 0 && (
                        <div>
                          <label className="block text-sm font-semibold text-purple-900 mb-2">
                            Service Categories
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {asset.assigned_supplier.service_categories.map((category, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-white text-purple-700 text-xs font-medium rounded-full border border-purple-200"
                              >
                                {category}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {asset.assigned_supplier.contact_persons && 
                       asset.assigned_supplier.contact_persons.length > 0 && (
                        <div>
                          <label className="block text-sm font-semibold text-purple-900 mb-2">
                            Contact Persons
                          </label>
                          <div className="space-y-2">
                            {asset.assigned_supplier.contact_persons.map((person, idx) => (
                              <div 
                                key={idx}
                                className="bg-white rounded-lg p-3 border border-purple-200"
                              >
                                <p className="font-medium text-purple-900">
                                  {person.name}
                                  {person.is_primary && (
                                    <span className="ml-2 px-2 py-0.5 bg-purple-200 text-purple-800 text-xs rounded-full">
                                      Primary
                                    </span>
                                  )}
                                </p>
                                <p className="text-sm text-purple-700">{person.role}</p>
                                <p className="text-sm text-purple-600">
                                  {person.email}
                                  {person.phone && ` • ${person.phone}`}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-5 border-2 border-dashed border-gray-300 text-center">
                    <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 font-medium">No supplier assigned yet</p>
                    <p className="text-gray-500 text-sm mt-1">
                      A supplier will be assigned during the quoting process
                    </p>
                  </div>
                )}
              </section>

              {/* Metadata Section */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  Metadata
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Created
                    </label>
                    <p className="text-gray-800">{formattedCreatedAt}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Last Updated
                    </label>
                    <p className="text-gray-800">{formattedUpdatedAt}</p>
                  </div>
                </div>
              </section>

              {/* Future Features - Placeholders */}
              <section className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Coming Soon
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Quotes Placeholder */}
                  <div className="bg-gray-50 rounded-lg p-5 border-2 border-dashed border-gray-300 text-center">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 font-medium text-sm">Quotes Comparison</p>
                    <p className="text-gray-500 text-xs mt-1">View and compare supplier quotes</p>
                  </div>

                  {/* Activity Placeholder */}
                  <div className="bg-gray-50 rounded-lg p-5 border-2 border-dashed border-gray-300 text-center">
                    <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 font-medium text-sm">Activity Log</p>
                    <p className="text-gray-500 text-xs mt-1">Track changes and updates</p>
                  </div>

                  {/* Documents Placeholder */}
                  <div className="bg-gray-50 rounded-lg p-5 border-2 border-dashed border-gray-300 text-center">
                    <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 font-medium text-sm">Documents</p>
                    <p className="text-gray-500 text-xs mt-1">Attach files and references</p>
                  </div>
                </div>
              </section>
            </div>

            {/* Footer - Optional action buttons area for future use */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-xl">
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AssetDetailModal;


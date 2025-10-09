import React from 'react';
import { Calendar, FileText, Building2, Edit, Trash2 } from 'lucide-react';
import type { Asset } from '@/lib/supabase';

interface AssetCardProps {
  asset: Asset;
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  onClick: (asset: Asset) => void;
}

/**
 * AssetCard - A presentational component for displaying individual asset information
 * 
 * Design Features:
 * - Purple gradient background matching the project card style
 * - Displays key asset metadata at a glance
 * - Status badge for quick state identification
 * - Compact card format suitable for Kanban columns
 * - Entire card is clickable to open detail modal (except action buttons)
 */
const AssetCard: React.FC<AssetCardProps> = ({ asset, onEdit, onDelete, onClick }) => {
  // Format the timeline date for display
  const formattedTimeline = asset.timeline
    ? new Date(asset.timeline).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : null;

  // Get status badge color based on asset status
  const getStatusColor = (): string => {
    switch (asset.status) {
      case 'Pending':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'Quoting':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'In Production':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Delivered':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div 
      className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] p-4 text-white relative group cursor-pointer"
      onClick={() => onClick(asset)}
    >
      {/* Action Buttons - Visible on hover */}
      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
        {/* Edit Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(asset);
          }}
          className="p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-colors"
          aria-label="Edit asset"
        >
          <Edit className="w-4 h-4 text-white" />
        </button>
        
        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(asset);
          }}
          className="p-2 bg-white/20 hover:bg-red-500 rounded-lg backdrop-blur-sm transition-colors"
          aria-label="Delete asset"
        >
          <Trash2 className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Asset Name */}
      <h3 className="text-lg font-bold mb-3 line-clamp-2 min-h-[3rem] pr-20">
        {asset.asset_name}
      </h3>

      {/* Specifications Preview */}
      {asset.specifications && (
        <div className="mb-3">
          <div className="flex items-start gap-2 text-white/90">
            <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p className="text-sm line-clamp-2">
              {asset.specifications}
            </p>
          </div>
        </div>
      )}

      {/* Timeline */}
      {formattedTimeline && (
        <div className="flex items-center gap-2 mb-3 text-white/80">
          <Calendar className="w-4 h-4" />
          <p className="text-xs">{formattedTimeline}</p>
        </div>
      )}

      {/* Assigned Supplier */}
      {asset.assigned_supplier && (
        <div className="flex items-center gap-2 mb-3 text-white/80">
          <Building2 className="w-4 h-4" />
          <p className="text-xs truncate">{asset.assigned_supplier.supplier_name}</p>
        </div>
      )}

      {/* Status Badge */}
      <div className="flex items-center justify-start mt-auto pt-2">
        <span 
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor()}`}
        >
          {asset.status}
        </span>
      </div>
    </div>
  );
};

export default AssetCard;

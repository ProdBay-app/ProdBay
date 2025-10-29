import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import type { Asset } from '@/lib/supabase';

interface AssetCardProps {
  asset: Asset;
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  onClick: (asset: Asset) => void;
  
  // NEW: Props for bi-directional hover linking with brief
  isHighlighted?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
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
 * - Bi-directional hover highlighting with project brief (highlights when source text hovered)
 */
const AssetCard: React.FC<AssetCardProps> = ({ 
  asset, 
  onEdit, 
  onDelete, 
  onClick,
  isHighlighted,
  onMouseEnter,
  onMouseLeave
}) => {

  return (
    <div 
      className={`bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] p-3 text-white relative group cursor-pointer ${
        isHighlighted ? 'ring-4 ring-teal-400 ring-offset-2 scale-[1.05] shadow-xl' : ''
      }`}
      onClick={() => onClick(asset)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Action Buttons - Visible on hover */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
        {/* Edit Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(asset);
          }}
          className="p-1.5 bg-white/20 hover:bg-white/30 rounded backdrop-blur-sm transition-colors"
          aria-label="Edit asset"
        >
          <Edit className="w-3 h-3 text-white" />
        </button>
        
        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(asset);
          }}
          className="p-1.5 bg-white/20 hover:bg-red-500 rounded backdrop-blur-sm transition-colors"
          aria-label="Delete asset"
        >
          <Trash2 className="w-3 h-3 text-white" />
        </button>
      </div>

      {/* Asset Name Only - Compact */}
      <h3 className="text-sm font-semibold line-clamp-2 pr-16 leading-tight">
        {asset.asset_name}
      </h3>
    </div>
  );
};

export default AssetCard;

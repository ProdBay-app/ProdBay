import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import type { Asset } from '@/lib/supabase';
import { getTagColor } from '@/utils/assetTags';

interface AssetCardProps {
  asset: Asset;
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  onClick: (asset: Asset) => void;
  
  // Props for bi-directional hover linking with brief
  isHighlighted?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

/**
 * AssetCard - A presentational component for displaying individual asset information
 * 
 * Design Features:
 * - Purple gradient background matching the project card style
 * - Fixed height (h-24) for uniform card dimensions
 * - Displays asset name with title case capitalization
 * - Shows primary tag (first tag) as colored badge
 * - Compact card format suitable for grid layouts
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
  // Get the first tag if available
  const primaryTag = asset.tags && asset.tags.length > 0 ? asset.tags[0] : null;
  const tagColor = primaryTag ? getTagColor(primaryTag) : null;

  // Convert hex color to rgba for opacity support
  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div 
      className={`h-24 flex flex-col justify-between bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] p-3 text-white relative group cursor-pointer ${
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

      {/* Asset Name - Title Case, Two Lines Max */}
      <h3 className="text-sm font-semibold line-clamp-2 capitalize leading-tight pr-16">
        {asset.asset_name}
      </h3>

      {/* Primary Tag Badge - Bottom of Card */}
      {primaryTag && tagColor && (
        <div 
          className="text-xs font-medium px-2 py-0.5 rounded-full self-start backdrop-blur-sm border"
          style={{ 
            backgroundColor: hexToRgba(tagColor, 0.25),
            color: '#FFFFFF',
            borderColor: hexToRgba(tagColor, 0.5)
          }}
        >
          {primaryTag}
        </div>
      )}
    </div>
  );
};

export default AssetCard;

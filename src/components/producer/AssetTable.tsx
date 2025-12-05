import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import type { Asset } from '@/lib/supabase';
import { getTagColor } from '@/utils/assetTags';

interface AssetTableProps {
  assets: Asset[];
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  onView?: (asset: Asset) => void;
  hoveredAssetId?: string | null;
  onAssetHover?: (assetId: string | null) => void;
}

/**
 * AssetTable - Data-dense table view for displaying assets
 * 
 * Features:
 * - 8 columns: Name, Quantity, Tags, Supplier Status, # Quote Requests, # Quotes Received, Last Updated, Actions
 * - Glassmorphism styling matching app aesthetic
 * - Responsive design with horizontal scroll on mobile
 * - Bi-directional hover linking with project brief
 * - Compact tag display with color coding
 * - Status badges with color coding
 */
const AssetTable: React.FC<AssetTableProps> = ({
  assets,
  onEdit,
  onDelete,
  onView,
  hoveredAssetId,
  onAssetHover
}) => {
  // Format last updated date
  const formatLastUpdated = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Convert hex color to rgba for opacity support
  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Format tags display (show first tag only, with counter badge if more exist)
  const formatTags = (tags: string[] | undefined | null): React.ReactNode => {
    if (!tags || tags.length === 0) {
      return <span className="text-gray-400 text-sm">No tags</span>;
    }

    const firstTag = tags[0];
    const remainingCount = tags.length - 1;
    const tagColor = getTagColor(firstTag);

    return (
      <div className="flex items-center gap-1">
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full backdrop-blur-sm border whitespace-nowrap"
          style={{
            backgroundColor: hexToRgba(tagColor, 0.25),
            color: '#FFFFFF',
            borderColor: hexToRgba(tagColor, 0.5)
          }}
        >
          {firstTag}
        </span>
        {remainingCount > 0 && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-500/30 text-gray-300 border border-gray-400/30 whitespace-nowrap">
            +{remainingCount}
          </span>
        )}
      </div>
    );
  };

  // Get hex color for asset status
  const getStatusHexColor = (status: string): string => {
    switch (status) {
      case 'Approved':
      case 'Delivered':
        return '#10B981'; // green-500
      case 'In Production':
      case 'Quoting':
        return '#F59E0B'; // amber-500
      case 'Pending':
        return '#6B7280'; // gray-500
      default:
        return '#6B7280'; // gray-500
    }
  };

  // Get status badge
  const getStatusBadge = (status: string): React.ReactNode => {
    const statusColor = getStatusHexColor(status);
    return (
      <span
        className="px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm border"
        style={{
          backgroundColor: hexToRgba(statusColor, 0.25),
          color: '#FFFFFF',
          borderColor: hexToRgba(statusColor, 0.5)
        }}
      >
        {status}
      </span>
    );
  };

  // Handle row click (open detail view)
  const handleRowClick = (asset: Asset) => {
    if (onView) {
      onView(asset);
    }
  };

  if (assets.length === 0) {
    return (
      <div className="bg-white/5 border-2 border-dashed border-white/30 rounded-lg p-12 text-center">
        <p className="text-gray-300">No assets to display</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-14rem)] overflow-auto rounded-lg border border-white/20">
      <table className="w-full border-collapse">
        {/* Table Header */}
        <thead className="sticky top-0 z-20">
          <tr className="bg-black/60 backdrop-blur-xl border-b border-white/20">
            <th className="px-4 py-3 text-left text-sm font-semibold text-white sticky left-0 bg-black/60 backdrop-blur-xl z-30">
              Name
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white">
              Quantity
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white">
              Tags
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white">
              Supplier Status
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white">
              # Quote Requests
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white">
              # Quotes Received
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white">
              Last Updated
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white">
              Actions
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {assets.map((asset) => {
            const isHighlighted = hoveredAssetId === asset.id;
            return (
              <tr
                key={asset.id}
                className={`
                  h-[72px] bg-white/5 border-b border-white/10 
                  hover:bg-white/10 hover:border-purple-400/30 
                  transition-all duration-200 cursor-pointer
                  ${isHighlighted ? 'ring-2 ring-purple-400/50 bg-white/15' : ''}
                `}
                onClick={() => handleRowClick(asset)}
                onMouseEnter={() => onAssetHover && onAssetHover(asset.id)}
                onMouseLeave={() => onAssetHover && onAssetHover(null)}
              >
                {/* Name */}
                <td className="px-4 py-3 text-gray-200 sticky left-0 bg-white/5 backdrop-blur-md z-10 whitespace-nowrap">
                  <span className="font-medium capitalize block max-w-[250px] overflow-hidden text-ellipsis">
                    {asset.asset_name}
                  </span>
                </td>

                {/* Quantity */}
                <td className="px-4 py-3 text-gray-200 whitespace-nowrap">
                  {asset.quantity !== null && asset.quantity !== undefined ? (
                    <span className="text-sm">{asset.quantity}</span>
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                </td>

                {/* Tags */}
                <td className="px-4 py-3 whitespace-nowrap">
                  {formatTags(asset.tags)}
                </td>

                {/* Supplier Status */}
                <td className="px-4 py-3 whitespace-nowrap">
                  {getStatusBadge(asset.status)}
                </td>

                {/* # Quote Requests */}
                <td className="px-4 py-3 text-gray-200 whitespace-nowrap">
                  <span className="text-sm">{asset.quote_count ?? 0}</span>
                </td>

                {/* # Quotes Received */}
                <td className="px-4 py-3 text-gray-200 whitespace-nowrap">
                  <span className="text-sm">{asset.received_quote_count ?? 0}</span>
                </td>

                {/* Last Updated */}
                <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                  <span className="text-sm">{formatLastUpdated(asset.updated_at)}</span>
                </td>

                {/* Actions */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {/* Edit Button */}
                    <button
                      onClick={() => onEdit(asset)}
                      className="p-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 rounded backdrop-blur-sm transition-colors"
                      aria-label="Edit asset"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => onDelete(asset)}
                      className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded backdrop-blur-sm transition-colors"
                      aria-label="Delete asset"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AssetTable;


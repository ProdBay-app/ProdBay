import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, Tag, X, ChevronDown } from 'lucide-react';
import type { Asset } from '@/lib/supabase';
import type { InlineEditFields } from './AssetList';
import { getTagColor, PREDEFINED_ASSET_TAGS, filterTags } from '@/utils/assetTags';

interface AssetTableProps {
  assets: Asset[];
  onDelete: (asset: Asset) => void;
  onView?: (asset: Asset) => void;
  hoveredAssetId?: string | null;
  onAssetHover?: (assetId: string | null) => void;
  /** Inline edit mode: when true, row click does not open detail modal and Edit icon is hidden */
  isEditMode?: boolean;
  edits?: Record<string, InlineEditFields>;
  onEditChange?: (assetId: string, updates: Partial<InlineEditFields>) => void;
}

/**
 * AssetTable - Data-dense table view for displaying assets
 * 
 * Features:
 * - 7 columns: Name, Quantity, Tags, Specifications, Supplier Status, Last Updated, Actions
 * - Glassmorphism styling matching app aesthetic
 * - Responsive design with horizontal scroll on mobile
 * - Bi-directional hover linking with project brief
 * - Compact tag display with color coding
 * - Status badges with color coding
 * 
 * NOTE: Sticky positioning for the Name column has been removed.
 * This will be addressed in a future update.
 */
const AssetTable: React.FC<AssetTableProps> = ({
  assets,
  onDelete,
  onView,
  hoveredAssetId,
  onAssetHover,
  isEditMode = false,
  edits = {},
  onEditChange
}) => {
  const [openTagSelectorForAssetId, setOpenTagSelectorForAssetId] = useState<string | null>(null);
  const [tagSearchTerm, setTagSearchTerm] = useState('');
  const [tagDropdownPosition, setTagDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const tagSelectorTriggerRef = useRef<HTMLButtonElement | null>(null);
  const tagDropdownRef = useRef<HTMLDivElement | null>(null);

  // Reset search when opening/closing tag selector
  useEffect(() => {
    if (!openTagSelectorForAssetId) {
      setTagSearchTerm('');
      setTagDropdownPosition(null);
    }
  }, [openTagSelectorForAssetId]);

  // Position dropdown from trigger ref (useLayoutEffect so it runs before paint)
  useLayoutEffect(() => {
    if (!openTagSelectorForAssetId) return;
    const el = tagSelectorTriggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setTagDropdownPosition({
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 280)
    });
  }, [openTagSelectorForAssetId]);

  // Click outside to close tag dropdown
  useEffect(() => {
    if (!openTagSelectorForAssetId) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        tagSelectorTriggerRef.current?.contains(target) ||
        tagDropdownRef.current?.contains(target)
      ) {
        return;
      }
      setOpenTagSelectorForAssetId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openTagSelectorForAssetId]);

  // Format last updated date
  const formatLastUpdated = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    // Handle future dates (clock skew or timezone issues)
    if (diffDays < 0) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    
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

  // Handle row click (open detail view) - disabled when isEditMode to allow cell focus
  const handleRowClick = (asset: Asset) => {
    if (!isEditMode && onView) {
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
        <thead 
          className="sticky top-0 z-20 shadow-sm"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)'
          }}
        >
          <tr className="border-b border-white/20">
            <th className="px-4 py-3 text-left text-sm font-semibold text-white">
              Name
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white">
              Quantity
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white">
              Tags
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white">
              Specifications
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white">
              Supplier Status
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
                  ${isEditMode ? 'min-h-[72px]' : 'h-[72px]'} bg-white/5 border-b border-white/10 
                  hover:bg-white/10 hover:border-purple-400/30 
                  transition-all duration-200 ${isEditMode ? '' : 'cursor-pointer'}
                  ${isHighlighted ? 'ring-2 ring-purple-400/50 bg-white/15' : ''}
                `}
                onClick={() => handleRowClick(asset)}
                onMouseEnter={() => onAssetHover && onAssetHover(asset.id)}
                onMouseLeave={() => onAssetHover && onAssetHover(null)}
              >
                {/* Name */}
                <td className={`px-4 py-3 text-gray-200 ${!isEditMode ? 'whitespace-nowrap' : ''} ${isHighlighted ? 'bg-white/15' : 'bg-white/5'}`}>
                  {isEditMode && onEditChange ? (
                    <textarea
                      value={edits[asset.id]?.asset_name ?? asset.asset_name ?? ''}
                      onChange={(e) => onEditChange(asset.id, { asset_name: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      rows={2}
                      className="w-full min-w-[120px] max-w-[250px] resize-none px-2 py-1.5 text-sm bg-black/20 border border-white/20 text-white rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Asset name"
                    />
                  ) : (
                    <span className="font-medium capitalize block max-w-[250px] overflow-hidden text-ellipsis">
                      {asset.asset_name}
                    </span>
                  )}
                </td>

                {/* Quantity */}
                <td className={`px-4 py-3 text-gray-200 ${!isEditMode ? 'whitespace-nowrap' : ''}`}>
                  {isEditMode && onEditChange ? (
                    <input
                      type="number"
                      value={
                        edits[asset.id] && 'quantity' in edits[asset.id]
                          ? (edits[asset.id].quantity ?? '')
                          : (asset.quantity ?? '')
                      }
                      onChange={(e) => {
                        const v = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                        onEditChange(asset.id, { quantity: Number.isNaN(v) ? undefined : v });
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-20 px-2 py-1.5 text-sm bg-black/20 border border-white/20 text-white rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="—"
                      min={0}
                    />
                  ) : (
                    asset.quantity !== null && asset.quantity !== undefined ? (
                      <span className="text-sm">{asset.quantity}</span>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )
                  )}
                </td>

                {/* Tags */}
                <td className={`px-4 py-3 ${isEditMode ? 'align-top overflow-visible' : 'whitespace-nowrap'}`}>
                  {isEditMode && onEditChange ? (
                    <div
                      className="min-w-[140px] max-w-[200px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {(() => {
                        const currentTags = edits[asset.id]?.tags ?? asset.tags ?? [];
                        const filteredTagsList = filterTags(tagSearchTerm);
                        const isOpen = openTagSelectorForAssetId === asset.id;
                        const position = isOpen ? tagDropdownPosition : null;

                        return (
                          <>
                            {currentTags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-1.5">
                                {currentTags.map((tagName) => (
                                  <span
                                    key={tagName}
                                    className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                                    style={{ backgroundColor: getTagColor(tagName) }}
                                  >
                                    {tagName}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = currentTags.filter((t) => t !== tagName);
                                        onEditChange(asset.id, { tags: next });
                                      }}
                                      className="ml-0.5 hover:bg-white/20 rounded-full p-0.5"
                                      aria-label={`Remove ${tagName}`}
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                            <button
                              ref={isOpen ? tagSelectorTriggerRef : undefined}
                              type="button"
                              onClick={() =>
                                setOpenTagSelectorForAssetId((prev) =>
                                  prev === asset.id ? null : asset.id
                                )
                              }
                              className="flex items-center justify-between gap-2 w-full text-left px-2 py-1 text-sm border border-white/20 bg-black/20 text-gray-200 rounded-md hover:bg-black/30 transition-colors"
                            >
                              <span className="truncate">
                                {currentTags.length > 0
                                  ? `${currentTags.length} tag(s)`
                                  : 'Select tags...'}
                              </span>
                              <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            </button>
                            {isOpen &&
                              position &&
                              createPortal(
                                <div
                                  ref={tagDropdownRef}
                                  className="fixed z-[9999] bg-gray-900 border border-white/20 rounded-lg shadow-xl max-h-60 overflow-hidden min-w-[280px]"
                                  style={{
                                    top: position.top,
                                    left: position.left,
                                    width: position.width
                                  }}
                                >
                                  <div className="p-2 border-b border-white/20">
                                    <input
                                      type="text"
                                      placeholder="Search tags..."
                                      value={tagSearchTerm}
                                      onChange={(e) => setTagSearchTerm(e.target.value)}
                                      className="w-full px-3 py-2 bg-black/20 border border-white/20 text-white placeholder-gray-400 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div className="max-h-48 overflow-y-auto">
                                    {filteredTagsList.length === 0 ? (
                                      <div className="p-3 text-sm text-gray-300 text-center">
                                        No tags found
                                      </div>
                                    ) : (
                                      filteredTagsList.map((tag) => (
                                        <button
                                          key={tag.name}
                                          type="button"
                                          onClick={() => {
                                            const next = currentTags.includes(tag.name)
                                              ? currentTags.filter((t) => t !== tag.name)
                                              : [...currentTags, tag.name];
                                            onEditChange(asset.id, { tags: next });
                                          }}
                                          className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-2 ${
                                            currentTags.includes(tag.name)
                                              ? 'bg-purple-500/20'
                                              : ''
                                          }`}
                                        >
                                          <div
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: tag.color }}
                                          />
                                          <div className="flex-1 min-w-0">
                                            <div className="font-medium text-white truncate">
                                              {tag.name}
                                            </div>
                                            <div className="text-xs text-gray-300 truncate">
                                              {tag.description}
                                            </div>
                                          </div>
                                          {currentTags.includes(tag.name) && (
                                            <span className="text-purple-300 flex-shrink-0">✓</span>
                                          )}
                                        </button>
                                      ))
                                    )}
                                  </div>
                                </div>,
                                document.body
                              )}
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    formatTags(asset.tags)
                  )}
                </td>

                {/* Specifications */}
                <td className={`px-4 py-3 text-gray-200 max-w-[220px] ${isEditMode ? 'align-top' : ''}`}>
                  {isEditMode && onEditChange ? (
                    <textarea
                      value={edits[asset.id]?.specifications ?? asset.specifications ?? ''}
                      onChange={(e) => onEditChange(asset.id, { specifications: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      rows={3}
                      className="w-full min-h-[4rem] max-h-[8rem] overflow-y-auto resize-y px-2 py-1.5 text-sm bg-black/20 border border-white/20 text-white rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Specifications"
                    />
                  ) : (
                    asset.specifications ? (
                      <span
                        className="block text-sm truncate"
                        title={asset.specifications}
                      >
                        {asset.specifications}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )
                  )}
                </td>

                {/* Supplier Status */}
                <td className="px-4 py-3 whitespace-nowrap">
                  {getStatusBadge(asset.status)}
                </td>

                {/* Last Updated */}
                <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                  <span className="text-sm">{formatLastUpdated(asset.updated_at)}</span>
                </td>

                {/* Actions */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
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


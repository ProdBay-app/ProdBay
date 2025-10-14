import React, { useState, useEffect, useRef } from 'react';
import { Save, Maximize2, Minimize2, Loader2, Edit3, Eye } from 'lucide-react';
import { ProducerService } from '@/services/producerService';
import { useNotification } from '@/hooks/useNotification';
import type { Asset } from '@/lib/supabase';

interface EditableBriefProps {
  projectId: string;
  briefDescription: string;
  physicalParameters: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onBriefUpdate?: (briefDescription: string, physicalParameters: string) => void;
  
  // NEW: Props for interactive asset tagging
  assets?: Asset[];
  hoveredAssetId?: string | null;
  onAssetHover?: (assetId: string | null) => void;
  onAssetClick?: (asset: Asset) => void;
}

/**
 * EditableBrief - Editable and expandable project brief component
 * 
 * Features:
 * - Dual mode: View mode with interactive asset tagging, Edit mode with textareas
 * - View mode: Highlights asset source text, clickable to open asset details
 * - Edit mode: Auto-resizing textareas for description and physical parameters
 * - Dirty tracking with "Unsaved Changes" indicator
 * - Save button appears only when changes are made
 * - Expand/collapse functionality for better writing experience
 * - Bi-directional hover linking between brief and assets
 * - Optimistic UI updates on successful save
 * - Loading and error states
 */
const EditableBrief: React.FC<EditableBriefProps> = ({
  projectId,
  briefDescription,
  physicalParameters,
  isExpanded,
  onToggleExpand,
  onBriefUpdate,
  assets,              // Will be used for interactive highlighting in next step
  hoveredAssetId,      // Will be used for interactive highlighting in next step
  onAssetHover,        // Will be used for interactive highlighting in next step
  onAssetClick         // Will be used for interactive highlighting in next step
}) => {
  const { showSuccess, showError } = useNotification();

  // Mode state: 'view' (default) or 'edit'
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  // Editing state
  const [editedBriefDescription, setEditedBriefDescription] = useState(briefDescription);
  const [editedPhysicalParameters, setEditedPhysicalParameters] = useState(physicalParameters);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Refs for textareas (for auto-resize)
  const briefTextareaRef = useRef<HTMLTextAreaElement>(null);
  const physicalTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync local state when props change (e.g., after external update)
  useEffect(() => {
    setEditedBriefDescription(briefDescription);
    setEditedPhysicalParameters(physicalParameters);
    setIsDirty(false);
  }, [briefDescription, physicalParameters]);

  // Auto-resize textareas to fit content
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement | null) => {
    if (!textarea) return;
    
    // Reset height to get accurate scrollHeight
    textarea.style.height = 'auto';
    // Set height to scrollHeight (content height)
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  // Adjust heights when content changes
  useEffect(() => {
    adjustTextareaHeight(briefTextareaRef.current);
  }, [editedBriefDescription]);

  useEffect(() => {
    adjustTextareaHeight(physicalTextareaRef.current);
  }, [editedPhysicalParameters]);

  // Handle description change
  const handleBriefDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setEditedBriefDescription(newValue);
    setIsDirty(
      newValue !== briefDescription || 
      editedPhysicalParameters !== physicalParameters
    );
  };

  // Handle physical parameters change
  const handlePhysicalParametersChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setEditedPhysicalParameters(newValue);
    setIsDirty(
      editedBriefDescription !== briefDescription || 
      newValue !== physicalParameters
    );
  };

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await ProducerService.updateProjectBrief(
        projectId,
        editedBriefDescription,
        editedPhysicalParameters
      );

      setIsDirty(false);
      showSuccess('Brief updated successfully');

      // Notify parent component (for optimistic update)
      onBriefUpdate?.(editedBriefDescription, editedPhysicalParameters);
    } catch (err) {
      console.error('Error saving brief:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save brief';
      showError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Render interactive content with asset highlighting
   * Safely parses text and wraps asset source_text in interactive <mark> elements
   * 
   * @param text - The text to parse (briefDescription or physicalParameters)
   * @returns Array of React nodes (text strings and <mark> elements)
   */
  const renderInteractiveContent = (text: string): React.ReactNode[] => {
    // If no assets provided or no interactive features enabled, return plain text
    if (!assets || !onAssetClick || !onAssetHover) {
      return [text];
    }

    // Build array of highlights (positions where source_text appears)
    const highlights: Array<{ start: number; end: number; asset: Asset }> = [];

    assets.forEach(asset => {
      // Only process assets that have source_text
      if (asset.source_text && asset.source_text.trim()) {
        // Find all occurrences of source_text in the text
        const sourceText = asset.source_text;
        let index = text.indexOf(sourceText);

        // We'll only highlight the first occurrence to avoid complexity
        if (index !== -1) {
          highlights.push({
            start: index,
            end: index + sourceText.length,
            asset
          });
        }
      }
    });

    // If no highlights found, return plain text
    if (highlights.length === 0) {
      return [text];
    }

    // Sort highlights by start position
    highlights.sort((a, b) => a.start - b.start);

    // Build array of React elements
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    highlights.forEach((highlight, idx) => {
      // Add plain text before this highlight
      if (highlight.start > lastIndex) {
        const plainText = text.substring(lastIndex, highlight.start);
        elements.push(plainText);
      }

      // Add interactive mark element
      const isHovered = hoveredAssetId === highlight.asset.id;
      
      elements.push(
        <mark
          key={`asset-highlight-${highlight.asset.id}-${idx}`}
          onClick={() => onAssetClick(highlight.asset)}
          onMouseEnter={() => onAssetHover(highlight.asset.id)}
          onMouseLeave={() => onAssetHover(null)}
          className={`
            cursor-pointer transition-all duration-200 rounded px-1
            ${isHovered
              ? 'bg-teal-300 border-b-2 border-teal-600 font-semibold'
              : 'bg-yellow-100 hover:bg-yellow-200 border-b border-yellow-300'
            }
          `}
          title={`Click to view: ${highlight.asset.asset_name}`}
        >
          {highlight.asset.source_text}
        </mark>
      );

      lastIndex = highlight.end;
    });

    // Add remaining text after last highlight
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      elements.push(remainingText);
    }

    return elements;
  };

  return (
    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">Brief</h2>
          
          {/* Unsaved Changes Indicator */}
          {isDirty && (
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium">
              Unsaved Changes
            </span>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Mode Toggle Button */}
          <button
            onClick={() => setMode(prev => prev === 'view' ? 'edit' : 'view')}
            disabled={isSaving}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            title={mode === 'view' ? 'Switch to edit mode' : 'Switch to view mode'}
          >
            {mode === 'view' ? (
              <>
                <Edit3 className="w-4 h-4" />
                <span>Edit</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                <span>View</span>
              </>
            )}
          </button>

          {/* Expand/Collapse Button */}
          <button
            onClick={onToggleExpand}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={isExpanded ? 'Collapse brief' : 'Expand brief'}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <Minimize2 className="w-5 h-5 text-gray-600" />
            ) : (
              <Maximize2 className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* EDIT MODE - Textareas for editing */}
      {mode === 'edit' && (
        <>
          {/* Brief Description */}
          <div className="mb-6">
            <label 
              htmlFor="brief-description" 
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Description
            </label>
            <textarea
              ref={briefTextareaRef}
              id="brief-description"
              value={editedBriefDescription}
              onChange={handleBriefDescriptionChange}
              placeholder="Enter project description..."
              className="
                w-full px-4 py-3 
                bg-gray-50 border border-gray-300 rounded-lg
                text-gray-900 leading-relaxed
                focus:ring-2 focus:ring-purple-500 focus:border-transparent
                resize-none overflow-hidden
                transition-all duration-200
              "
              style={{ minHeight: '150px' }}
              disabled={isSaving}
            />
          </div>

          {/* Physical Parameters */}
          <div className="mb-6">
            <label 
              htmlFor="physical-parameters" 
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Physical Parameters
            </label>
            <textarea
              ref={physicalTextareaRef}
              id="physical-parameters"
              value={editedPhysicalParameters}
              onChange={handlePhysicalParametersChange}
              placeholder="Enter physical parameters..."
              className="
                w-full px-4 py-3 
                bg-gray-50 border border-gray-300 rounded-lg
                text-gray-900 leading-relaxed
                focus:ring-2 focus:ring-purple-500 focus:border-transparent
                resize-none overflow-hidden
                transition-all duration-200
              "
              style={{ minHeight: '100px' }}
              disabled={isSaving}
            />
          </div>

          {/* Save Button - Only visible when dirty */}
          {isDirty && (
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`
                  w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                  font-medium transition-all duration-200
                  ${isSaving
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm hover:shadow'
                  }
                `}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* VIEW MODE - Interactive display with asset highlighting */}
      {mode === 'view' && (
        <>
          {/* Brief Description */}
          <div className="mb-6">
            <h3 className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </h3>
            <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 leading-relaxed min-h-[150px] whitespace-pre-wrap">
              {renderInteractiveContent(briefDescription)}
            </div>
          </div>

          {/* Physical Parameters */}
          {physicalParameters && (
            <div className="mb-6">
              <h3 className="block text-sm font-semibold text-gray-700 mb-2">
                Physical Parameters
              </h3>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 leading-relaxed min-h-[100px] whitespace-pre-wrap">
                {renderInteractiveContent(physicalParameters)}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default EditableBrief;


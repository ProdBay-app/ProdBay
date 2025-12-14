import React, { useState, useEffect, useRef } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { ProducerService } from '@/services/producerService';
import { useNotification } from '@/hooks/useNotification';
import Button from '@/components/ui/Button';
import type { Asset } from '@/lib/supabase';

interface EditableBriefProps {
  projectId: string;
  briefDescription: string;
  physicalParameters: string;
  isExpanded: boolean; // Kept for backward compatibility, but always true now
  onToggleExpand: () => void; // Kept for backward compatibility, but no-op now
  onBriefUpdate?: (briefDescription: string, physicalParameters: string) => void;
  
  // Props for interactive asset tagging
  assets?: Asset[];
  hoveredAssetId?: string | null;
  onAssetHover?: (assetId: string | null) => void;
  onAssetClick?: (asset: Asset) => void;
  
  // External mode control (when provided, uses external state)
  mode?: 'view' | 'edit';
  onModeChange?: (mode: 'view' | 'edit') => void;
  onDirtyChange?: (isDirty: boolean) => void;
  onSavingChange?: (isSaving: boolean) => void;
  onEditedValuesChange?: (briefDescription: string, physicalParameters: string) => void;
  
  // Highlights toggle control
  showHighlights?: boolean;
  
  // Max height to match Assets block (deprecated, but kept for compatibility)
  maxHeight?: number;
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
  isExpanded = true, // Always true now
  onToggleExpand = () => {}, // No-op now
  onBriefUpdate,
  assets,
  hoveredAssetId,
  onAssetHover,
  onAssetClick,
  maxHeight,
  // External mode control props
  mode: externalMode,
  onModeChange,
  onDirtyChange,
  onSavingChange,
  onEditedValuesChange,
  showHighlights = true
}) => {
  const { showSuccess, showError } = useNotification();

  // Use external mode if provided, otherwise use internal state
  const [internalMode, setInternalMode] = useState<'view' | 'edit'>('view');
  const mode = externalMode !== undefined ? externalMode : internalMode;
  const setMode = onModeChange || setInternalMode;

  // Editing state
  const [editedBriefDescription, setEditedBriefDescription] = useState(briefDescription);
  const [editedPhysicalParameters, setEditedPhysicalParameters] = useState(physicalParameters);
  const [internalIsDirty, setInternalIsDirty] = useState(false);
  const [internalIsSaving, setInternalIsSaving] = useState(false);
  
  // Expose dirty state to parent if callback provided
  const isDirty = internalIsDirty;
  const setIsDirty = (value: boolean) => {
    setInternalIsDirty(value);
    onDirtyChange?.(value);
  };
  
  // Expose saving state to parent if callback provided
  const isSaving = internalIsSaving;
  const setIsSaving = (value: boolean) => {
    setInternalIsSaving(value);
    onSavingChange?.(value);
  };

  // Refs for textareas (for auto-resize)
  const briefTextareaRef = useRef<HTMLTextAreaElement>(null);
  const physicalTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync local state when props change (e.g., after external update)
  // Only sync when not dirty to prevent overwriting user input during typing
  useEffect(() => {
    if (!isDirty) {
      setEditedBriefDescription(briefDescription);
      setEditedPhysicalParameters(physicalParameters);
      // Note: No need to set isDirty(false) here since it's already false
      // Notify parent of current values (in case they changed externally)
      onEditedValuesChange?.(briefDescription, physicalParameters);
    }
  }, [briefDescription, physicalParameters, onEditedValuesChange, isDirty]);

  // Auto-resize textareas to fit content
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement | null) => {
    if (!textarea) return;
    
    // Use requestAnimationFrame to ensure DOM has painted before measuring
    requestAnimationFrame(() => {
      // Reset height to get accurate scrollHeight
      textarea.style.height = 'auto';
      // Set height to scrollHeight (content height), with minimum of 120px
      const minHeight = 120;
      textarea.style.height = `${Math.max(textarea.scrollHeight, minHeight)}px`;
    });
  };

  // Adjust heights when mode changes to edit (immediate layout stabilization)
  useEffect(() => {
    if (mode === 'edit') {
      // Use setTimeout to ensure DOM has updated after mode change
      setTimeout(() => {
        adjustTextareaHeight(briefTextareaRef.current);
        adjustTextareaHeight(physicalTextareaRef.current);
      }, 0);
    }
  }, [mode]);

  // Adjust heights when content changes
  useEffect(() => {
    if (mode === 'edit') {
      adjustTextareaHeight(briefTextareaRef.current);
    }
  }, [editedBriefDescription, mode]);

  useEffect(() => {
    if (mode === 'edit') {
      adjustTextareaHeight(physicalTextareaRef.current);
    }
  }, [editedPhysicalParameters, mode]);

  // Handle description change
  const handleBriefDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setEditedBriefDescription(newValue);
    setIsDirty(
      newValue !== briefDescription || 
      editedPhysicalParameters !== physicalParameters
    );
    // Notify parent of current edited values
    onEditedValuesChange?.(newValue, editedPhysicalParameters);
  };

  // Handle physical parameters change
  const handlePhysicalParametersChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setEditedPhysicalParameters(newValue);
    setIsDirty(
      editedBriefDescription !== briefDescription || 
      newValue !== physicalParameters
    );
    // Notify parent of current edited values
    onEditedValuesChange?.(editedBriefDescription, newValue);
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
   * Normalize quotes only (for quote-agnostic matching)
   * Converts all quote variants to double quotes for consistent comparison
   * Preserves apostrophes in contractions (e.g., "don't", "it's")
   * 
   * @param str - The text to normalize
   * @returns Text with all quotes normalized to double quotes (apostrophes preserved)
   */
  const normalizeQuotes = (str: string): string => {
    // First normalize curly quotes (these are always quotes, never apostrophes)
    let result = str
      .replace(/['']/g, "'")      // Normalize curly single quotes to straight
      .replace(/[""]/g, '"');     // Normalize curly double quotes to straight
    
    // Convert straight single quotes to double quotes, but preserve apostrophes
    // Apostrophes are single quotes between word characters (letters/digits)
    // Quotes are single quotes at word boundaries or with whitespace/punctuation
    const isWordChar = (char: string) => /[a-zA-Z0-9]/.test(char);
    let normalized = '';
    for (let i = 0; i < result.length; i++) {
      const char = result[i];
      if (char === "'") {
        const before = i > 0 ? result[i - 1] : '';
        const after = i < result.length - 1 ? result[i + 1] : '';
        // If surrounded by word characters, it's an apostrophe - preserve it
        if (isWordChar(before) && isWordChar(after)) {
          normalized += "'";
        } else {
          // Otherwise, it's a quote - convert to double quote
          normalized += '"';
        }
      } else {
        normalized += char;
      }
    }
    result = normalized;
    
    return result;
  };

  /**
   * Normalize text for robust matching
   * Handles whitespace, line breaks, case sensitivity, AND punctuation differences
   * 
   * Transformations applied in sequence:
   * 1. Normalize quotes - Convert all quote types to standard double quote
   * 2. Normalize dashes - Convert em dash, en dash, hyphen to standard hyphen
   * 3. Normalize asterisks - Remove markdown bold/italic markers
   * 4. Normalize hashes - Remove markdown heading markers
   * 5. Replace Windows line breaks (\r\n) with space
   * 6. Replace Unix line breaks (\n) with space
   * 7. Replace multiple consecutive spaces with single space
   * 8. Convert to lowercase for case-insensitive matching
   * 9. Trim leading/trailing whitespace
   * 
   * This handles cases where:
   * - AI uses 'single quotes' but brief has "double quotes"
   * - Brief has markdown formatting (**, ##, etc.) that gets stripped when saved
   * - Different dash types (em dash —, en dash –, hyphen -)
   * 
   * @param str - The text to normalize
   * @returns Normalized text (lowercase, standardized punctuation, single spaces, trimmed)
   */
  const normalizeText = (str: string): string => {
    let result = str;
    
    // Normalize quotes - Convert all quote types to a consistent format
    result = result.replace(/['']/g, "'");           // Normalize curly single quotes to straight
    result = result.replace(/[""]/g, '"');           // Normalize curly double quotes to straight
    result = result.replace(/'/g, '"');              // Convert all single quotes to double quotes for consistency
    
    // Normalize dashes - only normalize special dashes, preserve hyphens in words
    result = result.replace(/—/g, '-');              // Em dash to hyphen
    result = result.replace(/–/g, '-');              // En dash to hyphen
    
    // Normalize bullet points and list markers - handle all variations
    result = result.replace(/[•·▪▫‣⁃]\s*/g, '');     // Remove various bullet point characters
    result = result.replace(/^[•*]\s+/gm, '');       // Remove bullet points at start of lines
    result = result.replace(/^-\s+/gm, '');          // Remove dashes at start of lines
    result = result.replace(/\s*[•*]\s*/g, ' ');     // Remove bullet points anywhere in text
    // Note: We don't remove dashes in the middle of text to preserve word hyphens like "afro-tech"
    
    // Normalize markdown formatting (stripped when saved to DB)
    result = result.replace(/\*\*(.+?)\*\*/g, '$1'); // Remove bold markers (capture group)
    result = result.replace(/\*/g, '');              // Remove remaining single asterisks (italic)
    result = result.replace(/^#+\s+/gm, '');         // Remove markdown heading markers
    
    // Normalize parentheses and brackets for better matching
    result = result.replace(/[()]/g, '');            // Remove parentheses
    result = result.replace(/[\[\]]/g, '');          // Remove square brackets
    
    // Normalize punctuation for better matching
    result = result.replace(/[.,;:!?]+$/, '');       // Remove trailing punctuation
    
    // Normalize whitespace
    result = result.replace(/\r\n/g, ' ');           // Replace Windows line breaks with space
    result = result.replace(/\n/g, ' ');             // Replace Unix line breaks with space
    result = result.replace(/[ \t]+/g, ' ');         // Replace multiple spaces/tabs with single space (preserve hyphens)
    result = result.toLowerCase();                   // Convert to lowercase for case-insensitive matching
    result = result.trim();                          // Remove leading/trailing whitespace
    
    return result;
  };

  /**
   * Render interactive content with asset highlighting
   * Safely parses text and wraps asset source_text in interactive <mark> elements
   * Uses normalized text matching for resilience against whitespace/case differences
   * 
   * @param text - The text to parse (briefDescription or physicalParameters)
   * @returns Array of React nodes (text strings and <mark> elements)
   */
  const renderInteractiveContent = (text: string): React.ReactNode[] => {
    // If highlights are disabled, return plain text
    if (!showHighlights) {
      return [text];
    }

    // If no assets provided or no interactive features enabled, return plain text
    if (!assets || !onAssetClick || !onAssetHover) {
      return [text];
    }

    // Normalize the brief text for robust matching
    const normalizedBriefText = normalizeText(text);

    // Build array of highlights (positions where source_text appears)
    const highlights: Array<{ start: number; end: number; asset: Asset }> = [];

    assets.forEach(asset => {
      // Only process assets that have source_text
      if (asset.source_text && asset.source_text.trim()) {
        const originalSourceText = asset.source_text;
        const normalizedSourceText = normalizeText(originalSourceText);
        
        // STRATEGY: Multi-pass matching for maximum resilience
        // Pass 1: Try exact match (fastest, works if no differences)
        let matchIndex = text.indexOf(originalSourceText);
        let matchLength = originalSourceText.length;
        
        // Pass 1.5: Try quote-normalized exact match (handles quote type differences)
        if (matchIndex === -1) {
          const normalizedText = normalizeQuotes(text);
          const normalizedSource = normalizeQuotes(originalSourceText);
          const normalizedIndex = normalizedText.indexOf(normalizedSource);
          
          if (normalizedIndex !== -1) {
            // Found match in normalized text, now find corresponding position in original
            // Strategy: Map normalized index to original by character-by-character alignment
            // Since quote normalization is 1:1 (each quote becomes one quote), we can align positions
            
            let normPos = 0;
            let origPos = 0;
            
            // Advance through normalized text until we reach the match position
            while (normPos < normalizedIndex && origPos < text.length) {
              const origChar = text[origPos];
              const normChar = normalizedText[normPos];
              
              // Check if characters match (accounting for quote normalization)
              const origNormalized = normalizeQuotes(origChar);
              if (origNormalized === normChar) {
                normPos++;
                origPos++;
              } else {
                // Characters don't align - this shouldn't happen if normalization is correct
                // Skip ahead in original to try to realign
                origPos++;
              }
            }
            
            // Now verify that we can match the source text starting at origPos
            if (origPos < text.length) {
              const remainingLength = Math.min(originalSourceText.length + 20, text.length - origPos);
              const searchWindow = text.substring(origPos, origPos + remainingLength);
              
              // Try to find a quote-agnostic match in the search window
              // Compare character by character, treating quotes as equivalent
              for (let start = 0; start <= searchWindow.length - originalSourceText.length; start++) {
                let matches = true;
                for (let i = 0; i < originalSourceText.length; i++) {
                  const windowChar = searchWindow[start + i];
                  const sourceChar = originalSourceText[i];
                  
                  // Normalize quotes for comparison
                  const windowNorm = normalizeQuotes(windowChar);
                  const sourceNorm = normalizeQuotes(sourceChar);
                  
                  if (windowNorm !== sourceNorm) {
                    matches = false;
                    break;
                  }
                }
                
                if (matches) {
                  matchIndex = origPos + start;
                  matchLength = originalSourceText.length;
                  break;
                }
              }
            }
          }
        }
        
        // Pass 2: Try case-insensitive match (handles capitalization differences)
        if (matchIndex === -1) {
          matchIndex = text.toLowerCase().indexOf(originalSourceText.toLowerCase());
        }
        
        // Pass 3: Try normalized match (handles whitespace + case + bullet point differences)
        if (matchIndex === -1) {
          // Check if it exists in normalized form
          const normalizedIndex = normalizedBriefText.indexOf(normalizedSourceText);
          
          if (normalizedIndex !== -1) {
            // Found in normalized text! Now find it in original using fuzzy search
            // Strategy: Search for the first few words case-insensitively, ignoring bullet points
            const firstWords = originalSourceText.split(/\s+/).slice(0, 3).join(' ');
            const searchText = text.toLowerCase();
            const searchWords = firstWords.toLowerCase();
            
            // Try to find the words, accounting for potential bullet points
            matchIndex = searchText.indexOf(searchWords);
            
            if (matchIndex === -1) {
              // Try with bullet point variations
              const bulletVariations = [
                '• ' + searchWords,
                '· ' + searchWords,
                '- ' + searchWords,
                '* ' + searchWords
              ];
              
              for (const variation of bulletVariations) {
                matchIndex = searchText.indexOf(variation);
                if (matchIndex !== -1) {
                  // Adjust match length to account for bullet point
                  matchLength = originalSourceText.length + (variation.length - searchWords.length);
                  break;
                }
              }
            }
            
            // If still no match, try finding the normalized text in the original text
            if (matchIndex === -1) {
              // Find where the normalized text appears in the original text
              const normalizedInOriginal = text.toLowerCase().indexOf(normalizedSourceText);
              if (normalizedInOriginal !== -1) {
                matchIndex = normalizedInOriginal;
                matchLength = originalSourceText.length;
              }
            }
            
            if (matchIndex === -1) {
              // Last resort: Try just the first word with bullet point variations
              const firstWord = originalSourceText.split(/\s+/)[0];
              if (firstWord && firstWord.length > 3) {
                const firstWordLower = firstWord.toLowerCase();
                const bulletVariations = [
                  '• ' + firstWordLower,
                  '· ' + firstWordLower,
                  '- ' + firstWordLower,
                  '* ' + firstWordLower,
                  firstWordLower
                ];
                
                for (const variation of bulletVariations) {
                  matchIndex = searchText.indexOf(variation);
                  if (matchIndex !== -1) {
                    // Use the original source text length for consistency
                    matchLength = originalSourceText.length;
                    break;
                  }
                }
              }
            }
          }
        }
        
        // Add highlight if match found
        if (matchIndex !== -1) {
          highlights.push({
            start: matchIndex,
            end: matchIndex + matchLength,
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
              ? 'bg-teal-500/30 border-b-2 border-teal-400 font-semibold'
              : 'bg-yellow-500/30 hover:bg-yellow-500/40 border-b border-yellow-400/50'
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
    <div 
      className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 transition-all duration-300 flex flex-col"
    >
      {/* Content - Always visible now */}
      <div className="p-6 overflow-y-auto flex-1 min-h-0">
          {/* EDIT MODE - Textareas for editing */}
          {mode === 'edit' && (
            <>
              {/* Brief Description */}
              <div className="mb-6">
                <label 
                  htmlFor="brief-description" 
                  className="block text-sm font-semibold text-gray-200 mb-2"
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
                    bg-black/20 border border-white/20 rounded-lg
                    text-white placeholder-gray-400 leading-relaxed
                    focus:ring-2 focus:ring-purple-500 focus:border-transparent
                    resize-y overflow-hidden
                    transition-all duration-200
                  "
                  style={{ minHeight: '120px' }}
                  disabled={isSaving}
                />
              </div>

              {/* Physical Parameters */}
              <div className="mb-6">
                <label 
                  htmlFor="physical-parameters" 
                  className="block text-sm font-semibold text-gray-200 mb-2"
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
                    bg-black/20 border border-white/20 rounded-lg
                    text-white placeholder-gray-400 leading-relaxed
                    focus:ring-2 focus:ring-purple-500 focus:border-transparent
                    resize-y overflow-hidden
                    transition-all duration-200
                  "
                  style={{ minHeight: '120px' }}
                  disabled={isSaving}
                />
              </div>

              {/* Save Button - Only visible when dirty */}
              {isDirty && (
                <div className="pt-4 border-t border-white/20">
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
                <h3 className="block text-sm font-semibold text-gray-200 mb-2">
                  Description
                </h3>
                <div className="px-4 py-3 bg-black/20 border border-white/20 rounded-lg text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {renderInteractiveContent(briefDescription)}
                </div>
              </div>

              {/* Physical Parameters */}
              {physicalParameters && (
                <div className="mb-6">
                  <h3 className="block text-sm font-semibold text-gray-200 mb-2">
                    Physical Parameters
                  </h3>
                  <div className="px-4 py-3 bg-black/20 border border-white/20 rounded-lg text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {renderInteractiveContent(physicalParameters)}
                  </div>
                </div>
              )}
            </>
          )}
      </div>
    </div>
  );
};

export default EditableBrief;


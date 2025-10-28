import React, { useState, useEffect, useRef } from 'react';
import { Save, Maximize2, Minimize2, Loader2, Edit3, Eye, Download } from 'lucide-react';
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

  // Handle PDF download - generates a PDF from the brief text
  const handleDownloadPdf = () => {
    try {
      // Create a new window for PDF generation
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        showError('Unable to open print window. Please check your popup blocker.');
        return;
      }

      // Get the current brief content (edited or original)
      const currentBriefDescription = mode === 'edit' ? editedBriefDescription : briefDescription;
      const currentPhysicalParameters = mode === 'edit' ? editedPhysicalParameters : physicalParameters;

      // Create HTML content for the PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Project Brief - ${projectId}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 10px;
            }
            .project-id {
              color: #6b7280;
              font-size: 14px;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              font-size: 18px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 15px;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 5px;
            }
            .content {
              white-space: pre-wrap;
              line-height: 1.7;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 12px;
              text-align: center;
            }
            @media print {
              body { margin: 0; padding: 15px; }
              .header { page-break-after: avoid; }
              .section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Project Brief</div>
            <div class="project-id">Project ID: ${projectId}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Description</div>
            <div class="content">${currentBriefDescription || 'No description provided.'}</div>
          </div>
          
          ${currentPhysicalParameters ? `
          <div class="section">
            <div class="section-title">Physical Parameters</div>
            <div class="content">${currentPhysicalParameters}</div>
          </div>
          ` : ''}
          
          <div class="footer">
            Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
          </div>
        </body>
        </html>
      `;

      // Write content to the new window
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for content to load, then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          // Close the window after printing
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        }, 500);
      };

      showSuccess('PDF download initiated');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showError('Failed to generate PDF');
    }
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
          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 px-3 py-1.5 bg-teal-100 text-teal-700 hover:bg-teal-200 rounded-lg transition-colors text-sm font-medium"
            title="Download brief as PDF"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>

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


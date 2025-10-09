import React, { useState, useEffect, useRef } from 'react';
import { Save, Maximize2, Minimize2, Loader2 } from 'lucide-react';
import { ProducerService } from '@/services/producerService';
import { useNotification } from '@/hooks/useNotification';

interface EditableBriefProps {
  projectId: string;
  briefDescription: string;
  physicalParameters: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onBriefUpdate?: (briefDescription: string, physicalParameters: string) => void;
}

/**
 * EditableBrief - Editable and expandable project brief component
 * 
 * Features:
 * - Always-editable textareas for description and physical parameters
 * - Auto-resizing textareas that grow with content
 * - Dirty tracking with "Unsaved Changes" indicator
 * - Save button appears only when changes are made
 * - Expand/collapse functionality for better writing experience
 * - Optimistic UI updates on successful save
 * - Loading and error states
 */
const EditableBrief: React.FC<EditableBriefProps> = ({
  projectId,
  briefDescription,
  physicalParameters,
  isExpanded,
  onToggleExpand,
  onBriefUpdate
}) => {
  const { showSuccess, showError } = useNotification();

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
    </section>
  );
};

export default EditableBrief;


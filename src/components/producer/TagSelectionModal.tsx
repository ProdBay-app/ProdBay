import React from 'react';

interface TagSelectionModalProps {
  isOpen: boolean;
  availableTags: string[];
  selectedTags: string[];
  onClose: () => void;
  onTagToggle: (tag: string) => void;
  onConfirm: () => void;
}

const TagSelectionModal: React.FC<TagSelectionModalProps> = ({
  isOpen,
  availableTags,
  selectedTags,
  onClose,
  onTagToggle,
  onConfirm
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-6">
        <div className="mb-4">
          <h3 className="text-xl font-semibold">Filter Suppliers by Tags</h3>
          <p className="text-gray-600 text-sm">Select tags to filter suppliers who will receive this request.</p>
        </div>

        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {availableTags.length === 0 && (
              <span className="text-sm text-gray-500">No tags available. All relevant suppliers will be selected.</span>
            )}
            {availableTags.map(tag => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onTagToggle(tag)}
                  className={`px-3 py-1 rounded-full text-sm border ${active ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-800 border-gray-300'}`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-700"
          >
            Send Requests
          </button>
        </div>
      </div>
    </div>
  );
};

export default TagSelectionModal;

import React, { useState, useEffect } from 'react';
import { X, Calendar, Loader2 } from 'lucide-react';
import type { ProjectMilestone, MilestoneStatus } from '@/types/database';

// Form data structure for milestone creation/editing
export interface MilestoneFormData {
  milestone_name: string;
  milestone_date: string;
  description: string;
  status?: MilestoneStatus;
}

interface MilestoneFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: MilestoneFormData) => void;
  isSubmitting: boolean;
  mode: 'create' | 'edit';
  milestoneToEdit?: ProjectMilestone | null;
}

/**
 * MilestoneFormModal - Reusable modal for creating and editing milestones
 * 
 * Features:
 * - Dual mode: create new milestones or edit existing ones
 * - Form with milestone name, date, description, and status
 * - Built-in form validation
 * - Pre-populates form when editing
 * - Resets form when creating or closing
 * - Dynamic title and button text based on mode
 * - Loading state during submission
 */
const MilestoneFormModal: React.FC<MilestoneFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  mode,
  milestoneToEdit
}) => {
  // Form state
  const [formData, setFormData] = useState<MilestoneFormData>({
    milestone_name: '',
    milestone_date: '',
    description: '',
    status: 'pending'
  });

  // Validation errors
  const [errors, setErrors] = useState<{
    milestone_name?: string;
    milestone_date?: string;
  }>({});

  // Pre-populate form when editing or reset when creating
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && milestoneToEdit) {
        // Pre-populate with milestone data
        setFormData({
          milestone_name: milestoneToEdit.milestone_name,
          milestone_date: milestoneToEdit.milestone_date,
          description: milestoneToEdit.description || '',
          status: milestoneToEdit.status
        });
        // Clear any previous errors
        setErrors({});
      } else {
        // Reset for create mode
        setFormData({
          milestone_name: '',
          milestone_date: '',
          description: '',
          status: 'pending'
        });
        // Clear any previous errors
        setErrors({});
      }
    }
  }, [isOpen, mode, milestoneToEdit]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Validate form before submission
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Validate milestone name
    if (!formData.milestone_name.trim()) {
      newErrors.milestone_name = 'Milestone name is required';
    }

    // Validate milestone date
    if (!formData.milestone_date) {
      newErrors.milestone_date = 'Milestone date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    // Submit the form data to parent
    onSubmit(formData);
  };

  // Handle modal close
  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-wedding-secondary/50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-wedding-primary/20 rounded-lg">
              <Calendar className="w-5 h-5 text-wedding-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {mode === 'create' ? 'Add New Milestone' : 'Edit Milestone'}
              </h3>
              <p className="text-sm text-gray-600">
                {mode === 'create' 
                  ? 'Create a new checkpoint for your wedding timeline' 
                  : 'Update milestone details'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Milestone Name */}
          <div>
            <label htmlFor="milestone_name" className="block text-sm font-medium text-gray-700 mb-1">
              Milestone Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="milestone_name"
              name="milestone_name"
              value={formData.milestone_name}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="e.g., Venue Confirmed, Catering Finalized"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-wedding-primary focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                errors.milestone_name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.milestone_name && (
              <p className="mt-1 text-sm text-red-600">{errors.milestone_name}</p>
            )}
          </div>

          {/* Milestone Date */}
          <div>
            <label htmlFor="milestone_date" className="block text-sm font-medium text-gray-700 mb-1">
              Milestone Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="milestone_date"
              name="milestone_date"
              value={formData.milestone_date}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-wedding-primary focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                errors.milestone_date ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.milestone_date && (
              <p className="mt-1 text-sm text-red-600">{errors.milestone_date}</p>
            )}
          </div>

          {/* Description (Optional) */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-500 text-xs">(Optional)</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={3}
              placeholder="Add additional details about this milestone..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wedding-primary focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            />
          </div>

          {/* Status (Only visible in edit mode) */}
          {mode === 'edit' && (
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wedding-primary focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Mark milestone as completed when it's achieved
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-wedding-primary text-white rounded-wedding hover:bg-wedding-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {mode === 'create' ? 'Adding...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  {mode === 'create' ? 'Add Milestone' : 'Save Changes'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MilestoneFormModal;


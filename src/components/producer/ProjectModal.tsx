import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, CheckCircle, XCircle } from 'lucide-react';
import type { ProjectFormData } from '@/services/producerService';

interface ProjectModalProps {
  isOpen: boolean;
  isEditing: boolean;
  isSubmitting: boolean;
  projectForm: ProjectFormData;
  allocationMethod: 'static' | 'ai';
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFormChange: (field: keyof ProjectFormData, value: string | number | undefined) => void;
  onAllocationMethodChange: (method: 'static' | 'ai') => void;
  // PDF upload props
  onPdfUpload?: (file: File) => void;
  isUploadingPdf?: boolean;
  uploadError?: string | null;
  uploadedFilename?: string | null;
}

const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  isEditing,
  isSubmitting,
  projectForm,
  allocationMethod,
  onClose,
  onSubmit,
  onFormChange,
  onAllocationMethodChange,
  onPdfUpload,
  isUploadingPdf = false,
  uploadError = null,
  uploadedFilename = null
}) => {
  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    onFormChange(name as keyof ProjectFormData, 
      name === 'financial_parameters' ? (value === '' ? undefined : parseFloat(value)) : value
    );
  };

  // Configure dropzone for PDF uploads
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0 && onPdfUpload) {
        onPdfUpload(acceptedFiles[0]);
      }
    },
    disabled: isUploadingPdf || !onPdfUpload
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
        <div className="mb-4">
          <h3 className="text-xl font-semibold">
            {isEditing ? 'Edit Project' : 'Create New Project'}
          </h3>
          <p className="text-gray-600 text-sm">
            {isEditing ? 'Update project details and save changes.' : 'Fill in details to create a new project.'}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
              <input
                name="project_name"
                value={projectForm.project_name}
                onChange={handleInputChange}
                required
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label>
              <input
                name="client_name"
                value={projectForm.client_name}
                onChange={handleInputChange}
                required
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Brief *</label>
            
            {/* PDF Upload Dropzone */}
            {onPdfUpload && (
              <div className="mb-3">
                <div
                  {...getRootProps()}
                  className={`
                    border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-teal-500 bg-teal-50' : 'border-gray-300 hover:border-teal-400 hover:bg-gray-50'}
                    ${isUploadingPdf ? 'opacity-50 cursor-wait' : ''}
                  `}
                >
                  <input {...getInputProps()} />
                  
                  {isUploadingPdf ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                      <p className="text-sm text-gray-600">Extracting text from PDF...</p>
                    </div>
                  ) : uploadedFilename ? (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                      <p className="text-sm text-gray-700">
                        <FileText className="w-4 h-4 inline mr-1" />
                        {uploadedFilename}
                      </p>
                      <p className="text-xs text-gray-500">Text extracted successfully. Drop another PDF to replace.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        {isDragActive ? (
                          <span className="text-teal-600 font-medium">Drop PDF here...</span>
                        ) : (
                          <>
                            <span className="text-teal-600 font-medium">Drop a PDF brief here</span> or click to browse
                          </>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">PDF files up to 10MB</p>
                    </div>
                  )}
                </div>
                
                {uploadError && (
                  <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                    <XCircle className="w-4 h-4" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>
            )}

            <textarea
              name="brief_description"
              value={projectForm.brief_description}
              onChange={handleInputChange}
              required
              rows={4}
              placeholder="Enter project brief manually or upload a PDF above..."
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Physical Parameters</label>
              <input
                name="physical_parameters"
                value={projectForm.physical_parameters}
                onChange={handleInputChange}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
              <input
                name="financial_parameters"
                value={projectForm.financial_parameters ?? ''}
                onChange={handleInputChange}
                type="number"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
              <input
                name="timeline_deadline"
                value={projectForm.timeline_deadline}
                onChange={handleInputChange}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
          </div>

          {!isEditing && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Asset Allocation Method:</p>
              
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="allocationMethod"
                    value="static"
                    checked={allocationMethod === 'static'}
                    onChange={() => onAllocationMethodChange('static')}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Static Allocation</span>
                    <p className="text-xs text-gray-500">Rule-based asset identification using keyword matching</p>
                  </div>
                </label>
                
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="allocationMethod"
                    value="ai"
                    checked={allocationMethod === 'ai'}
                    onChange={() => onAllocationMethodChange('ai')}
                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 focus:ring-purple-500 focus:ring-2"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">AI-Powered Allocation</span>
                    <p className="text-xs text-gray-500">AI analyzes your brief to identify assets with detailed specifications</p>
                  </div>
                </label>
              </div>
              
              {allocationMethod === 'ai' && (
                <div className="mt-3 p-3 bg-purple-100 rounded-lg">
                  <p className="text-sm text-purple-800">
                    ✨ AI will analyze your brief to identify assets, create detailed specifications, 
                    and suggest optimal supplier allocations with confidence scores.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {isSubmitting ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create Project')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;

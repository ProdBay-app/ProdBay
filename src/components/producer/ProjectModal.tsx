import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, CheckCircle, XCircle, Sparkles, Download, ArrowLeft, ArrowRight } from 'lucide-react';
import type { ProjectFormData } from '@/services/producerService';

interface ProjectModalProps {
  isOpen: boolean;
  isEditing: boolean;
  isSubmitting: boolean;
  projectForm: ProjectFormData;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFormChange: (field: keyof ProjectFormData, value: string | number | undefined) => void;
  // PDF upload props
  onPdfUpload?: (file: File) => void;
  isUploadingPdf?: boolean;
  uploadError?: string | null;
  uploadedFilename?: string | null;
  uploadedPdfFile?: File | null;
  onPdfDownload?: (file: File) => void;
  // AI brief analysis props
  onAnalyzeBrief?: () => void;
  isAnalyzingBrief?: boolean;
}

const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  isEditing,
  isSubmitting,
  projectForm,
  onClose,
  onSubmit,
  onFormChange,
  onPdfUpload,
  isUploadingPdf = false,
  uploadError = null,
  uploadedFilename = null,
  uploadedPdfFile = null,
  onPdfDownload,
  onAnalyzeBrief,
  isAnalyzingBrief = false
}) => {
  // Step management for wizard flow
  const [currentStep, setCurrentStep] = useState<'step1' | 'step2'>('step1');
  const [isTransitioning, setIsTransitioning] = useState(false);

  if (!isOpen) return null;

  // Reset step when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setCurrentStep('step1');
      setIsTransitioning(false);
    }
  }, [isOpen]);

  // Handle step transitions
  const handleNextStep = async () => {
    if (currentStep === 'step1') {
      // Validate that we have a brief to analyze
      if (!projectForm.brief_description || projectForm.brief_description.trim().length === 0) {
        return; // Don't proceed without brief
      }
      
      setIsTransitioning(true);
      
      // Trigger AI analysis
      if (onAnalyzeBrief) {
        try {
          await onAnalyzeBrief();
          // AI analysis will auto-populate the form, then we move to step 2
          setCurrentStep('step2');
        } catch (error) {
          console.error('AI analysis failed:', error);
          // Stay on step 1 if analysis fails
        } finally {
          setIsTransitioning(false);
        }
      } else {
        // If no AI analysis available, just move to step 2
        setCurrentStep('step2');
        setIsTransitioning(false);
      }
    }
  };

  const handleBackStep = () => {
    if (currentStep === 'step2') {
      setCurrentStep('step1');
    }
  };

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
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-semibold">
              {isEditing ? 'Edit Project' : 'Create New Project'}
            </h3>
            {!isEditing && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className={currentStep === 'step1' ? 'text-teal-600 font-medium' : ''}>
                  Step 1: Upload Brief
                </span>
                <ArrowRight className="w-4 h-4" />
                <span className={currentStep === 'step2' ? 'text-teal-600 font-medium' : ''}>
                  Step 2: Confirm Details
                </span>
              </div>
            )}
          </div>
          <p className="text-gray-600 text-sm">
            {isEditing 
              ? 'Update project details and save changes.' 
              : currentStep === 'step1' 
                ? 'Upload your project brief to get started. AI will analyze it automatically.'
                : 'Review and confirm the project details extracted by AI.'
            }
          </p>
        </div>

        {/* Step 1: Upload Brief */}
        {currentStep === 'step1' && !isEditing && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Upload Project Brief *</label>
              
              {/* PDF Upload Dropzone */}
              {onPdfUpload && (
                <div
                  {...getRootProps()}
                  className={`
                    border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-teal-500 bg-teal-50' : 'border-gray-300 hover:border-teal-400 hover:bg-gray-50'}
                    ${isUploadingPdf ? 'opacity-50 cursor-wait' : ''}
                  `}
                >
                  <input {...getInputProps()} />
                  
                  {isUploadingPdf ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
                      <p className="text-lg text-gray-600">Extracting text from PDF...</p>
                      <p className="text-sm text-gray-500">This may take a few moments</p>
                    </div>
                  ) : uploadedFilename ? (
                    <div className="flex flex-col items-center gap-3">
                      <CheckCircle className="w-12 h-12 text-green-600" />
                      <div className="flex items-center gap-2">
                        <p className="text-lg text-gray-700">
                          <FileText className="w-5 h-5 inline mr-2" />
                          {uploadedFilename}
                        </p>
                        {uploadedPdfFile && onPdfDownload && (
                          <button
                            type="button"
                            onClick={() => onPdfDownload(uploadedPdfFile)}
                            className="flex items-center gap-1 px-3 py-1 text-sm text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">Text extracted successfully. Drop another PDF to replace.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <Upload className="w-12 h-12 text-gray-400" />
                      <div>
                        <p className="text-lg text-gray-600 mb-1">
                          {isDragActive ? (
                            <span className="text-teal-600 font-medium">Drop PDF here...</span>
                          ) : (
                            <>
                              <span className="text-teal-600 font-medium">Drop a PDF brief here</span> or click to browse
                            </>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">PDF files up to 10MB</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {uploadError && (
                <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
                  <XCircle className="w-4 h-4" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Manual brief input as fallback */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Or enter brief manually:</label>
                <textarea
                  name="brief_description"
                  value={projectForm.brief_description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  placeholder="Enter project brief manually if you prefer not to upload a PDF..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Step 1 Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                disabled={isTransitioning || isAnalyzingBrief || !projectForm.brief_description || projectForm.brief_description.trim().length === 0}
                className="flex items-center gap-2 px-6 py-2 rounded bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isTransitioning || isAnalyzingBrief ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isAnalyzingBrief ? 'Analyzing Brief...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Confirm Details & Create */}
        {currentStep === 'step2' && !isEditing && (
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name *
                </label>
                <input
                  name="project_name"
                  value={projectForm.project_name}
                  onChange={handleInputChange}
                  required
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Name *
                </label>
                <input
                  name="client_name"
                  value={projectForm.client_name}
                  onChange={handleInputChange}
                  required
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Brief *</label>
              <textarea
                name="brief_description"
                value={projectForm.brief_description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Physical Parameters
                </label>
                <input
                  name="physical_parameters"
                  value={projectForm.physical_parameters}
                  onChange={handleInputChange}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget
                </label>
                <input
                  name="financial_parameters"
                  value={projectForm.financial_parameters ?? ''}
                  onChange={handleInputChange}
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deadline
                </label>
                <input
                  name="timeline_deadline"
                  value={projectForm.timeline_deadline}
                  onChange={handleInputChange}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* AI Allocation Notice */}
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">AI-Powered Asset Allocation</span>
              </div>
              <p className="text-sm text-purple-700">
                This project will use AI to automatically identify and allocate assets based on your brief. 
                The AI will analyze your requirements and create detailed asset specifications with optimal supplier suggestions.
              </p>
            </div>

            {/* Step 2 Actions */}
            <div className="flex justify-between pt-4 border-t">
              <button
                type="button"
                onClick={handleBackStep}
                className="flex items-center gap-2 px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div className="flex space-x-3">
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
                  className="px-6 py-2 rounded bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating Project...' : 'Create Project'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Edit Mode - Keep original form for editing */}
        {isEditing && (
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  Project Name *
                  {isAnalyzingBrief && <Loader2 className="w-3 h-3 text-purple-600 animate-spin" />}
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  Client Name *
                  {isAnalyzingBrief && <Loader2 className="w-3 h-3 text-purple-600 animate-spin" />}
                </label>
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
              
              {/* PDF Upload Dropzone for editing */}
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
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-700">
                            <FileText className="w-4 h-4 inline mr-1" />
                            {uploadedFilename}
                          </p>
                          {uploadedPdfFile && onPdfDownload && (
                            <button
                              type="button"
                              onClick={() => onPdfDownload(uploadedPdfFile)}
                              className="flex items-center gap-1 px-2 py-1 text-xs text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded transition-colors"
                              title="Download PDF"
                            >
                              <Download className="w-3 h-3" />
                              Download
                            </button>
                          )}
                        </div>
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
              
              {/* AI Analyze Brief Button for editing */}
              {onAnalyzeBrief && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={onAnalyzeBrief}
                    disabled={isAnalyzingBrief || !projectForm.brief_description || projectForm.brief_description.trim().length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isAnalyzingBrief ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing Brief...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Analyze Brief with AI
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-500 mt-1">
                    AI will extract project name, client name, budget, deadline, and other details
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  Physical Parameters
                  {isAnalyzingBrief && <Loader2 className="w-3 h-3 text-purple-600 animate-spin" />}
                </label>
                <input
                  name="physical_parameters"
                  value={projectForm.physical_parameters}
                  onChange={handleInputChange}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  Budget
                  {isAnalyzingBrief && <Loader2 className="w-3 h-3 text-purple-600 animate-spin" />}
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  Deadline
                  {isAnalyzingBrief && <Loader2 className="w-3 h-3 text-purple-600 animate-spin" />}
                </label>
                <input
                  name="timeline_deadline"
                  value={projectForm.timeline_deadline}
                  onChange={handleInputChange}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
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
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProjectModal;

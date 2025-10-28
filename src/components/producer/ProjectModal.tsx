import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, CheckCircle, XCircle, Sparkles, Download, ArrowLeft, ArrowRight } from 'lucide-react';
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
  allocationMethod,
  onClose,
  onSubmit,
  onFormChange,
  onAllocationMethodChange,
  onPdfUpload,
  isUploadingPdf = false,
  uploadError = null,
  uploadedFilename = null,
  uploadedPdfFile = null,
  onPdfDownload,
  onAnalyzeBrief,
  isAnalyzingBrief = false
}) => {
  if (!isOpen) return null;

  // Step management for wizard flow
  const [currentStep, setCurrentStep] = useState<'step1' | 'step2'>('step1');
  
  // Reset to step 1 when modal opens for new projects
  React.useEffect(() => {
    if (isOpen && !isEditing) {
      setCurrentStep('step1');
    }
  }, [isOpen, isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    onFormChange(name as keyof ProjectFormData, 
      name === 'financial_parameters' ? (value === '' ? undefined : parseFloat(value)) : value
    );
  };

  // Step transition handlers
  const handleNextStep = async () => {
    if (currentStep === 'step1' && onAnalyzeBrief) {
      // Trigger AI analysis and move to step 2
      await onAnalyzeBrief();
      setCurrentStep('step2');
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 'step2') {
      setCurrentStep('step1');
    }
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

  // Step indicator component
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      <div className="flex items-center space-x-4">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
          currentStep === 'step1' ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          1
        </div>
        <div className={`w-12 h-0.5 ${currentStep === 'step2' ? 'bg-teal-600' : 'bg-gray-200'}`}></div>
        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
          currentStep === 'step2' ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          2
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
        <div className="mb-4">
          <h3 className="text-xl font-semibold">
            {isEditing ? 'Edit Project' : 'Create New Project'}
          </h3>
          <p className="text-gray-600 text-sm">
            {isEditing ? 'Update project details and save changes.' : 'Upload your project brief to get started.'}
          </p>
        </div>

        {/* Step Indicator - only show for new projects */}
        {!isEditing && <StepIndicator />}

        {/* Step 1: Upload Brief */}
        {currentStep === 'step1' && !isEditing && (
          <div className="space-y-6">
            <div className="text-center">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Upload Your Project Brief</h4>
              <p className="text-gray-600 text-sm">
                Upload a PDF brief or enter your project details manually. Our AI will analyze the content to extract key information.
              </p>
            </div>

            {/* PDF Upload Dropzone */}
            {onPdfUpload && (
              <div>
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
                      <p className="text-lg text-gray-600">
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
                  )}
                </div>
                
                {uploadError && (
                  <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
                    <XCircle className="w-4 h-4" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>
            )}

            {/* Manual Brief Entry */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or enter your project brief manually
              </label>
              <textarea
                name="brief_description"
                value={projectForm.brief_description}
                onChange={handleInputChange}
                required
                rows={6}
                placeholder="Describe your project requirements, goals, and specifications..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Step 2: Confirm Details & Create */}
        {currentStep === 'step2' && !isEditing && (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Confirm Project Details</h4>
              <p className="text-gray-600 text-sm">
                Review the information extracted by AI and make any necessary adjustments before creating your project.
              </p>
            </div>

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
              <textarea
                name="brief_description"
                value={projectForm.brief_description}
                onChange={handleInputChange}
                required
                rows={4}
                placeholder="Project brief description..."
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
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

            {/* AI Allocation Notice for New Projects */}
            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">AI-Powered Asset Allocation</span>
              </div>
              <p className="text-sm text-purple-700">
                This project will use AI-powered allocation to automatically identify and create assets based on your brief. 
                The AI will analyze your requirements and generate detailed asset specifications with confidence scores.
              </p>
            </div>
          </div>
        )}

        {/* Edit Mode - Show original form */}
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
            
            {/* AI Analyze Brief Button */}
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

        {/* Step-based Action Buttons for New Projects */}
        {!isEditing && (
          <div className="flex justify-between pt-4 border-t">
            {currentStep === 'step1' ? (
              <>
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
                  disabled={isAnalyzingBrief || !projectForm.brief_description || projectForm.brief_description.trim().length === 0}
                  className="flex items-center gap-2 px-6 py-2 rounded bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isAnalyzingBrief ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  className="flex items-center gap-2 px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Project'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectModal;

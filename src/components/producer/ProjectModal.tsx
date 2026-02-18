import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, CheckCircle, XCircle, Sparkles, Download, ArrowLeft, ArrowRight } from 'lucide-react';
import type { ProjectFormData } from '@/services/producerService';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import Stepper, { Step } from '@/components/ui/Stepper';
import UploadGuidelinesPanel from '@/components/shared/UploadGuidelinesPanel';

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
  // PDF upload props (required — PDF upload is the only way to populate the brief)
  onPdfUpload: (file: File) => void;
  isUploadingPdf: boolean;
  uploadError: string | null;
  uploadedFilename: string | null;
  uploadedPdfFile: File | null;
  onPdfDownload: (file: File) => void;
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
  isUploadingPdf,
  uploadError,
  uploadedFilename,
  uploadedPdfFile,
  onPdfDownload,
  onAnalyzeBrief,
  isAnalyzingBrief = false
}) => {
  if (!isOpen) return null;

  // Handle Escape key to close modal
  useEscapeKey(isOpen, onClose, isSubmitting || isAnalyzingBrief);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    onFormChange(name as keyof ProjectFormData, 
      name === 'financial_parameters' ? (value === '' ? undefined : parseFloat(value)) : value
    );
  };

  // Stepper step change handler - trigger AI analysis when moving to step 2
  const handleStepChange = async (step: number) => {
    if (step === 2 && onAnalyzeBrief) {
      // Trigger AI analysis when entering step 2
      await onAnalyzeBrief();
    }
  };

  // Handle final step completion - create the project
  const handleFinalStepCompleted = () => {
    // Create a synthetic form event for submission
    const form = document.createElement('form');
    const syntheticEvent = {
      preventDefault: () => {},
      stopPropagation: () => {},
      currentTarget: form,
      target: form,
      bubbles: false,
      cancelable: false,
      defaultPrevented: false,
      eventPhase: 0,
      isTrusted: false,
      nativeEvent: new Event('submit'),
      timeStamp: Date.now(),
      type: 'submit'
    } as React.FormEvent;
    onSubmit(syntheticEvent);
  };

  // Configure dropzone for PDF uploads
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onPdfUpload(acceptedFiles[0]);
      }
    },
    disabled: isUploadingPdf
  });


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-2 sm:p-4">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-lg w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* Modal Header - Fixed */}
        <div className="p-4 sm:p-6 pb-4 border-b border-white/20 flex-shrink-0 flex items-start justify-between">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-white">
              {isEditing ? 'Edit Project' : 'Create New Project'}
            </h3>
            <p className="text-gray-300 text-sm">
              {isEditing ? 'Update project details and save changes.' : 'Upload your project brief to get started.'}
            </p>
          </div>
          {!isEditing && (
            <button
              type="button"
              onClick={onClose}
              className="text-gray-300 hover:text-white transition-colors"
              aria-label="Close"
            >
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {!isEditing ? (
            <Stepper
              initialStep={1}
              onStepChange={handleStepChange}
              onFinalStepCompleted={handleFinalStepCompleted}
              backButtonText="Previous"
              nextButtonText="Next"
              stepCircleContainerClassName="border-0 shadow-none"
              contentClassName="min-h-[400px]"
              nextButtonProps={{
                disabled: isAnalyzingBrief || !projectForm.brief_description || projectForm.brief_description.trim().length === 0 || isSubmitting,
                className: 'disabled:opacity-50 disabled:cursor-not-allowed'
              }}
              completeButtonText={isSubmitting ? 'Creating...' : 'Create Project'}
            >
              {/* Step 1: Upload Brief */}
              <Step>
                <div className="space-y-6">
                  <div className="text-center">
                    <h4 className="text-lg font-medium text-white mb-2">Upload Your Project Brief</h4>
                    <p className="text-gray-300 text-sm">
                      Upload a PDF brief and the system will analyze the content to extract key information.
                    </p>
                  </div>

            {/* PDF Upload Dropzone */}
              <div>
                <div
                  {...getRootProps()}
                  className={`
                    border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-teal-400 bg-teal-500/20' : 'border-white/20 hover:border-teal-400/50 hover:bg-white/10'}
                    ${isUploadingPdf ? 'opacity-50 cursor-wait' : ''}
                  `}
                >
                  <input {...getInputProps()} />
                  
                  {isUploadingPdf ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-12 h-12 text-teal-400 animate-spin" />
                      <p className="text-lg text-gray-200">Extracting text from PDF...</p>
                    </div>
                  ) : uploadedFilename ? (
                    <div className="flex flex-col items-center gap-3">
                      <CheckCircle className="w-12 h-12 text-green-400" />
                      <div className="flex items-center gap-2">
                        <p className="text-lg text-gray-200">
                          <FileText className="w-5 h-5 inline mr-2" />
                          {uploadedFilename}
                        </p>
                        {uploadedPdfFile && (
                          <button
                            type="button"
                            onClick={() => onPdfDownload(uploadedPdfFile)}
                            className="flex items-center gap-1 px-3 py-1 text-sm text-teal-300 hover:text-teal-200 hover:bg-teal-500/20 rounded transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-300">Text extracted successfully. Drop another PDF to replace.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <Upload className="w-12 h-12 text-gray-300" />
                      <p className="text-lg text-gray-200">
                        {isDragActive ? (
                          <span className="text-teal-300 font-medium">Drop PDF here...</span>
                        ) : (
                          <>
                            <span className="text-teal-300 font-medium">Drop a PDF brief here</span> or click to browse
                          </>
                        )}
                      </p>
                      <p className="text-sm text-gray-300">PDF files up to 10MB</p>
                    </div>
                  )}
                </div>
                
                {uploadError && (
                  <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
                    <XCircle className="w-4 h-4" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>

            {/* Upload Guidelines */}
            <UploadGuidelinesPanel />
                </div>
              </Step>

              {/* Step 2: Confirm Details & Create */}
              <Step>
                <div className="space-y-5">
                  <div className="text-center mb-6">
                    <h4 className="text-lg font-medium text-white mb-2">Confirm Project Details</h4>
                    <p className="text-gray-300 text-sm">
                      Review the extracted information and make any necessary adjustments before creating your project.
                    </p>
                  </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1 flex items-center gap-2">
                  Project Name *
                  {isAnalyzingBrief && <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />}
                </label>
                <input
                  name="project_name"
                  value={projectForm.project_name}
                  onChange={handleInputChange}
                  required
                  type="text"
                  className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1 flex items-center gap-2">
                  Client Name *
                  {isAnalyzingBrief && <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />}
                </label>
                <input
                  name="client_name"
                  value={projectForm.client_name}
                  onChange={handleInputChange}
                  required
                  type="text"
                  className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Project Brief *</label>
              <textarea
                name="brief_description"
                value={projectForm.brief_description}
                onChange={handleInputChange}
                required
                rows={4}
                placeholder="Project brief description..."
                className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1 flex items-center gap-2">
                  Physical Parameters
                  {isAnalyzingBrief && <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />}
                </label>
                <input
                  name="physical_parameters"
                  value={projectForm.physical_parameters}
                  onChange={handleInputChange}
                  type="text"
                  className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1 flex items-center gap-2">
                  Budget
                  {isAnalyzingBrief && <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />}
                </label>
                <input
                  name="financial_parameters"
                  value={projectForm.financial_parameters ?? ''}
                  onChange={handleInputChange}
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1 flex items-center gap-2">
                  Event Date
                  {isAnalyzingBrief && <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />}
                </label>
                <input
                  name="event_date"
                  value={projectForm.event_date}
                  onChange={handleInputChange}
                  type="date"
                  className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

                  {/* AI Allocation Notice for New Projects */}
                  <div className="mt-4 p-4 bg-purple-500/20 border border-purple-400/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-purple-300" />
                      <span className="text-sm font-medium text-purple-200">Smart Asset Allocation</span>
                    </div>
                    <p className="text-sm text-purple-300">
                      This project will use smart allocation to automatically identify and create assets based on your brief. 
                      The system will analyze your requirements and generate detailed asset specifications with confidence scores.
                    </p>
                  </div>
                </div>
              </Step>
            </Stepper>
          ) : (
            <>
              {/* Edit Mode - Show original form */}
              <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1 flex items-center gap-2">
                  Project Name *
                  {isAnalyzingBrief && <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />}
                </label>
                <input
                  name="project_name"
                  value={projectForm.project_name}
                  onChange={handleInputChange}
                  required
                  type="text"
                  className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1 flex items-center gap-2">
                  Client Name *
                  {isAnalyzingBrief && <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />}
                </label>
                <input
                  name="client_name"
                  value={projectForm.client_name}
                  onChange={handleInputChange}
                  required
                  type="text"
                  className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Project Brief *</label>
              
              {/* PDF Upload Dropzone */}
              <div className="mb-3">
                <div
                  {...getRootProps()}
                  className={`
                    border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-teal-400 bg-teal-500/20' : 'border-white/20 hover:border-teal-400/50 hover:bg-white/10'}
                    ${isUploadingPdf ? 'opacity-50 cursor-wait' : ''}
                  `}
                >
                  <input {...getInputProps()} />
                  
                  {isUploadingPdf ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
                      <p className="text-sm text-gray-200">Extracting text from PDF...</p>
                    </div>
                  ) : uploadedFilename ? (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-200">
                          <FileText className="w-4 h-4 inline mr-1" />
                          {uploadedFilename}
                        </p>
                        {uploadedPdfFile && (
                          <button
                            type="button"
                            onClick={() => onPdfDownload(uploadedPdfFile)}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-teal-300 hover:text-teal-200 hover:bg-teal-500/20 rounded transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-300">Text extracted successfully. Drop another PDF to replace.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-gray-300" />
                      <p className="text-sm text-gray-200">
                        {isDragActive ? (
                          <span className="text-teal-300 font-medium">Drop PDF here...</span>
                        ) : (
                          <>
                            <span className="text-teal-300 font-medium">Drop a PDF brief here</span> or click to browse
                          </>
                        )}
                      </p>
                      <p className="text-xs text-gray-300">PDF files up to 10MB</p>
                    </div>
                  )}
                </div>
                
                {uploadError && (
                  <div className="mt-2 flex items-center gap-2 text-red-400 text-sm">
                    <XCircle className="w-4 h-4" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>

              {/* Upload Guidelines */}
              <UploadGuidelinesPanel />

            <textarea
              name="brief_description"
              value={projectForm.brief_description}
              onChange={handleInputChange}
              required
              rows={4}
              placeholder="Enter project brief manually or upload a PDF above..."
              className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                      Analyze Brief
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-300 mt-1">
                  Will extract project name, client name, budget, deadline, and other details
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1 flex items-center gap-2">
                Physical Parameters
                {isAnalyzingBrief && <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />}
              </label>
              <input
                name="physical_parameters"
                value={projectForm.physical_parameters}
                onChange={handleInputChange}
                type="text"
                className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1 flex items-center gap-2">
                Budget
                {isAnalyzingBrief && <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />}
              </label>
              <input
                name="financial_parameters"
                value={projectForm.financial_parameters ?? ''}
                onChange={handleInputChange}
                type="number"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1 flex items-center gap-2">
                Event Date
                {isAnalyzingBrief && <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />}
              </label>
              <input
                name="event_date"
                value={projectForm.event_date}
                onChange={handleInputChange}
                type="date"
                className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-200">Asset Allocation Method:</p>
            
            <div className="space-y-2">
              <label className={`flex items-center space-x-3 cursor-pointer p-3 rounded-lg border transition-colors ${
                allocationMethod === 'static' 
                  ? 'bg-teal-500/20 border-teal-400/50' 
                  : 'bg-white/10 border-white/20 hover:bg-white/20'
              }`}>
                <input
                  type="radio"
                  name="allocationMethod"
                  value="static"
                  checked={allocationMethod === 'static'}
                  onChange={() => onAllocationMethodChange('static')}
                  className="w-4 h-4 text-teal-600 focus:ring-teal-500 focus:ring-2"
                />
                <div>
                  <span className="text-sm font-medium text-gray-200">Static Allocation</span>
                  <p className="text-xs text-gray-300">Rule-based asset identification using keyword matching</p>
                </div>
              </label>
              
              <label className={`flex items-center space-x-3 cursor-pointer p-3 rounded-lg border transition-colors ${
                allocationMethod === 'ai' 
                  ? 'bg-teal-500/20 border-teal-400/50' 
                  : 'bg-white/10 border-white/20 hover:bg-white/20'
              }`}>
                <input
                  type="radio"
                  name="allocationMethod"
                  value="ai"
                  checked={allocationMethod === 'ai'}
                  onChange={() => onAllocationMethodChange('ai')}
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500 focus:ring-2"
                />
                <div>
                  <span className="text-sm font-medium text-gray-200">Smart Allocation</span>
                  <p className="text-xs text-gray-300">Automatically analyzes your brief to identify assets with detailed specifications</p>
                </div>
              </label>
            </div>
            
            {allocationMethod === 'ai' && (
              <div className="mt-3 p-3 bg-purple-500/20 border border-purple-400/30 rounded-lg">
                <p className="text-sm text-purple-200">
                  ✨ The system will analyze your brief to identify assets, create detailed specifications, 
                  and suggest optimal supplier allocations with confidence scores.
                </p>
              </div>
            )}
          </div>

              </form>
            </>
          )}
        </div>

        {/* Modal Footer - Fixed */}
        {/* Note: Stepper component handles its own footer buttons for new projects */}
        {isEditing && (
          <div className="flex-shrink-0 border-t border-white/20 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 rounded border border-white/20 text-gray-200 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSubmit}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectModal;

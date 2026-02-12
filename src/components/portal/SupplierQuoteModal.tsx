import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, DollarSign, Upload, Package, CheckCircle } from 'lucide-react';
import { PortalService, type PortalSession, type Quote } from '@/services/portalService';
import { useNotification } from '@/hooks/useNotification';
import { getSupabase } from '@/lib/supabase';

interface SupplierQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: PortalSession | null;
  token: string;
  onQuoteSubmitted?: (quote: Quote) => void;
}

/**
 * SupplierQuoteModal Component
 * Modal for submitting quotes with price, notes, and file upload
 * Features:
 * - Price and currency selection
 * - Optional PDF file upload
 * - Optional notes field
 * - Success state display
 * - Dark/Glass theme styling
 */
const SupplierQuoteModal: React.FC<SupplierQuoteModalProps> = ({
  isOpen,
  onClose,
  session,
  token,
  onQuoteSubmitted
}) => {
  const { showSuccess, showError } = useNotification();

  // Quote submission state
  const [quotePrice, setQuotePrice] = useState<number>(0);
  const [quoteCurrency, setQuoteCurrency] = useState<string>('USD');
  const [quoteNotes, setQuoteNotes] = useState<string>('');
  const [submittingQuote, setSubmittingQuote] = useState<boolean>(false);
  const [quoteSubmitted, setQuoteSubmitted] = useState<boolean>(false);
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (file.type !== 'application/pdf') {
      showError('Only PDF files are allowed');
      e.target.value = ''; // Reset input
      return;
    }
    
    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      showError('File size must be less than 10MB');
      e.target.value = ''; // Reset input
      return;
    }
    
    setSelectedFile(file);
  }, [showError]);

  // Upload file to Supabase Storage
  const uploadFile = useCallback(async (file: File, quoteId: string): Promise<string> => {
    const supabase = await getSupabase();
    
    // Generate unique filename: quote-{quoteId}-{timestamp}.pdf
    const timestamp = Date.now();
    const filename = `public/quote-${quoteId}-${timestamp}.pdf`;
    
    // Upload file
    const { error } = await supabase.storage
      .from('quote-attachments')
      .upload(filename, file, {
        contentType: 'application/pdf',
        upsert: false
      });
    
    if (error) {
      console.error('Storage upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('quote-attachments')
      .getPublicUrl(filename);
    
    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL for uploaded file');
    }
    
    return urlData.publicUrl;
  }, []);

  // Handle quote submission
  const handleSubmitQuote = useCallback(async () => {
    if (!token || !session) return;

    // Validate inputs
    if (quotePrice <= 0) {
      showError('Please enter a valid price greater than 0');
      return;
    }

    setSubmittingQuote(true);
    let fileUrl: string | undefined = undefined;

    try {
      // Upload file first if selected
      if (selectedFile && session.quote.id) {
        setUploadingFile(true);
        try {
          fileUrl = await uploadFile(selectedFile, session.quote.id);
        } catch (uploadError) {
          console.error('File upload error:', uploadError);
          const errorMessage = uploadError instanceof Error ? uploadError.message : 'Failed to upload file';
          showError(errorMessage);
          setUploadingFile(false);
          setSubmittingQuote(false);
          return;
        } finally {
          setUploadingFile(false);
        }
      }

      // Submit quote with file URL
      const response = await PortalService.submitQuote(
        token,
        quotePrice,
        quoteNotes,
        fileUrl
      );

      if (!response.success || !response.data) {
        showError(response.error?.message || 'Failed to submit quote');
        return;
      }

      // Notify parent component
      if (onQuoteSubmitted) {
        onQuoteSubmitted(response.data);
      }

      setQuoteSubmitted(true);
      showSuccess('Quote submitted successfully!');
    } catch (error) {
      console.error('Error submitting quote:', error);
      showError('Failed to submit quote. Please try again.');
    } finally {
      setSubmittingQuote(false);
    }
  }, [token, session, quotePrice, quoteNotes, selectedFile, uploadFile, showSuccess, showError, onQuoteSubmitted]);

  // Reset form when modal closes
  const handleClose = useCallback(() => {
    if (!quoteSubmitted) {
      // Only reset if not submitted (preserve success state)
      setQuotePrice(0);
      setQuoteCurrency('USD');
      setQuoteNotes('');
      setSelectedFile(null);
    }
    onClose();
  }, [onClose, quoteSubmitted]);

  // Reset form when modal opens after submission
  React.useEffect(() => {
    if (!isOpen && quoteSubmitted) {
      // Reset after modal closes post-submission
      setTimeout(() => {
        setQuotePrice(0);
        setQuoteCurrency('USD');
        setQuoteNotes('');
        setSelectedFile(null);
        setQuoteSubmitted(false);
      }, 300);
    }
  }, [isOpen, quoteSubmitted]);

  if (!isOpen) return null;

  const asset = session?.asset;
  const quote = session?.quote;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity z-[99] flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-[101]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-wedding-primary to-wedding-primary-hover px-6 py-5 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Submit Your Quote</h2>
            <button
              onClick={handleClose}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {quoteSubmitted ? (
            // Success State
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/30 border border-green-400/50 mb-4">
                <CheckCircle className="h-8 w-8 text-green-300" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Quote Submitted Successfully!</h3>
              <p className="text-gray-300 mb-4">
                Thank you for your quote. The planner will review your submission and contact you if your quote is selected.
              </p>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-left">
                <h4 className="font-semibold text-white mb-2">Your Quote Summary:</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-300">
                    <span className="font-medium text-white">Price:</span> {quoteCurrency} {quotePrice.toFixed(2)}
                  </p>
                  {asset && (
                    <p className="text-gray-300">
                      <span className="font-medium text-white">Service:</span> {asset.asset_name}
                    </p>
                  )}
                  {quoteNotes && (
                    <p className="text-gray-300">
                      <span className="font-medium text-white">Notes:</span>{' '}
                      <span className="whitespace-pre-wrap">{quoteNotes}</span>
                    </p>
                  )}
                  {selectedFile && quote?.quote_document_url && (
                    <p className="text-gray-300">
                      <span className="font-medium text-white">Document:</span>{' '}
                      <a
                        href={quote.quote_document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-300 hover:text-wedding-primary-light underline"
                      >
                        {selectedFile.name}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Submission Form
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Price Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <DollarSign className="h-4 w-4 inline mr-1" />
                    Price *
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={quoteCurrency}
                      onChange={(e) => setQuoteCurrency(e.target.value)}
                      disabled={submittingQuote}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-wedding-primary focus:border-transparent disabled:bg-white/5 disabled:cursor-not-allowed"
                    >
                      <option value="USD" className="bg-[#0A0A0A]">USD</option>
                      <option value="EUR" className="bg-[#0A0A0A]">EUR</option>
                      <option value="GBP" className="bg-[#0A0A0A]">GBP</option>
                      <option value="CAD" className="bg-[#0A0A0A]">CAD</option>
                    </select>
                    <input
                      type="number"
                      value={quotePrice || ''}
                      onChange={(e) => setQuotePrice(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      disabled={submittingQuote}
                      required
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wedding-primary focus:border-transparent disabled:bg-white/5 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Upload className="h-4 w-4 inline mr-1" />
                    Attach Quote Document (Optional)
                  </label>
                  <input
                    type="file"
                    id="quote-file-upload"
                    accept=".pdf,application/pdf"
                    onChange={handleFileSelect}
                    disabled={submittingQuote || uploadingFile}
                    className="hidden"
                  />
                  <label
                    htmlFor="quote-file-upload"
                    className={`w-full border-2 border-dashed rounded-lg px-4 py-3 transition-colors flex items-center justify-center space-x-2 cursor-pointer ${
                      submittingQuote || uploadingFile
                        ? 'border-white/10 text-gray-500 cursor-not-allowed'
                        : selectedFile
                        ? 'border-green-400/50 text-green-300 hover:border-green-400'
                        : 'border-white/20 text-gray-300 hover:border-wedding-primary-light/50 hover:text-purple-300'
                    }`}
                  >
                    {uploadingFile ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-wedding-primary-light"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5" />
                        <span>{selectedFile ? selectedFile.name : 'Choose File'}</span>
                      </>
                    )}
                  </label>
                  {selectedFile && !uploadingFile && (
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <p className="text-green-300">
                        ✓ {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="text-red-400 hover:text-red-300 underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  {!selectedFile && (
                    <p className="text-xs text-gray-400 mt-1">PDF files only, max 10MB</p>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  placeholder="Add any additional information about your quote..."
                  rows={3}
                  disabled={submittingQuote}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wedding-primary focus:border-transparent disabled:bg-white/5 disabled:cursor-not-allowed"
                />
              </div>

              {/* Submit Button */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleSubmitQuote}
                  disabled={submittingQuote || uploadingFile || quotePrice <= 0}
                  className="w-full bg-wedding-primary text-white rounded-lg px-6 py-3 font-semibold hover:bg-wedding-primary-hover transition-colors flex items-center justify-center space-x-2 disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  {uploadingFile ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Uploading File...</span>
                    </>
                  ) : submittingQuote ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Package className="h-5 w-5" />
                      <span>Submit Quote</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SupplierQuoteModal;


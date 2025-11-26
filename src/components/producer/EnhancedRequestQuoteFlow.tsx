import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Building2, Mail, Tag, Loader2, ChevronLeft, ChevronRight, User, Phone, Star, Send, Paperclip } from 'lucide-react';
import { ProducerService } from '@/services/producerService';
import { QuoteRequestEmailService } from '@/services/quoteRequestEmailService';
import { useNotification } from '@/hooks/useNotification';
import type { Supplier, Quote, ContactPerson, Asset } from '@/lib/supabase';

interface RequestQuoteFlowProps {
  isOpen: boolean;
  assetId: string;
  assetName: string;
  asset: Asset | null;
  existingQuotes: Quote[];
  onClose: () => void;
  onQuotesRequested: (newQuotes: Quote[]) => void;
}

interface SupplierWithDetails extends Supplier {
  already_contacted: boolean;
}

interface CustomizedEmail {
  supplierId: string;
  contactEmail: string;
  contactName: string;
  subject: string;
  body: string;
  ccEmails: string;
  bccEmails: string;
  attachments: File[];
}

type FlowStep = 'selection' | 'preview';

/**
 * EnhancedRequestQuoteFlow - Comprehensive multi-supplier quote request system
 * 
 * Features:
 * - Step 1: Multi-supplier selection with checkboxes
 * - Step 2: Individual email customization for each supplier
 * - Email preview with navigation between suppliers
 * - CC/BCC fields
 * - Email signature auto-fill
 * - File attachments
 * - Contact person support
 * - Auto-close on submission
 */
const EnhancedRequestQuoteFlow: React.FC<RequestQuoteFlowProps> = ({
  isOpen,
  assetId,
  assetName,
  asset,
  existingQuotes,
  onClose,
  onQuotesRequested
}) => {
  const { showSuccess, showError } = useNotification();

  // Step management
  const [currentStep, setCurrentStep] = useState<FlowStep>('selection');

  // Supplier data
  const [suppliers, setSuppliers] = useState<SupplierWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);

  // Email customization
  const [customizedEmails, setCustomizedEmails] = useState<CustomizedEmail[]>([]);
  const [currentSupplierIndex, setCurrentSupplierIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // User signature (could be fetched from user profile in production)
  const [signature] = useState({
    name: 'Production Manager',
    company: 'Your Company Name',
    email: 'manager@yourcompany.com',
    phone: '+1 (555) 123-4567'
  });

  // Fetch suppliers when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchSuppliers();
      setCurrentStep('selection');
      setSelectedSupplierIds([]);
      setCustomizedEmails([]);
      setCurrentSupplierIndex(0);
    }
  }, [isOpen]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const data = await ProducerService.loadSuppliers();
      
      // Mark suppliers who already have quotes for this asset
      const suppliersWithStatus: SupplierWithDetails[] = data.map(supplier => ({
        ...supplier,
        already_contacted: existingQuotes.some(quote => quote.supplier_id === supplier.id)
      }));
      
      setSuppliers(suppliersWithStatus);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load suppliers';
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Toggle supplier selection
  const toggleSupplierSelection = (supplierId: string) => {
    setSelectedSupplierIds(prev => {
      if (prev.includes(supplierId)) {
        return prev.filter(id => id !== supplierId);
      } else {
        return [...prev, supplierId];
      }
    });
  };

  // Generate default email content for a supplier
  const generateDefaultEmail = (supplier: SupplierWithDetails): CustomizedEmail => {
    const primaryContact = supplier.contact_persons?.find((p: ContactPerson) => p.is_primary) || 
                          supplier.contact_persons?.[0];
    
    const contactName = primaryContact?.name || supplier.supplier_name;
    const contactEmail = primaryContact?.email || supplier.contact_email;
    
    const subject = `Quote Request: ${assetName}`;
    
    // Include project details if available (asset.project is populated via join in getAssetById)
    const assetWithProject = asset as Asset & { project?: { project_name: string; client_name: string; timeline_deadline?: string } };
    const projectInfo = assetWithProject?.project ? `
Project: ${assetWithProject.project.project_name}
Client: ${assetWithProject.project.client_name}${assetWithProject.project.timeline_deadline ? `
Deadline: ${new Date(assetWithProject.project.timeline_deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}` : '';

    const body = `Dear ${contactName},

We would like to request a quote for the following asset:
${projectInfo}

Asset: ${assetName}
Specifications: ${asset?.specifications || 'See project brief for details'}
${asset?.timeline ? `Timeline: ${new Date(asset.timeline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}

Please provide your quote by visiting the link below. You will receive a unique link via email once this request is sent.

We appreciate your time and look forward to working with you.

Best regards,

${signature.name}
${signature.company}
${signature.email}
${signature.phone}`;

    return {
      supplierId: supplier.id,
      contactEmail,
      contactName,
      subject,
      body,
      ccEmails: '',
      bccEmails: '',
      attachments: []
    };
  };

  // Move to preview step
  const proceedToPreview = () => {
    // Generate default emails for all selected suppliers
    const selectedSuppliers = suppliers.filter(s => selectedSupplierIds.includes(s.id));
    const emails = selectedSuppliers.map(generateDefaultEmail);
    setCustomizedEmails(emails);
    setCurrentStep('preview');
  };

  // Navigate between suppliers in preview
  const nextSupplier = () => {
    setCurrentSupplierIndex(prev => 
      prev < customizedEmails.length - 1 ? prev + 1 : 0
    );
  };

  const prevSupplier = () => {
    setCurrentSupplierIndex(prev => 
      prev > 0 ? prev - 1 : customizedEmails.length - 1
    );
  };

  // Update email content for current supplier
  const updateCurrentEmail = (field: keyof CustomizedEmail, value: string) => {
    setCustomizedEmails(prev => 
      prev.map((email, index) => 
        index === currentSupplierIndex 
          ? { ...email, [field]: value }
          : email
      )
    );
  };

  // Handle file attachment
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setCustomizedEmails(prev => 
        prev.map((email, index) => 
          index === currentSupplierIndex 
            ? { ...email, attachments: [...email.attachments, ...newFiles] }
            : email
        )
      );
    }
  };

  // Remove attachment
  const removeAttachment = (fileIndex: number) => {
    setCustomizedEmails(prev => 
      prev.map((email, index) => 
        index === currentSupplierIndex 
          ? { ...email, attachments: email.attachments.filter((_, i) => i !== fileIndex) }
          : email
      )
    );
  };

  // Send all quote requests
  const handleSendAllRequests = async () => {
    setSubmitting(true);
    try {
      const createdQuotes: Quote[] = [];
      const emailConfigs: Array<{
        quote: Quote;
        to: string;
        toName: string;
        subject: string;
        body: string;
        ccEmails?: string;
        bccEmails?: string;
        attachments?: File[];
      }> = [];

      // Step 1: Create quote records for each selected supplier
      for (const emailConfig of customizedEmails) {
        const newQuote = await ProducerService.requestQuote(assetId, emailConfig.supplierId);
        createdQuotes.push(newQuote);

        // Prepare email configuration
        emailConfigs.push({
          quote: newQuote,
          to: emailConfig.contactEmail,
          toName: emailConfig.contactName,
          subject: emailConfig.subject,
          body: emailConfig.body,
          ccEmails: emailConfig.ccEmails,
          bccEmails: emailConfig.bccEmails,
          attachments: emailConfig.attachments
        });
      }

      // Step 2: Send all emails in batch
      const emailResults = await QuoteRequestEmailService.sendBatchQuoteRequestEmails(emailConfigs);

      // Notify parent component of created quotes (optimistic update)
      onQuotesRequested(createdQuotes);

      // Show success message with details
      if (emailResults.failed === 0) {
        showSuccess(`Quote requests sent to ${emailResults.sent} supplier${emailResults.sent !== 1 ? 's' : ''}!`);
      } else {
        showError(`Sent ${emailResults.sent} email${emailResults.sent !== 1 ? 's' : ''}, but ${emailResults.failed} failed. Check console for details.`);
        // Log errors for debugging
        emailResults.errors.forEach(error => console.error(error));
      }

      // Close modal (auto-close on success or partial success)
      onClose();
    } catch (err) {
      console.error('Error sending quote requests:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send quote requests';
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentEmail = customizedEmails[currentSupplierIndex];
  const currentSupplier = currentEmail ? suppliers.find(s => s.id === currentEmail.supplierId) : null;

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[109] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-[110] overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 sm:p-6 lg:p-8">
          {/* Modal Content */}
          <div
            className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <h2 className="text-2xl font-bold text-white mb-1">
                    {currentStep === 'selection' ? 'Select Suppliers' : 'Customize Quote Requests'}
                  </h2>
                  <p className="text-purple-100 text-sm">
                    {currentStep === 'selection' 
                      ? `Choose suppliers to request quotes for "${assetName}"`
                      : `Preview and customize emails for each supplier (${currentSupplierIndex + 1} of ${customizedEmails.length})`
                    }
                  </p>
                </div>
                
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="flex-shrink-0 p-2 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Body - Conditional based on step */}
            <div className="flex-1 overflow-y-auto">
              {currentStep === 'selection' ? (
                /* STEP 1: Supplier Selection */
                <div className="p-6">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
                      <p className="text-gray-300">Loading suppliers...</p>
                    </div>
                  ) : suppliers.length === 0 ? (
                    <div className="text-center py-12">
                      <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-white font-medium mb-2">No suppliers available</p>
                      <p className="text-gray-300 text-sm">
                        Please add suppliers before requesting quotes.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {suppliers.map((supplier) => {
                        const isSelected = selectedSupplierIds.includes(supplier.id);
                        const isAlreadyContacted = supplier.already_contacted;

                        return (
                          <div
                            key={supplier.id}
                            className={`
                              border rounded-lg p-4 transition-all duration-200
                              ${isSelected ? 'border-purple-400/50 bg-purple-500/20 ring-2 ring-purple-400/50' : 'border-white/20'}
                              ${isAlreadyContacted ? 'opacity-60' : 'hover:border-purple-400/50 cursor-pointer'}
                            `}
                            onClick={() => !isAlreadyContacted && toggleSupplierSelection(supplier.id)}
                          >
                            <div className="flex items-start gap-3">
                              {/* Checkbox */}
                              <div className="flex-shrink-0 mt-1">
                                <input
                                  type="checkbox"
                                  id={`supplier-${supplier.id}`}
                                  checked={isSelected}
                                  onChange={() => toggleSupplierSelection(supplier.id)}
                                  disabled={isAlreadyContacted}
                                  className="w-4 h-4 accent-purple-600 focus:ring-purple-500 border-white/30 rounded cursor-pointer"
                                />
                              </div>

                              {/* Supplier Info */}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Building2 className="w-4 h-4 text-purple-300" />
                                  <label
                                    htmlFor={`supplier-${supplier.id}`}
                                    className="font-semibold text-white cursor-pointer"
                                  >
                                    {supplier.supplier_name}
                                  </label>
                                  {isAlreadyContacted && (
                                    <span className="px-2 py-0.5 text-xs bg-amber-500/30 text-amber-200 rounded-full font-medium">
                                      Already Contacted
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 text-sm text-gray-300 mb-2">
                                  <Mail className="w-3.5 h-3.5" />
                                  <span>{supplier.contact_email}</span>
                                </div>

                                {supplier.service_categories && supplier.service_categories.length > 0 && (
                                  <div className="flex items-start gap-1.5">
                                    <Tag className="w-3.5 h-3.5 text-gray-300 mt-0.5" />
                                    <div className="flex flex-wrap gap-1.5">
                                      {supplier.service_categories.map((category, idx) => (
                                        <span
                                          key={idx}
                                          className="px-2 py-0.5 text-xs bg-white/10 text-gray-200 rounded"
                                        >
                                          {category}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : currentEmail && currentSupplier ? (
                /* STEP 2: Email Preview & Customization */
                <div className="flex flex-col h-full">
                  {/* Supplier Navigation */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-white/20 bg-white/10">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={prevSupplier}
                        className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        disabled={customizedEmails.length <= 1}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      
                      <div className="text-center">
                        <div className="text-sm font-medium text-white">
                          {currentSupplier.supplier_name}
                        </div>
                        <div className="text-xs text-gray-300">
                          {currentSupplierIndex + 1} of {customizedEmails.length}
                        </div>
                      </div>
                      
                      <button
                        onClick={nextSupplier}
                        className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        disabled={customizedEmails.length <= 1}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Contact Info */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-300">To: {currentEmail.contactEmail}</span>
                      </div>
                      
                      {currentSupplier.contact_persons && currentSupplier.contact_persons.length > 0 && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-300">
                            {currentSupplier.contact_persons.find(p => p.is_primary)?.name || 
                             currentSupplier.contact_persons[0]?.name}
                          </span>
                          {currentSupplier.contact_persons.find(p => p.is_primary) && (
                            <Star className="h-3 w-3 text-yellow-400" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Email Editor */}
                  <div className="flex-1 p-6 overflow-y-auto space-y-6">
                    {/* Subject */}
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={currentEmail.subject}
                        onChange={(e) => updateCurrentEmail('subject', e.target.value)}
                        className="w-full px-3 py-2 bg-black/20 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter email subject"
                      />
                    </div>

                    {/* Email Body */}
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Email Body
                      </label>
                      <textarea
                        value={currentEmail.body}
                        onChange={(e) => updateCurrentEmail('body', e.target.value)}
                        rows={14}
                        className="w-full px-3 py-2 bg-black/20 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm"
                        placeholder="Enter email message"
                      />
                    </div>

                    {/* CC Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        CC (comma-separated emails)
                      </label>
                      <input
                        type="text"
                        value={currentEmail.ccEmails}
                        onChange={(e) => updateCurrentEmail('ccEmails', e.target.value)}
                        className="w-full px-3 py-2 bg-black/20 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="cc@example.com, another@example.com"
                      />
                    </div>

                    {/* BCC Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        BCC (comma-separated emails)
                      </label>
                      <input
                        type="text"
                        value={currentEmail.bccEmails}
                        onChange={(e) => updateCurrentEmail('bccEmails', e.target.value)}
                        className="w-full px-3 py-2 bg-black/20 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="bcc@example.com"
                      />
                    </div>

                    {/* Attachments */}
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Attachments
                      </label>
                      <div className="space-y-2">
                        {/* File input */}
                        <label className="flex items-center gap-2 px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 cursor-pointer transition-colors w-fit">
                          <Paperclip className="w-4 h-4 text-gray-300" />
                          <span className="text-sm text-gray-200">Add Attachment</span>
                          <input
                            type="file"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </label>

                        {/* Attachment list */}
                        {currentEmail.attachments.length > 0 && (
                          <div className="space-y-1">
                            {currentEmail.attachments.map((file, index) => (
                              <div key={index} className="flex items-center justify-between bg-black/20 px-3 py-2 rounded border border-white/20">
                                <span className="text-sm text-white">{file.name}</span>
                                <button
                                  onClick={() => removeAttachment(index)}
                                  className="text-red-400 hover:text-red-300 text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contact Person Details */}
                    {currentSupplier.contact_persons && currentSupplier.contact_persons.length > 0 && (
                      <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                        <h4 className="text-sm font-medium text-gray-200 mb-3">Contact Person Details</h4>
                        <div className="space-y-2">
                          {currentSupplier.contact_persons.map((person, index) => (
                            <div key={index} className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" />
                                <span className="font-medium text-white">{person.name}</span>
                                {person.is_primary && (
                                  <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/30 text-yellow-200 rounded text-xs">
                                    <Star className="h-2 w-2" />
                                    <span>Primary</span>
                                  </div>
                                )}
                              </div>
                              {person.role && (
                                <span className="text-gray-300">({person.role})</span>
                              )}
                              {person.phone && (
                                <div className="flex items-center gap-1 text-gray-300">
                                  <Phone className="h-3 w-3" />
                                  <span>{person.phone}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white/10 backdrop-blur-md px-6 py-4 border-t border-white/20">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-300">
                  {currentStep === 'selection' 
                    ? `${selectedSupplierIds.length} supplier${selectedSupplierIds.length !== 1 ? 's' : ''} selected`
                    : `${customizedEmails.length} email${customizedEmails.length !== 1 ? 's' : ''} will be sent`
                  }
                </div>
                
                <div className="flex gap-3">
                  {currentStep === 'preview' && (
                    <button
                      onClick={() => setCurrentStep('selection')}
                      className="px-4 py-2 rounded-lg border border-white/20 text-gray-200 hover:bg-white/10 transition-colors font-medium"
                      disabled={submitting}
                    >
                      Back to Selection
                    </button>
                  )}
                  
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg border border-white/20 text-gray-200 hover:bg-white/10 transition-colors font-medium"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  
                  {currentStep === 'selection' ? (
                    <button
                      onClick={proceedToPreview}
                      disabled={selectedSupplierIds.length === 0}
                      className={`
                        px-5 py-2 rounded-lg font-medium transition-all duration-200
                        ${selectedSupplierIds.length === 0
                          ? 'bg-gray-500/50 cursor-not-allowed text-white'
                          : 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm hover:shadow'
                        }
                      `}
                    >
                      Continue to Preview
                    </button>
                  ) : (
                    <button
                      onClick={handleSendAllRequests}
                      disabled={submitting}
                      className={`
                        px-5 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2
                        ${submitting
                          ? 'bg-gray-500/50 cursor-not-allowed text-white'
                          : 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm hover:shadow'
                        }
                      `}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send All Quote Requests
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};

export default EnhancedRequestQuoteFlow;


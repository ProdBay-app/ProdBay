import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Building2, Mail, Tag, Loader2, ChevronLeft, ChevronRight, User, Phone, Star, Send, Paperclip, Trophy, CheckSquare, Square, Search } from 'lucide-react';
import { ProducerService } from '@/services/producerService';
import { QuoteRequestService } from '@/services/quoteRequestService';
import { getSupabase } from '@/lib/supabase';
import { useNotification } from '@/hooks/useNotification';
import type { Supplier, Quote, ContactPerson, Asset } from '@/lib/supabase';
import { getSupplierRelevanceMetadata } from '@/utils/supplierRelevance';
import { getSupplierPrimaryEmail } from '@/utils/supplierUtils';
import { validateFile, formatFileSize } from '@/utils/fileValidation';

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
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Email customization
  const [customizedEmails, setCustomizedEmails] = useState<CustomizedEmail[]>([]);
  const [currentSupplierIndex, setCurrentSupplierIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // User signature (could be fetched from user profile in production)
  const [signature] = useState({
    name: 'Wedding Planner',
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
      setSearchTerm('');
      setSelectedCategories([]);
    }
  }, [isOpen]);

  // Get all unique service categories from suppliers
  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    suppliers.forEach(supplier => {
      if (supplier.service_categories) {
        supplier.service_categories.forEach(category => categories.add(category));
      }
    });
    return Array.from(categories).sort();
  }, [suppliers]);

  // Filter suppliers based on search and category filters
  const filteredSuppliers = useMemo(() => {
    let filtered = suppliers;

    // Apply search filter - prioritize name matching
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(supplier => {
        const primaryEmail = getSupplierPrimaryEmail(supplier);
        const emailMatch = primaryEmail ? primaryEmail.toLowerCase().includes(term) : false;
        // Primary: match supplier name
        if (supplier.supplier_name.toLowerCase().includes(term)) {
          return true;
        }
        // Fallback: match email or service categories
        return (
          emailMatch ||
          (supplier.service_categories && supplier.service_categories.some(cat => 
            cat.toLowerCase().includes(term)
          ))
        );
      });
    }

    // Apply category filter - show suppliers that have any selected category
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(supplier =>
        supplier.service_categories && 
        supplier.service_categories.some(cat => selectedCategories.includes(cat))
      );
    }

    return filtered;
  }, [suppliers, searchTerm, selectedCategories]);

  // Calculate relevance metadata and split into recommended/other sections
  const { recommendedSuppliers, otherSuppliers, maxScore } = useMemo(() => {
    const assetTags = asset?.tags || [];
    
    // Calculate relevance for each filtered supplier
    const suppliersWithRelevance = filteredSuppliers.map(supplier => ({
      ...supplier,
      relevance: getSupplierRelevanceMetadata(supplier, assetTags)
    }));
    
    // Split into recommended (score > 0) and other (score = 0)
    const recommended = suppliersWithRelevance.filter(s => s.relevance.score > 0);
    const other = suppliersWithRelevance.filter(s => s.relevance.score === 0);
    
    // Calculate max score among recommended suppliers
    const max = recommended.length > 0
      ? Math.max(...recommended.map(s => s.relevance.score))
      : 0;
    
    return { recommendedSuppliers: recommended, otherSuppliers: other, maxScore: max };
  }, [filteredSuppliers, asset?.tags]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      // Use relevance sorting if assetId is available, otherwise fallback to alphabetical
      const data = assetId
        ? await ProducerService.loadSuppliersForAsset(assetId)
        : await ProducerService.loadSuppliers();
      
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

  // Toggle category filter
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
  };

  // Select all recommended suppliers only
  const handleSelectAllRecommended = () => {
    const recommendedIds = recommendedSuppliers.map(s => s.id);
    const allRecommendedSelected = recommendedIds.every(id => selectedSupplierIds.includes(id));
    
    if (allRecommendedSelected) {
      // Deselect all recommended suppliers
      recommendedIds.forEach(id => {
        if (selectedSupplierIds.includes(id)) {
          toggleSupplierSelection(id);
        }
      });
    } else {
      // Select all recommended suppliers
      recommendedIds.forEach(id => {
        if (!selectedSupplierIds.includes(id)) {
          toggleSupplierSelection(id);
        }
      });
    }
  };

  // Check if all recommended suppliers are selected
  const allRecommendedSelected = recommendedSuppliers.length > 0 && 
    recommendedSuppliers.every(s => selectedSupplierIds.includes(s.id));

  const getDefaultContactEmails = (supplier: SupplierWithDetails, field: 'default_cc' | 'default_bcc'): string[] => {
    const primaryEmail = getSupplierPrimaryEmail(supplier);
    const contacts = supplier.contact_persons || [];
    const emails = contacts
      .filter(person => {
        if (field === 'default_cc') {
          return Boolean(person?.default_cc ?? person?.is_cc);
        }
        return Boolean(person?.default_bcc ?? person?.is_bcc);
      })
      .map(person => person.email)
      .filter(Boolean)
      .filter(email => email !== primaryEmail);

    return Array.from(new Set(emails));
  };

  // Generate default email content for a supplier
  const generateDefaultEmail = (supplier: SupplierWithDetails): CustomizedEmail => {
    const primaryContact = supplier.contact_persons?.find((p: ContactPerson) => p.is_primary) || 
                          supplier.contact_persons?.[0];
    
    const contactName = primaryContact?.name || supplier.supplier_name;
    const contactEmail = getSupplierPrimaryEmail(supplier) || '';
    const ccEmails = getDefaultContactEmails(supplier, 'default_cc').join(', ');
    const bccEmails = getDefaultContactEmails(supplier, 'default_bcc').join(', ');
    
    const subject = `Quote Request: ${assetName}`;

    const body = `Dear ${contactName},

We would like to request a quote for the following service:

Service: ${assetName}
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
      ccEmails,
      bccEmails,
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

  const mergeEmailIntoList = (existing: string, email: string): string => {
    if (!email) return existing;
    const items = existing
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
    if (!items.includes(email)) {
      items.push(email);
    }
    return items.join(', ');
  };

  // Handle file attachment with size validation and 10-file limit
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const currentEmail = customizedEmails[currentSupplierIndex];
      const currentCount = currentEmail.attachments.length;
      const maxAttachments = 10;
      
      const newFiles = Array.from(e.target.files);
      
      // Check if adding these files would exceed limit
      if (currentCount + newFiles.length > maxAttachments) {
        const remaining = maxAttachments - currentCount;
        showError(`Maximum ${maxAttachments} attachments allowed. You can add ${remaining} more file(s).`);
        e.target.value = '';
        return;
      }
      
      const validFiles: File[] = [];
      const rejectedFiles: { file: File; reason: string }[] = [];
      
      // Validate each file (type and size check)
      newFiles.forEach(file => {
        const validation = validateFile(file, 5);
        if (validation.valid) {
          validFiles.push(file);
        } else {
          rejectedFiles.push({ file, reason: validation.error || 'File validation failed' });
          showError(validation.error || `File "${file.name}" validation failed`);
        }
      });
      
      // Only add valid files to state (check limit again after validation)
      if (validFiles.length > 0) {
        const finalCount = currentCount + validFiles.length;
        if (finalCount > maxAttachments) {
          const allowed = maxAttachments - currentCount;
          showError(`Maximum ${maxAttachments} attachments allowed. Only ${allowed} file(s) can be added.`);
          e.target.value = '';
          return;
        }
        
        setCustomizedEmails(prev => 
          prev.map((email, index) => 
            index === currentSupplierIndex 
              ? { ...email, attachments: [...email.attachments, ...validFiles] }
              : email
          )
        );
      }
      
      // Reset file input to allow selecting the same file again if needed
      e.target.value = '';
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
      // Get authenticated user's email for Reply-To header
      const supabase = await getSupabase();
      const { data: { user } } = await supabase.auth.getUser();

      // Require authenticated user - no fallback for production safety
      if (!user || !user.email) {
        throw new Error('Authentication required. Please log in to send quote requests.');
      }

      const from = {
        name: user.user_metadata?.full_name || user.email.split('@')[0] || 'Planner',
        email: user.email
      };

      // Extract supplier IDs from customized emails
      const supplierIds = customizedEmails.map(email => email.supplierId);

      // Convert files to Base64 and transform customizedEmails to backend format
      const convertFilesToBase64 = async (files: File[]): Promise<Array<{ filename: string; content: string; contentType: string }>> => {
        const conversions = files.map(file => {
          return new Promise<{ filename: string; content: string; contentType: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              // Remove data:type;base64, prefix to get just the Base64 string
              const base64 = result.split(',')[1];
              resolve({
                filename: file.name,
                content: base64,
                contentType: file.type || 'application/octet-stream'
              });
            };
            reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
            reader.readAsDataURL(file);
          });
        });
        return Promise.all(conversions);
      };

      // Validate all attachments before conversion (safety check)
      const allAttachments = customizedEmails.flatMap(email => email.attachments);
      const invalidFiles = allAttachments.filter(file => !validateFile(file, 5).valid);
      if (invalidFiles.length > 0) {
        const invalidFileNames = invalidFiles.map(f => f.name).join(', ');
        showError(`Cannot send: ${invalidFiles.length} file(s) failed validation (${invalidFileNames}). Please remove them and try again.`);
        setSubmitting(false);
        return;
      }

      // Convert all attachments to Base64
      const backendCustomizedEmails = await Promise.all(
        customizedEmails.map(async (email) => {
          const attachments = email.attachments.length > 0
            ? await convertFilesToBase64(email.attachments)
            : undefined;

          return {
            supplierId: email.supplierId,
            subject: email.subject,
            body: email.body,
            ...(email.ccEmails && { ccEmails: email.ccEmails }),
            ...(email.bccEmails && { bccEmails: email.bccEmails }),
            ...(attachments && { attachments })
          };
        })
      );

      // Call backend API to create quotes and send emails
      const result = await QuoteRequestService.sendQuoteRequests(
        assetId,
        supplierIds,
        backendCustomizedEmails,
        from
      );

      // Extract created quotes from backend response
      // Backend returns results with quote_id for each supplier
      // Fetch all quotes for this asset once, then match by quote_id
      let allQuotes: Quote[] = [];
      try {
        allQuotes = await ProducerService.getQuotesForAsset(assetId);
      } catch (err) {
        console.warn('Could not fetch quotes after sending requests:', err);
      }

      const createdQuotes: Quote[] = [];
      for (const resultItem of result.data.results) {
        if (resultItem.email_sent && resultItem.quote_id) {
          const matchingQuote = allQuotes.find(q => q.id === resultItem.quote_id);
          if (matchingQuote) {
            createdQuotes.push(matchingQuote);
          }
        }
      }

      // Notify parent component of created quotes
      if (createdQuotes.length > 0) {
        onQuotesRequested(createdQuotes);
      }

      // Show success message with details from backend
      if (result.data.failed_requests === 0) {
        showSuccess(`Quote requests sent to ${result.data.successful_requests} vendor${result.data.successful_requests !== 1 ? 's' : ''}!`);
      } else {
        const failedDetails = result.data.errors.map(e => `${e.supplier_name}: ${e.error}`).join('; ');
        showError(`Sent ${result.data.successful_requests} request${result.data.successful_requests !== 1 ? 's' : ''}, but ${result.data.failed_requests} failed. ${failedDetails}`);
        // Log errors for debugging
        result.data.errors.forEach(error => console.error(`Failed for ${error.supplier_name}:`, error.error));
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
          {/* Wrapper for Modal and External Arrows */}
          <div className="relative w-full max-w-4xl">
            {/* Floating Navigation Arrows - Outside Modal (only in preview step) */}
            {currentStep === 'preview' && customizedEmails.length > 1 && (
              <>
                {/* Previous Arrow - Left Side */}
                <button
                  onClick={prevSupplier}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full z-20 p-3 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm border border-white/20 text-white transition-all duration-200 hover:scale-110 ml-2"
                  aria-label="Previous supplier"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                
                {/* Next Arrow - Right Side */}
                <button
                  onClick={nextSupplier}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full z-20 p-3 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm border border-white/20 text-white transition-all duration-200 hover:scale-110 mr-2"
                  aria-label="Next supplier"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Modal Content */}
            <div
              className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-wedding-primary to-wedding-primary-hover px-6 py-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <h2 className="text-2xl font-bold text-white mb-1">
                    {currentStep === 'selection' ? 'Select Vendors' : 'Customize Quote Requests'}
                  </h2>
                  <p className="text-purple-100 text-sm">
                    {currentStep === 'selection' 
                      ? `Choose vendors to request quotes for "${assetName}"`
                      : `Preview and customize emails for each vendor (${currentSupplierIndex + 1} of ${customizedEmails.length})`
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
                      <p className="text-gray-300">Loading vendors...</p>
                    </div>
                  ) : suppliers.length === 0 ? (
                    <div className="text-center py-12">
                      <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-white font-medium mb-2">No vendors available</p>
                      <p className="text-gray-300 text-sm">
                        Please add vendors before requesting quotes.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Prominent Search Bar - At the very top */}
                      <div className="mb-4">
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-300" />
                          <input
                            type="text"
                            placeholder="Search vendors by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-12 py-3 text-base bg-black/20 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-wedding-primary focus:border-purple-500 transition-colors"
                            autoFocus
                          />
                          {searchTerm && (
                            <button
                              onClick={() => setSearchTerm('')}
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white transition-colors"
                              aria-label="Clear search"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Tag Toggles - Always Visible, Below Search */}
                      {allCategories.length > 0 && (
                        <div className="mb-4 pb-4 border-b border-white/20">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-gray-200">Filter by Service Category</h4>
                            {(searchTerm.trim().length > 0 || selectedCategories.length > 0) && (
                              <button
                                onClick={clearFilters}
                                className="text-xs text-purple-300 hover:text-wedding-primary-light font-medium transition-colors"
                              >
                                Clear all filters
                              </button>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {allCategories.map(category => (
                              <button
                                key={category}
                                onClick={() => toggleCategory(category)}
                                className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                                  selectedCategories.includes(category)
                                    ? 'bg-wedding-primary/30 text-wedding-primary-light border-wedding-primary-light/50 font-medium shadow-sm'
                                    : 'bg-white/5 text-gray-300 border-white/20 hover:bg-white/10 hover:border-white/30'
                                }`}
                              >
                                {category}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-6">
                        {/* Recommended Suppliers Section */}
                        {recommendedSuppliers.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Star className="w-5 h-5 text-purple-400 fill-purple-400" />
                              <h4 className="text-sm font-semibold text-white">
                                Recommended for this Service ({recommendedSuppliers.length})
                              </h4>
                            </div>
                            <button
                              onClick={handleSelectAllRecommended}
                              className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-wedding-primary/30 text-wedding-primary-light rounded-lg hover:bg-wedding-secondary/500/40 transition-colors font-medium"
                            >
                              {allRecommendedSelected ? (
                                <>
                                  <CheckSquare className="w-3.5 h-3.5" />
                                  Deselect All
                                </>
                              ) : (
                                <>
                                  <Square className="w-3.5 h-3.5" />
                                  Select All
                                </>
                              )}
                            </button>
                          </div>
                          <div className="space-y-3">
                            {recommendedSuppliers.map((supplier) => {
                              const isSelected = selectedSupplierIds.includes(supplier.id);
                              const isAlreadyContacted = supplier.already_contacted;
                              const matchingCategories = supplier.relevance.matchingCategories;
                              const supplierEmail = getSupplierPrimaryEmail(supplier);

                              return (
                                <div
                                  key={supplier.id}
                                  className={`
                                    border rounded-lg p-4 transition-all duration-200
                                    ${isSelected ? 'border-wedding-primary-light/50 bg-wedding-primary/20 ring-2 ring-wedding-primary/50' : 'border-white/20'}
                                    ${isAlreadyContacted ? 'opacity-60' : 'hover:border-wedding-primary-light/50 cursor-pointer'}
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
                                        className="w-4 h-4 accent-purple-600 focus:ring-wedding-primary border-white/30 rounded cursor-pointer"
                                      />
                                    </div>

                                    {/* Supplier Info */}
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <Building2 className="w-4 h-4 text-purple-300" />
                                        <label
                                          htmlFor={`supplier-${supplier.id}`}
                                          className="font-semibold text-white cursor-pointer"
                                        >
                                          {supplier.supplier_name}
                                        </label>
                                        {supplier.relevance.score === maxScore && maxScore > 0 && (
                                          <span className="px-2 py-0.5 text-xs bg-wedding-primary/50 text-white rounded-full font-bold border border-wedding-primary-light flex items-center gap-1">
                                            <Trophy className="w-3 h-3 fill-white" />
                                            Best Match
                                          </span>
                                        )}
                                        {isAlreadyContacted && (
                                          <span className="px-2 py-0.5 text-xs bg-amber-500/30 text-amber-200 rounded-full font-medium">
                                            Already Contacted
                                          </span>
                                        )}
                                      </div>

                                      {supplierEmail && (
                                        <div className="flex items-center gap-1.5 text-sm text-gray-300 mb-2">
                                          <Mail className="w-3.5 h-3.5" />
                                          <span>{supplierEmail}</span>
                                        </div>
                                      )}

                                      {supplier.service_categories && supplier.service_categories.length > 0 && (
                                        <div className="flex items-start gap-1.5">
                                          <Tag className="w-3.5 h-3.5 text-gray-300 mt-0.5" />
                                          <div className="flex flex-wrap gap-1.5">
                                            {supplier.service_categories.map((category, idx) => {
                                              const isMatching = matchingCategories.includes(category);
                                              return (
                                                <span
                                                  key={idx}
                                                  className={`px-2 py-0.5 text-xs rounded ${
                                                    isMatching
                                                      ? 'bg-wedding-primary/30 text-wedding-primary-light font-semibold border border-wedding-primary-light/50'
                                                      : 'bg-white/10 text-gray-200'
                                                  }`}
                                                  aria-label={isMatching ? `Matching category: ${category}` : category}
                                                >
                                                  {category}
                                                </span>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Other Suppliers Section */}
                      {otherSuppliers.length > 0 && (
                        <div>
                          {recommendedSuppliers.length > 0 && (
                            <div className="border-t border-white/20 my-4"></div>
                          )}
                          <div className="flex items-center gap-2 mb-3">
                            <h4 className="text-sm font-medium text-gray-300">
                              Other Vendors ({otherSuppliers.length})
                            </h4>
                          </div>
                        <div className="space-y-3">
                          {otherSuppliers.map((supplier) => {
                            const isSelected = selectedSupplierIds.includes(supplier.id);
                            const isAlreadyContacted = supplier.already_contacted;
                            const supplierEmail = getSupplierPrimaryEmail(supplier);
                            
                            return (
                                <div
                                  key={supplier.id}
                                  className={`
                                    border rounded-lg p-4 transition-all duration-200
                                    ${isSelected ? 'border-wedding-primary-light/50 bg-wedding-primary/20 ring-2 ring-wedding-primary/50' : 'border-white/20'}
                                    ${isAlreadyContacted ? 'opacity-60' : 'hover:border-wedding-primary-light/50 cursor-pointer'}
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
                                        className="w-4 h-4 accent-purple-600 focus:ring-wedding-primary border-white/30 rounded cursor-pointer"
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

                                      {supplierEmail && (
                                        <div className="flex items-center gap-1.5 text-sm text-gray-300 mb-2">
                                          <Mail className="w-3.5 h-3.5" />
                                          <span>{supplierEmail}</span>
                                        </div>
                                      )}

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
                        </div>
                      )}
                      </div>
                    </>
                  )}
                </div>
              ) : currentEmail && currentSupplier ? (
                /* STEP 2: Email Preview & Customization */
                <div className="flex flex-col h-full">
                  {/* Supplier Header - No Navigation Arrows */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-white/20 bg-white/10">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">
                        {currentSupplier.supplier_name}
                      </div>
                      <div className="text-xs text-gray-300">
                        {currentSupplierIndex + 1} of {customizedEmails.length}
                      </div>
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

                  {/* Email Editor - With Horizontal Padding for Arrows */}
                  <div className="flex-1 px-12 py-6 overflow-y-auto space-y-6">
                    {/* Subject */}
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={currentEmail.subject}
                        onChange={(e) => updateCurrentEmail('subject', e.target.value)}
                        className="w-full px-3 py-2 bg-black/20 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-wedding-primary focus:border-transparent"
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
                        className="w-full px-3 py-2 bg-black/20 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-wedding-primary focus:border-transparent resize-none font-mono text-sm"
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
                        className="w-full px-3 py-2 bg-black/20 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-wedding-primary focus:border-transparent"
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
                        className="w-full px-3 py-2 bg-black/20 border border-white/20 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-wedding-primary focus:border-transparent"
                        placeholder="bcc@example.com"
                      />
                    </div>

                    {/* Attachments */}
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Attachments ({currentEmail.attachments.length}/10)
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
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-white">{file.name}</span>
                                  <span className="text-xs text-gray-400">({formatFileSize(file.size)})</span>
                                </div>
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
                            <div key={index} className="flex flex-wrap items-center gap-3 text-sm">
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
                              {person.email && (
                                <span className="text-gray-300">{person.email}</span>
                              )}
                              {!person.is_primary && person.email && currentEmail && (
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => updateCurrentEmail('ccEmails', mergeEmailIntoList(currentEmail.ccEmails, person.email))}
                                    className="px-2 py-0.5 text-xs bg-white/10 text-gray-200 rounded hover:bg-white/20"
                                  >
                                    Add to CC
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateCurrentEmail('bccEmails', mergeEmailIntoList(currentEmail.bccEmails, person.email))}
                                    className="px-2 py-0.5 text-xs bg-white/10 text-gray-200 rounded hover:bg-white/20"
                                  >
                                    Add to BCC
                                  </button>
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
                    ? `${selectedSupplierIds.length} vendor${selectedSupplierIds.length !== 1 ? 's' : ''} selected`
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
                          : 'bg-wedding-primary hover:bg-wedding-primary-hover text-white shadow-sm hover:shadow'
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
                          : 'bg-wedding-primary hover:bg-wedding-primary-hover text-white shadow-sm hover:shadow'
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
          {/* End Modal Content */}
          </div>
          {/* End Wrapper */}
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};

export default EnhancedRequestQuoteFlow;


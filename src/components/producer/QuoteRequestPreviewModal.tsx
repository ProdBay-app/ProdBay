import React, { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import type { Asset, Supplier, ContactPerson } from '@/lib/supabase';
import { useNotification } from '@/hooks/useNotification';
import { getSupplierPrimaryEmail } from '@/utils/supplierUtils';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Mail, 
  User, 
  Phone, 
  Star,
  Send,
  Loader2
} from 'lucide-react';

interface SupplierWithPreview {
  id: string;
  supplier_name: string;
  contact_persons: ContactPerson[];
  preview_email: {
    to: string;
    subject: string;
    body: string;
  };
}

interface CustomizedEmail {
  supplierId: string;
  subject: string;
  body: string;
}

interface QuoteRequestPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset;
  supplierIds: string[];
  onSend: (customizedEmails: CustomizedEmail[]) => Promise<void>;
}

const QuoteRequestPreviewModal: React.FC<QuoteRequestPreviewModalProps> = ({
  isOpen,
  onClose,
  asset,
  supplierIds,
  onSend
}) => {
  const { showError } = useNotification();
  const [suppliers, setSuppliers] = useState<SupplierWithPreview[]>([]);
  const [currentSupplierIndex, setCurrentSupplierIndex] = useState(0);
  const [customizedEmails, setCustomizedEmails] = useState<CustomizedEmail[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isOpen && supplierIds.length > 0) {
      generateEmailPreviews();
    }
  }, [isOpen, supplierIds, asset]);

  const generateEmailPreviews = async () => {
    setLoading(true);
    try {
      // Fetch supplier details
      const supabase = await getSupabase();
      const { data: suppliersData, error } = await supabase
        .from('suppliers')
        .select('*')
        .in('id', supplierIds);

      if (error) throw error;

      // Generate preview emails for each supplier
      const suppliersWithPreview: SupplierWithPreview[] = suppliersData.map(supplier => {
        const primaryContact = supplier.contact_persons?.find((p: ContactPerson) => p.is_primary) || 
                              supplier.contact_persons?.[0];
        
        const contactName = primaryContact?.name || supplier.supplier_name;
        const contactEmail = getSupplierPrimaryEmail(supplier) || '';
        
        const subject = `Quote Request: ${asset.asset_name}`;
        const body = `Dear ${contactName},

We would like to request a quote for the following service:

Service: ${asset.asset_name}
Specifications: ${asset.specifications || 'See wedding brief for details'}
Timeline: ${asset.timeline || 'To be discussed'}

Please provide your quote by visiting the link below and submitting your proposal.

Thank you for your time and we look forward to working with you.

Best regards,
[Your Name]
[Your Company]`;

        return {
          id: supplier.id,
          supplier_name: supplier.supplier_name,
          contact_persons: supplier.contact_persons || [],
          preview_email: {
            to: contactEmail,
            subject,
            body
          }
        };
      });

      setSuppliers(suppliersWithPreview);
      
      // Initialize customized emails with default content
      const initialCustomizedEmails: CustomizedEmail[] = suppliersWithPreview.map(supplier => ({
        supplierId: supplier.id,
        subject: supplier.preview_email.subject,
        body: supplier.preview_email.body
      }));
      setCustomizedEmails(initialCustomizedEmails);
      
    } catch (error) {
      console.error('Error generating email previews:', error instanceof Error ? error.message : String(error));
      showError('Failed to generate email previews');
    } finally {
      setLoading(false);
    }
  };

  const updateEmailContent = (supplierId: string, field: 'subject' | 'body', value: string) => {
    setCustomizedEmails(prev => 
      prev.map(email => 
        email.supplierId === supplierId 
          ? { ...email, [field]: value }
          : email
      )
    );
  };

  const getCurrentEmail = () => {
    if (suppliers.length === 0) return null;
    const currentSupplier = suppliers[currentSupplierIndex];
    return customizedEmails.find(email => email.supplierId === currentSupplier.id);
  };

  const handleSend = async () => {
    setSending(true);
    try {
      await onSend(customizedEmails);
      onClose();
    } catch (error) {
      console.error('Error sending emails:', error instanceof Error ? error.message : String(error));
      showError('Failed to send quote requests');
    } finally {
      setSending(false);
    }
  };

  const nextSupplier = () => {
    setCurrentSupplierIndex(prev => 
      prev < suppliers.length - 1 ? prev + 1 : 0
    );
  };

  const prevSupplier = () => {
    setCurrentSupplierIndex(prev => 
      prev > 0 ? prev - 1 : suppliers.length - 1
    );
  };

  if (!isOpen) return null;

  const currentSupplier = suppliers[currentSupplierIndex];
  const currentEmail = getCurrentEmail();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Preview Quote Request Emails</h2>
            <p className="text-sm text-gray-600 mt-1">
              Service: {asset.asset_name} • {suppliers.length} vendor(s) selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
              <span className="text-gray-600">Generating email previews...</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Supplier Navigation */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-4">
                <button
                  onClick={prevSupplier}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
                  disabled={suppliers.length <= 1}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-900">
                    {currentSupplier?.supplier_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {currentSupplierIndex + 1} of {suppliers.length}
                  </div>
                </div>
                
                <button
                  onClick={nextSupplier}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
                  disabled={suppliers.length <= 1}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Contact Person Info */}
              {currentSupplier && (
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">To: {currentSupplier.preview_email.to}</span>
                  </div>
                  
                  {currentSupplier.contact_persons.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        {currentSupplier.contact_persons.find(p => p.is_primary)?.name || 
                         currentSupplier.contact_persons[0]?.name}
                      </span>
                      {currentSupplier.contact_persons.find(p => p.is_primary) && (
                        <Star className="h-3 w-3 text-yellow-500" />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Email Editor */}
            <div className="flex-1 p-6 overflow-y-auto">
              {currentEmail && (
                <div className="space-y-6">
                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={currentEmail.subject}
                      onChange={(e) => updateEmailContent(currentSupplier.id, 'subject', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>

                  {/* Email Body */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Body
                    </label>
                    <textarea
                      value={currentEmail.body}
                      onChange={(e) => updateEmailContent(currentSupplier.id, 'body', e.target.value)}
                      rows={12}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Contact Person Details */}
                  {currentSupplier.contact_persons.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Contact Person Details</h4>
                      <div className="space-y-2">
                        {currentSupplier.contact_persons.map((person, index) => (
                          <div key={index} className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-gray-700">{person.name}</span>
                              {person.is_primary && (
                                <div className="flex items-center space-x-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
                                  <Star className="h-2 w-2" />
                                  <span>Primary</span>
                                </div>
                              )}
                            </div>
                            {person.role && (
                              <span className="text-gray-500">({person.role})</span>
                            )}
                            {person.phone && (
                              <div className="flex items-center space-x-1 text-gray-500">
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
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                {suppliers.length} email(s) will be sent
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={sending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending || suppliers.length === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Send Quote Requests</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuoteRequestPreviewModal;

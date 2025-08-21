import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Quote, Asset, Supplier } from '../../lib/supabase';
import { 
  DollarSign, 
  FileText, 
  Send, 
  CheckCircle, 
  Package, 
  Clock,
  Building2 
} from 'lucide-react';

const QuoteSubmission: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    cost: 0,
    notes_capacity: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleLogoClick = () => {
    navigate('/');
  };

  useEffect(() => {
    if (token) {
      loadQuoteData();
    }
  }, [token]);

  const loadQuoteData = async () => {
    try {
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          *,
          supplier:suppliers(*),
          asset:assets(
            *,
            project:projects(*)
          )
        `)
        .eq('quote_token', token)
        .single();

      if (quoteError || !quoteData) {
        console.error('Quote not found:', quoteError);
        return;
      }

      setQuote(quoteData);
      setAsset(quoteData.asset);
      setSupplier(quoteData.supplier);

      // If quote already has data, populate form
      if (quoteData.cost > 0 || quoteData.notes_capacity) {
        setFormData({
          cost: quoteData.cost || 0,
          notes_capacity: quoteData.notes_capacity || ''
        });
      }

      // Check if already submitted
      if (quoteData.cost > 0 && quoteData.status === 'Submitted') {
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Error loading quote data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('quotes')
        .update({
          cost: formData.cost,
          notes_capacity: formData.notes_capacity,
          status: 'Submitted'
        })
        .eq('id', quote!.id);

      if (error) throw error;

      setSubmitted(true);
      alert('Quote submitted successfully!');
    } catch (error) {
      console.error('Error submitting quote:', error);
      alert('Failed to submit quote. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!quote || !asset || !supplier) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Quote Not Found</h2>
          <p className="text-gray-600">
            This quote request may have expired or the link may be invalid.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-orange-600 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div 
            className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleLogoClick}
            title="Go to Home"
          >
            <Package className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">ProdBay Quote Request</h1>
              <p className="opacity-90">Supplier Portal</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {submitted ? (
          // Success State
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Quote Submitted Successfully!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for your quote. The producer will review your submission and contact you if your quote is selected.
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Your Quote Summary:</h3>
              <div className="text-left space-y-2">
                <p><span className="font-medium">Cost:</span> ${formData.cost.toFixed(2)}</p>
                <p><span className="font-medium">Asset:</span> {asset.asset_name}</p>
                {formData.notes_capacity && (
                  <p><span className="font-medium">Notes:</span> {formData.notes_capacity}</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Quote Form
          <div className="space-y-6">
            {/* Project Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Building2 className="h-6 w-6 text-orange-600" />
                <h2 className="text-xl font-semibold">Project Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Project Details</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Project:</span> {asset.project?.project_name}</p>
                    <p><span className="font-medium">Client:</span> {asset.project?.client_name}</p>
                    {asset.timeline && (
                      <p><span className="font-medium">Deadline:</span> {new Date(asset.timeline).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Your Details</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Company:</span> {supplier.supplier_name}</p>
                    <p><span className="font-medium">Email:</span> {supplier.contact_email}</p>
                    <p><span className="font-medium">Categories:</span> {supplier.service_categories.join(', ')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Asset Requirements */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Package className="h-6 w-6 text-orange-600" />
                <h2 className="text-xl font-semibold">Asset Requirements</h2>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{asset.asset_name}</h3>
                <p className="text-gray-700 mb-4">{asset.specifications}</p>
                
                {asset.project?.brief_description && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Project Brief Context:</h4>
                    <p className="text-gray-700 text-sm">{asset.project.brief_description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quote Submission Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-3 mb-6">
                <DollarSign className="h-6 w-6 text-orange-600" />
                <h2 className="text-xl font-semibold">Submit Your Quote</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-2">
                    Total Cost *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      id="cost"
                      value={formData.cost || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                      required
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="notes_capacity" className="block text-sm font-medium text-gray-700 mb-2">
                    Notes & Capacity Details
                  </label>
                  <textarea
                    id="notes_capacity"
                    value={formData.notes_capacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes_capacity: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Include details about your capacity, timeline, terms, special requirements, or any other relevant information..."
                  />
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <button
                    type="submit"
                    disabled={submitting || formData.cost <= 0}
                    className="flex items-center space-x-2 px-8 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="h-4 w-4" />
                    <span>{submitting ? 'Submitting...' : 'Submit Quote'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Information Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Important Information:</p>
                  <ul className="space-y-1 text-blue-700">
                    <li>• Please provide your best competitive pricing</li>
                    <li>• Include all costs (materials, labor, delivery, etc.)</li>
                    <li>• Specify any terms or conditions in the notes section</li>
                    <li>• The producer will review all quotes and contact selected suppliers</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuoteSubmission;
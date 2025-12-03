import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Package, 
  FileText, 
  Calendar, 
  DollarSign, 
  Send, 
  Upload,
  AlertCircle,
  User,
  CheckCircle,
  Briefcase,
  MapPin
} from 'lucide-react';
import { PortalService, type PortalSession, type Message } from '@/services/portalService';
import { useNotification } from '@/hooks/useNotification';
import { getSupabase } from '@/lib/supabase';

/**
 * QuotePortal Component
 * Booking.com-style supplier portal for quote requests
 * Features:
 * - Two-column layout (Context | Conversation)
 * - Real-time message polling
 * - Optimistic UI for message sending
 * - Quote submission UI skeleton
 */
const QuotePortal: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { showSuccess, showError } = useNotification();

  // Session state
  const [session, setSession] = useState<PortalSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Message state
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quote submission state
  const [quotePrice, setQuotePrice] = useState<number>(0);
  const [quoteCurrency, setQuoteCurrency] = useState<string>('USD');
  const [quoteNotes, setQuoteNotes] = useState<string>('');
  const [submittingQuote, setSubmittingQuote] = useState<boolean>(false);
  const [quoteSubmitted, setQuoteSubmitted] = useState<boolean>(false);
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);

  // Polling interval ref
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load session data
  const loadSession = useCallback(async () => {
    if (!token) {
      setError('Access token is missing');
      setLoading(false);
      return;
    }

    try {
      const response = await PortalService.getSession(token);
      
      if (!response.success || !response.data) {
        setError(response.error?.message || 'Failed to load portal session');
        setLoading(false);
        return;
      }

      setSession(response.data);
      setMessages(response.data.messages || []);
      setError(null);
    } catch (err) {
      console.error('Error loading session:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Poll for new messages
  const pollMessages = useCallback(async () => {
    if (!token || !session) return;

    try {
      const response = await PortalService.getSession(token);
      if (response.success && response.data) {
        // Only update if messages have changed (avoid unnecessary re-renders)
        const newMessages = response.data.messages || [];
        if (JSON.stringify(newMessages) !== JSON.stringify(messages)) {
          setMessages(newMessages);
        }
      }
    } catch (err) {
      console.error('Error polling messages:', err);
      // Don't show error for polling failures - just log
    }
  }, [token, session, messages]);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!token || !messageInput.trim() || sendingMessage) return;

    const content = messageInput.trim();
    setMessageInput('');

    // Optimistic UI: Add message immediately
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      quote_id: session?.quote.id || '',
      sender_type: 'SUPPLIER',
      content,
      created_at: new Date().toISOString(),
      is_read: false
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setSendingMessage(true);
    scrollToBottom();

    try {
      const response = await PortalService.sendMessage(token, content);
      
      if (!response.success || !response.data) {
        // Remove optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
        showError(response.error?.message || 'Failed to send message');
        return;
      }

      // Replace optimistic message with real one
      setMessages(prev => 
        prev.map(m => m.id === optimisticMessage.id ? response.data! : m)
      );
      
      showSuccess('Message sent successfully');
    } catch (err) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      showError('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  }, [token, messageInput, sendingMessage, session, scrollToBottom, showSuccess, showError]);

  // Handle Enter key in message input
  const handleMessageKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

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

      // Update session with new quote data
      setSession(prev => prev ? {
        ...prev,
        quote: response.data!
      } : null);

      setQuoteSubmitted(true);
      showSuccess('Quote submitted successfully!');
    } catch (error) {
      console.error('Error submitting quote:', error);
      showError('Failed to submit quote. Please try again.');
    } finally {
      setSubmittingQuote(false);
    }
  }, [token, session, quotePrice, quoteNotes, selectedFile, uploadFile, showSuccess, showError]);

  // Load session on mount
  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Check if quote is already submitted when session loads
  useEffect(() => {
    if (session?.quote) {
      const isSubmitted = session.quote.status === 'Submitted' && session.quote.cost > 0;
      setQuoteSubmitted(isSubmitted);
      if (isSubmitted) {
        setQuotePrice(session.quote.cost);
        setQuoteNotes(session.quote.notes_capacity || '');
      }
    }
  }, [session]);

  // Set up polling (every 8 seconds)
  useEffect(() => {
    if (session && !error) {
      pollingIntervalRef.current = setInterval(pollMessages, 8000);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [session, error, pollMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Format date helper
  const formatProjectDate = (dateString?: string): string => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-blue-500/30 text-blue-200 border-blue-400/50';
      case 'In Progress':
        return 'bg-yellow-500/30 text-yellow-200 border-yellow-400/50';
      case 'Quoting':
        return 'bg-purple-500/30 text-purple-200 border-purple-400/50';
      case 'Completed':
        return 'bg-green-500/30 text-green-200 border-green-400/50';
      case 'Cancelled':
        return 'bg-red-500/30 text-red-200 border-red-400/50';
      default:
        return 'bg-gray-500/30 text-gray-200 border-gray-400/50';
    }
  };

  // Error state
  if (error || (loading === false && !session)) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
        <div className="bg-white/5 border border-white/10 rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Link Expired or Invalid</h2>
            <p className="text-gray-300 mb-6">
              {error || 'The quote request link you\'re trying to access is no longer valid or has expired.'}
            </p>
            <p className="text-sm text-gray-400">
              Please contact the producer for a new quote request link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white">Loading quote request...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const { quote, asset, project } = session;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          Request for Quote: {asset.asset_name}
        </h1>
        {project && (
          <p className="text-gray-300 text-sm">
            {project.project_name} • {project.client_name}
          </p>
        )}
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Context */}
        <div className="lg:col-span-1 space-y-4">
          {/* Project Context */}
          {project && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Briefcase className="h-5 w-5 text-purple-300" />
                <h2 className="text-lg font-semibold text-white">Project Context</h2>
              </div>
              <div className="space-y-4 text-sm">
                {/* Project Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Project</label>
                  <p className="text-white">{project.project_name}</p>
                </div>

                {/* Client Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Client</label>
                  <p className="text-white">{project.client_name}</p>
                </div>

                {/* Project Description */}
                {project.brief_description && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Description</label>
                    <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{project.brief_description}</p>
                  </div>
                )}

                {/* Timeline/Deadline */}
                {project.timeline_deadline && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Deadline
                    </label>
                    <p className="text-white">{formatProjectDate(project.timeline_deadline)}</p>
                  </div>
                )}

                {/* Physical Parameters (may contain location/logistics) */}
                {project.physical_parameters && project.physical_parameters.trim() && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      Location & Logistics
                    </label>
                    <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{project.physical_parameters}</p>
                  </div>
                )}

                {/* Project Status */}
                {project.project_status && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(project.project_status)}`}>
                      {project.project_status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Asset Specifications */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="h-5 w-5 text-purple-300" />
              <h2 className="text-lg font-semibold text-white">Specifications</h2>
            </div>
            {asset.specifications ? (
              <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                {asset.specifications}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No specifications provided</p>
            )}
          </div>

          {/* Timeline */}
          {asset.timeline && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="h-5 w-5 text-purple-300" />
                <h2 className="text-lg font-semibold text-white">Timeline</h2>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-400">Deadline</p>
                  <p className="text-white font-medium">{formatDate(asset.timeline)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Quote Status */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Package className="h-5 w-5 text-purple-300" />
              <h2 className="text-lg font-semibold text-white">Quote Status</h2>
            </div>
            <div className="text-sm">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                quote.status === 'Submitted' ? 'bg-green-500/30 text-green-200 border border-green-400/50' :
                quote.status === 'Accepted' ? 'bg-blue-500/30 text-blue-200 border border-blue-400/50' :
                quote.status === 'Rejected' ? 'bg-red-500/30 text-red-200 border border-red-400/50' :
                'bg-gray-500/30 text-gray-200 border border-gray-400/50'
              }`}>
                {quote.status}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Conversation */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="bg-white/5 border border-white/10 rounded-xl flex flex-col h-[600px]">
            {/* Chat Header */}
            <div className="border-b border-white/10 p-4 bg-white/5 rounded-t-xl">
              <h2 className="text-lg font-semibold text-white">Conversation</h2>
              <p className="text-sm text-gray-400">Chat with the producer about this quote</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isSupplier = message.sender_type === 'SUPPLIER';
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isSupplier ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg p-3 ${
                          isSupplier
                            ? 'bg-purple-600 text-white'
                            : 'bg-white/10 text-gray-100 border border-white/20'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <User className="h-4 w-4" />
                          <span className="text-xs font-medium">
                            {isSupplier ? 'Me' : 'Producer'}
                          </span>
                          <span className={`text-xs ${isSupplier ? 'text-purple-100' : 'text-gray-400'}`}>
                            {formatTime(message.created_at)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-white/10 p-4 bg-white/5 rounded-b-xl">
              <div className="flex space-x-2">
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleMessageKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 resize-none bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={2}
                  disabled={sendingMessage}
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageInput.trim() || sendingMessage}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Submission Section */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 sticky bottom-0">
        {quoteSubmitted ? (
          // Success State
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/30 border border-green-400/50 mb-4">
              <CheckCircle className="h-8 w-8 text-green-300" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Quote Submitted Successfully!</h2>
            <p className="text-gray-300 mb-4">
              Thank you for your quote. The producer will review your submission and contact you if your quote is selected.
            </p>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-white mb-2">Your Quote Summary:</h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-300"><span className="font-medium text-white">Price:</span> {quoteCurrency} {quotePrice.toFixed(2)}</p>
                <p className="text-gray-300"><span className="font-medium text-white">Asset:</span> {asset.asset_name}</p>
                {quoteNotes && (
                  <p className="text-gray-300"><span className="font-medium text-white">Notes:</span> <span className="whitespace-pre-wrap">{quoteNotes}</span></p>
                )}
                {selectedFile && (
                  <p className="text-gray-300">
                    <span className="font-medium text-white">Document:</span>{' '}
                    <a
                      href={session?.quote.quote_document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-300 hover:text-purple-200 underline"
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
            <h2 className="text-xl font-bold text-white mb-4">Submit Your Quote</h2>
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
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-white/5 disabled:cursor-not-allowed"
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
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-white/5 disabled:cursor-not-allowed"
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
                  disabled={submittingQuote || uploadingFile || quoteSubmitted}
                  className="hidden"
                />
                <label
                  htmlFor="quote-file-upload"
                  className={`w-full border-2 border-dashed rounded-lg px-4 py-3 transition-colors flex items-center justify-center space-x-2 cursor-pointer ${
                    submittingQuote || uploadingFile || quoteSubmitted
                      ? 'border-white/10 text-gray-500 cursor-not-allowed'
                      : selectedFile
                      ? 'border-green-400/50 text-green-300 hover:border-green-400'
                      : 'border-white/20 text-gray-300 hover:border-purple-400/50 hover:text-purple-300'
                  }`}
                >
                  {uploadingFile ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400"></div>
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
                    {!quoteSubmitted && (
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="text-red-400 hover:text-red-300 underline"
                      >
                        Remove
                      </button>
                    )}
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
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-white/5 disabled:cursor-not-allowed"
              />
            </div>

            {/* Submit Button */}
            <div className="mt-6">
              <button
                type="button"
                onClick={handleSubmitQuote}
                disabled={submittingQuote || uploadingFile || quotePrice <= 0}
                className="w-full bg-purple-600 text-white rounded-lg px-6 py-3 font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2 disabled:bg-gray-600 disabled:cursor-not-allowed"
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
    </div>
  );
};

export default QuotePortal;


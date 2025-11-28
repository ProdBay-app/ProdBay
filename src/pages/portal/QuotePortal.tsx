import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Package, 
  Building2, 
  FileText, 
  Calendar, 
  DollarSign, 
  Send, 
  Upload,
  AlertCircle,
  Clock,
  User
} from 'lucide-react';
import { PortalService, type PortalSession, type Message } from '@/services/portalService';
import { useNotification } from '@/hooks/useNotification';

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

  // Load session on mount
  useEffect(() => {
    loadSession();
  }, [loadSession]);

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

  // Error state
  if (error || (loading === false && !session)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Expired or Invalid</h2>
            <p className="text-gray-600 mb-6">
              {error || 'The quote request link you\'re trying to access is no longer valid or has expired.'}
            </p>
            <p className="text-sm text-gray-500">
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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-white">Loading quote request...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const { quote, asset, project, supplier } = session;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Request for Quote: {asset.asset_name}
        </h1>
        <p className="text-gray-600">
          Project: {project.project_name} • Client: {project.client_name}
        </p>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Context */}
        <div className="lg:col-span-1 space-y-4">
          {/* Project Details */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Building2 className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Project Details</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Project Name</p>
                <p className="text-gray-900 font-medium">{project.project_name}</p>
              </div>
              <div>
                <p className="text-gray-500">Client</p>
                <p className="text-gray-900 font-medium">{project.client_name}</p>
              </div>
              {project.financial_parameters && (
                <div>
                  <p className="text-gray-500">Budget</p>
                  <p className="text-gray-900 font-medium">
                    ${project.financial_parameters.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Asset Specifications */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Specifications</h2>
            </div>
            {asset.specifications ? (
              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                {asset.specifications}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No specifications provided</p>
            )}
          </div>

          {/* Timeline */}
          {(asset.timeline || project.timeline_deadline) && (
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Timeline</h2>
              </div>
              <div className="space-y-2 text-sm">
                {asset.timeline && (
                  <div>
                    <p className="text-gray-500">Asset Deadline</p>
                    <p className="text-gray-900 font-medium">{formatDate(asset.timeline)}</p>
                  </div>
                )}
                {project.timeline_deadline && (
                  <div>
                    <p className="text-gray-500">Project Deadline</p>
                    <p className="text-gray-900 font-medium">{formatDate(project.timeline_deadline)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quote Status */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Package className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Quote Status</h2>
            </div>
            <div className="text-sm">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                quote.status === 'Submitted' ? 'bg-green-100 text-green-800' :
                quote.status === 'Accepted' ? 'bg-blue-100 text-blue-800' :
                quote.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {quote.status}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Conversation */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg flex flex-col h-[600px]">
            {/* Chat Header */}
            <div className="border-b border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900">Conversation</h2>
              <p className="text-sm text-gray-500">Chat with the producer about this quote</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
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
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <User className="h-4 w-4" />
                          <span className="text-xs font-medium">
                            {isSupplier ? 'Me' : 'Producer'}
                          </span>
                          <span className={`text-xs ${isSupplier ? 'text-blue-100' : 'text-gray-500'}`}>
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
            <div className="border-t border-gray-200 p-4">
              <div className="flex space-x-2">
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleMessageKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  disabled={sendingMessage}
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageInput.trim() || sendingMessage}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
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
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6 sticky bottom-0">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Submit Your Quote</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Price Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="h-4 w-4 inline mr-1" />
              Price
            </label>
            <div className="flex space-x-2">
              <select
                value={quoteCurrency}
                onChange={(e) => setQuoteCurrency(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
              </select>
              <input
                type="number"
                value={quotePrice || ''}
                onChange={(e) => setQuotePrice(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Upload className="h-4 w-4 inline mr-1" />
              Attach Quote Document (Optional)
            </label>
            <button
              type="button"
              className="w-full border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
            >
              <Upload className="h-5 w-5" />
              <span>Choose File</span>
            </button>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes (Optional)
          </label>
          <textarea
            value={quoteNotes}
            onChange={(e) => setQuoteNotes(e.target.value)}
            placeholder="Add any additional information about your quote..."
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Submit Button */}
        <div className="mt-6">
          <button
            type="button"
            className="w-full bg-blue-600 text-white rounded-lg px-6 py-3 font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            onClick={() => {
              // Placeholder - will be wired up in future PR
              showSuccess('Quote submission will be available soon');
            }}
          >
            <Package className="h-5 w-5" />
            <span>Submit Quote</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuotePortal;


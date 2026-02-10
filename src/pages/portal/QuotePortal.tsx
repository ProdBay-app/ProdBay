import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Package,
  FileText,
  Calendar,
  Send,
  AlertCircle,
  User,
  Briefcase,
  MapPin,
  Paperclip,
  X
} from 'lucide-react';
import { PortalService, type PortalSession, type Message, type Quote } from '@/services/portalService';
import { useNotification } from '@/hooks/useNotification';
import SupplierQuoteModal from '@/components/portal/SupplierQuoteModal';
import OriginalRequestCard from '@/components/portal/OriginalRequestCard';
import AttachmentSidePanel from '@/components/shared/AttachmentSidePanel';

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
  const [selectedFiles, setSelectedFiles] = useState<Array<{ file: File; key: string }>>([]);
  const [attachmentNotes, setAttachmentNotes] = useState<Record<string, string>>({});
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAttachmentPanelOpen, setIsAttachmentPanelOpen] = useState(false);

  // Modal state
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);

  // Polling interval ref
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (window.innerWidth >= 1024) {
      setIsAttachmentPanelOpen(true);
    }
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
        // Use the error message from the backend, which now provides more helpful context
        const errorMessage = response.error?.message || 'Failed to load portal session';
        setError(errorMessage);
        setLoading(false);
        return;
      }

      setSession(response.data);
      setMessages(response.data.messages || []);
      setError(null);
    } catch (err) {
      console.error('Error loading session:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
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

  const getFileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`;

  const buildAttachmentNotes = useCallback(() => {
    const noteLines = selectedFiles
      .map((fileItem) => {
        const note = attachmentNotes[fileItem.key]?.trim();
        if (!note) return null;
        return `- ${fileItem.file.name}: ${note}`;
      })
      .filter(Boolean);

    if (noteLines.length === 0) return '';
    return `Attachment notes:\n${noteLines.join('\n')}`;
  }, [attachmentNotes, selectedFiles]);

  const sendMessageWithPayload = useCallback(async (
    content: string,
    files: Array<{ file: File; key: string }>,
    options: {
      clearInput: boolean;
      clearFiles: boolean;
      focusInput: boolean;
    }
  ) => {
    if (!token || sendingMessage) return;

    const normalizedContent = content.trim();
    if (!normalizedContent && files.length === 0) return;

    // Optimistic UI: Add message immediately
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      quote_id: session?.quote.id || '',
      sender_type: 'SUPPLIER',
      content: normalizedContent,
      created_at: new Date().toISOString(),
      is_read: false
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setSendingMessage(true);
    scrollToBottom();

    try {
      const response = await PortalService.sendMessage(
        token,
        normalizedContent,
        files.map((item) => item.file)
      );

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

      if (options.clearInput) {
        setMessageInput('');
      }
      if (options.clearFiles) {
        setSelectedFiles([]);
        setAttachmentNotes({});
      }
      if (options.focusInput) {
        messageInputRef.current?.focus();
      }

      showSuccess('Message sent successfully');
    } catch (err) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      showError('Failed to send message');
    } finally {
      setSendingMessage(false);
      if (options.focusInput) {
        setTimeout(() => {
          messageInputRef.current?.focus();
        }, 0);
      }
    }
  }, [token, sendingMessage, session, scrollToBottom, showSuccess, showError]);

  // Send message
  const sendMessage = useCallback(async () => {
    const notesText = buildAttachmentNotes();
    const combinedContent = [messageInput.trim(), notesText].filter(Boolean).join('\n\n');
    await sendMessageWithPayload(combinedContent, selectedFiles, {
      clearInput: true,
      clearFiles: true,
      focusInput: true
    });
  }, [messageInput, selectedFiles, sendMessageWithPayload, buildAttachmentNotes]);

  const handlePanelUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    setSelectedFiles(prev => [
      ...prev,
      ...files.map((file) => ({
        file,
        key: getFileKey(file)
      }))
    ]);
  }, []);

  // Handle Enter key in message input
  const handleMessageKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileSelectClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    setSelectedFiles(prev => [
      ...prev,
      ...files.map((file) => ({
        file,
        key: getFileKey(file)
      }))
    ]);
    event.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    const fileKey = selectedFiles[index]?.key;
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setAttachmentNotes((prev) => {
      const next = { ...prev };
      if (fileKey) {
        delete next[fileKey];
      }
      return next;
    });
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

  // Handle quote submission from modal
  const handleQuoteSubmitted = useCallback((quote: Quote) => {
    // Update session with new quote data
    setSession(prev => prev ? {
      ...prev,
      quote
    } : null);
    // Close modal after successful submission
    setShowSubmitModal(false);
  }, []);

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

  // Error state
  if (error || (loading === false && !session)) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4">
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
      <div className="relative min-h-screen flex items-center justify-center">
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
    <div className="relative text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Request for Quote: {asset.asset_name}
            </h1>
            {project && (
              <p className="text-gray-300 text-sm">
                Project details
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsAttachmentPanelOpen(true)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:text-white hover:bg-white/20 transition-colors"
          >
            View Attachments
          </button>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Context */}
        <div className="lg:col-span-1 space-y-4">
          {/* Original Request */}
          <OriginalRequestCard
            emailBody={quote.request_email_body}
            attachments={quote.request_attachments}
          />

          {/* Project Context */}
          {project && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Briefcase className="h-5 w-5 text-purple-300" />
                <h2 className="text-lg font-semibold text-white">Project Context</h2>
              </div>
              <div className="space-y-4 text-sm">
                {/* Event Date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Event Date
                  </label>
                  <p className="text-white">{formatProjectDate(project.event_date || undefined)}</p>
                </div>

                {/* Timeline/Deadline */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Deadline
                  </label>
                  <p className="text-white">{formatProjectDate(project.timeline_deadline || undefined)}</p>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    Location
                  </label>
                  <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {project.location?.trim() ? project.location : 'Not specified'}
                  </p>
                </div>
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
                quote.status === 'Accepted' ? 'bg-blue-500/30 text-blue-200 border-blue-400/50' :
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
          <div className="flex flex-col lg:flex-row gap-6">
            <div className={`bg-white/5 border border-white/10 rounded-xl flex flex-col h-[600px] ${isAttachmentPanelOpen ? 'lg:flex-1' : 'w-full'}`}>
              {/* Chat Header */}
              <div className="border-b border-white/10 p-4 bg-white/5 rounded-t-xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Conversation</h2>
                    <p className="text-sm text-gray-400">Chat with the producer about this quote</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAttachmentPanelOpen(true)}
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                    aria-label="View attachments"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                </div>
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
                        id={`msg-${message.id}`}
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

                          {message.message_attachments && message.message_attachments.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-white/20 space-y-2">
                              {message.message_attachments.map((attachment) => {
                                const attachmentUrl = attachment.storage_url || attachment.public_url;
                                if (!attachmentUrl) return null;
                                return (
                                  <a
                                    key={attachment.id}
                                    href={attachmentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-xs text-white/90 hover:text-white hover:bg-white/10 rounded px-2 py-1"
                                  >
                                    <FileText className="h-3.5 w-3.5 text-white/70" />
                                    <span className="truncate">{attachment.filename}</span>
                                  </a>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t border-white/10 p-4 bg-white/5 rounded-b-xl">
                {selectedFiles.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {selectedFiles.map((fileItem, index) => {
                      const fileKey = fileItem.key;
                      return (
                        <div
                          key={fileKey}
                          className="bg-white/10 border border-white/20 rounded-md px-3 py-2 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-white/90 truncate">
                              <FileText className="h-3.5 w-3.5 text-white/70" />
                              <span className="truncate">{fileItem.file.name}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(index)}
                              className="text-white/70 hover:text-white"
                              aria-label="Remove file"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <textarea
                            value={attachmentNotes[fileKey] || ''}
                            onChange={(event) => {
                              const value = event.target.value;
                              setAttachmentNotes((prev) => ({
                                ...prev,
                                [fileKey]: value
                              }));
                            }}
                            placeholder="Add a note for this attachment..."
                            rows={2}
                            className="w-full resize-none rounded-md bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex space-x-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={handleFileSelectClick}
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                    disabled={sendingMessage}
                    aria-label="Attach files"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <textarea
                    ref={messageInputRef}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleMessageKeyDown}
                    placeholder="Type your message..."
                    className="flex-1 resize-none bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={2}
                    disabled={sendingMessage}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={(!messageInput.trim() && selectedFiles.length === 0) || sendingMessage}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    <Send className="h-4 w-4" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </div>
            {isAttachmentPanelOpen && (
              <div className="hidden lg:block w-96 h-[600px]">
                <AttachmentSidePanel
                  quoteId={session.quote.id}
                  isOpen={isAttachmentPanelOpen}
                  onClose={() => setIsAttachmentPanelOpen(false)}
                  onUploadFiles={handlePanelUpload}
                  uploadDisabled={sendingMessage}
                  variant="inline"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Quote Button */}
      {quote.status !== 'Submitted' && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setShowSubmitModal(true)}
            className="bg-purple-600 text-white rounded-lg px-8 py-3 font-semibold hover:bg-purple-700 transition-colors flex items-center space-x-2 shadow-lg"
          >
            <Package className="h-5 w-5" />
            <span>Submit Quote</span>
          </button>
        </div>
      )}

      {/* Quote Submission Modal */}
      <SupplierQuoteModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        session={session}
        token={token || ''}
        onQuoteSubmitted={handleQuoteSubmitted}
      />
      {session?.quote?.id && (
        <div className="lg:hidden">
          <AttachmentSidePanel
            quoteId={session.quote.id}
            isOpen={isAttachmentPanelOpen}
            onClose={() => setIsAttachmentPanelOpen(false)}
            onUploadFiles={handlePanelUpload}
            uploadDisabled={sendingMessage}
            variant="overlay"
          />
        </div>
      )}
      </div>
    </div>
  );
};

export default QuotePortal;

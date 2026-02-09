import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MessageCircle,
  Send,
  ChevronLeft,
  User,
  AlertCircle,
  Loader2,
  Paperclip,
  X,
  FileText
} from 'lucide-react';
import { QuoteService, type Message } from '@/services/quoteService';
import { useNotification } from '@/hooks/useNotification';
import { createInitialRequestMessage, isInitialRequestMessage } from '@/utils/quoteRequestMessage';
import MessageAttachments from '@/components/shared/MessageAttachments';
import AttachmentSidePanel from '@/components/shared/AttachmentSidePanel';

/**
 * ProducerQuoteChat Component
 * Producer-side chat interface for communicating with suppliers about quotes
 * Features:
 * - Chat interface with message history
 * - Real-time message polling
 * - Optimistic UI for message sending
 * - Back button to return to previous page
 */
const ProducerQuoteChat: React.FC = () => {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  // Session state
  const [quoteData, setQuoteData] = useState<{
    quote: any;
    asset: any;
    supplier: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Message state
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [attachmentNotes, setAttachmentNotes] = useState<Record<string, string>>({});
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAttachmentPanelOpen, setIsAttachmentPanelOpen] = useState(false);

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

  // Load quote data and messages
  const loadQuoteData = useCallback(async () => {
    if (!quoteId) {
      setError('Quote ID is missing');
      setLoading(false);
      return;
    }

    try {
      const response = await QuoteService.getQuoteMessages(quoteId);

      if (!response.success || !response.data) {
        setError(response.error?.message || 'Failed to load quote data');
        setLoading(false);
        return;
      }

      setQuoteData({
        quote: response.data.quote,
        asset: response.data.asset,
        supplier: response.data.supplier
      });

      // Prepend initial request message if it exists
      const initialRequest = createInitialRequestMessage(
        response.data.quote,
        response.data.quote.id
      );
      const allMessages = initialRequest
        ? [initialRequest, ...(response.data.messages || [])]
        : (response.data.messages || []);

      setMessages(allMessages);
      setError(null);
    } catch (err) {
      console.error('Error loading quote data:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [quoteId]);

  // Poll for new messages
  const pollMessages = useCallback(async () => {
    if (!quoteId || !quoteData) return;

    try {
      const response = await QuoteService.getQuoteMessages(quoteId);
      if (response.success && response.data) {
        // Prepend initial request message if it exists
        const initialRequest = createInitialRequestMessage(
          response.data.quote,
          response.data.quote.id
        );
        const newMessages = initialRequest
          ? [initialRequest, ...(response.data.messages || [])]
          : (response.data.messages || []);

        // Only update if messages have changed (avoid unnecessary re-renders)
        // Compare without the synthetic message ID (which includes timestamp)
        const currentMessagesWithoutSynthetic = messages.filter(m => !isInitialRequestMessage(m.id));
        const newMessagesWithoutSynthetic = newMessages.filter(m => !isInitialRequestMessage(m.id));

        if (JSON.stringify(newMessagesWithoutSynthetic) !== JSON.stringify(currentMessagesWithoutSynthetic)) {
          setMessages(newMessages);
        }
      }
    } catch (err) {
      console.error('Error polling messages:', err);
      // Don't show error for polling failures - just log
    }
  }, [quoteId, quoteData, messages]);

  const getFileKey = (file: File, index: number) => `${file.name}-${file.size}-${file.lastModified}-${index}`;

  const buildAttachmentNotes = useCallback(() => {
    const noteLines = selectedFiles
      .map((file, index) => {
        const note = attachmentNotes[getFileKey(file, index)]?.trim();
        if (!note) return null;
        return `- ${file.name}: ${note}`;
      })
      .filter(Boolean);

    if (noteLines.length === 0) return '';
    return `Attachment notes:\n${noteLines.join('\n')}`;
  }, [attachmentNotes, selectedFiles]);

  const sendMessageWithPayload = useCallback(async (
    content: string,
    files: File[],
    options: {
      clearInput: boolean;
      clearFiles: boolean;
      focusInput: boolean;
    }
  ) => {
    if (!quoteId || sendingMessage) return;

    const normalizedContent = content.trim();
    if (!normalizedContent && files.length === 0) return;

    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      quote_id: quoteId,
      sender_type: 'PRODUCER',
      content: normalizedContent,
      created_at: new Date().toISOString(),
      is_read: false
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setSendingMessage(true);
    scrollToBottom();

    try {
      const response = await QuoteService.sendProducerMessage(quoteId, normalizedContent, files);

      if (!response.success || !response.data) {
        setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
        showError(response.error?.message || 'Failed to send message');
        return;
      }

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
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      showError('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  }, [quoteId, sendingMessage, scrollToBottom, showSuccess, showError]);

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
    setSelectedFiles(prev => [...prev, ...files]);
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
    setSelectedFiles(prev => [...prev, ...files]);
    event.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    const fileKey = getFileKey(selectedFiles[index], index);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setAttachmentNotes((prev) => {
      const next = { ...prev };
      delete next[fileKey];
      return next;
    });
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };


  // Load data on mount
  useEffect(() => {
    loadQuoteData();
  }, [loadQuoteData]);

  // Set up polling (every 8 seconds)
  useEffect(() => {
    if (quoteData && !error) {
      pollingIntervalRef.current = setInterval(pollMessages, 8000);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [quoteData, error, pollMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  return (
    <div className="min-h-screen pt-20 pb-10 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Go back"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <div className="flex-1">
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                  <h1 className="text-2xl font-bold text-white">Loading chat...</h1>
                </div>
              ) : quoteData ? (
                <h1 className="text-2xl font-bold text-white">
                  Chat with {quoteData.supplier?.supplier_name || 'Supplier'} - {quoteData.asset?.asset_name || 'Quote'}
                </h1>
              ) : (
                <h1 className="text-2xl font-bold text-white">Chat</h1>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAttachmentPanelOpen(prev => !prev)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:text-white hover:bg-white/20 transition-colors"
          >
            View Attachments
          </button>
        </div>

        {/* Error state */}
        {error && !loading && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
              <div>
                <h3 className="text-red-400 font-semibold mb-1">Error loading chat</h3>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
            <p className="text-gray-300">Loading chat...</p>
          </div>
        )}

        {/* Chat Interface */}
        {!loading && !error && quoteData && (
          <div className="flex flex-col lg:flex-row gap-6 h-full">
            <div className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-lg flex flex-col h-[600px] shadow-lg flex-1 min-w-0 ${isAttachmentPanelOpen ? '' : 'w-full'}`}>
              {/* Chat Header */}
              <div className="border-b border-white/20 p-4 bg-white/5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-purple-300" />
                    <div>
                      <h2 className="text-lg font-semibold text-white">Conversation</h2>
                      <p className="text-sm text-gray-300">
                        {quoteData.supplier?.supplier_name || 'Supplier'} • {quoteData.asset?.asset_name || 'Quote'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAttachmentPanelOpen(prev => !prev)}
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
                    const isProducer = message.sender_type === 'PRODUCER';
                    const isInitialRequest = isInitialRequestMessage(message.id);

                    return (
                      <div
                        key={message.id}
                        id={`msg-${message.id}`}
                        className={`flex ${isProducer ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-lg p-3 ${
                            isInitialRequest
                              ? 'bg-purple-600/80 border-2 border-purple-400 text-white'
                              : isProducer
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 text-gray-100'
                          }`}
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            <User className="h-4 w-4" />
                            <span className="text-xs font-medium">
                              {isInitialRequest ? 'Original Request' : isProducer ? 'Me' : quoteData.supplier?.supplier_name || 'Supplier'}
                            </span>
                            <span className={`text-xs ${isProducer || isInitialRequest ? 'text-blue-100' : 'text-gray-400'}`}>
                              {formatTime(message.created_at)}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                          {/* Attachments (if present) */}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-white/20">
                              <MessageAttachments
                                attachments={message.attachments}
                                variant={isProducer || isInitialRequest ? 'light' : 'dark'}
                              />
                            </div>
                          )}

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
              <div className="border-t border-white/20 p-4 bg-white/5">
                {selectedFiles.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {selectedFiles.map((file, index) => {
                      const fileKey = getFileKey(file, index);
                      return (
                        <div
                          key={fileKey}
                          className="bg-white/10 border border-white/20 rounded-md px-3 py-2 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-white/90 truncate">
                              <FileText className="h-3.5 w-3.5 text-white/70" />
                              <span className="truncate">{file.name}</span>
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
                    className="flex-1 resize-none bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={2}
                    disabled={sendingMessage}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={(!messageInput.trim() && selectedFiles.length === 0) || sendingMessage}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {sendingMessage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </div>
            {isAttachmentPanelOpen && (
              <div className="hidden lg:block w-96 h-[600px] shrink-0">
                <AttachmentSidePanel
                  quoteId={quoteId}
                  isOpen={isAttachmentPanelOpen}
                  onClose={() => setIsAttachmentPanelOpen(false)}
                  onUploadFiles={handlePanelUpload}
                  uploadDisabled={sendingMessage}
                  variant="inline"
                />
              </div>
            )}
          </div>
        )}
      </div>
      {quoteId && (
        <div className="lg:hidden">
          <AttachmentSidePanel
            quoteId={quoteId}
            isOpen={isAttachmentPanelOpen}
            onClose={() => setIsAttachmentPanelOpen(false)}
            onUploadFiles={handlePanelUpload}
            uploadDisabled={sendingMessage}
            variant="overlay"
          />
        </div>
      )}
    </div>
  );
};

export default ProducerQuoteChat;

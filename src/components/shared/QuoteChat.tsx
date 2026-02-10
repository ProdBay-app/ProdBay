import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Send, User, Loader2, Paperclip, X, FileText } from 'lucide-react';
import { QuoteService, type Message } from '@/services/quoteService';
import { useNotification } from '@/hooks/useNotification';
import { createInitialRequestMessage, isInitialRequestMessage } from '@/utils/quoteRequestMessage';
import MessageAttachments from './MessageAttachments';

interface QuoteChatProps {
  quoteId: string;
  supplierName: string;
  assetName: string;
  onMessageSent?: () => void;
  externalSelectedFiles?: Array<{ file: File; key: string }>;
  onSelectedFilesChange?: (files: Array<{ file: File; key: string }>) => void;
  externalAttachmentNotes?: Record<string, string>;
  onAttachmentNotesChange?: (notes: Record<string, string>) => void;
}

/**
 * QuoteChat - Reusable chat interface component
 * 
 * Features:
 * - Chat interface with message history
 * - Real-time message polling (every 8 seconds)
 * - Optimistic UI for message sending
 * - Auto-scroll to bottom
 * - Loading and error states
 */
const QuoteChat: React.FC<QuoteChatProps> = ({
  quoteId,
  supplierName,
  assetName,
  onMessageSent,
  externalSelectedFiles,
  onSelectedFilesChange,
  externalAttachmentNotes,
  onAttachmentNotesChange
}) => {
  const { showSuccess, showError } = useNotification();

  // Message state
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [localSelectedFiles, setLocalSelectedFiles] = useState<Array<{ file: File; key: string }>>([]);
  const [localAttachmentNotes, setLocalAttachmentNotes] = useState<Record<string, string>>({});
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedFiles = externalSelectedFiles ?? localSelectedFiles;
  const attachmentNotes = externalAttachmentNotes ?? localAttachmentNotes;

  const updateSelectedFiles = useCallback((
    updater:
      | Array<{ file: File; key: string }>
      | ((prev: Array<{ file: File; key: string }>) => Array<{ file: File; key: string }>)
  ) => {
    const next = typeof updater === 'function' ? updater(selectedFiles) : updater;
    if (onSelectedFilesChange) {
      onSelectedFilesChange(next);
    } else {
      setLocalSelectedFiles(next);
    }
  }, [onSelectedFilesChange, selectedFiles]);

  const updateAttachmentNotes = useCallback((updater: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => {
    const next = typeof updater === 'function' ? updater(attachmentNotes) : updater;
    if (onAttachmentNotesChange) {
      onAttachmentNotesChange(next);
    } else {
      setLocalAttachmentNotes(next);
    }
  }, [attachmentNotes, onAttachmentNotesChange]);

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

  // Polling interval ref
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!quoteId) {
      setError('Quote ID is missing');
      setLoading(false);
      return;
    }

    try {
      const response = await QuoteService.getQuoteMessages(quoteId);
      
      if (!response.success || !response.data) {
        setError(response.error?.message || 'Failed to load messages');
        setLoading(false);
        return;
      }

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
      console.error('Error loading messages:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [quoteId]);

  // Poll for new messages
  const pollMessages = useCallback(async () => {
    if (!quoteId) return;

    try {
      const response = await QuoteService.getQuoteMessages(quoteId);
      if (response.success && response.data) {
        // Prepend initial request message if it exists (same as loadMessages)
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
  }, [quoteId, messages]);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!quoteId || sendingMessage) return;
    if (!messageInput.trim() && selectedFiles.length === 0) return;

    const notesText = buildAttachmentNotes();
    const content = [messageInput.trim(), notesText].filter(Boolean).join('\n\n');

    // Optimistic UI: Add message immediately
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      quote_id: quoteId,
      sender_type: 'PRODUCER',
      content,
      created_at: new Date().toISOString(),
      is_read: false
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setSendingMessage(true);
    scrollToBottom();

    try {
      const response = await QuoteService.sendProducerMessage(
        quoteId,
        content,
        selectedFiles.map((item) => item.file)
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
      
      setMessageInput('');
      updateSelectedFiles([]);
      updateAttachmentNotes({});
      messageInputRef.current?.focus();
      showSuccess('Message sent successfully');
      onMessageSent?.();
    } catch (err) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      showError('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  }, [quoteId, messageInput, selectedFiles, sendingMessage, scrollToBottom, showSuccess, showError, onMessageSent, buildAttachmentNotes, updateAttachmentNotes, updateSelectedFiles]);

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
    updateSelectedFiles(prev => [
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
    updateSelectedFiles(prev => prev.filter((_, i) => i !== index));
    updateAttachmentNotes((prev) => {
      const next = { ...prev };
      if (fileKey) {
        delete next[fileKey];
      }
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

  // Load messages on mount
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Set up polling (every 8 seconds)
  useEffect(() => {
    if (!loading && !error) {
      pollingIntervalRef.current = setInterval(pollMessages, 8000);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [loading, error, pollMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg flex flex-col h-full min-h-0 shadow-lg">
      {/* Chat Header */}
      <div className="border-b border-white/20 p-4 bg-white/5">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-5 h-5 text-purple-300" />
          <div>
            <h2 className="text-lg font-semibold text-white">Conversation</h2>
            <p className="text-sm text-gray-300">
              {supplierName} • {assetName}
            </p>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            <p className="text-gray-300 text-sm">Loading messages...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 w-full">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Messages */}
      {!loading && !error && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
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
                        {isInitialRequest ? 'Original Request' : isProducer ? 'Me' : supplierName}
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
      )}

      {/* Message Input */}
      <div className="border-t border-white/20 p-4 bg-white/5">
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
                      updateAttachmentNotes((prev) => ({
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
            disabled={sendingMessage || loading}
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
            disabled={sendingMessage || loading}
          />
          <button
            onClick={sendMessage}
            disabled={(!messageInput.trim() && selectedFiles.length === 0) || sendingMessage || loading}
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
  );
};

export default QuoteChat;


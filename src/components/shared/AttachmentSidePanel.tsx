import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronDown, ChevronRight, FileText, Paperclip, X } from 'lucide-react';
import { QuoteService, type MessageAttachment } from '@/services/quoteService';
import { PortalService } from '@/services/portalService';

interface AttachmentSidePanelProps {
  quoteId: string;
  isOpen: boolean;
  onClose: () => void;
  onUploadFiles?: (files: File[]) => void;
  uploadDisabled?: boolean;
  variant?: 'overlay' | 'inline';
}

const AttachmentSidePanel: React.FC<AttachmentSidePanelProps> = ({
  quoteId,
  isOpen,
  onClose,
  onUploadFiles,
  uploadDisabled = false,
  variant = 'overlay'
}) => {
  const { token } = useParams<{ token?: string }>();
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProducer, setShowProducer] = useState(true);
  const [showSupplier, setShowSupplier] = useState(true);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const sortedAttachments = useMemo(() => {
    return [...attachments].sort((a, b) => {
      const aTime = Date.parse(a.created_at);
      const bTime = Date.parse(b.created_at);
      if (Number.isNaN(aTime) || Number.isNaN(bTime)) return 0;
      return bTime - aTime;
    });
  }, [attachments]);

  const producerAttachments = useMemo(
    () => sortedAttachments.filter((attachment) => attachment.sender_type === 'PRODUCER'),
    [sortedAttachments]
  );

  const supplierAttachments = useMemo(
    () => sortedAttachments.filter((attachment) => attachment.sender_type === 'SUPPLIER'),
    [sortedAttachments]
  );

  const fetchAttachments = useCallback(async (showLoading = true) => {
    if (!quoteId || !isOpen) return;

    if (showLoading) {
      setLoading(true);
    }
    setError(null);

    const response = token
      ? await PortalService.getMessageAttachments(token)
      : await QuoteService.getMessageAttachments(quoteId);

    if (!response.success || !response.data) {
      setError(response.error?.message || 'Failed to load attachments');
      setAttachments([]);
      setLoading(false);
      return;
    }

    setAttachments(response.data);
    if (showLoading) {
      setLoading(false);
    }
  }, [quoteId, isOpen, token]);

  useEffect(() => {
    if (!isOpen) return;
    fetchAttachments(true);
    pollingRef.current = setInterval(() => {
      fetchAttachments(false);
    }, 8000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [fetchAttachments, isOpen]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const handleJumpToMessage = (messageId: string) => {
    const messageElement = document.getElementById(`msg-${messageId}`);
    if (!messageElement) return;

    messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    messageElement.classList.add(
      'ring-2',
      'ring-purple-400',
      'ring-offset-2',
      'ring-offset-transparent',
      'animate-pulse'
    );

    window.setTimeout(() => {
      messageElement.classList.remove(
        'ring-2',
        'ring-purple-400',
        'ring-offset-2',
        'ring-offset-transparent',
        'animate-pulse'
      );
    }, 1500);

    onClose();
  };

  const handleUploadClick = () => {
    if (uploadDisabled) return;
    uploadInputRef.current?.click();
  };

  const handleUploadChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    onUploadFiles?.(files);
    event.target.value = '';
  };

  if (!isOpen) return null;

  const panelContent = (
    <>
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <h3 className="text-white font-semibold text-lg">Attachments</h3>
        <div className="flex items-center gap-2">
          <input
            ref={uploadInputRef}
            type="file"
            multiple
            onChange={handleUploadChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleUploadClick}
            className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
            disabled={uploadDisabled || !onUploadFiles}
          >
            <span className="flex items-center gap-2 text-sm">
              <Paperclip className="h-4 w-4" />
              Upload New
            </span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white"
            aria-label="Close attachments panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="h-full overflow-y-auto p-4 space-y-4 pb-24">
          {loading && (
            <p className="text-sm text-gray-400">Loading attachments...</p>
          )}

          {error && !loading && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {!loading && !error && attachments.length === 0 && (
            <p className="text-sm text-gray-400">No attachments yet.</p>
          )}

          {!loading && !error && (
            <>
              <div className="border border-white/10 rounded-lg">
                <button
                  type="button"
                  onClick={() => setShowProducer((prev) => !prev)}
                  className="w-full flex items-center justify-between px-4 py-3 text-white/90"
                >
                  <span className="text-sm font-semibold">Producer Uploads</span>
                  {showProducer ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {showProducer && (
                  <div className="px-4 pb-3 space-y-3">
                    {producerAttachments.length === 0 ? (
                      <p className="text-xs text-gray-400">No producer attachments.</p>
                    ) : (
                      producerAttachments.map((attachment) => {
                        const attachmentUrl = attachment.storage_url || attachment.public_url;
                        return (
                          <div
                            key={attachment.id}
                            className="bg-white/5 border border-white/10 rounded-md p-3 space-y-2"
                          >
                            <div className="flex items-center gap-2 text-xs text-white/90">
                              <FileText className="h-3.5 w-3.5 text-white/70" />
                              {attachmentUrl ? (
                                <a
                                  href={attachmentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="truncate hover:text-white"
                                >
                                  {attachment.filename}
                                </a>
                              ) : (
                                <span className="truncate">{attachment.filename}</span>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-gray-400">
                              <span>Uploaded {formatDate(attachment.created_at)}</span>
                              <button
                                type="button"
                                onClick={() => handleJumpToMessage(attachment.message_id)}
                                className="text-purple-300 hover:text-purple-200"
                              >
                                Jump to Message
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              <div className="border border-white/10 rounded-lg">
                <button
                  type="button"
                  onClick={() => setShowSupplier((prev) => !prev)}
                  className="w-full flex items-center justify-between px-4 py-3 text-white/90"
                >
                  <span className="text-sm font-semibold">Supplier Uploads</span>
                  {showSupplier ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {showSupplier && (
                  <div className="px-4 pb-3 space-y-3">
                    {supplierAttachments.length === 0 ? (
                      <p className="text-xs text-gray-400">No supplier attachments.</p>
                    ) : (
                      supplierAttachments.map((attachment) => {
                        const attachmentUrl = attachment.storage_url || attachment.public_url;
                        return (
                          <div
                            key={attachment.id}
                            className="bg-white/5 border border-white/10 rounded-md p-3 space-y-2"
                          >
                            <div className="flex items-center gap-2 text-xs text-white/90">
                              <FileText className="h-3.5 w-3.5 text-white/70" />
                              {attachmentUrl ? (
                                <a
                                  href={attachmentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="truncate hover:text-white"
                                >
                                  {attachment.filename}
                                </a>
                              ) : (
                                <span className="truncate">{attachment.filename}</span>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-gray-400">
                              <span>Uploaded {formatDate(attachment.created_at)}</span>
                              <button
                                type="button"
                                onClick={() => handleJumpToMessage(attachment.message_id)}
                                className="text-purple-300 hover:text-purple-200"
                              >
                                Jump to Message
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </>
          )}
      </div>
    </>
  );

  if (variant === 'inline') {
    return (
      <div className="h-full w-full bg-slate-900/95 border border-white/10 rounded-xl shadow-lg flex flex-col">
        {panelContent}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end lg:pointer-events-none">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 lg:hidden"
        onClick={onClose}
        aria-label="Close attachments panel"
      />
      <div className="relative h-full w-full max-w-md bg-slate-900/95 border-l border-white/10 shadow-xl lg:pointer-events-auto">
        {panelContent}
      </div>
    </div>
  );
};

export default AttachmentSidePanel;

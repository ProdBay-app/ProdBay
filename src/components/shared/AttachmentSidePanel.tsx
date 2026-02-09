import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronDown, ChevronRight, FileText, X } from 'lucide-react';
import { QuoteService, type MessageAttachment } from '@/services/quoteService';
import { PortalService } from '@/services/portalService';

interface AttachmentSidePanelProps {
  quoteId: string;
  isOpen: boolean;
  onClose: () => void;
}

const AttachmentSidePanel: React.FC<AttachmentSidePanelProps> = ({
  quoteId,
  isOpen,
  onClose
}) => {
  const { token } = useParams<{ token?: string }>();
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProducer, setShowProducer] = useState(true);
  const [showSupplier, setShowSupplier] = useState(true);

  const producerAttachments = useMemo(
    () => attachments.filter((attachment) => attachment.sender_type === 'PRODUCER'),
    [attachments]
  );

  const supplierAttachments = useMemo(
    () => attachments.filter((attachment) => attachment.sender_type === 'SUPPLIER'),
    [attachments]
  );

  const fetchAttachments = useCallback(async () => {
    if (!quoteId || !isOpen) return;

    setLoading(true);
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
    setLoading(false);
  }, [quoteId, isOpen, token]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Close attachments panel"
      />
      <div className="relative h-full w-full max-w-md bg-slate-900/95 border-l border-white/10 shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="text-white font-semibold text-lg">Attachments</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white"
            aria-label="Close attachments panel"
          >
            <X className="h-5 w-5" />
          </button>
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
                              <span>{formatDate(attachment.created_at)}</span>
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
                              <span>{formatDate(attachment.created_at)}</span>
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
      </div>
    </div>
  );
};

export default AttachmentSidePanel;

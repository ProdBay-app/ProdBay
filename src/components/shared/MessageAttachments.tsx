import React from 'react';
import { FileText, Download } from 'lucide-react';
import type { QuoteRequestAttachment } from '@/services/quoteService';

interface MessageAttachmentsProps {
  attachments: QuoteRequestAttachment[];
  variant?: 'light' | 'dark';
}

/**
 * MessageAttachments - Renders clickable attachment links in chat messages
 * Used for displaying attachments in the "Original Request" message
 */
const MessageAttachments: React.FC<MessageAttachmentsProps> = ({
  attachments,
  variant = 'light'
}) => {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  // Format file size helper
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = bytes / Math.pow(k, i);
    return `${size.toFixed(i === 0 ? 0 : 2)} ${sizes[i]}`;
  };

  // Styling based on variant (light for producer messages, dark for supplier messages)
  const linkClass = variant === 'light'
    ? 'text-white/90 hover:text-white hover:bg-white/20'
    : 'text-gray-200 hover:text-white hover:bg-white/10';

  const iconClass = variant === 'light'
    ? 'text-white/70'
    : 'text-gray-400';

  const sizeClass = variant === 'light'
    ? 'text-white/60'
    : 'text-gray-500';

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <a
          key={attachment.id}
          href={attachment.storage_url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2 px-2 py-1.5 rounded transition-colors ${linkClass}`}
        >
          <FileText className={`h-3.5 w-3.5 flex-shrink-0 ${iconClass}`} />
          <span className="text-xs font-medium truncate flex-1 min-w-0">
            {attachment.filename}
          </span>
          <span className={`text-xs ${sizeClass} flex-shrink-0`}>
            {formatFileSize(attachment.file_size_bytes)}
          </span>
          <Download className={`h-3 w-3 flex-shrink-0 ${iconClass}`} />
        </a>
      ))}
    </div>
  );
};

export default MessageAttachments;


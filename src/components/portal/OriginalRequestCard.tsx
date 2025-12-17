import React from 'react';
import { FileText, Download, Paperclip } from 'lucide-react';
import type { QuoteRequestAttachment } from '@/services/portalService';

interface OriginalRequestCardProps {
  emailBody?: string;
  attachments?: QuoteRequestAttachment[];
}

/**
 * OriginalRequestCard - Displays the original quote request email body and attachments
 * Used in Supplier Portal to show what was originally requested
 */
const OriginalRequestCard: React.FC<OriginalRequestCardProps> = ({
  emailBody,
  attachments
}) => {
  // Don't render if no data
  if (!emailBody && (!attachments || attachments.length === 0)) {
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

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center space-x-2 mb-4">
        <FileText className="h-5 w-5 text-purple-300" />
        <h3 className="text-lg font-semibold text-white">Original Request</h3>
      </div>

      {/* Email Body */}
      {emailBody && (
        <div className="mb-4">
          <div className="bg-black/20 rounded-lg p-4 border border-white/10">
            <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
              {emailBody}
            </p>
          </div>
        </div>
      )}

      {/* Attachments */}
      {attachments && attachments.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Paperclip className="h-4 w-4 text-gray-400" />
            <h4 className="text-sm font-medium text-gray-300">
              Attachments ({attachments.length})
            </h4>
          </div>
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={attachment.storage_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between bg-black/20 hover:bg-black/30 border border-white/10 rounded-lg p-3 transition-colors group"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <FileText className="h-4 w-4 text-purple-300 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate group-hover:text-purple-200 transition-colors">
                      {attachment.filename}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatFileSize(attachment.file_size_bytes)} • {attachment.content_type}
                    </p>
                  </div>
                </div>
                <Download className="h-4 w-4 text-gray-400 group-hover:text-purple-300 transition-colors flex-shrink-0 ml-2" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OriginalRequestCard;


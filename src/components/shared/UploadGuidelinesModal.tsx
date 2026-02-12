import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { useEscapeKey } from '@/hooks/useEscapeKey';

const STORAGE_KEY = 'upload-guidelines-collapsed';

interface UploadGuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFile: () => void;
}

const doItems = [
  {
    title: 'Use Bullet Points',
    description:
      'Lists allow the system to instantly identify distinct requirements and deliverables.',
  },
  {
    title: 'Standard Headings',
    description:
      'Label sections clearly (e.g., "Budget", "Timeline") to ensure accurate sorting.',
  },
  {
    title: 'Digital Text',
    description:
      'Upload original files with selectable text for 100% extraction accuracy.',
  },
];

const avoidItems = [
  {
    title: 'Dense Paragraphs',
    description:
      'Long blocks of text make it difficult to isolate specific constraints or goals.',
  },
  {
    title: 'Hidden Details',
    description:
      'Avoid burying crucial numbers or dates inside unrelated sentences.',
  },
  {
    title: 'Scanned Images',
    description:
      'Photocopies or photos of paper documents may result in missing data.',
  },
];

/**
 * UploadGuidelinesModal - Interstitial modal shown before file upload
 *
 * Displays formatting tips in a two-column DO / AVOID layout to help users
 * prepare briefs that the analysis engine can process accurately.
 *
 * Features:
 * - Collapsible tips with localStorage preference caching
 * - Bottom-sheet style (anchored to bottom half of viewport)
 * - Responsive (stacks columns on mobile)
 * - Accessible with escape-key close and backdrop click
 */
const UploadGuidelinesModal: React.FC<UploadGuidelinesModalProps> = ({
  isOpen,
  onClose,
  onSelectFile,
}) => {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEscapeKey(isOpen, onClose);

  // Persist the user's collapse preference
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      // localStorage unavailable — silently ignore
    }
  }, [collapsed]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSelectFile = () => {
    onClose();
    onSelectFile();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-40"
      onClick={handleBackdropClick}
    >
      {/* Bottom-sheet container */}
      <div className="bg-white w-full max-w-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[85vh] animate-slide-up">
        {/* ── Header ── */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Maximize system accuracy
              </h2>
              <p className="mt-1 text-sm text-gray-500 leading-relaxed max-w-md">
                Format your brief as follows to ensure the analysis engine
                captures every requirement correctly.
              </p>
            </div>

            {/* Collapse / expand toggle */}
            <button
              type="button"
              onClick={toggleCollapsed}
              className="ml-4 mt-1 flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-800 transition-colors shrink-0"
              aria-label={collapsed ? 'Expand tips' : 'Collapse tips'}
            >
              {collapsed ? (
                <>
                  Show tips <ChevronDown className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  Hide tips <ChevronUp className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Body — collapsible ── */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            collapsed ? 'max-h-0 opacity-0' : 'max-h-[60vh] opacity-100'
          }`}
        >
          <div className="px-6 py-5 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* ── DO THIS column ── */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wide">
                    Do this
                  </h3>
                </div>
                <ul className="space-y-3">
                  {doItems.map((item) => (
                    <li key={item.title} className="flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-700 leading-relaxed mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ── AVOID THIS column ── */}
              <div className="rounded-xl border border-red-200 bg-red-50/60 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <h3 className="text-sm font-bold text-red-600 uppercase tracking-wide">
                    Avoid this
                  </h3>
                </div>
                <ul className="space-y-3">
                  {avoidItems.map((item) => (
                    <li key={item.title} className="flex items-start gap-2.5">
                      <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-gray-500">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-400 leading-relaxed mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSelectFile}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 shadow-sm transition-colors"
          >
            <Upload className="w-4 h-4" />
            Select File
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default UploadGuidelinesModal;

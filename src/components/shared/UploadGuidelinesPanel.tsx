import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';

const STORAGE_KEY = 'upload-guidelines-collapsed';

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
 * UploadGuidelinesPanel - Collapsible inline tips panel for brief uploads
 *
 * Displays formatting guidance in a two-column DO / AVOID layout directly
 * above the upload dropzone. Collapse preference is cached in localStorage.
 */
const UploadGuidelinesPanel: React.FC = () => {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      // localStorage unavailable — silently ignore
    }
  }, [collapsed]);

  const toggle = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  return (
    <div className="rounded-lg border border-white/15 bg-white/5 mb-4 overflow-hidden">
      {/* Toggle header */}
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-sm font-medium text-gray-200 truncate">
            Maximize system accuracy
          </span>
        </div>
        {collapsed ? (
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
        )}
      </button>

      {/* Collapsible body */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          collapsed
            ? 'max-h-0 opacity-0 pointer-events-none'
            : 'max-h-[600px] opacity-100'
        }`}
      >
        <div className="px-4 pb-4">
          {/* Subtext */}
          <p className="text-xs text-gray-400 mb-3 leading-relaxed">
            Format your brief as follows to ensure the analysis engine captures
            every requirement correctly.
          </p>

          {/* Two-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* ── DO THIS ── */}
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
              <div className="flex items-center gap-1.5 mb-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                  Do this
                </h4>
              </div>
              <ul className="space-y-2">
                {doItems.map((item) => (
                  <li key={item.title} className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500/80 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-gray-100">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-gray-300 leading-relaxed mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── AVOID THIS ── */}
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
              <div className="flex items-center gap-1.5 mb-2.5">
                <XCircle className="w-4 h-4 text-red-400" />
                <h4 className="text-xs font-bold text-red-400 uppercase tracking-wide">
                  Avoid this
                </h4>
              </div>
              <ul className="space-y-2">
                {avoidItems.map((item) => (
                  <li key={item.title} className="flex items-start gap-2">
                    <XCircle className="w-3.5 h-3.5 text-red-500/70 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-gray-400">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
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
    </div>
  );
};

export default UploadGuidelinesPanel;

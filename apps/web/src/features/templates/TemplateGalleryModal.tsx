import { ArrowRight, BookOpen, Check, Sparkles, X } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { useDocumentStore } from '../../stores/documentStore';
import { STARTER_TEMPLATES, type ZineTemplate } from './templates';

interface TemplateGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TemplateGalleryModal: React.FC<TemplateGalleryModalProps> = ({ isOpen, onClose }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ZineTemplate | null>(
    STARTER_TEMPLATES[0],
  );

  const loadDocument = useDocumentStore((s) => s.loadDocument);
  const applyLook = useDocumentStore((s) => s.applyLook);
  const setActivePageIndex = useDocumentStore((s) => s.setActivePageIndex);

  if (!isOpen) return null;

  const handleApplyTemplate = (template: ZineTemplate) => {
    // Load pages and format parameters into document
    loadDocument({
      title: template.name,
      formatId: template.formatId,
      paper: template.paper,
      pages: JSON.parse(JSON.stringify(template.pages)),
      activeLookId: template.activeLookId,
    });

    // Apply signature look styling
    if (template.activeLookId) {
      applyLook(template.activeLookId);
    }

    setActivePageIndex(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b-2 border-black dark:border-white p-4 bg-amber-200 dark:bg-amber-950/40">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-black dark:text-white" />
            <h2 className="font-mono text-xl font-bold uppercase tracking-wider text-black dark:text-white">
              Starter Template Gallery
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-black/10 dark:hover:bg-white/10 border-2 border-transparent hover:border-black dark:hover:border-white transition-colors"
          >
            <X className="w-5 h-5 text-black dark:text-white" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {STARTER_TEMPLATES.map((tmpl) => {
            const isSelected = selectedTemplate?.id === tmpl.id;
            return (
              // biome-ignore lint/a11y/noStaticElementInteractions: template card selection
              // biome-ignore lint/a11y/useKeyWithClickEvents: template card selection
              <div
                key={tmpl.id}
                onClick={() => setSelectedTemplate(tmpl)}
                className={`flex flex-col border-2 border-black dark:border-white cursor-pointer transition-all ${
                  isSelected
                    ? 'ring-4 ring-black dark:ring-white bg-amber-50 dark:bg-zinc-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60 bg-white dark:bg-zinc-900'
                }`}
              >
                {/* Mini Preview Box */}
                <div
                  className="h-44 border-b-2 border-black dark:border-white p-4 flex flex-col justify-between relative overflow-hidden"
                  style={{ backgroundColor: tmpl.coverBg }}
                >
                  <div className="flex justify-between items-start z-10">
                    <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 border border-black bg-white/90 text-black">
                      {tmpl.formatId}
                    </span>
                    {isSelected && (
                      <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <div className="z-10">
                    <p className="font-mono text-base font-black leading-tight text-black line-clamp-2 uppercase">
                      {tmpl.name}
                    </p>
                    <p className="font-mono text-[11px] text-zinc-700 font-semibold mt-1 line-clamp-2">
                      {tmpl.tagline}
                    </p>
                  </div>

                  {/* Decorative background grid pattern */}
                  <div
                    className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{
                      backgroundImage: 'radial-gradient(circle, #000 1.5px, transparent 1.5px)',
                      backgroundSize: '12px 12px',
                    }}
                  />
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                      {tmpl.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {tmpl.tags.map((t) => (
                        <span
                          key={t}
                          className="font-mono text-[9px] font-bold px-1.5 py-0.5 border border-zinc-400 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApplyTemplate(tmpl);
                    }}
                    className="mt-4 w-full py-2 px-3 border-2 border-black dark:border-white font-mono text-xs font-bold uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black hover:opacity-90 flex items-center justify-center gap-2"
                  >
                    <span>Use Template</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="border-t-2 border-black dark:border-white p-4 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs text-zinc-600 dark:text-zinc-400">
            <BookOpen className="w-4 h-4" />
            <span>Templates replace current draft canvas objects & page layouts.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 border-2 border-black dark:border-white font-mono text-xs font-bold uppercase tracking-wider bg-white dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

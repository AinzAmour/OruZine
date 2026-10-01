import type { Margins, PaperSize } from '@oruzine/formats';
import { Check, X } from 'lucide-react';
import type React from 'react';
import { useDocumentStore } from '../../stores/documentStore';

interface FormatSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FormatSetupModal: React.FC<FormatSetupModalProps> = ({ isOpen, onClose }) => {
  const { paper, setPaper, margins, setMargins, bleedMm, setBleedMm, rtl, setRtl } =
    useDocumentStore();

  if (!isOpen) return null;

  const handleMarginPreset = (preset: 'standard' | 'narrow' | 'none') => {
    let m: Margins = { top: 5, right: 5, bottom: 5, left: 5 };
    if (preset === 'narrow') m = { top: 3, right: 3, bottom: 3, left: 3 };
    if (preset === 'none') m = { top: 0, right: 0, bottom: 0, left: 0 };
    setMargins(m);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 select-none">
      <div className="bg-paper xerox-border w-full max-w-md p-6 flex flex-col gap-6 text-ink font-mono animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-chrome-border pb-3">
          <h2 className="text-base font-bold tracking-tight">8-PAGE MINI ZINE SETUP</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-chrome border border-chrome-border"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-4 text-xs">
          {/* Paper Size */}
          <div className="flex flex-col gap-1.5">
            <span className="font-bold text-ink/70 uppercase">Paper Size</span>
            <div className="grid grid-cols-3 gap-2">
              {(['letter', 'a4', 'a3'] as PaperSize[]).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPaper(p)}
                  className={`p-2 border uppercase font-bold transition-colors ${
                    paper === p
                      ? 'border-spot bg-spot/10 text-spot'
                      : 'border-chrome-border hover:bg-chrome'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Margins */}
          <div className="flex flex-col gap-1.5">
            <span className="font-bold text-ink/70 uppercase">Print Margins</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleMarginPreset('standard')}
                className={`p-2 border font-bold transition-colors ${
                  margins.top === 5
                    ? 'border-spot bg-spot/10 text-spot'
                    : 'border-chrome-border hover:bg-chrome'
                }`}
              >
                Standard (5mm)
              </button>
              <button
                type="button"
                onClick={() => handleMarginPreset('narrow')}
                className={`p-2 border font-bold transition-colors ${
                  margins.top === 3
                    ? 'border-spot bg-spot/10 text-spot'
                    : 'border-chrome-border hover:bg-chrome'
                }`}
              >
                Narrow (3mm)
              </button>
              <button
                type="button"
                onClick={() => handleMarginPreset('none')}
                className={`p-2 border font-bold transition-colors ${
                  margins.top === 0
                    ? 'border-spot bg-spot/10 text-spot'
                    : 'border-chrome-border hover:bg-chrome'
                }`}
              >
                Borderles (0mm)
              </button>
            </div>
          </div>

          {/* Bleed Toggle */}
          <div className="flex items-center justify-between border-t border-chrome-border pt-3">
            <div>
              <span className="font-bold block">Page Bleed Area</span>
              <span className="text-[10px] text-ink/60">Allow background/image overflow</span>
            </div>
            <button
              type="button"
              onClick={() => setBleedMm(bleedMm > 0 ? 0 : 3)}
              className={`px-3 py-1.5 border font-bold ${
                bleedMm > 0
                  ? 'border-spot bg-spot text-spot-contrast'
                  : 'border-chrome-border bg-chrome'
              }`}
            >
              {bleedMm > 0 ? '3mm Bleed' : 'No Bleed'}
            </button>
          </div>

          {/* Reading Direction */}
          <div className="flex items-center justify-between border-t border-chrome-border pt-3">
            <div>
              <span className="font-bold block">Reading Direction</span>
              <span className="text-[10px] text-ink/60">
                Left-to-Right vs Right-to-Left (Manga)
              </span>
            </div>
            <div className="flex items-center border border-chrome-border">
              <button
                type="button"
                onClick={() => setRtl(false)}
                className={`px-2.5 py-1 ${!rtl ? 'bg-spot text-spot-contrast font-bold' : ''}`}
              >
                LTR
              </button>
              <button
                type="button"
                onClick={() => setRtl(true)}
                className={`px-2.5 py-1 border-l border-chrome-border ${
                  rtl ? 'bg-spot text-spot-contrast font-bold' : ''
                }`}
              >
                RTL
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-chrome-border">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-spot text-spot-contrast font-bold text-xs hover:opacity-90 transition-opacity"
          >
            <Check size={14} />
            <span>Apply Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

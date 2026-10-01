import type { Margins, PaperSize } from '@oruzine/formats';
import { Check, X } from 'lucide-react';
import type React from 'react';
import { useDocumentStore } from '../../stores/documentStore';

interface FormatSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FormatSetupModal: React.FC<FormatSetupModalProps> = ({ isOpen, onClose }) => {
  const {
    formatId,
    setFormat,
    pages,
    setPageCount,
    paper,
    setPaper,
    margins,
    setMargins,
    bleedMm,
    setBleedMm,
    creepMm,
    setCreepMm,
    rtl,
    setRtl,
  } = useDocumentStore();

  if (!isOpen) return null;

  const handleMarginPreset = (preset: 'standard' | 'narrow' | 'none') => {
    let m: Margins = { top: 5, right: 5, bottom: 5, left: 5 };
    if (preset === 'narrow') m = { top: 3, right: 3, bottom: 3, left: 3 };
    if (preset === 'none') m = { top: 0, right: 0, bottom: 0, left: 0 };
    setMargins(m);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 select-none">
      <div className="bg-paper xerox-border w-full max-w-lg p-6 flex flex-col gap-5 text-ink font-mono animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-chrome-border pb-3">
          <h2 className="text-base font-bold tracking-tight">ZINE FORMAT & PRINT SETUP</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-chrome border border-chrome-border"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-4 text-xs">
          {/* Format Selection */}
          <div className="flex flex-col gap-1.5">
            <span className="font-bold text-ink/70 uppercase">Zine Format</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormat('mini-8', 8)}
                className={`p-3 border text-left flex flex-col gap-1 transition-colors ${
                  formatId === 'mini-8'
                    ? 'border-spot bg-spot/10 text-spot font-bold'
                    : 'border-chrome-border hover:bg-chrome'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">8-Page Mini Zine</span>
                  <span className="text-[10px] opacity-70">1 Sheet</span>
                </div>
                <span className="text-[10px] text-ink/70 font-normal leading-tight">
                  Single-sided pocket zine. 1 horizontal slit, 0 staples.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('quarter-fold-4', 4)}
                className={`p-3 border text-left flex flex-col gap-1 transition-colors ${
                  formatId === 'quarter-fold-4'
                    ? 'border-spot bg-spot/10 text-spot font-bold'
                    : 'border-chrome-border hover:bg-chrome'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">4-Page Quarter Fold</span>
                  <span className="text-[10px] opacity-70">1 Sheet</span>
                </div>
                <span className="text-[10px] text-ink/70 font-normal leading-tight">
                  French fold pamphlet. 2 folds, zero tools or cuts needed.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('accordion-6', 6)}
                className={`p-3 border text-left flex flex-col gap-1 transition-colors ${
                  formatId === 'accordion-6'
                    ? 'border-spot bg-spot/10 text-spot font-bold'
                    : 'border-chrome-border hover:bg-chrome'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">6-Page Accordion</span>
                  <span className="text-[10px] opacity-70">Duplex</span>
                </div>
                <span className="text-[10px] text-ink/70 font-normal leading-tight">
                  Continuous Z-strip leporello zine. 3 panels per side.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('saddle-stitch', Math.max(4, pages.length))}
                className={`p-3 border text-left flex flex-col gap-1 transition-colors ${
                  formatId === 'saddle-stitch'
                    ? 'border-spot bg-spot/10 text-spot font-bold'
                    : 'border-chrome-border hover:bg-chrome'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Saddle-Stitch Booklet</span>
                  <span className="text-[10px] opacity-70">Duplex</span>
                </div>
                <span className="text-[10px] text-ink/70 font-normal leading-tight">
                  Folded down spine and stapled. Prints short-edge duplex.
                </span>
              </button>
            </div>
          </div>

          {/* Booklet Page Count (if saddle-stitch) */}
          {formatId === 'saddle-stitch' && (
            <div className="flex flex-col gap-1.5 p-3 bg-chrome border border-chrome-border">
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase text-[11px]">Booklet Pages</span>
                <span className="text-[10px] text-ink/60">
                  {pages.length} pages ({pages.length / 4} sheets duplex)
                </span>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {[4, 8, 12, 16, 20, 24, 32].map((cnt) => (
                  <button
                    type="button"
                    key={cnt}
                    onClick={() => setPageCount(cnt)}
                    className={`py-1.5 border text-center font-bold text-xs ${
                      pages.length === cnt
                        ? 'border-spot bg-spot text-spot-contrast'
                        : 'border-chrome-border bg-paper hover:bg-chrome'
                    }`}
                  >
                    {cnt}p
                  </button>
                ))}
              </div>

              {/* Creep compensation */}
              <div className="mt-2 pt-2 border-t border-chrome-border flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span>Creep Compensation:</span>
                  <span className="font-bold text-spot">{creepMm.toFixed(1)} mm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.5"
                  value={creepMm}
                  onChange={(e) => setCreepMm(Number.parseFloat(e.target.value))}
                  className="w-full accent-spot h-1.5 cursor-pointer"
                />
                <span className="text-[9px] text-ink/60">
                  Shifts inner-sheet content outward so folded page margins stay balanced.
                </span>
              </div>
            </div>
          )}

          {/* Paper Size */}
          <div className="flex flex-col gap-1.5">
            <span className="font-bold text-ink/70 uppercase">Paper Size</span>
            <div className="grid grid-cols-4 gap-2">
              {(['letter', 'a4', 'a3', 'tabloid'] as PaperSize[]).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPaper(p)}
                  className={`p-2 border uppercase font-bold transition-colors text-center ${
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
                Borderless (0mm)
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

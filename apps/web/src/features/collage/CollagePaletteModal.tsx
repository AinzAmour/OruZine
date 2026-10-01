import { Sparkles, X } from 'lucide-react';
import type React from 'react';
import { type StickerType, useDocumentStore } from '../../stores/documentStore';
import { StickerView } from './StickerView';

interface CollagePaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StickerOption {
  type: StickerType;
  label: string;
  category: 'tape' | 'hardware' | 'punk';
}

const STICKER_OPTIONS: StickerOption[] = [
  { type: 'tape-masking', label: 'Masking Tape', category: 'tape' },
  { type: 'tape-duct', label: 'Duct Tape', category: 'tape' },
  { type: 'tape-clear', label: 'Clear Tape', category: 'tape' },
  { type: 'staple', label: 'Office Staple', category: 'hardware' },
  { type: 'pushpin', label: 'Pink Pushpin', category: 'hardware' },
  { type: 'arrow', label: 'Bold Arrow', category: 'punk' },
  { type: 'star', label: '5-Pt Star', category: 'punk' },
  { type: 'barcode', label: 'Zine Barcode', category: 'punk' },
  { type: 'halftone-dot', label: 'Halftone Dot Grid', category: 'punk' },
];

export const CollagePaletteModal: React.FC<CollagePaletteModalProps> = ({ isOpen, onClose }) => {
  const { activePageIndex, addSticker } = useDocumentStore();

  if (!isOpen) return null;

  const handleSelectSticker = (type: StickerType) => {
    addSticker(activePageIndex, type);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 select-none">
      <div className="bg-paper xerox-border w-full max-w-md p-6 flex flex-col gap-4 text-ink font-mono animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-chrome-border pb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-spot" />
            <h2 className="text-sm font-bold tracking-tight">COLLAGE MATERIALS & STICKERS</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-chrome border border-chrome-border"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {STICKER_OPTIONS.map((item) => (
            <button
              type="button"
              key={item.type}
              onClick={() => handleSelectSticker(item.type)}
              className="p-3 border border-chrome-border hover:border-spot hover:bg-spot/5 flex flex-col items-center justify-between gap-2.5 transition-all text-center group cursor-pointer"
            >
              <div className="w-16 h-10 flex items-center justify-center overflow-hidden">
                <StickerView stickerType={item.type} />
              </div>
              <span className="text-[11px] font-bold text-ink/80 group-hover:text-spot transition-colors">
                {item.label}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-chrome-border pt-3 text-[11px] text-ink/60">
          <span>Click to place onto Page {activePageIndex + 1}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 border border-chrome-border hover:bg-chrome"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

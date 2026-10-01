import {
  AVAILABLE_OVERLAYS,
  type LookDefinition,
  OVERLAY_REGISTRY,
  SIGNATURE_LOOKS,
} from '@oruzine/filters';
import { Check, Flame, Palette, RotateCcw, Sparkles, Tv, Wand2, X } from 'lucide-react';
import type React from 'react';
import { useDocumentStore } from '../../stores/documentStore';

interface LooksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LooksModal: React.FC<LooksModalProps> = ({ isOpen, onClose }) => {
  const {
    activeLookId,
    applyLook,
    clearLook,
    pages,
    activePageIndex,
    addOverlay,
    removeOverlay,
    applyOverlaysToAllPages,
  } = useDocumentStore();

  if (!isOpen) return null;

  const activePage = pages[activePageIndex];
  const pageOverlays = activePage?.pageOverlays || [];

  const handleSelectLook = (look: LookDefinition) => {
    applyLook(look.id);
  };

  const handleClear = () => {
    clearLook();
  };

  const getLookIcon = (id: string) => {
    switch (id) {
      case 'xerox-punk':
        return <Flame size={16} className="text-black" />;
      case 'newsprint-noir':
        return <Palette size={16} className="text-amber-800" />;
      case 'vhs-basement':
        return <Tv size={16} className="text-cyan-400" />;
      case 'riso-pop':
        return <Sparkles size={16} className="text-spot" />;
      case 'neon-night':
        return <Wand2 size={16} className="text-emerald-400" />;
      default:
        return <Sparkles size={16} className="text-spot" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 select-none">
      <div className="bg-paper xerox-border w-full max-w-2xl max-h-[88vh] flex flex-col font-mono text-ink animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-chrome-border p-4 bg-chrome">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-spot" />
            <div>
              <h2 className="text-sm font-bold tracking-tight">SIGNATURE PRINT CULTURE LOOKS</h2>
              <span className="text-[10px] text-ink/60">
                1-click zine-wide shaders, inks, paper stocks & texture overlays
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-paper border border-chrome-border"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
          {/* Active Look banner & reset */}
          <div className="flex items-center justify-between bg-chrome/40 border border-chrome-border p-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-ink/60">ACTIVE LOOK:</span>
              <span className="font-bold text-spot">
                {activeLookId
                  ? SIGNATURE_LOOKS.find((l) => l.id === activeLookId)?.name
                  : 'Clean / Default (No Look applied)'}
              </span>
            </div>
            {activeLookId && (
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1 text-[11px] px-2 py-0.5 border border-chrome-border hover:bg-paper text-ink/80 hover:text-red-500"
              >
                <RotateCcw size={11} />
                <span>Revert to Clean</span>
              </button>
            )}
          </div>

          {/* 5 Signature Looks Grid */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-ink/70">PICK A PRINT CULTURE LOOK</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SIGNATURE_LOOKS.map((look) => {
                const isActive = activeLookId === look.id;

                return (
                  <button
                    type="button"
                    key={look.id}
                    onClick={() => handleSelectLook(look)}
                    className={`p-3 border text-left flex flex-col gap-2 transition-all relative ${
                      isActive
                        ? 'border-spot bg-spot/10 ring-1 ring-spot'
                        : 'border-chrome-border bg-paper hover:border-ink/50 shadow-xs'
                    }`}
                  >
                    {/* Top row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getLookIcon(look.id)}
                        <span className="text-xs font-bold tracking-tight">{look.name}</span>
                      </div>
                      {isActive && (
                        <span className="text-[9px] bg-spot text-spot-contrast px-1.5 py-0.5 font-bold uppercase">
                          Active
                        </span>
                      )}
                    </div>

                    {/* Tagline & description */}
                    <p className="text-[11px] text-ink font-semibold">{look.tagline}</p>
                    <p className="text-[9px] text-ink/60 line-clamp-2">{look.description}</p>

                    {/* Color swatch & ingredients */}
                    <div className="flex items-center justify-between pt-2 border-t border-chrome-border/60 text-[9px] text-ink/50">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3.5 h-3.5 border border-black/20"
                          style={{ backgroundColor: look.paperColor }}
                          title="Paper Stock"
                        />
                        <span
                          className="w-3.5 h-3.5 border border-black/20"
                          style={{ backgroundColor: look.accentColor }}
                          title="Ink Color"
                        />
                      </div>
                      <span>
                        {look.filters.length} shaders • {look.overlays.length} textures
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Texture Overlays Palette */}
          <div className="flex flex-col gap-2 pt-2 border-t border-chrome-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink/70">PAGE TEXTURE OVERLAYS</span>
              {pageOverlays.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    applyOverlaysToAllPages(pageOverlays);
                    alert('Texture overlays applied across all pages!');
                  }}
                  className="text-[10px] text-spot hover:underline flex items-center gap-1 font-bold"
                >
                  <Sparkles size={11} />
                  <span>Apply Overlays to All Pages</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AVAILABLE_OVERLAYS.map((type) => {
                const def = OVERLAY_REGISTRY[type];
                const activeInstance = pageOverlays.find((o) => o.type === type);
                const isEnabled = !!activeInstance;

                return (
                  <button
                    type="button"
                    key={type}
                    onClick={() => {
                      if (activeInstance) {
                        removeOverlay(activePageIndex, activeInstance.id);
                      } else {
                        addOverlay(activePageIndex, type);
                      }
                    }}
                    className={`p-2 border text-left flex flex-col gap-1 transition-colors ${
                      isEnabled
                        ? 'border-spot bg-spot/10'
                        : 'border-chrome-border bg-chrome/40 hover:bg-paper'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{def.name}</span>
                      {isEnabled ? (
                        <Check size={12} className="text-spot" />
                      ) : (
                        <span className="text-[10px] text-ink/40">+</span>
                      )}
                    </div>
                    <span className="text-[9px] text-ink/60 line-clamp-1">{def.description}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-chrome-border p-3 bg-chrome flex items-center justify-between">
          <span className="text-[10px] text-ink/50">
            Looks apply to all pages simultaneously without losing your layout or images.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-spot text-spot-contrast font-bold text-xs hover:opacity-90 flex items-center gap-1.5"
          >
            <Check size={14} />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};

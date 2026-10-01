import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { type DocumentPage, useDocumentStore } from '../../stores/documentStore';
import { StickerView } from '../collage/StickerView';

interface FlipbookReaderProps {
  onEditPage: (pageIndex: number) => void;
}

export const FlipbookReader: React.FC<FlipbookReaderProps> = ({ onEditPage }) => {
  const { pages, formatId, title } = useDocumentStore();
  const [spreadIndex, setSpreadIndex] = useState(0); // 0 = Cover, 1 = Pages 2-3, etc.
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Group pages into spreads:
  // Spread 0: [Page 1 (Cover)]
  // Spread 1: [Page 2, Page 3]
  // Spread 2: [Page 4, Page 5]
  // ...
  // Last Spread: [Page N (Back Cover)]
  interface Spread {
    id: string;
    label: string;
    leftPage: DocumentPage | null;
    rightPage: DocumentPage | null;
  }

  const spreads: Spread[] = [];

  if (pages.length > 0) {
    // Cover spread (Front cover is on the right side of an unopened book, or standalone centered)
    spreads.push({
      id: 'cover',
      label: 'Front Cover',
      leftPage: null,
      rightPage: pages[0],
    });

    // Middle spreads (pair 2-3, 4-5, etc.)
    for (let i = 1; i < pages.length - 1; i += 2) {
      const left = pages[i];
      const right = i + 1 < pages.length - 1 ? pages[i + 1] : null;
      spreads.push({
        id: `spread-${i}-${i + 1}`,
        label: right ? `Pages ${left.pageNumber} & ${right.pageNumber}` : `Page ${left.pageNumber}`,
        leftPage: left,
        rightPage: right,
      });
    }

    // Back cover spread (if more than 1 page)
    if (pages.length > 1) {
      spreads.push({
        id: 'back',
        label: 'Back Cover',
        leftPage: pages[pages.length - 1],
        rightPage: null,
      });
    }
  }

  const currentSpread = spreads[spreadIndex] || spreads[0];

  // Keyboard navigation (Left / Right arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setSpreadIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'ArrowRight') {
        setSpreadIndex((i) => Math.min(spreads.length - 1, i + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [spreads.length]);

  const renderPageContent = (page: DocumentPage) => {
    return (
      <div
        className="w-full h-full relative overflow-hidden select-none flex flex-col justify-between"
        style={{ backgroundColor: page.backgroundColor || '#ffffff' }}
      >
        {/* Page Overlays */}
        {page.pageOverlays?.map((ovl) => (
          <div
            key={ovl.id}
            className="absolute inset-0 pointer-events-none z-15"
            style={{
              opacity: ovl.opacity * 0.75,
              mixBlendMode: ovl.blendMode,
              backgroundImage:
                ovl.type === 'toner-dust'
                  ? 'radial-gradient(circle, #000 1px, transparent 1px)'
                  : ovl.type === 'copier-streaks'
                    ? 'repeating-linear-gradient(90deg, transparent 0, transparent 40px, rgba(0,0,0,0.15) 41px, transparent 42px)'
                    : ovl.type === 'fold-creases'
                      ? 'linear-gradient(to bottom, transparent 49%, rgba(0,0,0,0.3) 50%, transparent 51%)'
                      : undefined,
              backgroundSize: ovl.type === 'toner-dust' ? '12px 12px' : undefined,
            }}
          />
        ))}

        {/* Objects */}
        {page.objects.map((obj) => {
          if (obj.hidden) return null;

          return (
            <div
              key={obj.id}
              className="absolute select-none pointer-events-none"
              style={{
                left: `${obj.xPercent * 100}%`,
                top: `${obj.yPercent * 100}%`,
                width: `${obj.wPercent * 100}%`,
                height: `${obj.hPercent * 100}%`,
                transform: `rotate(${obj.rotation}deg)`,
                transformOrigin: 'center center',
                opacity: obj.opacity,
              }}
            >
              {obj.type === 'shape' && (
                <div
                  className="w-full h-full"
                  style={{
                    backgroundColor: obj.fillColor || 'transparent',
                    borderColor: obj.strokeColor || '#121212',
                    borderWidth: `${obj.strokeWidth || 2}px`,
                    borderStyle: 'solid',
                    borderRadius: obj.shapeType === 'circle' ? '9999px' : '0px',
                  }}
                />
              )}

              {obj.type === 'sticker' && <StickerView sticker={obj} />}

              {obj.type === 'image' && obj.imageDataUrl && (
                <div
                  className="w-full h-full relative"
                  style={{
                    filter: obj.paperShadow
                      ? 'drop-shadow(2px 3px 5px rgba(0, 0, 0, 0.35))'
                      : undefined,
                  }}
                >
                  <img
                    src={obj.imageDataUrl}
                    alt="Zine content"
                    className={`w-full h-full ${
                      obj.imageFit === 'contain' ? 'object-contain' : 'object-cover'
                    }`}
                    style={{
                      transform: `${obj.flipX ? 'scaleX(-1)' : ''} ${obj.flipY ? 'scaleY(-1)' : ''}`,
                      clipPath:
                        obj.mask === 'circle'
                          ? 'circle(50% at 50% 50%)'
                          : obj.mask === 'star'
                            ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
                            : obj.mask === 'stamp'
                              ? 'polygon(0% 5%, 5% 0%, 10% 5%, 15% 0%, 20% 5%, 25% 0%, 30% 5%, 35% 0%, 40% 5%, 45% 0%, 50% 5%, 55% 0%, 60% 5%, 65% 0%, 70% 5%, 75% 0%, 80% 5%, 85% 0%, 90% 5%, 95% 0%, 100% 5%, 95% 10%, 100% 15%, 95% 20%, 100% 25%, 95% 30%, 100% 35%, 95% 40%, 100% 45%, 95% 50%, 100% 55%, 95% 60%, 100% 65%, 95% 70%, 100% 75%, 95% 80%, 100% 85%, 95% 90%, 100% 95%, 95% 100%, 90% 95%, 85% 100%, 80% 95%, 75% 100%, 70% 95%, 65% 100%, 60% 95%, 55% 100%, 50% 95%, 45% 100%, 40% 95%, 35% 100%, 30% 95%, 25% 100%, 20% 95%, 15% 100%, 10% 95%, 5% 100%, 0% 95%, 5% 90%, 0% 85%, 5% 80%, 0% 75%, 5% 70%, 0% 65%, 5% 60%, 0% 55%, 5% 50%, 0% 45%, 5% 40%, 0% 35%, 5% 30%, 0% 25%, 5% 20%, 0% 15%, 5% 10%, 0% 5%)'
                              : obj.mask === 'torn-edge'
                                ? 'polygon(2% 2%, 98% 3%, 97% 97%, 3% 98%)'
                                : undefined,
                    }}
                  />
                </div>
              )}

              {obj.type === 'text' && (
                <div
                  className="w-full h-full whitespace-pre-wrap overflow-hidden"
                  style={{
                    color: obj.color,
                    fontWeight: obj.bold ? 'bold' : 'normal',
                    fontStyle: obj.italic ? 'italic' : 'normal',
                    textDecoration: obj.underline ? 'underline' : 'none',
                    textAlign: obj.align || 'left',
                    fontFamily: obj.fontFamily || 'monospace',
                    backgroundColor: obj.backgroundColor || 'transparent',
                    lineHeight: obj.lineHeight ? `${obj.lineHeight}` : '1.3',
                    letterSpacing: obj.letterSpacing ? `${obj.letterSpacing}px` : 'normal',
                    fontSize: `${Math.max(8, obj.fontSizePt)}px`,
                  }}
                >
                  {obj.text}
                </div>
              )}
            </div>
          );
        })}

        {/* Small page number indicator at bottom */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-mono opacity-40 font-bold">
          {page.pageNumber}
        </div>
      </div>
    );
  };

  const pageWidthPx = 280 * scale;
  const pageHeightPx = 380 * scale;

  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-between p-6 select-none bg-zinc-950 text-white ${
        isFullscreen ? 'fixed inset-0 z-50 p-8' : ''
      }`}
    >
      {/* Top Reader Controls */}
      <div className="w-full max-w-4xl flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-400">
            Virtual Zine Reader
          </span>
          <span className="text-zinc-500">•</span>
          <span className="font-mono text-xs text-zinc-300 font-bold">{title}</span>
          <span className="text-[10px] font-mono px-2 py-0.5 border border-zinc-700 bg-zinc-900 text-zinc-400 uppercase">
            {formatId}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center border border-zinc-800 rounded bg-zinc-900 text-xs">
            <button
              type="button"
              onClick={() => setScale((s) => Math.max(0.7, s - 0.1))}
              className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <span className="px-2 text-[11px] font-mono text-zinc-300">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setScale((s) => Math.min(1.5, s + 0.1))}
              className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
          </div>

          {/* Fullscreen toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen((f) => !f)}
            className="p-1.5 border border-zinc-800 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* Center Flipbook Spread Stage */}
      <div className="flex-1 w-full flex items-center justify-center py-6 relative">
        {/* Navigation Previous Button */}
        <button
          type="button"
          disabled={spreadIndex === 0}
          onClick={() => setSpreadIndex((i) => Math.max(0, i - 1))}
          className="absolute left-4 md:left-12 z-20 p-3 rounded-full bg-zinc-800/80 hover:bg-amber-400 hover:text-black border border-zinc-700 disabled:opacity-20 disabled:hover:bg-zinc-800/80 disabled:hover:text-white transition-all shadow-lg"
          title="Previous Page / Spread (Left Arrow)"
        >
          <ChevronLeft size={20} />
        </button>

        {/* 3D Book Container */}
        <div
          className="flex items-center justify-center transition-all duration-300 relative"
          style={{
            perspective: '1200px',
          }}
        >
          {/* Front Cover Only */}
          {currentSpread.id === 'cover' && currentSpread.rightPage && (
            <div className="flex flex-col items-center">
              <div className="mb-2 flex items-center gap-2">
                <span className="font-mono text-xs text-amber-400 font-bold uppercase tracking-wider">
                  Front Cover
                </span>
                <button
                  type="button"
                  onClick={() => onEditPage(0)}
                  className="flex items-center gap-1 text-[10px] font-mono text-zinc-400 hover:text-amber-400 bg-zinc-900 px-2 py-0.5 border border-zinc-800 rounded"
                >
                  <Edit3 size={10} />
                  <span>Edit</span>
                </button>
              </div>

              {/* Cover Book Plate */}
              <div
                className="relative border-4 border-black shadow-[16px_16px_35px_rgba(0,0,0,0.8)] rounded-r-sm overflow-hidden"
                style={{
                  width: `${pageWidthPx}px`,
                  height: `${pageHeightPx}px`,
                }}
              >
                {/* Left Spine Shadow */}
                <div className="absolute top-0 bottom-0 left-0 w-4 bg-gradient-to-r from-black/40 via-black/10 to-transparent pointer-events-none z-20" />
                {renderPageContent(currentSpread.rightPage)}
              </div>
            </div>
          )}

          {/* Back Cover Only */}
          {currentSpread.id === 'back' && currentSpread.leftPage && (
            <div className="flex flex-col items-center">
              <div className="mb-2 flex items-center gap-2">
                <span className="font-mono text-xs text-amber-400 font-bold uppercase tracking-wider">
                  Back Cover
                </span>
                <button
                  type="button"
                  onClick={() => onEditPage(pages.length - 1)}
                  className="flex items-center gap-1 text-[10px] font-mono text-zinc-400 hover:text-amber-400 bg-zinc-900 px-2 py-0.5 border border-zinc-800 rounded"
                >
                  <Edit3 size={10} />
                  <span>Edit</span>
                </button>
              </div>

              {/* Back Plate */}
              <div
                className="relative border-4 border-black shadow-[16px_16px_35px_rgba(0,0,0,0.8)] rounded-l-sm overflow-hidden"
                style={{
                  width: `${pageWidthPx}px`,
                  height: `${pageHeightPx}px`,
                }}
              >
                {/* Right Spine Shadow */}
                <div className="absolute top-0 bottom-0 right-0 w-4 bg-gradient-to-l from-black/40 via-black/10 to-transparent pointer-events-none z-20" />
                {renderPageContent(currentSpread.leftPage)}
              </div>
            </div>
          )}

          {/* Open Two-Page Spread */}
          {currentSpread.id !== 'cover' && currentSpread.id !== 'back' && (
            <div className="flex items-center shadow-[0_20px_50px_rgba(0,0,0,0.9)] border-4 border-black rounded-sm overflow-hidden">
              {/* Left Page */}
              {currentSpread.leftPage && (
                <div
                  className="relative overflow-hidden border-r border-zinc-300 dark:border-zinc-800"
                  style={{
                    width: `${pageWidthPx}px`,
                    height: `${pageHeightPx}px`,
                  }}
                >
                  {/* Spine Crease Shadow (Right side of left page) */}
                  <div className="absolute top-0 bottom-0 right-0 w-6 bg-gradient-to-l from-black/35 via-black/10 to-transparent pointer-events-none z-20" />
                  {renderPageContent(currentSpread.leftPage)}

                  {/* Edit Left Page Shortcut */}
                  <button
                    type="button"
                    onClick={() => onEditPage((currentSpread.leftPage?.pageNumber ?? 1) - 1)}
                    className="absolute top-2 left-2 z-25 bg-black/70 hover:bg-black text-white p-1 rounded text-[10px] flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity"
                    title={`Edit Page ${currentSpread.leftPage.pageNumber}`}
                  >
                    <Edit3 size={11} />
                    <span>p.{currentSpread.leftPage.pageNumber}</span>
                  </button>
                </div>
              )}

              {/* Right Page */}
              {currentSpread.rightPage ? (
                <div
                  className="relative overflow-hidden"
                  style={{
                    width: `${pageWidthPx}px`,
                    height: `${pageHeightPx}px`,
                  }}
                >
                  {/* Spine Crease Shadow (Left side of right page) */}
                  <div className="absolute top-0 bottom-0 left-0 w-6 bg-gradient-to-r from-black/35 via-black/10 to-transparent pointer-events-none z-20" />
                  {renderPageContent(currentSpread.rightPage)}

                  {/* Edit Right Page Shortcut */}
                  <button
                    type="button"
                    onClick={() => onEditPage((currentSpread.rightPage?.pageNumber ?? 2) - 1)}
                    className="absolute top-2 right-2 z-25 bg-black/70 hover:bg-black text-white p-1 rounded text-[10px] flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity"
                    title={`Edit Page ${currentSpread.rightPage.pageNumber}`}
                  >
                    <Edit3 size={11} />
                    <span>p.{currentSpread.rightPage.pageNumber}</span>
                  </button>
                </div>
              ) : (
                <div
                  className="bg-zinc-900 border-l border-zinc-800 flex items-center justify-center font-mono text-xs text-zinc-600 italic"
                  style={{
                    width: `${pageWidthPx}px`,
                    height: `${pageHeightPx}px`,
                  }}
                >
                  Blank inside spread
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Next Button */}
        <button
          type="button"
          disabled={spreadIndex === spreads.length - 1}
          onClick={() => setSpreadIndex((i) => Math.min(spreads.length - 1, i + 1))}
          className="absolute right-4 md:right-12 z-20 p-3 rounded-full bg-zinc-800/80 hover:bg-amber-400 hover:text-black border border-zinc-700 disabled:opacity-20 disabled:hover:bg-zinc-800/80 disabled:hover:text-white transition-all shadow-lg"
          title="Next Page / Spread (Right Arrow)"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Bottom Spread Navigator Thumbnails */}
      <div className="w-full max-w-2xl flex flex-col items-center gap-2 border-t border-zinc-800 pt-3">
        <div className="flex items-center gap-2">
          {spreads.map((s, idx) => (
            <button
              type="button"
              key={s.id}
              onClick={() => setSpreadIndex(idx)}
              className={`px-3 py-1 text-xs font-mono rounded transition-all ${
                spreadIndex === idx
                  ? 'bg-amber-400 text-black font-bold shadow'
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <span className="text-[10px] font-mono text-zinc-500">
          Use ← Left / Right → arrow keys to flip pages
        </span>
      </div>
    </div>
  );
};

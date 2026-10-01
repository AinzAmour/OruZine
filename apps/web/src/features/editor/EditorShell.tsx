import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  Image as ImageIcon,
  Layers,
  Maximize2,
  RotateCcw,
  Scissors,
  Settings,
  Trash2,
  Type,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { type TextBox, useDocumentStore } from '../../stores/documentStore';
import { ExportModal } from '../export/ExportModal';
import { FormatSetupModal } from '../format/FormatSetupModal';
import { FoldGuideModal } from '../preview/FoldGuideModal';

export const EditorShell: React.FC = () => {
  const {
    title,
    setTitle,
    paper,
    margins,
    pages,
    activePageIndex,
    setActivePageIndex,
    setPageImage,
    clearPageImage,
    setPageImageFit,
    addTextBox,
    updateTextBox,
    removeTextBox,
    reorderPages,
    resetDocument,
    isAutosaved,
    checkSavedSession,
    restoreSavedSession,
  } = useDocumentStore();

  const [viewMode, setViewMode] = useState<'page' | 'sheet'>('page');
  const [zoom, setZoom] = useState<number>(100);
  const [selectedTextBoxId, setSelectedTextBoxId] = useState<string | null>(null);
  const [isSetupOpen, setIsSetupOpen] = useState<boolean>(false);
  const [isFoldGuideOpen, setIsFoldGuideOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [hasRestorableSession, setHasRestorableSession] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const activePage = pages[activePageIndex] ?? pages[0];
  const selectedTextBox = activePage.textBoxes.find((b) => b.id === selectedTextBoxId) ?? null;

  // Check saved session on mount
  useEffect(() => {
    checkSavedSession().then((hasSaved) => {
      if (hasSaved) {
        setHasRestorableSession(true);
      }
    });
  }, [checkSavedSession]);

  // Handle image upload
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setPageImage(activePageIndex, dataUrl, 'cover');
        }
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };

  // Dragging text box on canvas
  const handleCanvasMouseDown = (e: React.MouseEvent, box: TextBox) => {
    e.stopPropagation();
    setSelectedTextBoxId(box.id);

    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const rect = canvasEl.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialXPercent = box.xPercent;
    const initialYPercent = box.yPercent;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      const newXPercent = Math.max(0, Math.min(0.9, initialXPercent + deltaX / rect.width));
      const newYPercent = Math.max(0, Math.min(0.9, initialYPercent + deltaY / rect.height));

      updateTextBox(activePageIndex, box.id, {
        xPercent: Number(newXPercent.toFixed(3)),
        yPercent: Number(newYPercent.toFixed(3)),
      });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-53px)] font-mono text-ink bg-paper select-none">
      {/* Session restore banner */}
      {hasRestorableSession && (
        <div className="bg-spot text-spot-contrast px-4 py-2 text-xs flex items-center justify-between">
          <span>A previous zine session was found in your browser.</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                restoreSavedSession();
                setHasRestorableSession(false);
              }}
              className="px-2 py-0.5 bg-paper text-ink font-bold hover:opacity-90"
            >
              Restore
            </button>
            <button
              type="button"
              onClick={() => setHasRestorableSession(false)}
              className="px-2 py-0.5 border border-white/40 hover:bg-white/10"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Top Editor Bar */}
      <div className="border-b border-chrome-border bg-chrome px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-transparent border-b border-dashed border-ink/40 px-1 py-0.5 text-xs font-bold text-ink focus:outline-none focus:border-spot"
            title="Rename your zine"
          />
          <button
            type="button"
            onClick={() => setIsSetupOpen(true)}
            className="text-xs text-ink/70 hover:text-spot flex items-center gap-1 border border-chrome-border px-2 py-0.5"
            title="Change paper size or margins"
          >
            <span className="capitalize">{paper}</span>
            <span>({margins.top}mm)</span>
            <Settings size={12} />
          </button>
          <span className="text-[10px] text-ink/50 flex items-center gap-1">
            {isAutosaved ? (
              <>
                <CheckCircle2 size={11} className="text-emerald-500" />
                <span>Autosaved</span>
              </>
            ) : (
              <span>Saving...</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border border-chrome-border text-xs">
            <button
              type="button"
              onClick={() => setViewMode('page')}
              className={`px-2.5 py-1 transition-colors ${
                viewMode === 'page' ? 'bg-spot text-spot-contrast font-bold' : 'hover:bg-paper'
              }`}
            >
              Page View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('sheet')}
              className={`px-2.5 py-1 border-l border-chrome-border transition-colors ${
                viewMode === 'sheet' ? 'bg-spot text-spot-contrast font-bold' : 'hover:bg-paper'
              }`}
            >
              Imposed Sheet
            </button>
          </div>

          {/* How to fold guide */}
          <button
            type="button"
            onClick={() => setIsFoldGuideOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 border border-chrome-border text-xs hover:bg-paper transition-colors"
          >
            <Scissors size={13} className="text-spot" />
            <span>How to Fold</span>
          </button>

          {/* Export Button */}
          <button
            type="button"
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-spot text-spot-contrast font-bold text-xs hover:opacity-90 transition-opacity xerox-border-sm"
          >
            <Download size={13} />
            <span>Export (300 DPI)</span>
          </button>

          {/* Start over */}
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset this zine and start over?')) {
                resetDocument();
              }
            }}
            className="p-1.5 border border-chrome-border hover:bg-paper transition-colors text-ink/70 hover:text-red-500"
            title="Start Over"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Filmstrip */}
        <aside className="w-60 border-r border-chrome-border bg-chrome p-3 flex flex-col gap-2 overflow-y-auto">
          <div className="flex items-center justify-between text-xs text-ink/70 pb-2 border-b border-chrome-border">
            <span>PAGES (READER ORDER)</span>
            <span className="font-bold">{pages.length}</span>
          </div>

          <div className="flex flex-col gap-2">
            {pages.map((p, idx) => {
              const isCover = p.pageNumber === 1;
              const isBack = p.pageNumber === 8;
              const isSelected = activePageIndex === idx;

              return (
                <div
                  key={p.pageNumber}
                  className={`p-2 border transition-all text-xs flex items-center justify-between ${
                    isSelected
                      ? 'border-spot bg-spot/10 font-bold spot-shadow'
                      : 'border-chrome-border hover:border-ink/50 bg-paper'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActivePageIndex(idx)}
                    className="flex items-center gap-2 text-left flex-1"
                  >
                    <div className="w-9 h-12 border border-dashed border-ink/30 bg-paper overflow-hidden flex items-center justify-center shrink-0">
                      {p.imageDataUrl ? (
                        <img
                          src={p.imageDataUrl}
                          alt={`Page ${p.pageNumber}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[9px] text-ink/40">p.{p.pageNumber}</span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs">
                        {p.pageNumber}.{' '}
                        {isCover ? 'Cover' : isBack ? 'Back' : `Page ${p.pageNumber}`}
                      </span>
                      <span className="text-[10px] text-ink/50">
                        {p.textBoxes.length} text {p.imageDataUrl ? '• 1 image' : ''}
                      </span>
                    </div>
                  </button>

                  {/* Reorder arrows */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => reorderPages(idx, idx - 1)}
                      className="p-1 border border-chrome-border hover:bg-chrome disabled:opacity-20"
                      title="Move Up"
                    >
                      <ArrowLeft size={10} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === pages.length - 1}
                      onClick={() => reorderPages(idx, idx + 1)}
                      className="p-1 border border-chrome-border hover:bg-chrome disabled:opacity-20"
                      title="Move Down"
                    >
                      <ArrowRight size={10} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Center: Canvas Workspace */}
        <main className="flex-1 bg-paper/60 relative flex flex-col items-center justify-center p-8 overflow-auto">
          {/* Zoom controls */}
          <div className="absolute top-4 right-4 flex items-center gap-1 bg-chrome border border-chrome-border p-1 text-xs z-10">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              className="p-1 hover:bg-paper"
            >
              <ZoomOut size={13} />
            </button>
            <span className="px-2 font-mono text-[11px]">{zoom}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(200, z + 10))}
              className="p-1 hover:bg-paper"
            >
              <ZoomIn size={13} />
            </button>
            <button
              type="button"
              onClick={() => setZoom(100)}
              className="p-1 hover:bg-paper border-l border-chrome-border"
            >
              <Maximize2 size={13} />
            </button>
          </div>

          {/* Active Canvas / Sheet Box */}
          {viewMode === 'page' ? (
            <div
              ref={canvasRef}
              className="bg-paper xerox-border transition-all duration-150 flex flex-col justify-between relative overflow-hidden select-none"
              style={{
                width: `${(280 * zoom) / 100}px`,
                height: `${(380 * zoom) / 100}px`,
              }}
            >
              {/* Bleed outline */}
              <div className="absolute inset-2 border border-dashed border-spot/20 pointer-events-none z-10" />

              {/* Background Image if uploaded */}
              {activePage.imageDataUrl ? (
                <img
                  src={activePage.imageDataUrl}
                  alt={`Page ${activePage.pageNumber}`}
                  className={`absolute inset-0 w-full h-full pointer-events-none ${
                    activePage.imageFit === 'contain' ? 'object-contain' : 'object-cover'
                  }`}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-8 border-2 border-dashed border-chrome-border flex flex-col items-center justify-center gap-2 text-ink/40 hover:border-spot hover:text-spot transition-colors cursor-pointer"
                >
                  <ImageIcon size={28} />
                  <span className="text-xs font-bold">CLICK TO ADD IMAGE</span>
                  <span className="text-[10px]">JPG, PNG, WebP</span>
                </button>
              )}

              {/* Free Text Boxes */}
              {activePage.textBoxes.map((box) => {
                const isSelected = selectedTextBoxId === box.id;

                return (
                  <button
                    type="button"
                    key={box.id}
                    onClick={() => setSelectedTextBoxId(box.id)}
                    onMouseDown={(e) => handleCanvasMouseDown(e, box)}
                    className={`absolute p-1 cursor-move transition-shadow z-20 text-left ${
                      isSelected
                        ? 'border border-spot ring-1 ring-spot bg-paper/90 shadow'
                        : 'hover:border hover:border-dashed hover:border-ink/50 bg-paper/60'
                    }`}
                    style={{
                      left: `${box.xPercent * 100}%`,
                      top: `${box.yPercent * 100}%`,
                      color: box.color,
                      fontWeight: box.bold ? 'bold' : 'normal',
                      fontSize: `${Math.max(10, (box.fontSizePt * zoom) / 100)}px`,
                    }}
                  >
                    <span className="whitespace-pre-wrap">{box.text}</span>
                  </button>
                );
              })}

              {/* Page Number Label */}
              <div className="absolute top-2 left-2 z-10 text-[9px] px-1.5 py-0.5 bg-paper/90 border border-chrome-border text-ink/70">
                Page {activePage.pageNumber}{' '}
                {activePage.pageNumber === 1
                  ? '• Cover'
                  : activePage.pageNumber === 8
                    ? '• Back'
                    : ''}
              </div>
            </div>
          ) : (
            /* Imposed Sheet View Preview */
            <div
              className="bg-paper xerox-border p-4 transition-all duration-150 flex flex-col gap-2 select-none"
              style={{
                width: `${(600 * zoom) / 100}px`,
                height: `${(420 * zoom) / 100}px`,
              }}
            >
              <div className="text-[10px] text-ink/50 flex items-center justify-between pb-1 border-b border-chrome-border">
                <span>8-PAGE MINI ZINE IMPOSITION (PRINTER SHEET)</span>
                <span className="text-spot font-bold">TOP ROW IS INVERTED 180° FOR FOLDING</span>
              </div>

              {/* 4 cols x 2 rows grid */}
              <div className="grid grid-cols-4 grid-rows-2 gap-1 flex-1 relative bg-chrome/20 border border-chrome-border">
                {/* Dashed fold lines indicator */}
                <div className="absolute top-1/2 left-0 w-full border-b border-dashed border-gray-400 pointer-events-none" />
                <div className="absolute top-0 left-1/4 h-full border-r border-dashed border-gray-400 pointer-events-none" />
                <div className="absolute top-0 left-2/4 h-full border-r border-dashed border-gray-400 pointer-events-none" />
                <div className="absolute top-0 left-3/4 h-full border-r border-dashed border-gray-400 pointer-events-none" />
                {/* Center cut line across middle two columns */}
                <div className="absolute top-1/2 left-1/4 w-1/2 border-b-2 border-spot pointer-events-none" />

                {/* Top row rotated 180 */}
                {[5, 4, 3, 2].map((pageNum) => {
                  const pData = pages.find((p) => p.pageNumber === pageNum);

                  return (
                    <div
                      key={pageNum}
                      className="border border-chrome-border bg-paper flex flex-col items-center justify-center p-2 relative rotate-180 overflow-hidden"
                    >
                      {pData?.imageDataUrl && (
                        <img
                          src={pData.imageDataUrl}
                          alt={`Page ${pageNum}`}
                          className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none"
                        />
                      )}
                      <div className="relative z-10 bg-paper/90 px-1 text-[10px] font-bold">
                        p.{pageNum}
                      </div>
                    </div>
                  );
                })}

                {/* Bottom row upright */}
                {[6, 7, 8, 1].map((pageNum) => {
                  const pData = pages.find((p) => p.pageNumber === pageNum);

                  return (
                    <div
                      key={pageNum}
                      className="border border-chrome-border bg-paper flex flex-col items-center justify-center p-2 relative overflow-hidden"
                    >
                      {pData?.imageDataUrl && (
                        <img
                          src={pData.imageDataUrl}
                          alt={`Page ${pageNum}`}
                          className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none"
                        />
                      )}
                      <div className="relative z-10 bg-paper/90 px-1 text-[10px] font-bold">
                        {pageNum === 1
                          ? 'Cover (p.1)'
                          : pageNum === 8
                            ? 'Back (p.8)'
                            : `p.${pageNum}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>

        {/* Right: Inspector */}
        <aside className="w-72 border-l border-chrome-border bg-chrome p-4 flex flex-col gap-4 overflow-y-auto">
          <div className="flex items-center justify-between text-xs text-ink/70 pb-2 border-b border-chrome-border">
            <span>PAGE & OBJECT INSPECTOR</span>
            <Layers size={13} />
          </div>

          {/* Page Image Control */}
          <div className="flex flex-col gap-2 text-xs border-b border-chrome-border pb-4">
            <span className="text-[10px] text-ink/60 uppercase font-bold">Page Image</span>
            {activePage.imageDataUrl ? (
              <div className="flex flex-col gap-2">
                <div className="w-full aspect-[4/3] border border-chrome-border overflow-hidden bg-paper relative">
                  <img
                    src={activePage.imageDataUrl}
                    alt="Page preview"
                    className={`w-full h-full ${
                      activePage.imageFit === 'contain' ? 'object-contain' : 'object-cover'
                    }`}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex border border-chrome-border text-[11px]">
                    <button
                      type="button"
                      onClick={() => setPageImageFit(activePageIndex, 'cover')}
                      className={`px-2 py-0.5 ${
                        activePage.imageFit === 'cover'
                          ? 'bg-spot text-spot-contrast font-bold'
                          : ''
                      }`}
                    >
                      Cover
                    </button>
                    <button
                      type="button"
                      onClick={() => setPageImageFit(activePageIndex, 'contain')}
                      className={`px-2 py-0.5 border-l border-chrome-border ${
                        activePage.imageFit === 'contain'
                          ? 'bg-spot text-spot-contrast font-bold'
                          : ''
                      }`}
                    >
                      Contain
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => clearPageImage(activePageIndex)}
                    className="p-1 text-red-500 hover:bg-red-500/10 border border-chrome-border"
                    title="Remove Image"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 border-2 border-dashed border-chrome-border hover:border-spot bg-paper text-center flex flex-col items-center gap-1 cursor-pointer"
              >
                <ImageIcon size={18} className="text-spot" />
                <span className="font-bold text-[11px]">Upload Image</span>
              </button>
            )}
          </div>

          {/* Selected Text Box Controls */}
          {selectedTextBox ? (
            <div className="flex flex-col gap-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-ink/60 uppercase font-bold">Selected Text</span>
                <button
                  type="button"
                  onClick={() => removeTextBox(activePageIndex, selectedTextBox.id)}
                  className="p-1 text-red-500 hover:bg-red-500/10 border border-chrome-border"
                  title="Delete text box"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              <div>
                <textarea
                  value={selectedTextBox.text}
                  onChange={(e) =>
                    updateTextBox(activePageIndex, selectedTextBox.id, { text: e.target.value })
                  }
                  className="w-full p-2 border border-chrome-border bg-paper text-xs text-ink focus:outline-none focus:border-spot font-mono"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-ink/60 block mb-1">Font Size</span>
                  <input
                    type="number"
                    min={8}
                    max={48}
                    value={selectedTextBox.fontSizePt}
                    onChange={(e) =>
                      updateTextBox(activePageIndex, selectedTextBox.id, {
                        fontSizePt: Number(e.target.value),
                      })
                    }
                    className="w-full p-1 border border-chrome-border bg-paper text-xs"
                  />
                </div>

                <div>
                  <span className="text-[10px] text-ink/60 block mb-1">Style</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateTextBox(activePageIndex, selectedTextBox.id, {
                        bold: !selectedTextBox.bold,
                      })
                    }
                    className={`w-full p-1 border font-bold ${
                      selectedTextBox.bold
                        ? 'border-spot bg-spot text-spot-contrast'
                        : 'border-chrome-border'
                    }`}
                  >
                    Bold
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-ink/50 text-center p-4 border border-dashed border-chrome-border">
              Click a text box on the canvas to inspect & edit it.
            </div>
          )}
        </aside>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Bottom Tool Palette */}
      <footer className="border-t border-chrome-border bg-chrome px-4 py-2 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-chrome-border hover:border-spot bg-paper text-xs font-bold"
        >
          <ImageIcon size={14} className="text-spot" />
          <span>{activePage.imageDataUrl ? 'Replace Image' : 'Add Image'}</span>
        </button>

        <button
          type="button"
          onClick={() => addTextBox(activePageIndex, 'My Zine Text')}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-chrome-border hover:border-spot bg-paper text-xs font-bold"
        >
          <Type size={14} className="text-spot" />
          <span>Add Text Box</span>
        </button>

        <button
          type="button"
          onClick={() => setIsSetupOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-chrome-border hover:border-spot bg-paper text-xs"
        >
          <Settings size={14} />
          <span>Format Options</span>
        </button>
      </footer>

      {/* Modals */}
      <FormatSetupModal isOpen={isSetupOpen} onClose={() => setIsSetupOpen(false)} />
      <FoldGuideModal isOpen={isFoldGuideOpen} onClose={() => setIsFoldGuideOpen(false)} />
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
    </div>
  );
};

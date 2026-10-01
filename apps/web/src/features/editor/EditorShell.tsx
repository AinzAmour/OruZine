import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Copy,
  Download,
  Image as ImageIcon,
  Maximize2,
  Redo,
  RotateCcw,
  Scissors,
  Settings,
  Square,
  Trash2,
  Type,
  Undo,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  type ImageObject,
  type ShapeObject,
  type TextObject,
  useDocumentStore,
} from '../../stores/documentStore';
import { ExportModal } from '../export/ExportModal';
import { FormatSetupModal } from '../format/FormatSetupModal';
import { FoldGuideModal } from '../preview/FoldGuideModal';
import { LayersPanel } from './LayersPanel';
import { TransformBox } from './TransformBox';

export const EditorShell: React.FC = () => {
  const {
    title,
    setTitle,
    paper,
    margins,
    pages,
    activePageIndex,
    setActivePageIndex,
    selectedObjectId,
    setSelectedObjectId,
    addObject,
    updateObject,
    removeObject,
    duplicateObject,
    reorderPages,
    resetDocument,
    isAutosaved,
    checkSavedSession,
    restoreSavedSession,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useDocumentStore();

  const [viewMode, setViewMode] = useState<'page' | 'sheet'>('page');
  const [zoom, setZoom] = useState<number>(100);
  const [isSetupOpen, setIsSetupOpen] = useState<boolean>(false);
  const [isFoldGuideOpen, setIsFoldGuideOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [hasRestorableSession, setHasRestorableSession] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const activePage = pages[activePageIndex] ?? pages[0];
  const selectedObject = activePage.objects.find((o) => o.id === selectedObjectId) ?? null;

  // Check saved session on mount
  useEffect(() => {
    checkSavedSession().then((hasSaved) => {
      if (hasSaved) {
        setHasRestorableSession(true);
      }
    });
  }, [checkSavedSession]);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo()) redo();
        } else {
          if (canUndo()) undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        if (canRedo()) redo();
      }

      // Delete selected object
      if (!isInput && (e.key === 'Delete' || e.key === 'Backspace')) {
        if (selectedObjectId) {
          e.preventDefault();
          removeObject(activePageIndex, selectedObjectId);
        }
      }

      // Escape to deselect
      if (e.key === 'Escape') {
        setSelectedObjectId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    canUndo,
    canRedo,
    undo,
    redo,
    selectedObjectId,
    activePageIndex,
    removeObject,
    setSelectedObjectId,
  ]);

  // Add new Image object
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          const newImg: ImageObject = {
            id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type: 'image',
            imageDataUrl: dataUrl,
            imageFit: 'cover',
            xPercent: 0.1,
            yPercent: 0.1,
            wPercent: 0.8,
            hPercent: 0.5,
            rotation: 0,
            opacity: 1,
            locked: false,
            hidden: false,
          };
          addObject(activePageIndex, newImg);
        }
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };

  // Add new Text object
  const handleAddText = () => {
    const newText: TextObject = {
      id: `text-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'text',
      text: 'Double click to edit',
      fontSizePt: 14,
      color: '#121212',
      bold: false,
      xPercent: 0.15,
      yPercent: 0.35,
      wPercent: 0.7,
      hPercent: 0.12,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
    };
    addObject(activePageIndex, newText);
  };

  // Add new Shape object
  const handleAddShape = (shapeType: 'rect' | 'circle') => {
    const newShape: ShapeObject = {
      id: `shape-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'shape',
      shapeType,
      fillColor: '#f4f4ee',
      strokeColor: '#121212',
      strokeWidth: 2,
      xPercent: 0.2,
      yPercent: 0.4,
      wPercent: 0.5,
      hPercent: 0.25,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
    };
    addObject(activePageIndex, newShape);
  };

  const canvasWidthPx = (280 * zoom) / 100;
  const canvasHeightPx = (380 * zoom) / 100;

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
          {/* Undo / Redo */}
          <div className="flex items-center border border-chrome-border">
            <button
              type="button"
              disabled={!canUndo()}
              onClick={undo}
              className="p-1.5 hover:bg-paper disabled:opacity-30 transition-colors text-ink"
              title="Undo (Ctrl+Z)"
            >
              <Undo size={14} />
            </button>
            <button
              type="button"
              disabled={!canRedo()}
              onClick={redo}
              className="p-1.5 hover:bg-paper disabled:opacity-30 border-l border-chrome-border transition-colors text-ink"
              title="Redo (Ctrl+Shift+Z / Ctrl+Y)"
            >
              <Redo size={14} />
            </button>
          </div>

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
              if (
                window.confirm('Reset this zine and start over? All unsaved work will be cleared.')
              ) {
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
                    <div className="w-9 h-12 border border-dashed border-ink/30 bg-paper overflow-hidden flex items-center justify-center shrink-0 relative">
                      {p.objects.length > 0 ? (
                        <div className="text-[9px] text-ink/70 font-mono">
                          {p.objects.length} obj
                        </div>
                      ) : (
                        <span className="text-[9px] text-ink/40">p.{p.pageNumber}</span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs">
                        {p.pageNumber}.{' '}
                        {isCover ? 'Cover' : isBack ? 'Back' : `Page ${p.pageNumber}`}
                      </span>
                      <span className="text-[10px] text-ink/50">{p.objects.length} layers</span>
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
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: Canvas deselection */}
        <main
          className="flex-1 bg-paper/60 relative flex flex-col items-center justify-center p-8 overflow-auto"
          onClick={() => setSelectedObjectId(null)}
        >
          {/* Zoom controls */}
          <div className="absolute top-4 right-4 flex items-center gap-1 bg-chrome border border-chrome-border p-1 text-xs z-30">
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
            // biome-ignore lint/a11y/noStaticElementInteractions: Sheet click boundary
            // biome-ignore lint/a11y/useKeyWithClickEvents: Sheet click boundary
            <div
              ref={canvasRef}
              onClick={(e) => e.stopPropagation()}
              className="bg-paper xerox-border transition-all duration-150 flex flex-col justify-between relative overflow-hidden select-none"
              style={{
                width: `${canvasWidthPx}px`,
                height: `${canvasHeightPx}px`,
              }}
            >
              {/* Bleed outline */}
              <div className="absolute inset-2 border border-dashed border-spot/20 pointer-events-none z-10" />

              {/* Render all page objects */}
              {activePage.objects.map((obj) => {
                if (obj.hidden) return null;
                const isSelected = selectedObjectId === obj.id;

                const leftPx = obj.xPercent * canvasWidthPx;
                const topPx = obj.yPercent * canvasHeightPx;
                const widthPx = obj.wPercent * canvasWidthPx;
                const heightPx = obj.hPercent * canvasHeightPx;

                return (
                  // biome-ignore lint/a11y/noStaticElementInteractions: Interactive canvas object element
                  // biome-ignore lint/a11y/useKeyWithClickEvents: Interactive canvas object element
                  <div
                    key={obj.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedObjectId(obj.id);
                    }}
                    className={`absolute select-none pointer-events-auto cursor-pointer ${
                      isSelected ? 'ring-1 ring-spot/50' : ''
                    }`}
                    style={{
                      left: `${leftPx}px`,
                      top: `${topPx}px`,
                      width: `${widthPx}px`,
                      height: `${heightPx}px`,
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

                    {obj.type === 'image' && obj.imageDataUrl && (
                      <img
                        src={obj.imageDataUrl}
                        alt="Layer"
                        className={`w-full h-full pointer-events-none ${
                          obj.imageFit === 'contain' ? 'object-contain' : 'object-cover'
                        }`}
                      />
                    )}

                    {obj.type === 'text' && (
                      <div
                        className="w-full h-full whitespace-pre-wrap overflow-hidden"
                        style={{
                          color: obj.color,
                          fontWeight: obj.bold ? 'bold' : 'normal',
                          fontSize: `${Math.max(9, (obj.fontSizePt * zoom) / 100)}px`,
                        }}
                      >
                        {obj.text}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Interactive Transform Bounding Box */}
              {selectedObject && (
                <TransformBox
                  object={selectedObject}
                  zoom={zoom}
                  canvasWidthPx={canvasWidthPx}
                  canvasHeightPx={canvasHeightPx}
                />
              )}

              {/* Page Number Label */}
              <div className="absolute top-2 left-2 z-20 text-[9px] px-1.5 py-0.5 bg-paper/90 border border-chrome-border text-ink/70 pointer-events-none">
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
                      <div className="relative z-10 bg-paper/90 px-1 text-[10px] font-bold">
                        p.{pageNum}
                      </div>
                      <div className="text-[8px] text-ink/40">
                        {pData?.objects.length ?? 0} objs
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
                      <div className="relative z-10 bg-paper/90 px-1 text-[10px] font-bold">
                        {pageNum === 1
                          ? 'Cover (p.1)'
                          : pageNum === 8
                            ? 'Back (p.8)'
                            : `p.${pageNum}`}
                      </div>
                      <div className="text-[8px] text-ink/40">
                        {pData?.objects.length ?? 0} objs
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>

        {/* Right: Inspector */}
        <aside className="w-80 border-l border-chrome-border bg-chrome p-4 flex flex-col gap-4 overflow-y-auto">
          {/* Layers Panel */}
          <LayersPanel />

          {/* Selected Object Inspector */}
          {selectedObject ? (
            <div className="flex flex-col gap-3 text-xs border-t border-chrome-border pt-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-ink/60 uppercase font-bold">
                  Selected: {selectedObject.type}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => duplicateObject(activePageIndex, selectedObject.id)}
                    className="p-1 hover:bg-paper border border-chrome-border"
                    title="Duplicate"
                  >
                    <Copy size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeObject(activePageIndex, selectedObject.id)}
                    className="p-1 text-red-500 hover:bg-red-500/10 border border-chrome-border"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Text specific props */}
              {selectedObject.type === 'text' && (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={selectedObject.text}
                    onChange={(e) =>
                      updateObject(activePageIndex, selectedObject.id, { text: e.target.value })
                    }
                    className="w-full p-2 border border-chrome-border bg-paper text-xs text-ink font-mono"
                    rows={3}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-ink/60 block mb-1">Font Size (pt)</span>
                      <input
                        type="number"
                        min={8}
                        max={72}
                        value={selectedObject.fontSizePt}
                        onChange={(e) =>
                          updateObject(activePageIndex, selectedObject.id, {
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
                          updateObject(activePageIndex, selectedObject.id, {
                            bold: !selectedObject.bold,
                          })
                        }
                        className={`w-full p-1 border font-bold ${
                          selectedObject.bold
                            ? 'border-spot bg-spot text-spot-contrast'
                            : 'border-chrome-border'
                        }`}
                      >
                        Bold
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Image specific props */}
              {selectedObject.type === 'image' && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-ink/60">Image Fitting</span>
                    <div className="flex border border-chrome-border text-[11px]">
                      <button
                        type="button"
                        onClick={() =>
                          updateObject(activePageIndex, selectedObject.id, { imageFit: 'cover' })
                        }
                        className={`px-2 py-0.5 ${
                          selectedObject.imageFit === 'cover'
                            ? 'bg-spot text-spot-contrast font-bold'
                            : ''
                        }`}
                      >
                        Cover
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateObject(activePageIndex, selectedObject.id, { imageFit: 'contain' })
                        }
                        className={`px-2 py-0.5 border-l border-chrome-border ${
                          selectedObject.imageFit === 'contain'
                            ? 'bg-spot text-spot-contrast font-bold'
                            : ''
                        }`}
                      >
                        Contain
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Shape specific props */}
              {selectedObject.type === 'shape' && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-ink/60">Shape Fill</span>
                    <input
                      type="color"
                      value={selectedObject.fillColor || '#f4f4ee'}
                      onChange={(e) =>
                        updateObject(activePageIndex, selectedObject.id, {
                          fillColor: e.target.value,
                        })
                      }
                      className="w-8 h-6 p-0 border border-chrome-border cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-ink/60">Border Color</span>
                    <input
                      type="color"
                      value={selectedObject.strokeColor || '#121212'}
                      onChange={(e) =>
                        updateObject(activePageIndex, selectedObject.id, {
                          strokeColor: e.target.value,
                        })
                      }
                      className="w-8 h-6 p-0 border border-chrome-border cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Opacity slider */}
              <div className="flex flex-col gap-1 pt-1">
                <div className="flex justify-between text-[10px] text-ink/60">
                  <span>Opacity</span>
                  <span>{Math.round(selectedObject.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={selectedObject.opacity}
                  onChange={(e) =>
                    updateObject(activePageIndex, selectedObject.id, {
                      opacity: Number(e.target.value),
                    })
                  }
                  className="w-full accent-spot"
                />
              </div>
            </div>
          ) : (
            <div className="text-xs text-ink/50 text-center p-4 border border-dashed border-chrome-border">
              Click an object on the canvas or pick a layer to inspect properties.
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
          <span>Add Image</span>
        </button>

        <button
          type="button"
          onClick={handleAddText}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-chrome-border hover:border-spot bg-paper text-xs font-bold"
        >
          <Type size={14} className="text-spot" />
          <span>Add Text</span>
        </button>

        <button
          type="button"
          onClick={() => handleAddShape('rect')}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-chrome-border hover:border-spot bg-paper text-xs font-bold"
        >
          <Square size={14} className="text-spot" />
          <span>Add Rectangle</span>
        </button>

        <button
          type="button"
          onClick={() => handleAddShape('circle')}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-chrome-border hover:border-spot bg-paper text-xs font-bold"
        >
          <Circle size={14} className="text-spot" />
          <span>Add Circle</span>
        </button>

        <button
          type="button"
          onClick={() => setIsSetupOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-chrome-border hover:border-spot bg-paper text-xs"
        >
          <Settings size={14} />
          <span>Options</span>
        </button>
      </footer>

      {/* Modals */}
      <FormatSetupModal isOpen={isSetupOpen} onClose={() => setIsSetupOpen(false)} />
      <FoldGuideModal isOpen={isFoldGuideOpen} onClose={() => setIsFoldGuideOpen(false)} />
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
    </div>
  );
};

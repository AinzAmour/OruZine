import { SIGNATURE_LOOKS } from '@oruzine/filters';
import { FORMAT_REGISTRY, MINI_8_FORMAT } from '@oruzine/formats';
import { impose } from '@oruzine/imposition';
import {
  AlignCenter,
  AlignEndVertical,
  AlignJustify,
  AlignLeft,
  AlignRight,
  AlignStartVertical,
  AlignVerticalSpaceAround,
  ArrowLeft,
  ArrowRight,
  Bold,
  BookOpen,
  CheckCircle2,
  Circle,
  Copy,
  Download,
  FlipHorizontal,
  FlipVertical,
  FolderOpen,
  Grid,
  Image as ImageIcon,
  Italic,
  Maximize2,
  Redo,
  RotateCcw,
  Save,
  Scissors,
  Settings,
  Sliders,
  Sparkles,
  Square,
  Trash2,
  Type,
  Underline,
  Undo,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  type ImageMask,
  type ImageObject,
  type ShapeObject,
  type TextAlign,
  type TextObject,
  useDocumentStore,
} from '../../stores/documentStore';
import { isHeicFile, processImageFile } from '../../utils/imageLoader';
import { CollagePaletteModal } from '../collage/CollagePaletteModal';
import { ImageCutoutModal } from '../collage/ImageCutoutModal';
import { StickerView } from '../collage/StickerView';
import { ExportModal } from '../export/ExportModal';
import { FilterStackModal, type FilterStackTarget } from '../filters/FilterStackModal';
import { FormatSetupModal } from '../format/FormatSetupModal';
import { LooksModal } from '../looks/LooksModal';
import { FlipbookReader } from '../preview/FlipbookReader';
import { FoldGuideModal } from '../preview/FoldGuideModal';
import {
  downloadProjectFile,
  exportProjectToZip,
  importProjectFromZip,
} from '../project/projectFileManager';
import { TemplateGalleryModal } from '../templates/TemplateGalleryModal';
import { LayersPanel } from './LayersPanel';
import { TransformBox } from './TransformBox';

export const EditorShell: React.FC = () => {
  const {
    title,
    setTitle,
    formatId,
    paper,
    margins,
    bleedMm,
    creepMm,
    rtl,
    pages,
    activePageIndex,
    setActivePageIndex,
    selectedObjectId,
    setSelectedObjectId,
    addObject,
    updateObject,
    removeObject,
    duplicateObject,
    alignObject,
    nudgeObject,
    reorderPages,
    resetDocument,
    isAutosaved,
    checkSavedSession,
    restoreSavedSession,
    undo,
    redo,
    canUndo,
    canRedo,
    activeLookId,
  } = useDocumentStore();

  const [viewMode, setViewMode] = useState<'page' | 'flipbook' | 'sheet'>('page');
  const [previewSheetIndex, setPreviewSheetIndex] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(100);
  const [isSetupOpen, setIsSetupOpen] = useState<boolean>(false);
  const [isLooksModalOpen, setIsLooksModalOpen] = useState<boolean>(false);
  const [isFoldGuideOpen, setIsFoldGuideOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isCollagePaletteOpen, setIsCollagePaletteOpen] = useState<boolean>(false);
  const [isCutoutModalOpen, setIsCutoutModalOpen] = useState<boolean>(false);
  const [isTemplateGalleryOpen, setIsTemplateGalleryOpen] = useState<boolean>(false);
  const [filterModalTarget, setFilterModalTarget] = useState<FilterStackTarget | null>(null);

  const [isConvertingHeic, setIsConvertingHeic] = useState<boolean>(false);
  const [showSafetyMargins, setShowSafetyMargins] = useState<boolean>(true);
  const [showGridDots, setShowGridDots] = useState<boolean>(false);
  const [isDraggingOverCanvas, setIsDraggingOverCanvas] = useState<boolean>(false);

  const activeFormat = FORMAT_REGISTRY[formatId] || MINI_8_FORMAT;
  const plan = impose(activeFormat, pages.length, {
    paper,
    margins,
    bleedMm,
    creepMm,
    rtl,
  });
  const currentSheet =
    plan.sheets[Math.min(previewSheetIndex, plan.sheets.length - 1)] || plan.sheets[0];
  const [hasRestorableSession, setHasRestorableSession] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectFileInputRef = useRef<HTMLInputElement>(null);
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

  // Global Keyboard shortcuts & Object Nudging
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

      // Arrow keys nudging selected object
      if (!isInput && selectedObjectId) {
        const step = e.shiftKey ? 0.04 : 0.01;
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          nudgeObject(activePageIndex, selectedObjectId, -step, 0);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          nudgeObject(activePageIndex, selectedObjectId, step, 0);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          nudgeObject(activePageIndex, selectedObjectId, 0, -step);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          nudgeObject(activePageIndex, selectedObjectId, 0, step);
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
    nudgeObject,
    setSelectedObjectId,
  ]);

  // Process and add image file (with Apple HEIC/HEIF decoding support)
  const handleImageFile = async (file: File) => {
    const isHeic = isHeicFile(file);
    if (isHeic) setIsConvertingHeic(true);

    try {
      const { dataUrl } = await processImageFile(file);
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
        flipX: false,
        flipY: false,
      };
      addObject(activePageIndex, newImg);
    } catch (err) {
      console.error('Image import failed:', err);
      alert(err instanceof Error ? err.message : 'Could not import image file.');
    } finally {
      if (isHeic) setIsConvertingHeic(false);
    }
  };

  // Add new Image object from file picker
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleImageFile(file);
    }
    if (e.target) e.target.value = '';
  };

  // Drag and drop onto canvas
  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverCanvas(true);
  };

  const handleCanvasDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverCanvas(false);
  };

  const handleCanvasDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverCanvas(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('image/') || isHeicFile(file))) {
      await handleImageFile(file);
    }
  };

  // Export .oruzine project file (ZIP containing document.json + image blobs)
  const handleSaveProject = async () => {
    try {
      const state = useDocumentStore.getState();
      const zipBlob = await exportProjectToZip(state);
      downloadProjectFile(zipBlob, state.title);
    } catch (err) {
      console.error('Failed to export project archive:', err);
      alert('Could not export project file. Please try again.');
    }
  };

  // Import .oruzine project file
  const handleProjectFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const restored = await importProjectFromZip(file);
      useDocumentStore.getState().loadDocument(restored);
      setActivePageIndex(0);
    } catch (err) {
      console.error('Failed to import project archive:', err);
      alert(`Failed to import project file: ${err instanceof Error ? err.message : String(err)}`);
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
              Page Edit
            </button>
            <button
              type="button"
              onClick={() => setViewMode('flipbook')}
              className={`px-2.5 py-1 border-l border-chrome-border transition-colors ${
                viewMode === 'flipbook' ? 'bg-spot text-spot-contrast font-bold' : 'hover:bg-paper'
              }`}
              title="Virtual 3D Flip-Book / Two-Page Spread Reader"
            >
              Flipbook Reader 📖
            </button>
            <button
              type="button"
              onClick={() => setViewMode('sheet')}
              className={`px-2.5 py-1 border-l border-chrome-border transition-colors ${
                viewMode === 'sheet' ? 'bg-spot text-spot-contrast font-bold' : 'hover:bg-paper'
              }`}
            >
              Imposed Sheet 🖨️
            </button>
          </div>

          {/* Starter Templates */}
          <button
            type="button"
            onClick={() => setIsTemplateGalleryOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 border border-chrome-border text-xs hover:bg-paper transition-colors"
            title="Choose from starter zine templates"
          >
            <BookOpen size={13} className="text-spot" />
            <span>Templates</span>
          </button>

          {/* Signature Looks */}
          <button
            type="button"
            onClick={() => setIsLooksModalOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 border text-xs transition-colors ${
              activeLookId
                ? 'border-spot bg-spot text-spot-contrast font-bold'
                : 'border-chrome-border hover:bg-paper'
            }`}
            title="Apply authentic 1-click print-culture Look"
          >
            <Sparkles size={13} className={activeLookId ? 'text-spot-contrast' : 'text-spot'} />
            <span>
              {activeLookId
                ? `${SIGNATURE_LOOKS.find((l) => l.id === activeLookId)?.name || 'Look'}`
                : 'Looks'}
            </span>
          </button>

          {/* How to fold guide */}
          <button
            type="button"
            onClick={() => setIsFoldGuideOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 border border-chrome-border text-xs hover:bg-paper transition-colors"
          >
            <Scissors size={13} className="text-spot" />
            <span>How to Fold</span>
          </button>

          {/* Save .oruzine Project Archive */}
          <button
            type="button"
            onClick={handleSaveProject}
            className="flex items-center gap-1.5 px-2.5 py-1 border border-chrome-border text-xs hover:bg-paper transition-colors"
            title="Save portable .oruzine project archive (ZIP with images)"
          >
            <Save size={13} className="text-spot" />
            <span>Save .oruzine</span>
          </button>

          {/* Open .oruzine Project Archive */}
          <button
            type="button"
            onClick={() => projectFileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1 border border-chrome-border text-xs hover:bg-paper transition-colors"
            title="Open existing .oruzine project archive"
          >
            <FolderOpen size={13} className="text-spot" />
            <span>Open</span>
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
              const isBack = p.pageNumber === pages.length;
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
          {/* Quick Object Alignment Bar (when an object is selected in page view) */}
          {viewMode === 'page' && selectedObjectId && (
            // biome-ignore lint/a11y/useKeyWithClickEvents: Toolbar container event isolation
            // biome-ignore lint/a11y/noStaticElementInteractions: Toolbar container event isolation
            <div
              className="absolute top-4 left-6 flex items-center gap-1 bg-chrome border border-chrome-border p-1 text-xs z-30 shadow-sm animate-in fade-in duration-100"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-[10px] uppercase font-bold text-ink/60 px-1">Align:</span>
              <button
                type="button"
                onClick={() => alignObject(activePageIndex, selectedObjectId, 'left')}
                className="p-1 hover:bg-paper border border-transparent hover:border-chrome-border"
                title="Align Left"
              >
                <AlignLeft size={13} />
              </button>
              <button
                type="button"
                onClick={() => alignObject(activePageIndex, selectedObjectId, 'center')}
                className="p-1 hover:bg-paper border border-transparent hover:border-chrome-border"
                title="Center Horizontally"
              >
                <AlignCenter size={13} />
              </button>
              <button
                type="button"
                onClick={() => alignObject(activePageIndex, selectedObjectId, 'right')}
                className="p-1 hover:bg-paper border border-transparent hover:border-chrome-border"
                title="Align Right"
              >
                <AlignRight size={13} />
              </button>
              <div className="h-3 w-px bg-chrome-border mx-0.5" />
              <button
                type="button"
                onClick={() => alignObject(activePageIndex, selectedObjectId, 'top')}
                className="p-1 hover:bg-paper border border-transparent hover:border-chrome-border"
                title="Align Top"
              >
                <AlignStartVertical size={13} />
              </button>
              <button
                type="button"
                onClick={() => alignObject(activePageIndex, selectedObjectId, 'middle')}
                className="p-1 hover:bg-paper border border-transparent hover:border-chrome-border"
                title="Center Vertically"
              >
                <AlignVerticalSpaceAround size={13} />
              </button>
              <button
                type="button"
                onClick={() => alignObject(activePageIndex, selectedObjectId, 'bottom')}
                className="p-1 hover:bg-paper border border-transparent hover:border-chrome-border"
                title="Align Bottom"
              >
                <AlignEndVertical size={13} />
              </button>
              <div className="h-3 w-px bg-chrome-border mx-0.5" />
              <button
                type="button"
                onClick={() => alignObject(activePageIndex, selectedObjectId, 'fit-width')}
                className="px-1.5 py-0.5 text-[10px] font-mono hover:bg-paper font-bold border border-transparent hover:border-chrome-border"
                title="Fit to Page Width"
              >
                Fit W
              </button>
              <button
                type="button"
                onClick={() => alignObject(activePageIndex, selectedObjectId, 'fit-page')}
                className="px-1.5 py-0.5 text-[10px] font-mono hover:bg-paper font-bold border border-transparent hover:border-chrome-border"
                title="Fill Page"
              >
                Fill
              </button>
            </div>
          )}

          {/* HEIC Conversion Floating Indicator */}
          {isConvertingHeic && (
            <div className="absolute top-16 z-40 bg-amber-300 text-black px-4 py-2 border-2 border-black font-mono text-xs font-bold shadow-lg animate-pulse flex items-center gap-2">
              <span>Converting Apple HEIC/HEIF photo to high-res JPG...</span>
            </div>
          )}

          {/* Canvas Guides & Zoom controls */}
          <div className="absolute top-4 right-4 flex items-center gap-1 bg-chrome border border-chrome-border p-1 text-xs z-30">
            {viewMode === 'page' && (
              <>
                <button
                  type="button"
                  onClick={() => setShowSafetyMargins((m) => !m)}
                  className={`px-2 py-0.5 font-mono text-[10px] font-bold border transition-colors ${
                    showSafetyMargins
                      ? 'border-spot bg-spot/10 text-spot'
                      : 'border-transparent text-ink/60 hover:bg-paper'
                  }`}
                  title="Toggle Margin Safety Area"
                >
                  Margins
                </button>
                <button
                  type="button"
                  onClick={() => setShowGridDots((g) => !g)}
                  className={`p-1 border transition-colors ${
                    showGridDots
                      ? 'border-spot bg-spot/10 text-spot'
                      : 'border-transparent text-ink/60 hover:bg-paper'
                  }`}
                  title="Toggle Dot Grid Pattern"
                >
                  <Grid size={13} />
                </button>
                <div className="h-3 w-px bg-chrome-border mx-0.5" />
              </>
            )}

            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              className="p-1 hover:bg-paper"
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <span className="px-2 font-mono text-[11px]">{zoom}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(200, z + 10))}
              className="p-1 hover:bg-paper"
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
            <button
              type="button"
              onClick={() => setZoom(100)}
              className="p-1 hover:bg-paper border-l border-chrome-border"
              title="Reset Zoom (100%)"
            >
              <Maximize2 size={13} />
            </button>
          </div>

          {/* Active Canvas / Flipbook / Sheet Switch */}
          {viewMode === 'page' ? (
            // biome-ignore lint/a11y/noStaticElementInteractions: Sheet click boundary
            // biome-ignore lint/a11y/useKeyWithClickEvents: Sheet click boundary
            <div
              ref={canvasRef}
              onClick={(e) => e.stopPropagation()}
              onDragOver={handleCanvasDragOver}
              onDragLeave={handleCanvasDragLeave}
              onDrop={handleCanvasDrop}
              className="xerox-border transition-all duration-150 flex flex-col justify-between relative overflow-hidden select-none"
              style={{
                width: `${canvasWidthPx}px`,
                height: `${canvasHeightPx}px`,
                backgroundColor: activePage.backgroundColor || '#ffffff',
                backgroundImage: showGridDots
                  ? 'radial-gradient(circle, rgba(0,0,0,0.15) 1px, transparent 1px)'
                  : undefined,
                backgroundSize: showGridDots ? '14px 14px' : undefined,
              }}
            >
              {/* Drag over overlay */}
              {isDraggingOverCanvas && (
                <div className="absolute inset-0 z-40 bg-spot/20 border-4 border-dashed border-spot flex items-center justify-center font-bold text-xs bg-paper/80 font-mono text-spot">
                  Drop Image Here (PNG, JPG, HEIC, WebP, SVG)
                </div>
              )}

              {/* Bleed & Margin Safety Guides */}
              {showSafetyMargins && (
                <div className="absolute inset-2 border border-dashed border-spot/30 pointer-events-none z-10" />
              )}

              {/* Page Overlays live preview */}
              {activePage.pageOverlays?.map((ovl) => (
                <div
                  key={ovl.id}
                  className="absolute inset-0 pointer-events-none z-15"
                  style={{
                    opacity: ovl.opacity * 0.7,
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
                          alt="Layer"
                          className={`w-full h-full pointer-events-none ${
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
                  : activePage.pageNumber === pages.length
                    ? '• Back'
                    : ''}
              </div>
            </div>
          ) : viewMode === 'flipbook' ? (
            /* Virtual 3D Flipbook Reader */
            <FlipbookReader
              onEditPage={(idx) => {
                setActivePageIndex(idx);
                setViewMode('page');
              }}
            />
          ) : (
            /* Imposed Sheet View Preview */
            <div
              className="bg-paper xerox-border p-4 transition-all duration-150 flex flex-col gap-2 select-none"
              style={{
                width: `${(640 * zoom) / 100}px`,
                height: `${(440 * zoom) / 100}px`,
              }}
            >
              <div className="text-[10px] text-ink/70 flex items-center justify-between pb-1 border-b border-chrome-border">
                <span className="font-bold">
                  {activeFormat.name.toUpperCase()} IMPOSITION
                  {plan.sheets.length > 1 &&
                    ` • SHEET ${previewSheetIndex + 1}/${plan.sheets.length} (${currentSheet.side.toUpperCase()})`}
                </span>
                {plan.sheets.length > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={previewSheetIndex === 0}
                      onClick={() => setPreviewSheetIndex((i) => Math.max(0, i - 1))}
                      className="px-2 py-0.5 border border-chrome-border disabled:opacity-40 hover:bg-chrome text-[9px]"
                    >
                      Prev Sheet
                    </button>
                    <button
                      type="button"
                      disabled={previewSheetIndex >= plan.sheets.length - 1}
                      onClick={() =>
                        setPreviewSheetIndex((i) => Math.min(plan.sheets.length - 1, i + 1))
                      }
                      className="px-2 py-0.5 border border-chrome-border disabled:opacity-40 hover:bg-chrome text-[9px]"
                    >
                      Next Sheet
                    </button>
                  </div>
                )}
              </div>

              {/* Sheet container */}
              <div className="flex-1 relative bg-chrome/20 border border-chrome-border overflow-hidden">
                {/* Render Fold Lines */}
                {activeFormat.foldLines.map((fl) => (
                  <div
                    key={`fold-${fl.x1}-${fl.y1}-${fl.x2}-${fl.y2}`}
                    className="absolute border-dashed border-gray-400 pointer-events-none"
                    style={{
                      left: `${fl.x1 * 100}%`,
                      top: `${fl.y1 * 100}%`,
                      width: fl.x1 === fl.x2 ? '1px' : `${(fl.x2 - fl.x1) * 100}%`,
                      height: fl.y1 === fl.y2 ? '1px' : `${(fl.y2 - fl.y1) * 100}%`,
                      borderTopWidth: fl.y1 === fl.y2 ? '1px' : 0,
                      borderLeftWidth: fl.x1 === fl.x2 ? '1px' : 0,
                    }}
                  />
                ))}

                {/* Render Cut Lines */}
                {activeFormat.cutLines.map((cl) => (
                  <div
                    key={`cut-${cl.x1}-${cl.y1}-${cl.x2}-${cl.y2}`}
                    className="absolute border-spot pointer-events-none"
                    style={{
                      left: `${cl.x1 * 100}%`,
                      top: `${cl.y1 * 100}%`,
                      width: cl.x1 === cl.x2 ? '2px' : `${(cl.x2 - cl.x1) * 100}%`,
                      height: cl.y1 === cl.y2 ? '2px' : `${(cl.y2 - cl.y1) * 100}%`,
                      borderTopWidth: cl.y1 === cl.y2 ? '2px' : 0,
                      borderLeftWidth: cl.x1 === cl.x2 ? '2px' : 0,
                    }}
                  />
                ))}

                {/* Imposed Cells */}
                {currentSheet.cells.map((cell) => {
                  const pData = cell.page ? pages.find((p) => p.pageNumber === cell.page) : null;
                  return (
                    <div
                      key={`cell-${cell.col}-${cell.row}-${cell.page ?? 'blank'}`}
                      className="absolute border border-chrome-border bg-paper flex flex-col items-center justify-center p-2 overflow-hidden shadow-sm"
                      style={{
                        left: `${cell.normalized.x * 100}%`,
                        top: `${cell.normalized.y * 100}%`,
                        width: `${cell.normalized.w * 100}%`,
                        height: `${cell.normalized.h * 100}%`,
                        transform: `rotate(${cell.rotation}deg)`,
                        transformOrigin: 'center center',
                      }}
                    >
                      {cell.page ? (
                        <>
                          <div className="relative z-10 bg-paper/90 px-1 text-[10px] font-bold">
                            {cell.page === 1
                              ? 'Cover (p.1)'
                              : cell.page === pages.length
                                ? `Back (p.${pages.length})`
                                : `p.${cell.page}`}
                          </div>
                          <div className="text-[8px] text-ink/40">
                            {pData?.objects.length ?? 0} objs
                          </div>
                        </>
                      ) : (
                        <div className="text-[9px] text-ink/30 italic">Blank</div>
                      )}
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

              {/* Object Alignment Tools */}
              <div className="flex flex-col gap-1.5 p-2 bg-chrome border border-chrome-border">
                <span className="text-[10px] text-ink/70 font-bold uppercase">
                  Align Object on Page
                </span>
                <div className="grid grid-cols-4 gap-1">
                  <button
                    type="button"
                    onClick={() => alignObject(activePageIndex, selectedObject.id, 'left')}
                    className="p-1 border border-chrome-border hover:bg-paper flex items-center justify-center gap-1 text-[10px]"
                    title="Align Left (Margin)"
                  >
                    <AlignLeft size={12} />
                    <span>Left</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => alignObject(activePageIndex, selectedObject.id, 'center')}
                    className="p-1 border border-chrome-border hover:bg-paper flex items-center justify-center gap-1 text-[10px]"
                    title="Center Horizontally"
                  >
                    <AlignCenter size={12} />
                    <span>Center</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => alignObject(activePageIndex, selectedObject.id, 'right')}
                    className="p-1 border border-chrome-border hover:bg-paper flex items-center justify-center gap-1 text-[10px]"
                    title="Align Right"
                  >
                    <AlignRight size={12} />
                    <span>Right</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => alignObject(activePageIndex, selectedObject.id, 'fit-width')}
                    className="p-1 border border-chrome-border hover:bg-paper flex items-center justify-center text-[10px] font-bold"
                    title="Fit to Page Width"
                  >
                    Fit W
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  <button
                    type="button"
                    onClick={() => alignObject(activePageIndex, selectedObject.id, 'top')}
                    className="p-1 border border-chrome-border hover:bg-paper flex items-center justify-center gap-1 text-[10px]"
                    title="Align Top"
                  >
                    <AlignStartVertical size={12} />
                    <span>Top</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => alignObject(activePageIndex, selectedObject.id, 'middle')}
                    className="p-1 border border-chrome-border hover:bg-paper flex items-center justify-center gap-1 text-[10px]"
                    title="Center Vertically"
                  >
                    <AlignVerticalSpaceAround size={12} />
                    <span>Middle</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => alignObject(activePageIndex, selectedObject.id, 'bottom')}
                    className="p-1 border border-chrome-border hover:bg-paper flex items-center justify-center gap-1 text-[10px]"
                    title="Align Bottom"
                  >
                    <AlignEndVertical size={12} />
                    <span>Bottom</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => alignObject(activePageIndex, selectedObject.id, 'fit-page')}
                    className="p-1 border border-chrome-border hover:bg-paper flex items-center justify-center text-[10px] font-bold"
                    title="Fill Entire Page"
                  >
                    Fill
                  </button>
                </div>
              </div>

              {/* Text specific props & Rich Typography */}
              {selectedObject.type === 'text' && (
                <div className="flex flex-col gap-2.5">
                  <span className="text-[10px] text-ink/70 font-bold uppercase">
                    Text Typography
                  </span>
                  <textarea
                    value={selectedObject.text}
                    onChange={(e) =>
                      updateObject(activePageIndex, selectedObject.id, { text: e.target.value })
                    }
                    className="w-full p-2 border border-chrome-border bg-paper text-xs text-ink font-mono"
                    rows={3}
                    placeholder="Type text here..."
                  />

                  {/* Text Alignment */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-ink/60">Text Alignment</span>
                    <div className="grid grid-cols-4 gap-1">
                      {(['left', 'center', 'right', 'justify'] as TextAlign[]).map((al) => (
                        <button
                          key={al}
                          type="button"
                          onClick={() =>
                            updateObject(activePageIndex, selectedObject.id, { align: al })
                          }
                          className={`p-1.5 border flex items-center justify-center transition-colors ${
                            (selectedObject.align || 'left') === al
                              ? 'border-spot bg-spot text-spot-contrast font-bold'
                              : 'border-chrome-border hover:bg-paper'
                          }`}
                          title={`Align ${al}`}
                        >
                          {al === 'left' && <AlignLeft size={13} />}
                          {al === 'center' && <AlignCenter size={13} />}
                          {al === 'right' && <AlignRight size={13} />}
                          {al === 'justify' && <AlignJustify size={13} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Family */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-ink/60">Font Family</span>
                    <select
                      value={selectedObject.fontFamily || 'monospace'}
                      onChange={(e) =>
                        updateObject(activePageIndex, selectedObject.id, {
                          fontFamily: e.target.value,
                        })
                      }
                      className="p-1 border border-chrome-border bg-paper text-xs text-ink"
                    >
                      <option value="monospace">Typewriter / Monospace</option>
                      <option value="sans-serif">Clean Sans / Modernist</option>
                      <option value="serif">Classic Editorial Serif</option>
                      <option value="'Impact', sans-serif">Riot Poster Headline (Impact)</option>
                      <option value="'Courier New', monospace">Teleprinter / Courier</option>
                    </select>
                  </div>

                  {/* Font Size & Styles */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-ink/60 block mb-1">Size (pt)</span>
                      <input
                        type="number"
                        min={8}
                        max={96}
                        value={selectedObject.fontSizePt}
                        onChange={(e) =>
                          updateObject(activePageIndex, selectedObject.id, {
                            fontSizePt: Number(e.target.value),
                          })
                        }
                        className="w-full p-1 border border-chrome-border bg-paper text-xs font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-ink/60 block mb-1">Styles</span>
                      <div className="flex border border-chrome-border">
                        <button
                          type="button"
                          onClick={() =>
                            updateObject(activePageIndex, selectedObject.id, {
                              bold: !selectedObject.bold,
                            })
                          }
                          className={`flex-1 p-1 text-center font-bold ${
                            selectedObject.bold ? 'bg-spot text-spot-contrast' : 'hover:bg-paper'
                          }`}
                          title="Bold"
                        >
                          <Bold size={11} className="mx-auto" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateObject(activePageIndex, selectedObject.id, {
                              italic: !selectedObject.italic,
                            })
                          }
                          className={`flex-1 p-1 text-center border-l border-chrome-border italic ${
                            selectedObject.italic ? 'bg-spot text-spot-contrast' : 'hover:bg-paper'
                          }`}
                          title="Italic"
                        >
                          <Italic size={11} className="mx-auto" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateObject(activePageIndex, selectedObject.id, {
                              underline: !selectedObject.underline,
                            })
                          }
                          className={`flex-1 p-1 text-center border-l border-chrome-border underline ${
                            selectedObject.underline
                              ? 'bg-spot text-spot-contrast'
                              : 'hover:bg-paper'
                          }`}
                          title="Underline"
                        >
                          <Underline size={11} className="mx-auto" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Text Color & Highlight Background */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-ink/60 block mb-1">Text Color</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={selectedObject.color || '#121212'}
                          onChange={(e) =>
                            updateObject(activePageIndex, selectedObject.id, {
                              color: e.target.value,
                            })
                          }
                          className="w-6 h-6 border border-chrome-border p-0 bg-transparent cursor-pointer"
                        />
                        <span className="font-mono text-[10px]">
                          {selectedObject.color || '#121212'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-ink/60 block mb-1">Highlight Box</span>
                      <div className="flex items-center gap-1">
                        {[
                          { label: 'None', color: 'transparent' },
                          { label: 'Yellow', color: '#fff568' },
                          { label: 'Black', color: '#111111' },
                          { label: 'Pink', color: '#ff2d6b' },
                          { label: 'White', color: '#ffffff' },
                        ].map((c) => (
                          <button
                            key={c.label}
                            type="button"
                            onClick={() =>
                              updateObject(activePageIndex, selectedObject.id, {
                                backgroundColor: c.color,
                              })
                            }
                            className={`w-4 h-4 border border-black/40 rounded-sm ${
                              (selectedObject.backgroundColor || 'transparent') === c.color
                                ? 'ring-2 ring-spot'
                                : ''
                            }`}
                            style={{
                              backgroundColor: c.color === 'transparent' ? '#eee' : c.color,
                            }}
                            title={c.label}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Image specific props */}
              {selectedObject.type === 'image' && (
                <div className="flex flex-col gap-3">
                  {/* Flip Controls */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-ink/60 font-bold uppercase">
                      Image Direction
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          updateObject(activePageIndex, selectedObject.id, {
                            flipX: !selectedObject.flipX,
                          })
                        }
                        className={`px-2 py-1 border text-[10px] flex items-center gap-1 ${
                          selectedObject.flipX
                            ? 'border-spot bg-spot text-spot-contrast font-bold'
                            : 'border-chrome-border hover:bg-paper'
                        }`}
                        title="Flip Horizontal"
                      >
                        <FlipHorizontal size={12} />
                        <span>Flip H</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateObject(activePageIndex, selectedObject.id, {
                            flipY: !selectedObject.flipY,
                          })
                        }
                        className={`px-2 py-1 border text-[10px] flex items-center gap-1 ${
                          selectedObject.flipY
                            ? 'border-spot bg-spot text-spot-contrast font-bold'
                            : 'border-chrome-border hover:bg-paper'
                        }`}
                        title="Flip Vertical"
                      >
                        <FlipVertical size={12} />
                        <span>Flip V</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-ink/60 font-bold uppercase">
                      Image Fitting
                    </span>
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

                  {/* Print Filters & Shaders */}
                  <button
                    type="button"
                    onClick={() =>
                      setFilterModalTarget({
                        type: 'object',
                        objectId: selectedObject.id,
                        pageIndex: activePageIndex,
                        title: 'Selected Image',
                      })
                    }
                    className="w-full flex items-center justify-center gap-2 py-1.5 px-3 border border-chrome-border hover:border-spot bg-paper text-xs font-bold transition-colors"
                  >
                    <Sliders size={13} className="text-spot" />
                    <span>
                      Print Filters & Shaders{' '}
                      {selectedObject.filters && selectedObject.filters.length > 0
                        ? `(${selectedObject.filters.filter((f) => f.enabled).length})`
                        : ''}
                    </span>
                  </button>

                  {/* AI Cutout & Eraser Button */}
                  <button
                    type="button"
                    onClick={() => setIsCutoutModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-spot/10 border border-spot text-spot text-xs font-bold hover:bg-spot hover:text-spot-contrast transition-colors"
                  >
                    <Scissors size={14} />
                    <span>AI Cutout & Magic Wand</span>
                  </button>

                  {/* Mask Shape */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-ink/60 font-bold uppercase">Shape Mask</span>
                    <div className="grid grid-cols-5 gap-1 text-[10px]">
                      {(['none', 'circle', 'star', 'stamp', 'torn-edge'] as ImageMask[]).map(
                        (m) => (
                          <button
                            type="button"
                            key={m}
                            onClick={() =>
                              updateObject(activePageIndex, selectedObject.id, { mask: m })
                            }
                            className={`px-1 py-1 border capitalize truncate ${
                              (selectedObject.mask ?? 'none') === m
                                ? 'border-spot bg-spot text-spot-contrast font-bold'
                                : 'border-chrome-border hover:bg-paper'
                            }`}
                          >
                            {m === 'torn-edge' ? 'Torn' : m}
                          </button>
                        ),
                      )}
                    </div>
                  </div>

                  {/* Paper Drop Shadow Toggle */}
                  <div className="flex items-center justify-between border-t border-chrome-border pt-2">
                    <span className="text-[10px] text-ink/60">Paper Cut Shadow</span>
                    <button
                      type="button"
                      onClick={() =>
                        updateObject(activePageIndex, selectedObject.id, {
                          paperShadow: !selectedObject.paperShadow,
                        })
                      }
                      className={`px-2 py-0.5 text-[11px] border font-bold ${
                        selectedObject.paperShadow
                          ? 'border-spot bg-spot text-spot-contrast'
                          : 'border-chrome-border text-ink/60'
                      }`}
                    >
                      {selectedObject.paperShadow ? 'ON' : 'OFF'}
                    </button>
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
            <div className="flex flex-col gap-3">
              <div className="text-xs text-ink/50 text-center p-4 border border-dashed border-chrome-border">
                Click an object on the canvas or pick a layer to inspect properties.
              </div>

              {/* Page-wide print filters */}
              <div className="border-t border-chrome-border pt-3 flex flex-col gap-2">
                <span className="text-[10px] text-ink/60 uppercase font-bold">
                  Page Print Treatment
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setFilterModalTarget({
                      type: 'page',
                      pageIndex: activePageIndex,
                      title: `Page ${activePage.pageNumber}`,
                    })
                  }
                  className="w-full flex items-center justify-center gap-2 py-1.5 px-3 border border-chrome-border hover:border-spot bg-paper text-xs font-bold transition-colors"
                >
                  <Sliders size={13} className="text-spot" />
                  <span>
                    Page Filter Stack{' '}
                    {activePage.pageFilters && activePage.pageFilters.length > 0
                      ? `(${activePage.pageFilters.filter((f) => f.enabled).length})`
                      : ''}
                  </span>
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Hidden Image File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageFileChange}
        accept="image/*,.heic,.heif,.HEIC,.HEIF"
        className="hidden"
      />

      {/* Hidden Project Archive File Input (.oruzine) */}
      <input
        type="file"
        ref={projectFileInputRef}
        onChange={handleProjectFileChange}
        accept=".oruzine,.zip,application/zip,application/json"
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
          onClick={() => setIsCollagePaletteOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-chrome-border hover:border-spot bg-paper text-xs font-bold"
        >
          <Sparkles size={14} className="text-spot" />
          <span>Tape & Stickers</span>
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
      <CollagePaletteModal
        isOpen={isCollagePaletteOpen}
        onClose={() => setIsCollagePaletteOpen(false)}
      />
      <ImageCutoutModal
        isOpen={isCutoutModalOpen}
        onClose={() => setIsCutoutModalOpen(false)}
        object={selectedObject?.type === 'image' ? selectedObject : null}
      />
      <FilterStackModal
        isOpen={!!filterModalTarget}
        onClose={() => setFilterModalTarget(null)}
        target={filterModalTarget}
      />
      <LooksModal isOpen={isLooksModalOpen} onClose={() => setIsLooksModalOpen(false)} />
      <TemplateGalleryModal
        isOpen={isTemplateGalleryOpen}
        onClose={() => setIsTemplateGalleryOpen(false)}
      />
    </div>
  );
};

import {
  Download,
  Eye,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  Maximize2,
  PenTool,
  Redo,
  Sparkles,
  Square,
  Type,
  Undo,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

export const EditorShell: React.FC = () => {
  const [activePage, setActivePage] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'page' | 'sheet'>('page');
  const [zoom, setZoom] = useState<number>(100);

  const pages = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="flex flex-col h-[calc(100vh-53px)] font-mono text-ink bg-paper select-none">
      {/* Top Editor Bar */}
      <div className="border-b border-chrome-border bg-chrome px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <input
            type="text"
            defaultValue="Untitled Zine"
            className="bg-transparent border-b border-dashed border-ink/40 px-1 py-0.5 text-xs font-bold text-ink focus:outline-none focus:border-spot"
          />
          <span className="text-xs text-ink/50">8-Page Mini (Letter)</span>
        </div>

        <div className="flex items-center gap-2">
          {/* History */}
          <div className="flex items-center border border-chrome-border">
            <button
              type="button"
              disabled
              className="p-1.5 hover:bg-paper disabled:opacity-30 transition-colors text-ink"
              title="Undo (Ctrl+Z)"
            >
              <Undo size={14} />
            </button>
            <button
              type="button"
              disabled
              className="p-1.5 hover:bg-paper disabled:opacity-30 border-l border-chrome-border transition-colors text-ink"
              title="Redo (Ctrl+Shift+Z)"
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

          {/* Actions */}
          <button
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1 border border-chrome-border text-xs hover:bg-paper transition-colors"
          >
            <Eye size={13} />
            <span>Preview</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1 bg-ink text-paper font-bold text-xs hover:opacity-90 transition-opacity"
          >
            <Download size={13} />
            <span>Export</span>
          </button>

          <button
            type="button"
            className="p-1.5 border border-chrome-border hover:bg-paper transition-colors text-ink"
          >
            <HelpCircle size={14} />
          </button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Filmstrip */}
        <aside className="w-56 border-r border-chrome-border bg-chrome p-3 flex flex-col gap-2 overflow-y-auto">
          <div className="flex items-center justify-between text-xs text-ink/70 pb-2 border-b border-chrome-border">
            <span>PAGES (READER ORDER)</span>
            <span className="font-bold">{pages.length}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {pages.map((p) => {
              const isCover = p === 1;
              const isBack = p === 8;
              const isSelected = activePage === p;

              return (
                <button
                  type="button"
                  key={p}
                  onClick={() => setActivePage(p)}
                  className={`flex flex-col items-center p-2 border transition-all text-xs ${
                    isSelected
                      ? 'border-spot bg-spot/10 font-bold spot-shadow'
                      : 'border-chrome-border hover:border-ink/50 bg-paper'
                  }`}
                >
                  <div className="w-full aspect-[3/4] border border-dashed border-ink/20 flex items-center justify-center text-[10px] text-ink/60 mb-1">
                    {isCover ? 'Cover' : isBack ? 'Back' : `p.${p}`}
                  </div>
                  <span className="text-[10px]">
                    {p}. {isCover ? 'Front' : isBack ? 'Back' : `Page ${p}`}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Center: Canvas Workspace */}
        <main className="flex-1 bg-paper/60 relative flex flex-col items-center justify-center p-8 overflow-hidden">
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
              className="bg-paper xerox-border transition-all duration-150 flex flex-col justify-between p-6 relative"
              style={{
                width: `${(280 * zoom) / 100}px`,
                height: `${(380 * zoom) / 100}px`,
              }}
            >
              <div className="absolute inset-3 border border-dashed border-spot/30 pointer-events-none" />
              <div className="text-[10px] text-ink/40 uppercase tracking-widest">
                Page {activePage}{' '}
                {activePage === 1 ? '— Front Cover' : activePage === 8 ? '— Back Cover' : ''}
              </div>

              <div className="flex-1 flex items-center justify-center text-center p-4">
                <div className="border-2 border-dashed border-chrome-border p-8 w-full h-full flex flex-col items-center justify-center gap-2 text-ink/50 hover:border-spot transition-colors cursor-pointer">
                  <ImageIcon size={28} className="text-spot" />
                  <span className="text-xs font-bold">DROP IMAGE HERE</span>
                  <span className="text-[10px]">or click to browse</span>
                </div>
              </div>

              <div className="text-[10px] text-ink/40 flex justify-between">
                <span>Safe Margin (5mm)</span>
                <span>Bleed (3mm)</span>
              </div>
            </div>
          ) : (
            /* Imposed Sheet View Preview */
            <div
              className="bg-paper xerox-border p-4 transition-all duration-150 flex flex-col gap-2"
              style={{
                width: `${(560 * zoom) / 100}px`,
                height: `${(380 * zoom) / 100}px`,
              }}
            >
              <div className="text-[10px] text-ink/40 flex items-center justify-between pb-1 border-b border-chrome-border">
                <span>8-PAGE MINI ZINE IMPOSITION (PRINTER SHEET)</span>
                <span className="text-spot font-bold">1 SHEET • CUT MIDDLE 2 PANELS</span>
              </div>

              {/* 4 cols x 2 rows grid */}
              <div className="grid grid-cols-4 grid-rows-2 gap-1 flex-1">
                {/* Top row rotated 180 */}
                {[5, 4, 3, 2].map((p) => (
                  <div
                    key={p}
                    className="border border-chrome-border bg-chrome/40 flex flex-col items-center justify-center text-xs relative rotate-180"
                  >
                    <span className="text-ink/80 font-bold">p.{p}</span>
                    <span className="text-[8px] text-ink/50">180°</span>
                  </div>
                ))}
                {/* Bottom row upright */}
                {[6, 7, 8, 1].map((p) => (
                  <div
                    key={p}
                    className="border border-chrome-border bg-chrome/40 flex flex-col items-center justify-center text-xs relative"
                  >
                    <span className="text-ink/80 font-bold">
                      {p === 1 ? 'Cover (p.1)' : p === 8 ? 'Back (p.8)' : `p.${p}`}
                    </span>
                    <span className="text-[8px] text-ink/50">0°</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Right: Inspector */}
        <aside className="w-64 border-l border-chrome-border bg-chrome p-4 flex flex-col gap-4 overflow-y-auto">
          <div className="flex items-center justify-between text-xs text-ink/70 pb-2 border-b border-chrome-border">
            <span>PAGE INSPECTOR</span>
            <Layers size={13} />
          </div>

          <div className="flex flex-col gap-3 text-xs">
            <div>
              <span className="text-[10px] text-ink/60 uppercase block mb-1">Page Number</span>
              <div className="p-2 border border-chrome-border bg-paper font-bold">
                Page {activePage} of 8
              </div>
            </div>

            <div>
              <label
                htmlFor="layout-preset-select"
                className="text-[10px] text-ink/60 uppercase block mb-1"
              >
                Layout Preset
              </label>
              <select
                id="layout-preset-select"
                className="w-full p-1.5 border border-chrome-border bg-paper text-xs text-ink focus:outline-none focus:border-spot"
              >
                <option>Full-Bleed Photo</option>
                <option>Photo + Caption</option>
                <option>2-Up Collage</option>
                <option>Text Only (Poetry)</option>
              </select>
            </div>

            <div>
              <span className="text-[10px] text-ink/60 uppercase block mb-1">Filters & Look</span>
              <div className="p-3 border border-dashed border-chrome-border bg-paper text-center text-ink/60 text-[11px]">
                No active filter stack
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom Tool Palette */}
      <footer className="border-t border-chrome-border bg-chrome px-4 py-2 flex items-center justify-center gap-3">
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 border border-chrome-border hover:border-spot bg-paper text-xs"
        >
          <ImageIcon size={14} className="text-spot" />
          <span>Add Image</span>
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 border border-chrome-border hover:border-spot bg-paper text-xs"
        >
          <Type size={14} className="text-spot" />
          <span>Add Text</span>
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 border border-chrome-border hover:border-spot bg-paper text-xs"
        >
          <Square size={14} className="text-spot" />
          <span>Shape</span>
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 border border-chrome-border hover:border-spot bg-paper text-xs"
        >
          <PenTool size={14} className="text-spot" />
          <span>Draw</span>
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 border border-spot/40 bg-spot/10 text-ink text-xs font-bold"
        >
          <Sparkles size={14} className="text-spot" />
          <span>AI Cutout</span>
        </button>
      </footer>
    </div>
  );
};

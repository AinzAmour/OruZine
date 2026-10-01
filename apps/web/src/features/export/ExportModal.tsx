import {
  type ExportPageData,
  generateImposedPdf,
  renderImposedSheetToCanvas,
} from '@oruzine/export';
import { MINI_8_FORMAT } from '@oruzine/formats';
import { impose } from '@oruzine/imposition';
import { AlertCircle, Download, Loader2, Printer, X } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { useDocumentStore } from '../../stores/documentStore';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { title, paper, margins, bleedMm, rtl, pages } = useDocumentStore();

  const [exportFormat, setExportFormat] = useState<'pdf' | 'jpg' | 'png'>('pdf');
  const [dpi, setDpi] = useState<number>(300);
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [grayscale, setGrayscale] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setErrorMsg(null);

    try {
      const plan = impose(MINI_8_FORMAT, 8, {
        paper,
        margins,
        bleedMm,
        rtl,
      });

      // Prepare image elements asynchronously
      const preparedPages: ExportPageData[] = await Promise.all(
        pages.map(async (p) => {
          let imgEl: HTMLImageElement | null = null;
          if (p.imageDataUrl) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = p.imageDataUrl;
            await new Promise((res) => {
              img.onload = () => res(null);
              img.onerror = () => res(null);
            });
            imgEl = img;
          }

          return {
            pageNumber: p.pageNumber,
            backgroundColor: '#ffffff',
            imageElement: imgEl,
            imageFit: p.imageFit,
            textBoxes: p.textBoxes.map((b) => ({
              id: b.id,
              text: b.text,
              xPercent: b.xPercent,
              yPercent: b.yPercent,
              fontSizePt: b.fontSizePt,
              color: b.color,
              bold: b.bold,
            })),
          };
        }),
      );

      const filename = `${title.toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'oruzine'}_imposed`;

      if (exportFormat === 'pdf') {
        const pdfBytes = await generateImposedPdf(MINI_8_FORMAT, preparedPages, plan, {
          dpi,
          showGuides,
          grayscale,
          rtl,
        });

        // Trigger PDF file download
        const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // JPG or PNG sheet export
        const canvas = await renderImposedSheetToCanvas(MINI_8_FORMAT, preparedPages, plan, {
          dpi,
          showGuides,
          grayscale,
          rtl,
        });

        const mime = exportFormat === 'jpg' ? 'image/jpeg' : 'image/png';
        const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, mime, 0.95));

        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${filename}.${exportFormat}`;
          a.click();
          URL.revokeObjectURL(url);
        }
      }

      onClose();
    } catch (err: unknown) {
      console.error('Export error:', err);
      const msg =
        err instanceof Error
          ? err.message
          : 'Export failed. Please check browser memory and try again.';
      setErrorMsg(msg);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 select-none">
      <div className="bg-paper xerox-border w-full max-w-md p-6 flex flex-col gap-6 text-ink font-mono animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-chrome-border pb-3">
          <div className="flex items-center gap-2">
            <Printer size={18} className="text-spot" />
            <h2 className="text-base font-bold tracking-tight">EXPORT PRINT-READY ZINE</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-chrome border border-chrome-border"
          >
            <X size={16} />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500 text-red-600 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex flex-col gap-4 text-xs">
          {/* Format selection */}
          <div className="flex flex-col gap-1.5">
            <span className="font-bold text-ink/70 uppercase">File Format</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setExportFormat('pdf')}
                className={`p-2.5 border font-bold flex flex-col items-center gap-1 ${
                  exportFormat === 'pdf'
                    ? 'border-spot bg-spot/10 text-spot'
                    : 'border-chrome-border hover:bg-chrome'
                }`}
              >
                <span>PDF (Print)</span>
                <span className="text-[9px] font-normal text-ink/60">100% Scale</span>
              </button>
              <button
                type="button"
                onClick={() => setExportFormat('jpg')}
                className={`p-2.5 border font-bold flex flex-col items-center gap-1 ${
                  exportFormat === 'jpg'
                    ? 'border-spot bg-spot/10 text-spot'
                    : 'border-chrome-border hover:bg-chrome'
                }`}
              >
                <span>JPG Image</span>
                <span className="text-[9px] font-normal text-ink/60">Single Sheet</span>
              </button>
              <button
                type="button"
                onClick={() => setExportFormat('png')}
                className={`p-2.5 border font-bold flex flex-col items-center gap-1 ${
                  exportFormat === 'png'
                    ? 'border-spot bg-spot/10 text-spot'
                    : 'border-chrome-border hover:bg-chrome'
                }`}
              >
                <span>PNG Image</span>
                <span className="text-[9px] font-normal text-ink/60">Lossless</span>
              </button>
            </div>
          </div>

          {/* Resolution DPI */}
          <div className="flex flex-col gap-1.5">
            <span className="font-bold text-ink/70 uppercase">Print Resolution</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDpi(150)}
                className={`p-2 border ${
                  dpi === 150
                    ? 'border-spot bg-spot/10 text-spot font-bold'
                    : 'border-chrome-border'
                }`}
              >
                150 DPI (Fast)
              </button>
              <button
                type="button"
                onClick={() => setDpi(300)}
                className={`p-2 border ${
                  dpi === 300
                    ? 'border-spot bg-spot/10 text-spot font-bold'
                    : 'border-chrome-border'
                }`}
              >
                300 DPI (Press)
              </button>
              <button
                type="button"
                onClick={() => setDpi(600)}
                className={`p-2 border ${
                  dpi === 600
                    ? 'border-spot bg-spot/10 text-spot font-bold'
                    : 'border-chrome-border'
                }`}
              >
                600 DPI (Ultra)
              </button>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-col gap-2 pt-2 border-t border-chrome-border">
            <label className="flex items-center justify-between cursor-pointer py-1">
              <span>Include Fold & Cut Guides</span>
              <input
                type="checkbox"
                checked={showGuides}
                onChange={(e) => setShowGuides(e.target.checked)}
                className="w-4 h-4 accent-spot"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer py-1">
              <span>B&W Printer Mode</span>
              <input
                type="checkbox"
                checked={grayscale}
                onChange={(e) => setGrayscale(e.target.checked)}
                className="w-4 h-4 accent-spot"
              />
            </label>
          </div>

          {/* Home Printer Notice */}
          <div className="p-3 bg-chrome border border-chrome-border text-[11px] text-ink/80 leading-relaxed">
            <strong className="text-spot block mb-0.5">⚠️ Home Printer Tip:</strong>
            When printing the exported PDF, select <strong>"Actual Size"</strong> or{' '}
            <strong>"100%"</strong> in your printer dialog — <em>never</em> choose "Fit to Printable
            Area" or the folds will be misaligned!
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-chrome-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-chrome-border text-xs hover:bg-chrome"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 bg-spot text-spot-contrast font-bold text-xs hover:opacity-90 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Rendering {dpi} DPI...</span>
              </>
            ) : (
              <>
                <Download size={14} />
                <span>Download {exportFormat.toUpperCase()}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

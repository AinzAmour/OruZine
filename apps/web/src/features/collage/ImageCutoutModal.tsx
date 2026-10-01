import { applyTornEdgeToCanvas, magicWandCutout, removeBackgroundAuto } from '@oruzine/ai';
import { Check, Eraser, Loader2, RotateCcw, Scissors, Sparkles, Wand2, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { type ImageObject, useDocumentStore } from '../../stores/documentStore';

interface ImageCutoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  object: ImageObject | null;
}

export const ImageCutoutModal: React.FC<ImageCutoutModalProps> = ({ isOpen, onClose, object }) => {
  const { activePageIndex, updateObject } = useDocumentStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [tool, setTool] = useState<'wand' | 'brush' | 'auto'>('auto');
  const [tolerance, setTolerance] = useState<number>(25);
  const [brushSize, setBrushSize] = useState<number>(20);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [paperShadow, setPaperShadow] = useState<boolean>(object?.paperShadow ?? true);
  const [originalDataUrl, setOriginalDataUrl] = useState<string | null>(null);

  // Initialize canvas when modal opens
  useEffect(() => {
    if (!isOpen || !object?.imageDataUrl) return;

    setOriginalDataUrl(object.imageDataUrl);
    setPaperShadow(object.paperShadow ?? true);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = object.imageDataUrl;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      }
    };
  }, [isOpen, object]);

  if (!isOpen || !object?.imageDataUrl) return null;

  // Auto AI Background Removal
  const handleAutoCutout = async () => {
    if (!canvasRef.current) return;
    setIsProcessing(true);
    setProgressMsg('Analyzing edges and contrast...');

    try {
      const resultDataUrl = await removeBackgroundAuto(canvasRef.current, {
        tolerance,
        feather: 1,
        onProgress: (_p: number, msg: string) => setProgressMsg(msg),
      });

      const img = new Image();
      img.src = resultDataUrl;
      await new Promise((res) => {
        img.onload = res;
      });

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        }
      }
    } catch (err) {
      console.error('Cutout error:', err);
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  // Torn Edge Cutout
  const handleTornEdge = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    applyTornEdgeToCanvas(canvas, 10);
  };

  // Reset to original image
  const handleReset = () => {
    if (!originalDataUrl || !canvasRef.current) return;
    const img = new Image();
    img.src = originalDataUrl;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      }
    };
  };

  // Canvas interactive pointer events (Magic wand click & brush erasing)
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || isProcessing) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const startX = Math.floor((e.clientX - rect.left) * scaleX);
    const startY = Math.floor((e.clientY - rect.top) * scaleY);

    if (tool === 'wand') {
      magicWandCutout(canvas, startX, startY, tolerance);
      return;
    }

    if (tool === 'brush') {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const erase = (clientX: number, clientY: number) => {
        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, brushSize * (scaleX / 2), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      erase(e.clientX, e.clientY);

      const onMouseMove = (moveEvent: MouseEvent) => {
        erase(moveEvent.clientX, moveEvent.clientY);
      };

      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
  };

  // Apply cutout and update document store
  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cutoutDataUrl = canvas.toDataURL('image/png');
    updateObject(activePageIndex, object.id, {
      imageDataUrl: cutoutDataUrl,
      paperShadow,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 select-none">
      <div className="bg-paper xerox-border w-full max-w-3xl p-6 flex flex-col gap-4 text-ink font-mono animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-chrome-border pb-3">
          <div className="flex items-center gap-2">
            <Scissors size={18} className="text-spot" />
            <h2 className="text-sm font-bold tracking-tight">COLLAGE CUTOUT & AI ERASER STUDIO</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-chrome border border-chrome-border"
          >
            <X size={16} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-chrome border border-chrome-border text-xs">
          <div className="flex items-center gap-1.5">
            {/* Auto AI Background removal */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleAutoCutout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-spot text-spot-contrast font-bold hover:opacity-90 disabled:opacity-50"
              title="Automatically remove background"
            >
              {isProcessing ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Sparkles size={13} />
              )}
              <span>Auto Magic Cutout</span>
            </button>

            {/* Magic Wand tool */}
            <button
              type="button"
              onClick={() => setTool('wand')}
              className={`flex items-center gap-1 px-3 py-1.5 border font-bold ${
                tool === 'wand'
                  ? 'border-spot bg-spot/20 text-spot'
                  : 'border-chrome-border bg-paper hover:bg-chrome'
              }`}
              title="Click on background color to erase connected area"
            >
              <Wand2 size={13} />
              <span>Magic Wand</span>
            </button>

            {/* Eraser Brush */}
            <button
              type="button"
              onClick={() => setTool('brush')}
              className={`flex items-center gap-1 px-3 py-1.5 border font-bold ${
                tool === 'brush'
                  ? 'border-spot bg-spot/20 text-spot'
                  : 'border-chrome-border bg-paper hover:bg-chrome'
              }`}
              title="Paint to erase background"
            >
              <Eraser size={13} />
              <span>Eraser Brush</span>
            </button>

            {/* Torn Edge filter */}
            <button
              type="button"
              onClick={handleTornEdge}
              className="flex items-center gap-1 px-2.5 py-1.5 border border-chrome-border bg-paper hover:bg-chrome"
              title="Make edges ragged and torn like real magazine scraps"
            >
              <span>Torn Edges</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 px-2.5 py-1.5 border border-chrome-border hover:bg-paper text-ink/70"
              title="Reset to original image"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Sliders bar */}
        <div className="flex items-center gap-6 px-2 text-[11px] text-ink/80">
          <div className="flex items-center gap-2">
            <span>Color Tolerance:</span>
            <input
              type="range"
              min="5"
              max="70"
              value={tolerance}
              onChange={(e) => setTolerance(Number(e.target.value))}
              className="w-24 accent-spot h-1.5 cursor-pointer"
            />
            <span className="font-bold">{tolerance}%</span>
          </div>

          {tool === 'brush' && (
            <div className="flex items-center gap-2">
              <span>Brush Size:</span>
              <input
                type="range"
                min="5"
                max="60"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-24 accent-spot h-1.5 cursor-pointer"
              />
              <span className="font-bold">{brushSize}px</span>
            </div>
          )}

          <label className="flex items-center gap-1.5 ml-auto cursor-pointer">
            <input
              type="checkbox"
              checked={paperShadow}
              onChange={(e) => setPaperShadow(e.target.checked)}
              className="w-3.5 h-3.5 accent-spot"
            />
            <span>Paper Drop Shadow</span>
          </label>
        </div>

        {/* Canvas Workspace Area */}
        <div className="flex-1 bg-neutral-900/10 border border-chrome-border relative flex items-center justify-center p-4 min-h-[300px] max-h-[460px] overflow-auto">
          {/* Checkered transparency background pattern */}
          <div
            className="relative border border-ink/20 shadow-md"
            style={{
              backgroundImage:
                'linear-gradient(45deg, #e5e5e5 25%, transparent 25%), linear-gradient(-45deg, #e5e5e5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e5e5 75%), linear-gradient(-45deg, transparent 75%, #e5e5e5 75%)',
              backgroundSize: '16px 16px',
              backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
            }}
          >
            <canvas
              ref={canvasRef}
              onMouseDown={handleCanvasMouseDown}
              className={`max-w-full max-h-[420px] object-contain block ${
                tool === 'wand'
                  ? 'cursor-crosshair'
                  : tool === 'brush'
                    ? 'cursor-cell'
                    : 'cursor-default'
              }`}
            />
          </div>

          {isProcessing && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-paper text-xs font-mono">
              <Loader2 size={24} className="animate-spin text-spot" />
              <span>{progressMsg || 'Processing cutout...'}</span>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between border-t border-chrome-border pt-3">
          <div className="text-[11px] text-ink/60">
            {tool === 'wand'
              ? '💡 Tip: Click background areas to erase matching colors.'
              : tool === 'brush'
                ? '💡 Tip: Click & drag to erase pixels with the brush.'
                : '💡 Tip: Click Auto Magic Cutout for instant client-side subject separation.'}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-chrome-border text-xs hover:bg-chrome"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-1.5 px-5 py-2 bg-spot text-spot-contrast font-bold text-xs hover:opacity-90"
            >
              <Check size={14} />
              <span>Apply Cutout to Zine</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

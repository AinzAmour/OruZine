import { Check, Crop as CropIcon, RotateCcw, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { type ImageObject, useDocumentStore } from '../../stores/documentStore';

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  object: ImageObject | null;
}

type AspectRatioPreset = 'free' | '1:1' | '4:3' | '16:9' | 'page';

export const ImageCropModal: React.FC<ImageCropModalProps> = ({ isOpen, onClose, object }) => {
  const { activePageIndex, updateObject } = useDocumentStore();
  const sourceImageRef = useRef<HTMLImageElement | null>(null);

  // Crop box normalized coords [0..1] relative to the displayed image area
  const [crop, setCrop] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  }>({
    x: 0.05,
    y: 0.05,
    w: 0.9,
    h: 0.9,
  });

  const [preset, setPreset] = useState<AspectRatioPreset>('free');
  const [imgNaturalSize, setImgNaturalSize] = useState<{
    width: number;
    height: number;
  }>({ width: 800, height: 600 });
  const [rawImageSrc, setRawImageSrc] = useState<string>('');

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen || !object?.imageDataUrl) return;

    // Use original image if previously cropped, otherwise current data URL
    const srcToUse = object.originalImageDataUrl || object.imageDataUrl;
    setRawImageSrc(srcToUse);

    const img = new Image();
    img.src = srcToUse;
    img.onload = () => {
      setImgNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      // Reset crop to standard 90% centered box
      setCrop({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });
      setPreset('free');
    };
  }, [isOpen, object]);

  if (!isOpen || !object || !rawImageSrc) return null;

  // Apply aspect ratio constraints to current crop
  const applyPresetRatio = (p: AspectRatioPreset) => {
    setPreset(p);
    if (p === 'free') return;

    let targetRatio = 1.0;
    if (p === '1:1') targetRatio = 1.0;
    else if (p === '4:3') targetRatio = 4 / 3;
    else if (p === '16:9') targetRatio = 16 / 9;
    else if (p === 'page') targetRatio = 1 / Math.SQRT2; // Portrait zine page ratio

    // Calculate new dimensions in normalized coordinates accounting for image aspect ratio
    const imgAspect = imgNaturalSize.width / imgNaturalSize.height;
    // targetRatio is width/height in visual space
    // visual ratio = (crop.w * imgAspect) / crop.h = targetRatio
    let newW = 0.8;
    let newH = (newW * imgAspect) / targetRatio;

    if (newH > 0.9) {
      newH = 0.85;
      newW = (newH * targetRatio) / imgAspect;
    }

    newW = Math.min(0.95, Math.max(0.1, newW));
    newH = Math.min(0.95, Math.max(0.1, newH));

    setCrop({
      x: Math.max(0, (1 - newW) / 2),
      y: Math.max(0, (1 - newH) / 2),
      w: newW,
      h: newH,
    });
  };

  // Drag handles
  const handleCropHandleStart = (
    e: React.MouseEvent,
    handle: 'nw' | 'ne' | 'se' | 'sw' | 'top' | 'bottom' | 'left' | 'right' | 'move',
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const initialCrop = { ...crop };
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const boxW = rect.width;
    const boxH = rect.height;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - startMouseX) / boxW;
      const deltaY = (moveEvent.clientY - startMouseY) / boxH;

      let { x, y, w, h } = initialCrop;

      if (handle === 'move') {
        x = Math.max(0, Math.min(1 - w, initialCrop.x + deltaX));
        y = Math.max(0, Math.min(1 - h, initialCrop.y + deltaY));
      } else {
        if (handle.includes('e')) {
          w = Math.max(0.08, Math.min(1 - x, initialCrop.w + deltaX));
        }
        if (handle.includes('w')) {
          const maxLeftShift = initialCrop.x + initialCrop.w - 0.08;
          x = Math.max(0, Math.min(maxLeftShift, initialCrop.x + deltaX));
          w = initialCrop.w + (initialCrop.x - x);
        }
        if (handle.includes('s') || handle === 'bottom') {
          h = Math.max(0.08, Math.min(1 - y, initialCrop.h + deltaY));
        }
        if (handle.includes('n') || handle === 'top') {
          const maxTopShift = initialCrop.y + initialCrop.h - 0.08;
          y = Math.max(0, Math.min(maxTopShift, initialCrop.y + deltaY));
          h = initialCrop.h + (initialCrop.y - y);
        }
        if (handle === 'right') {
          w = Math.max(0.08, Math.min(1 - x, initialCrop.w + deltaX));
        }
        if (handle === 'left') {
          const maxLeftShift = initialCrop.x + initialCrop.w - 0.08;
          x = Math.max(0, Math.min(maxLeftShift, initialCrop.x + deltaX));
          w = initialCrop.w + (initialCrop.x - x);
        }
      }

      setCrop({
        x: Number(x.toFixed(4)),
        y: Number(y.toFixed(4)),
        w: Number(w.toFixed(4)),
        h: Number(h.toFixed(4)),
      });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Perform canvas crop and save
  const handleApplyCrop = () => {
    const img = sourceImageRef.current;
    if (!img) return;

    const sourceX = crop.x * imgNaturalSize.width;
    const sourceY = crop.y * imgNaturalSize.height;
    const sourceW = crop.w * imgNaturalSize.width;
    const sourceH = crop.h * imgNaturalSize.height;

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(sourceW));
    canvas.height = Math.max(1, Math.round(sourceH));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, 0, 0, canvas.width, canvas.height);

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.94);

    // Save cropped data url, keeping original for non-destructive future re-crops
    updateObject(activePageIndex, object.id, {
      imageDataUrl: croppedDataUrl,
      originalImageDataUrl: object.originalImageDataUrl || rawImageSrc,
      cropRect: { x: crop.x, y: crop.y, width: crop.w, height: crop.h },
    });

    onClose();
  };

  // Reset to full uncropped original
  const handleResetToOriginal = () => {
    setCrop({ x: 0, y: 0, w: 1, h: 1 });
    setPreset('free');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-zinc-900 border-2 border-zinc-700 text-white rounded-lg shadow-2xl flex flex-col w-full max-w-4xl h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2">
            <CropIcon size={18} className="text-amber-400" />
            <h2 className="font-mono text-sm font-bold tracking-wider uppercase text-zinc-100">
              Canva-Style Photo Crop & Frame
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar: Aspect Ratios & Zoom */}
        <div className="flex flex-wrap items-center justify-between px-5 py-2.5 bg-zinc-900 border-b border-zinc-800 text-xs gap-3">
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-zinc-400 text-[11px] uppercase mr-1">Aspect:</span>
            {(['free', '1:1', '4:3', '16:9', 'page'] as AspectRatioPreset[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => applyPresetRatio(p)}
                className={`px-2.5 py-1 border rounded text-[11px] font-bold uppercase transition-colors ${
                  preset === p
                    ? 'border-amber-400 bg-amber-400 text-black'
                    : 'border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {p === 'page' ? 'Page Aspect' : p}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 font-mono">
            <button
              type="button"
              onClick={handleResetToOriginal}
              className="flex items-center gap-1 px-2.5 py-1 border border-zinc-700 hover:border-zinc-500 rounded bg-zinc-800 text-zinc-300 hover:text-white text-[11px]"
              title="Reset Crop to Full Photo"
            >
              <RotateCcw size={12} />
              <span>Full Photo</span>
            </button>
          </div>
        </div>

        {/* Main Crop Area */}
        <div className="flex-1 bg-zinc-950 flex items-center justify-center p-6 overflow-hidden relative select-none">
          <div
            ref={containerRef}
            className="relative max-w-full max-h-full flex items-center justify-center"
            style={{
              width: `${Math.min(650, (650 * imgNaturalSize.width) / Math.max(imgNaturalSize.height, 1))}px`,
              aspectRatio: `${imgNaturalSize.width} / ${imgNaturalSize.height}`,
            }}
          >
            {/* Background Dimmed Full Image */}
            <img
              ref={sourceImageRef}
              src={rawImageSrc}
              alt="Source for crop"
              className="w-full h-full object-contain pointer-events-none opacity-40 filter brightness-50"
            />

            {/* Clear Cropped Region Preview Overlay */}
            {/* biome-ignore lint/a11y/noStaticElementInteractions: Crop box movement */}
            <div
              className="absolute overflow-hidden shadow-2xl border-2 border-amber-400 cursor-move"
              onMouseDown={(e) => handleCropHandleStart(e, 'move')}
              style={{
                left: `${crop.x * 100}%`,
                top: `${crop.y * 100}%`,
                width: `${crop.w * 100}%`,
                height: `${crop.h * 100}%`,
              }}
            >
              {/* Full Image offset within crop frame */}
              <div
                className="absolute pointer-events-none"
                style={{
                  left: `-${(crop.x / crop.w) * 100}%`,
                  top: `-${(crop.y / crop.h) * 100}%`,
                  width: `${(1 / crop.w) * 100}%`,
                  height: `${(1 / crop.h) * 100}%`,
                }}
              >
                <img
                  src={rawImageSrc}
                  alt="Cropped preview"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Rule of Thirds Grid Lines */}
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-60">
                <div className="border-r border-b border-white/40" />
                <div className="border-r border-b border-white/40" />
                <div className="border-b border-white/40" />
                <div className="border-r border-b border-white/40" />
                <div className="border-r border-b border-white/40" />
                <div className="border-b border-white/40" />
                <div className="border-r border-white/40" />
                <div className="border-r border-white/40" />
                <div />
              </div>

              {/* Corner Canva-style L-bracket handles */}
              <button
                type="button"
                aria-label="Crop top-left"
                className="absolute -top-1.5 -left-1.5 w-5 h-5 border-t-4 border-l-4 border-amber-400 bg-transparent cursor-nw-resize z-20 p-0"
                onMouseDown={(e) => handleCropHandleStart(e, 'nw')}
              />
              <button
                type="button"
                aria-label="Crop top-right"
                className="absolute -top-1.5 -right-1.5 w-5 h-5 border-t-4 border-r-4 border-amber-400 bg-transparent cursor-ne-resize z-20 p-0"
                onMouseDown={(e) => handleCropHandleStart(e, 'ne')}
              />
              <button
                type="button"
                aria-label="Crop bottom-left"
                className="absolute -bottom-1.5 -left-1.5 w-5 h-5 border-b-4 border-l-4 border-amber-400 bg-transparent cursor-sw-resize z-20 p-0"
                onMouseDown={(e) => handleCropHandleStart(e, 'sw')}
              />
              <button
                type="button"
                aria-label="Crop bottom-right"
                className="absolute -bottom-1.5 -right-1.5 w-5 h-5 border-b-4 border-r-4 border-amber-400 bg-transparent cursor-se-resize z-20 p-0"
                onMouseDown={(e) => handleCropHandleStart(e, 'se')}
              />

              {/* Edge handles */}
              <button
                type="button"
                aria-label="Crop top"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-amber-400 border-0 cursor-n-resize z-20 rounded p-0"
                onMouseDown={(e) => handleCropHandleStart(e, 'top')}
              />
              <button
                type="button"
                aria-label="Crop bottom"
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-amber-400 border-0 cursor-s-resize z-20 rounded p-0"
                onMouseDown={(e) => handleCropHandleStart(e, 'bottom')}
              />
              <button
                type="button"
                aria-label="Crop left"
                className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1.5 bg-amber-400 border-0 cursor-w-resize z-20 rounded p-0"
                onMouseDown={(e) => handleCropHandleStart(e, 'left')}
              />
              <button
                type="button"
                aria-label="Crop right"
                className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-1.5 bg-amber-400 border-0 cursor-e-resize z-20 rounded p-0"
                onMouseDown={(e) => handleCropHandleStart(e, 'right')}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800 bg-zinc-950 font-mono text-xs">
          <div className="text-zinc-500 text-[11px]">
            Drag handles to crop • Drag inside frame to reposition
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white rounded"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyCrop}
              className="flex items-center gap-1.5 px-5 py-1.5 bg-amber-400 hover:bg-amber-300 text-black font-bold rounded shadow transition-colors"
            >
              <Check size={14} />
              <span>Apply Crop</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

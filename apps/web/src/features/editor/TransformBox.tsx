import { RotateCw } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { useDocumentStore, type ZineObject } from '../../stores/documentStore';

interface TransformBoxProps {
  object: ZineObject;
  zoom?: number;
  canvasWidthPx: number;
  canvasHeightPx: number;
}

export const TransformBox: React.FC<TransformBoxProps> = ({
  object,
  zoom: _zoom,
  canvasWidthPx,
  canvasHeightPx,
}) => {
  const { activePageIndex, updateObject } = useDocumentStore();
  const [_isRotating, setIsRotating] = useState(false);
  const [snappedX, setSnappedX] = useState(false);
  const [snappedY, setSnappedY] = useState(false);

  const boxX = object.xPercent * canvasWidthPx;
  const boxY = object.yPercent * canvasHeightPx;
  const boxW = Math.max(30, object.wPercent * canvasWidthPx);
  const boxH = Math.max(20, object.hPercent * canvasHeightPx);

  // Drag moving
  const handleDragStart = (e: React.MouseEvent) => {
    if (object.locked) return;
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = object.xPercent;
    const initialY = object.yPercent;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - startX) / canvasWidthPx;
      const deltaY = (moveEvent.clientY - startY) / canvasHeightPx;

      // Allow bleeding and dragging off the canvas boundary (Canva style)
      const minX = -object.wPercent + 0.03;
      const maxX = 0.97;
      const minY = -object.hPercent + 0.03;
      const maxY = 0.97;
      let newX = Math.max(minX, Math.min(maxX, initialX + deltaX));
      let newY = Math.max(minY, Math.min(maxY, initialY + deltaY));

      let isSnapX = false;
      let isSnapY = false;

      // Snapping to page center (within 2.5% threshold)
      if (Math.abs(newX + object.wPercent / 2 - 0.5) < 0.025) {
        newX = 0.5 - object.wPercent / 2;
        isSnapX = true;
      }
      if (Math.abs(newY + object.hPercent / 2 - 0.5) < 0.025) {
        newY = 0.5 - object.hPercent / 2;
        isSnapY = true;
      }

      setSnappedX(isSnapX);
      setSnappedY(isSnapY);

      updateObject(activePageIndex, object.id, {
        xPercent: Number(newX.toFixed(4)),
        yPercent: Number(newY.toFixed(4)),
      });
    };

    const onMouseUp = () => {
      setSnappedX(false);
      setSnappedY(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Corner resizing
  const handleResizeStart = (e: React.MouseEvent, corner: 'se' | 'sw' | 'ne' | 'nw') => {
    if (object.locked) return;
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const initialW = object.wPercent;
    const initialH = object.hPercent;
    const initialX = object.xPercent;
    const initialY = object.yPercent;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - startX) / canvasWidthPx;
      const deltaY = (moveEvent.clientY - startY) / canvasHeightPx;

      let newW = initialW;
      let newH = initialH;
      let newX = initialX;
      let newY = initialY;

      if (corner === 'se') {
        newW = Math.max(0.04, Math.min(3.0, initialW + deltaX));
        newH = Math.max(0.04, Math.min(3.0, initialH + deltaY));
      } else if (corner === 'sw') {
        newW = Math.max(0.04, Math.min(3.0, initialW - deltaX));
        newX = initialX + deltaX;
        newH = Math.max(0.04, Math.min(3.0, initialH + deltaY));
      } else if (corner === 'ne') {
        newW = Math.max(0.04, Math.min(3.0, initialW + deltaX));
        newH = Math.max(0.04, Math.min(3.0, initialH - deltaY));
        newY = initialY + deltaY;
      } else if (corner === 'nw') {
        newW = Math.max(0.04, Math.min(3.0, initialW - deltaX));
        newX = initialX + deltaX;
        newH = Math.max(0.04, Math.min(3.0, initialH - deltaY));
        newY = initialY + deltaY;
      }

      updateObject(activePageIndex, object.id, {
        wPercent: Number(newW.toFixed(4)),
        hPercent: Number(newH.toFixed(4)),
        xPercent: Number(newX.toFixed(4)),
        yPercent: Number(newY.toFixed(4)),
      });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Rotation handle
  const handleRotateStart = (e: React.MouseEvent) => {
    if (object.locked) return;
    e.stopPropagation();
    setIsRotating(true);

    const centerX = boxX + boxW / 2;
    const centerY = boxY + boxH / 2;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const mouseX = moveEvent.clientX;
      const mouseY = moveEvent.clientY;
      const rad = Math.atan2(mouseY - centerY, mouseX - centerX);
      let deg = Math.round((rad * 180) / Math.PI + 90);
      if (deg < 0) deg += 360;

      // Snap to 0, 90, 180, 270 degrees
      if (Math.abs(deg % 90) < 5 || Math.abs(deg % 90) > 85) {
        deg = Math.round(deg / 90) * 90;
      }

      updateObject(activePageIndex, object.id, {
        rotation: deg % 360,
      });
    };

    const onMouseUp = () => {
      setIsRotating(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <>
      {/* Magnetic Center Vertical Guide Line */}
      {snappedX && (
        <div
          className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-spot border-l-2 border-dashed border-spot/90 pointer-events-none z-30"
          style={{ height: `${canvasHeightPx}px` }}
        >
          <span className="absolute top-2 left-1 bg-spot text-spot-contrast text-[8px] font-bold px-1 py-0.5 rounded font-mono shadow">
            CENTER X
          </span>
        </div>
      )}

      {/* Magnetic Center Horizontal Guide Line */}
      {snappedY && (
        <div
          className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-spot border-t-2 border-dashed border-spot/90 pointer-events-none z-30"
          style={{ width: `${canvasWidthPx}px` }}
        >
          <span className="absolute left-2 -top-5 bg-spot text-spot-contrast text-[8px] font-bold px-1 py-0.5 rounded font-mono shadow">
            CENTER Y
          </span>
        </div>
      )}

      {/* biome-ignore lint/a11y/noStaticElementInteractions: Canvas object transform handles require raw pointer/mouse interaction */}
      <div
        onMouseDown={handleDragStart}
        className={`absolute border-2 border-spot pointer-events-auto select-none ${
          object.locked ? 'cursor-not-allowed border-dashed opacity-80' : 'cursor-move'
        }`}
        style={{
          left: `${boxX}px`,
          top: `${boxY}px`,
          width: `${boxW}px`,
          height: `${boxH}px`,
          transform: `rotate(${object.rotation}deg)`,
          transformOrigin: 'center center',
        }}
      >
        {/* Rotation Indicator Pill */}
        {object.rotation !== 0 && (
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-spot text-spot-contrast text-[9px] px-1 py-0.5 rounded font-mono font-bold whitespace-nowrap">
            {object.rotation}°
          </div>
        )}

        {!object.locked && (
          <>
            {/* Top Rotation Handle */}
            <button
              type="button"
              onMouseDown={handleRotateStart}
              className="absolute -top-6 left-1/2 -translate-x-1/2 w-4 h-4 bg-spot text-spot-contrast flex items-center justify-center rounded-full cursor-grab hover:scale-110 transition-transform shadow p-0 border-none"
              title="Rotate object"
              aria-label="Rotate object"
            >
              <RotateCw size={10} />
            </button>

            {/* Corner Resize Handles */}
            <button
              type="button"
              onMouseDown={(e) => handleResizeStart(e, 'nw')}
              className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-paper border-2 border-spot cursor-nwse-resize p-0"
              aria-label="Resize northwest"
            />
            <button
              type="button"
              onMouseDown={(e) => handleResizeStart(e, 'ne')}
              className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-paper border-2 border-spot cursor-nesw-resize p-0"
              aria-label="Resize northeast"
            />
            <button
              type="button"
              onMouseDown={(e) => handleResizeStart(e, 'sw')}
              className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-paper border-2 border-spot cursor-nesw-resize p-0"
              aria-label="Resize southwest"
            />
            <button
              type="button"
              onMouseDown={(e) => handleResizeStart(e, 'se')}
              className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-paper border-2 border-spot cursor-nwse-resize p-0"
              aria-label="Resize southeast"
            />
          </>
        )}
      </div>
    </>
  );
};

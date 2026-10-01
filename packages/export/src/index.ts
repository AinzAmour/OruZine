import { PDFDocument } from '@cantoo/pdf-lib';
import type { FormatDefinition } from '@oruzine/formats';
import type { PlacementPlan } from '@oruzine/imposition';

export interface ExportTextBox {
  id: string;
  text: string;
  xPercent: number;
  yPercent: number;
  fontSizePt: number;
  color: string;
  bold?: boolean;
}

export interface ExportObject {
  id: string;
  type: 'image' | 'text' | 'shape';
  xPercent: number;
  yPercent: number;
  wPercent: number;
  hPercent: number;
  rotation: number;
  opacity: number;
  imageElement?: HTMLImageElement | ImageBitmap | null;
  imageFit?: 'cover' | 'contain';
  text?: string;
  fontSizePt?: number;
  color?: string;
  bold?: boolean;
  shapeType?: 'rect' | 'circle' | 'line';
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

export interface ExportPageData {
  pageNumber: number;
  backgroundColor?: string;
  objects?: ExportObject[];
  // Backward compatibility
  imageElement?: HTMLImageElement | ImageBitmap | null;
  imageFit?: 'cover' | 'contain';
  textBoxes?: ExportTextBox[];
}

export interface ExportOptions {
  dpi?: number;
  showGuides?: boolean;
  grayscale?: boolean;
  rtl?: boolean;
}

export const mmToPixels = (mm: number, dpi: number): number => {
  return Math.round((mm / 25.4) * dpi);
};

export const mmToPoints = (mm: number): number => {
  return (mm / 25.4) * 72;
};

/**
 * Renders an imposed sheet onto an HTMLCanvasElement at the requested DPI.
 */
export async function renderImposedSheetToCanvas(
  format: FormatDefinition,
  pages: ExportPageData[],
  plan: PlacementPlan,
  opts: ExportOptions = {},
  sheetIndex = 0,
): Promise<HTMLCanvasElement> {
  const dpi = opts.dpi ?? 300;
  const sheet = plan.sheets[sheetIndex] ?? plan.sheets[0];

  const canvasWidth = mmToPixels(sheet.widthMm, dpi);
  const canvasHeight = mmToPixels(sheet.heightMm, dpi);

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D canvas context');
  }

  // 1. Fill base paper background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 2. Render each cell
  for (const cell of sheet.cells) {
    if (cell.page === null) continue;

    const pageData = pages.find((p) => p.pageNumber === cell.page);

    const cellX = (cell.x / sheet.widthMm) * canvasWidth;
    const cellY = (cell.y / sheet.heightMm) * canvasHeight;
    const cellW = (cell.w / sheet.widthMm) * canvasWidth;
    const cellH = (cell.h / sheet.heightMm) * canvasHeight;

    ctx.save();

    // Translate to cell center for rotation
    const centerX = cellX + cellW / 2;
    const centerY = cellY + cellH / 2;
    ctx.translate(centerX, centerY);

    if (cell.rotation !== 0) {
      ctx.rotate((cell.rotation * Math.PI) / 180);
    }

    // Clip to cell bounds
    ctx.beginPath();
    ctx.rect(-cellW / 2, -cellH / 2, cellW, cellH);
    ctx.clip();

    // Fill page background
    ctx.fillStyle = pageData?.backgroundColor || '#ffffff';
    ctx.fillRect(-cellW / 2, -cellH / 2, cellW, cellH);

    // Multi-object rendering
    if (pageData?.objects && pageData.objects.length > 0) {
      for (const obj of pageData.objects) {
        ctx.save();
        ctx.globalAlpha = obj.opacity ?? 1;

        const objX = -cellW / 2 + obj.xPercent * cellW;
        const objY = -cellH / 2 + obj.yPercent * cellH;
        const objW = obj.wPercent * cellW;
        const objH = obj.hPercent * cellH;

        // Object translation & rotation
        ctx.translate(objX + objW / 2, objY + objH / 2);
        if (obj.rotation !== 0) {
          ctx.rotate((obj.rotation * Math.PI) / 180);
        }

        if (obj.type === 'shape') {
          ctx.beginPath();
          if (obj.shapeType === 'circle') {
            ctx.ellipse(0, 0, objW / 2, objH / 2, 0, 0, Math.PI * 2);
          } else {
            ctx.rect(-objW / 2, -objH / 2, objW, objH);
          }
          if (obj.fillColor) {
            ctx.fillStyle = opts.grayscale ? '#e5e5e5' : obj.fillColor;
            ctx.fill();
          }
          if (obj.strokeColor) {
            ctx.strokeStyle = opts.grayscale ? '#000000' : obj.strokeColor;
            ctx.lineWidth = Math.max(1, (obj.strokeWidth || 2) * (dpi / 300));
            ctx.stroke();
          }
        } else if (obj.type === 'image' && obj.imageElement) {
          const img = obj.imageElement;
          const fit = obj.imageFit ?? 'cover';
          const imgRatio = img.width / img.height;
          const targetRatio = objW / objH;

          let drawW = objW;
          let drawH = objH;
          if (fit === 'cover') {
            if (imgRatio > targetRatio) {
              drawW = objH * imgRatio;
            } else {
              drawH = objW / imgRatio;
            }
          } else {
            if (imgRatio > targetRatio) {
              drawH = objW / imgRatio;
            } else {
              drawW = objH * imgRatio;
            }
          }

          ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        } else if (obj.type === 'text' && obj.text) {
          const scaledFontSize = ((obj.fontSizePt || 12) / 72) * dpi;
          ctx.font = `${obj.bold ? 'bold ' : ''}${scaledFontSize}px "Courier New", monospace`;
          ctx.fillStyle = opts.grayscale ? '#000000' : obj.color || '#121212';
          ctx.textBaseline = 'top';

          const lines = obj.text.split('\n');
          const lineHeight = scaledFontSize * 1.25;
          lines.forEach((line, i) => {
            ctx.fillText(line, -objW / 2, -objH / 2 + i * lineHeight);
          });
        }

        ctx.restore();
      }
    } else {
      // Fallback single-image + text rendering
      if (pageData?.imageElement) {
        const img = pageData.imageElement;
        const fit = pageData.imageFit ?? 'cover';
        const imgRatio = img.width / img.height;
        const cellRatio = cellW / cellH;

        let drawW = cellW;
        let drawH = cellH;
        if (fit === 'cover') {
          if (imgRatio > cellRatio) {
            drawW = cellH * imgRatio;
          } else {
            drawH = cellW / imgRatio;
          }
        } else {
          if (imgRatio > cellRatio) {
            drawH = cellW / imgRatio;
          } else {
            drawW = cellH * imgRatio;
          }
        }
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      }

      if (pageData?.textBoxes && pageData.textBoxes.length > 0) {
        for (const tb of pageData.textBoxes) {
          const textX = -cellW / 2 + tb.xPercent * cellW;
          const textY = -cellH / 2 + tb.yPercent * cellH;
          const scaledFontSize = (tb.fontSizePt / 72) * dpi;

          ctx.font = `${tb.bold ? 'bold ' : ''}${scaledFontSize}px "Courier New", monospace`;
          ctx.fillStyle = opts.grayscale ? '#000000' : tb.color;
          ctx.textBaseline = 'top';

          const lines = tb.text.split('\n');
          const lineHeight = scaledFontSize * 1.25;
          lines.forEach((line, i) => {
            ctx.fillText(line, textX, textY + i * lineHeight);
          });
        }
      }
    }

    ctx.restore();
  }

  // 3. Draw dashed fold & cut guides if requested
  if (opts.showGuides) {
    ctx.save();
    ctx.strokeStyle = '#999999';
    ctx.lineWidth = Math.max(1, Math.round(dpi / 300));
    ctx.setLineDash([Math.round(dpi * 0.02), Math.round(dpi * 0.02)]);

    for (const fold of format.foldLines) {
      ctx.beginPath();
      ctx.moveTo(fold.x1 * canvasWidth, fold.y1 * canvasHeight);
      ctx.lineTo(fold.x2 * canvasWidth, fold.y2 * canvasHeight);
      ctx.stroke();
    }

    ctx.strokeStyle = '#ff2d6b';
    ctx.lineWidth = Math.max(2, Math.round((dpi / 300) * 1.5));
    ctx.setLineDash([Math.round(dpi * 0.03), Math.round(dpi * 0.015)]);

    for (const cut of format.cutLines) {
      ctx.beginPath();
      ctx.moveTo(cut.x1 * canvasWidth, cut.y1 * canvasHeight);
      ctx.lineTo(cut.x2 * canvasWidth, cut.y2 * canvasHeight);
      ctx.stroke();
    }

    ctx.restore();
  }

  return canvas;
}

/**
 * Generates an imposed, print-ready PDF at true physical scale (100% scale).
 * For multi-sheet and duplex formats, renders each sheet side in imposition sequence.
 */
export async function generateImposedPdf(
  format: FormatDefinition,
  pages: ExportPageData[],
  plan: PlacementPlan,
  opts: ExportOptions = {},
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  const pageWidthPt = mmToPoints(plan.paperWidthMm);
  const pageHeightPt = mmToPoints(plan.paperHeightMm);

  for (let s = 0; s < plan.sheets.length; s++) {
    const canvas = await renderImposedSheetToCanvas(format, pages, plan, opts, s);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png'),
    );
    if (!blob) {
      throw new Error(`Failed to create PNG blob from canvas for sheet ${s + 1}`);
    }

    const pngBytes = new Uint8Array(await blob.arrayBuffer());
    const pdfPage = pdfDoc.addPage([pageWidthPt, pageHeightPt]);
    const embeddedPng = await pdfDoc.embedPng(pngBytes);

    pdfPage.drawImage(embeddedPng, {
      x: 0,
      y: 0,
      width: pageWidthPt,
      height: pageHeightPt,
    });
  }

  return pdfDoc.save();
}

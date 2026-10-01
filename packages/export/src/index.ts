import { PDFDocument } from '@cantoo/pdf-lib';
import type { FormatDefinition } from '@oruzine/formats';
import type { PlacementPlan } from '@oruzine/imposition';

export interface ExportTextBox {
  id: string;
  text: string;
  xPercent: number; // 0..1 relative to page width
  yPercent: number; // 0..1 relative to page height
  fontSizePt: number;
  color: string;
  bold?: boolean;
}

export interface ExportPageData {
  pageNumber: number;
  backgroundColor?: string;
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
): Promise<HTMLCanvasElement> {
  const dpi = opts.dpi ?? 300;
  const sheet = plan.sheets[0];

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

    // Clip to cell bounds (-cellW/2 to +cellW/2, -cellH/2 to +cellH/2)
    ctx.beginPath();
    ctx.rect(-cellW / 2, -cellH / 2, cellW, cellH);
    ctx.clip();

    // Fill page background
    ctx.fillStyle = pageData?.backgroundColor || '#ffffff';
    ctx.fillRect(-cellW / 2, -cellH / 2, cellW, cellH);

    // Draw image if present
    if (pageData?.imageElement) {
      const img = pageData.imageElement;
      const fit = pageData.imageFit ?? 'cover';
      const imgRatio = img.width / img.height;
      const cellRatio = cellW / cellH;

      let drawW = cellW;
      let drawH = cellH;
      let drawX = -cellW / 2;
      let drawY = -cellH / 2;

      if (fit === 'cover') {
        if (imgRatio > cellRatio) {
          drawW = cellH * imgRatio;
          drawX = -drawW / 2;
        } else {
          drawH = cellW / imgRatio;
          drawY = -drawH / 2;
        }
      } else {
        // contain
        if (imgRatio > cellRatio) {
          drawH = cellW / imgRatio;
          drawY = -drawH / 2;
        } else {
          drawW = cellH * imgRatio;
          drawX = -drawW / 2;
        }
      }

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    }

    // Draw text boxes
    if (pageData?.textBoxes && pageData.textBoxes.length > 0) {
      for (const tb of pageData.textBoxes) {
        const textX = -cellW / 2 + tb.xPercent * cellW;
        const textY = -cellH / 2 + tb.yPercent * cellH;
        const scaledFontSize = (tb.fontSizePt / 72) * dpi;

        ctx.font = `${tb.bold ? 'bold ' : ''}${scaledFontSize}px "Courier New", monospace`;
        ctx.fillStyle = opts.grayscale ? '#000000' : tb.color;
        ctx.textBaseline = 'top';

        // Support multiline text
        const lines = tb.text.split('\n');
        const lineHeight = scaledFontSize * 1.25;
        lines.forEach((line, i) => {
          ctx.fillText(line, textX, textY + i * lineHeight);
        });
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

    // Draw fold lines
    for (const fold of format.foldLines) {
      ctx.beginPath();
      ctx.moveTo(fold.x1 * canvasWidth, fold.y1 * canvasHeight);
      ctx.lineTo(fold.x2 * canvasWidth, fold.y2 * canvasHeight);
      ctx.stroke();
    }

    // Draw cut lines (darker dashed red or dark gray)
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
 */
export async function generateImposedPdf(
  format: FormatDefinition,
  pages: ExportPageData[],
  plan: PlacementPlan,
  opts: ExportOptions = {},
): Promise<Uint8Array> {
  const canvas = await renderImposedSheetToCanvas(format, pages, plan, opts);

  // Convert canvas to PNG blob/bytes
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/png'),
  );
  if (!blob) {
    throw new Error('Failed to create PNG blob from canvas');
  }

  const pngBytes = new Uint8Array(await blob.arrayBuffer());

  // Create PDF document using @cantoo/pdf-lib
  const pdfDoc = await PDFDocument.create();

  // Exact physical dimensions in PDF points (72 points per inch)
  const pageWidthPt = mmToPoints(plan.paperWidthMm);
  const pageHeightPt = mmToPoints(plan.paperHeightMm);

  const pdfPage = pdfDoc.addPage([pageWidthPt, pageHeightPt]);
  const embeddedPng = await pdfDoc.embedPng(pngBytes);

  pdfPage.drawImage(embeddedPng, {
    x: 0,
    y: 0,
    width: pageWidthPt,
    height: pageHeightPt,
  });

  return pdfDoc.save();
}

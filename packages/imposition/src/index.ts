import { type FormatDefinition, type Margins, PAPER_SIZES, type PaperSize } from '@oruzine/formats';

export type Unit = 'mm';

export interface ImposedCell {
  page: number | null; // 1-indexed in reader order, null = blank padding
  col: number;
  row: number;
  x: number; // mm from top-left of sheet
  y: number; // mm from top-left of sheet
  w: number; // mm cell width
  h: number; // mm cell height
  rotation: 0 | 90 | 180 | 270;
  // Normalized 0..1 bounding box for previewing
  normalized: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export interface ImposedSheet {
  side: 'front' | 'back';
  widthMm: number;
  heightMm: number;
  cells: ImposedCell[];
}

export interface PlacementPlan {
  sheets: ImposedSheet[];
  paddedPages: number;
  totalSheets: number;
  paper: PaperSize;
  paperWidthMm: number;
  paperHeightMm: number;
}

export interface ImposeOptions {
  paper: PaperSize;
  margins: Margins;
  bleedMm: number;
  creepMm?: number;
  rtl?: boolean;
}

/**
 * Calculates placement and rotation of all panels on the print sheets.
 * Pure TypeScript, zero DOM dependencies.
 */
export function impose(
  format: FormatDefinition,
  pageCount: number,
  opts: ImposeOptions,
): PlacementPlan {
  const paperDims = PAPER_SIZES[opts.paper] ?? PAPER_SIZES.letter;

  // Determine physical sheet width and height based on orientation
  const isLandscape = format.paper.orientation === 'landscape';
  const sheetWidthMm = isLandscape
    ? Math.max(paperDims.widthMm, paperDims.heightMm)
    : Math.min(paperDims.widthMm, paperDims.heightMm);
  const sheetHeightMm = isLandscape
    ? Math.min(paperDims.widthMm, paperDims.heightMm)
    : Math.max(paperDims.widthMm, paperDims.heightMm);

  if (format.layout.type === 'table') {
    const requiredPages = format.pageCount.fixed ?? 8;
    const paddedPages = Math.max(0, requiredPages - pageCount);

    const sheets: ImposedSheet[] = format.layout.sheets.map((sheetLayout) => {
      const cols = sheetLayout.cols;
      const rows = sheetLayout.rows;

      const printableWidth = sheetWidthMm - opts.margins.left - opts.margins.right;
      const printableHeight = sheetHeightMm - opts.margins.top - opts.margins.bottom;

      const cellWidth = printableWidth / cols;
      const cellHeight = printableHeight / rows;

      const cells: ImposedCell[] = sheetLayout.cells.map((cell) => {
        // RTL mirrors column order if requested
        const effectiveCol = opts.rtl ? cols - 1 - cell.col : cell.col;
        const effectiveRow = cell.row;

        const xMm = opts.margins.left + effectiveCol * cellWidth;
        const yMm = opts.margins.top + effectiveRow * cellHeight;

        // If page exceeds user's page count, mark as blank padding
        const pageNum = cell.page <= pageCount ? cell.page : null;

        return {
          page: pageNum,
          col: effectiveCol,
          row: effectiveRow,
          x: Number(xMm.toFixed(3)),
          y: Number(yMm.toFixed(3)),
          w: Number(cellWidth.toFixed(3)),
          h: Number(cellHeight.toFixed(3)),
          rotation: cell.rotation,
          normalized: {
            x: Number((xMm / sheetWidthMm).toFixed(4)),
            y: Number((yMm / sheetHeightMm).toFixed(4)),
            w: Number((cellWidth / sheetWidthMm).toFixed(4)),
            h: Number((cellHeight / sheetHeightMm).toFixed(4)),
          },
        };
      });

      return {
        side: sheetLayout.side,
        widthMm: sheetWidthMm,
        heightMm: sheetHeightMm,
        cells,
      };
    });

    return {
      sheets,
      paddedPages,
      totalSheets: sheets.length,
      paper: opts.paper,
      paperWidthMm: sheetWidthMm,
      paperHeightMm: sheetHeightMm,
    };
  }

  if (format.layout.type === 'algorithm' && format.layout.id === 'saddle-stitch') {
    const multiple = format.pageCount.multipleOf ?? 4;
    const targetPageCount = Math.max(
      format.pageCount.min ?? 4,
      Math.ceil(pageCount / multiple) * multiple,
    );
    const paddedPages = targetPageCount - pageCount;
    const physicalSheets = targetPageCount / 4;

    const printableWidth = sheetWidthMm - opts.margins.left - opts.margins.right;
    const printableHeight = sheetHeightMm - opts.margins.top - opts.margins.bottom;
    const cellWidth = printableWidth / 2;
    const cellHeight = printableHeight;

    const sheets: ImposedSheet[] = [];

    for (let s = 0; s < physicalSheets; s++) {
      // Creep calculation: outermost sheet (s=0) shifts 0, innermost sheet (s=S-1) shifts creepMm
      const creepOffset =
        physicalSheets > 1 && opts.creepMm ? (opts.creepMm * s) / (physicalSheets - 1) : 0;

      // Front: left = N - 2s, right = 1 + 2s
      let frontLeftPage = targetPageCount - 2 * s;
      let frontRightPage = 1 + 2 * s;
      if (opts.rtl) {
        const tmp = frontLeftPage;
        frontLeftPage = frontRightPage;
        frontRightPage = tmp;
      }

      // Back: left = 2 + 2s, right = N - 1 - 2s
      let backLeftPage = 2 + 2 * s;
      let backRightPage = targetPageCount - 1 - 2 * s;
      if (opts.rtl) {
        const tmp = backLeftPage;
        backLeftPage = backRightPage;
        backRightPage = tmp;
      }

      // Helper to build 2 cells on a sheet side
      const buildCells = (leftPage: number, rightPage: number): ImposedCell[] => {
        // Left cell: col 0, shifted left (outward from spine) by creepOffset
        const leftX = opts.margins.left - creepOffset;
        const leftY = opts.margins.top;

        // Right cell: col 1, shifted right (outward from spine) by creepOffset
        const rightX = opts.margins.left + cellWidth + creepOffset;
        const rightY = opts.margins.top;

        return [
          {
            page: leftPage <= pageCount ? leftPage : null,
            col: 0,
            row: 0,
            x: Number(leftX.toFixed(3)),
            y: Number(leftY.toFixed(3)),
            w: Number(cellWidth.toFixed(3)),
            h: Number(cellHeight.toFixed(3)),
            rotation: 0,
            normalized: {
              x: Number((leftX / sheetWidthMm).toFixed(4)),
              y: Number((leftY / sheetHeightMm).toFixed(4)),
              w: Number((cellWidth / sheetWidthMm).toFixed(4)),
              h: Number((cellHeight / sheetHeightMm).toFixed(4)),
            },
          },
          {
            page: rightPage <= pageCount ? rightPage : null,
            col: 1,
            row: 0,
            x: Number(rightX.toFixed(3)),
            y: Number(rightY.toFixed(3)),
            w: Number(cellWidth.toFixed(3)),
            h: Number(cellHeight.toFixed(3)),
            rotation: 0,
            normalized: {
              x: Number((rightX / sheetWidthMm).toFixed(4)),
              y: Number((rightY / sheetHeightMm).toFixed(4)),
              w: Number((cellWidth / sheetWidthMm).toFixed(4)),
              h: Number((cellHeight / sheetHeightMm).toFixed(4)),
            },
          },
        ];
      };

      // Add Front side of sheet s
      sheets.push({
        side: 'front',
        widthMm: sheetWidthMm,
        heightMm: sheetHeightMm,
        cells: buildCells(frontLeftPage, frontRightPage),
      });

      // Add Back side of sheet s
      sheets.push({
        side: 'back',
        widthMm: sheetWidthMm,
        heightMm: sheetHeightMm,
        cells: buildCells(backLeftPage, backRightPage),
      });
    }

    return {
      sheets,
      paddedPages,
      totalSheets: sheets.length,
      paper: opts.paper,
      paperWidthMm: sheetWidthMm,
      paperHeightMm: sheetHeightMm,
    };
  }

  throw new Error(`Unsupported layout algorithm: ${(format.layout as { id?: string }).id}`);
}

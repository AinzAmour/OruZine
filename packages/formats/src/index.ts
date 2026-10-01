// Paper dimensions in millimeters (width x height in portrait)
export type PaperSize = 'letter' | 'a4' | 'a3' | 'tabloid';

export interface PaperDimensions {
  widthMm: number;
  heightMm: number;
}

export const PAPER_SIZES: Record<PaperSize, PaperDimensions> = {
  letter: { widthMm: 215.9, heightMm: 279.4 },
  a4: { widthMm: 210, heightMm: 297 },
  a3: { widthMm: 297, heightMm: 420 },
  tabloid: { widthMm: 279.4, heightMm: 431.8 },
};

export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type?: 'fold' | 'cut';
}

export interface FoldStep {
  step: number;
  title: string;
  instruction: string;
  cut?: boolean;
}

export interface CellLayout {
  col: number;
  row: number;
  page: number; // 1-indexed in reader order
  rotation: 0 | 90 | 180 | 270;
}

export interface SheetLayout {
  side: 'front' | 'back';
  cols: number;
  rows: number;
  cells: CellLayout[];
}

export interface FormatDefinition {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'advanced';
  needs: ('scissors' | 'stapler' | 'ruler')[];
  paper: {
    sizes: PaperSize[];
    orientation: 'landscape' | 'portrait';
  };
  pageCount: {
    fixed?: number;
    min?: number;
    max?: number;
    multipleOf?: number;
  };
  sidedness: 'single' | 'duplex';
  duplexFlip?: 'long-edge' | 'short-edge';
  readingDirection: 'ltr' | 'rtl';
  layout:
    | { type: 'table'; sheets: SheetLayout[] }
    | { type: 'algorithm'; id: 'saddle-stitch' | 'accordion' | 'quarter-fold' };
  foldLines: Line[];
  cutLines: Line[];
  foldSteps: FoldStep[];
}

/**
 * Format A: 8-Page Mini Zine
 * One sheet, one slit in middle two panels, 8 pages.
 *
 * Landscape layout (4 columns x 2 rows):
 * Top row:    5 (180°)   4 (180°)   3 (180°)   2 (180°)
 * Bottom row: 6 (0°)     7 (0°)     8 (0°)     1 (0°)
 *
 * Page 1 = Front Cover, Page 8 = Back Cover
 * Middle horizontal cut across col 1 and 2 (between cols 1..2 on center fold)
 */
export const MINI_8_FORMAT: FormatDefinition = {
  id: 'mini-8',
  name: '8-Page Mini Zine',
  description:
    'Single-sheet 8-page pocket zine with one horizontal cut. Folds easily with no staples.',
  difficulty: 'easy',
  needs: ['scissors'],
  paper: {
    sizes: ['letter', 'a4', 'a3'],
    orientation: 'landscape',
  },
  pageCount: {
    fixed: 8,
  },
  sidedness: 'single',
  readingDirection: 'ltr',
  layout: {
    type: 'table',
    sheets: [
      {
        side: 'front',
        cols: 4,
        rows: 2,
        cells: [
          // Top row (each cell rotated 180°)
          { col: 0, row: 0, page: 5, rotation: 180 },
          { col: 1, row: 0, page: 4, rotation: 180 },
          { col: 2, row: 0, page: 3, rotation: 180 },
          { col: 3, row: 0, page: 2, rotation: 180 },
          // Bottom row (upright 0°)
          { col: 0, row: 1, page: 6, rotation: 0 },
          { col: 1, row: 1, page: 7, rotation: 0 },
          { col: 2, row: 1, page: 8, rotation: 0 },
          { col: 3, row: 1, page: 1, rotation: 0 },
        ],
      },
    ],
  },
  // Normalized 0..1 coordinates
  foldLines: [
    // Center horizontal fold
    { x1: 0, y1: 0.5, x2: 1, y2: 0.5, type: 'fold' },
    // Three vertical folds
    { x1: 0.25, y1: 0, x2: 0.25, y2: 1, type: 'fold' },
    { x1: 0.5, y1: 0, x2: 0.5, y2: 1, type: 'fold' },
    { x1: 0.75, y1: 0, x2: 0.75, y2: 1, type: 'fold' },
  ],
  // Center cut along horizontal fold across middle two columns (0.25 to 0.75)
  cutLines: [{ x1: 0.25, y1: 0.5, x2: 0.75, y2: 0.5, type: 'cut' }],
  foldSteps: [
    {
      step: 1,
      title: 'Fold in half horizontally',
      instruction:
        'Fold the sheet in half along the long edge (hamburger fold), crease well, and unfold.',
    },
    {
      step: 2,
      title: 'Fold in half vertically',
      instruction:
        'Fold the sheet in half along the short edge, then fold each end outward to create 8 equal panels. Crease firmly and unfold.',
    },
    {
      step: 3,
      title: 'Cut the center slit',
      instruction:
        'Fold the sheet in half horizontally again. Cut along the center crease across the middle two panels only (from the fold to the quarter creases). Do not cut to the edges!',
      cut: true,
    },
    {
      step: 4,
      title: 'Push together into a plus sign',
      instruction:
        'Open the sheet lengthwise. Push the two ends inward so the cut slit opens into a diamond and collapses into a 4-pane cross (+ shape).',
    },
    {
      step: 5,
      title: 'Fold into the booklet',
      instruction:
        'Fold the panels around each other with Page 1 on the front cover and Page 8 on the back cover. Press all folds flat.',
    },
  ],
};

export const FORMAT_REGISTRY: Record<string, FormatDefinition> = {
  'mini-8': MINI_8_FORMAT,
};

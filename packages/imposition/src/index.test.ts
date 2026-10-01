import { MINI_8_FORMAT, PAPER_SIZES } from '@oruzine/formats';
import { describe, expect, it } from 'vitest';
import { impose } from './index';

describe('Imposition Engine - 8-Page Mini Zine', () => {
  const defaultOpts = {
    paper: 'letter' as const,
    margins: { top: 5, right: 5, bottom: 5, left: 5 },
    bleedMm: 3,
    rtl: false,
  };

  /**
   * PHYSICAL FOLD CHECKLIST VERIFICATION
   *
   * 1. Landscape Sheet (4 columns x 2 rows):
   *    Top row:    5 (180°)   4 (180°)   3 (180°)   2 (180°)
   *    Bottom row: 6 (0°)     7 (0°)     8 (0°)     1 (0°)
   *
   * 2. Folding sequence:
   *    - Fold in half horizontally (crease across middle line)
   *    - Slit across horizontal crease between middle columns (panels 4/7 and 3/8)
   *    - Fold accordion / push ends together to form a plus (+)
   *    - Front cover page 1 faces front upright
   *    - Inside opens to pages 2 and 3 facing each other
   *    - Next spread is pages 4 and 5 facing each other
   *    - Next spread is pages 6 and 7 facing each other
   *    - Back cover is page 8 upright
   */
  it('imposes 8-page mini zine in correct physical fold order', () => {
    const plan = impose(MINI_8_FORMAT, 8, defaultOpts);

    expect(plan.sheets).toHaveLength(1);
    const sheet = plan.sheets[0];
    expect(sheet.cells).toHaveLength(8);

    // Verify cell locations & orientations
    // Col 0
    const cellTopLeft = sheet.cells.find((c) => c.col === 0 && c.row === 0);
    const cellBottomLeft = sheet.cells.find((c) => c.col === 0 && c.row === 1);
    expect(cellTopLeft?.page).toBe(5);
    expect(cellTopLeft?.rotation).toBe(180);
    expect(cellBottomLeft?.page).toBe(6);
    expect(cellBottomLeft?.rotation).toBe(0);

    // Col 1
    const cellCol1Top = sheet.cells.find((c) => c.col === 1 && c.row === 0);
    const cellCol1Bottom = sheet.cells.find((c) => c.col === 1 && c.row === 1);
    expect(cellCol1Top?.page).toBe(4);
    expect(cellCol1Top?.rotation).toBe(180);
    expect(cellCol1Bottom?.page).toBe(7);
    expect(cellCol1Bottom?.rotation).toBe(0);

    // Col 2
    const cellCol2Top = sheet.cells.find((c) => c.col === 2 && c.row === 0);
    const cellCol2Bottom = sheet.cells.find((c) => c.col === 2 && c.row === 1);
    expect(cellCol2Top?.page).toBe(3);
    expect(cellCol2Top?.rotation).toBe(180);
    expect(cellCol2Bottom?.page).toBe(8); // Back cover
    expect(cellCol2Bottom?.rotation).toBe(0);

    // Col 3
    const cellCol3Top = sheet.cells.find((c) => c.col === 3 && c.row === 0);
    const cellCol3Bottom = sheet.cells.find((c) => c.col === 3 && c.row === 1);
    expect(cellCol3Top?.page).toBe(2);
    expect(cellCol3Top?.rotation).toBe(180);
    expect(cellCol3Bottom?.page).toBe(1); // Front cover
    expect(cellCol3Bottom?.rotation).toBe(0);
  });

  it('calculates exact physical dimensions for Letter landscape', () => {
    const plan = impose(MINI_8_FORMAT, 8, defaultOpts);
    const sheet = plan.sheets[0];

    const letterWidth = Math.max(PAPER_SIZES.letter.widthMm, PAPER_SIZES.letter.heightMm); // 279.4
    const letterHeight = Math.min(PAPER_SIZES.letter.widthMm, PAPER_SIZES.letter.heightMm); // 215.9

    expect(sheet.widthMm).toBeCloseTo(letterWidth, 1);
    expect(sheet.heightMm).toBeCloseTo(letterHeight, 1);

    // Check printable area: (279.4 - 10) / 4 = 67.35mm cell width
    const cell = sheet.cells[0];
    expect(cell.w).toBeCloseTo((letterWidth - 10) / 4, 1);
    expect(cell.h).toBeCloseTo((letterHeight - 10) / 2, 1);
  });

  it('calculates exact physical dimensions for A4 landscape', () => {
    const plan = impose(MINI_8_FORMAT, 8, { ...defaultOpts, paper: 'a4' });
    const sheet = plan.sheets[0];

    expect(sheet.widthMm).toBe(297);
    expect(sheet.heightMm).toBe(210);

    const cell = sheet.cells[0];
    expect(cell.w).toBeCloseTo((297 - 10) / 4, 1);
    expect(cell.h).toBeCloseTo((210 - 10) / 2, 1);
  });

  it('mirrors columns when RTL reading direction is enabled', () => {
    const plan = impose(MINI_8_FORMAT, 8, { ...defaultOpts, rtl: true });
    const sheet = plan.sheets[0];

    // Under RTL, Front cover (page 1) should now be in col 0 instead of col 3
    const page1Cell = sheet.cells.find((c) => c.page === 1);
    expect(page1Cell?.col).toBe(0);
    expect(page1Cell?.row).toBe(1);

    // Page 2 should be col 0, row 0
    const page2Cell = sheet.cells.find((c) => c.page === 2);
    expect(page2Cell?.col).toBe(0);
    expect(page2Cell?.row).toBe(0);
  });
});

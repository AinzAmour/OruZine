import {
  ACCORDION_6_FORMAT,
  MINI_8_FORMAT,
  PAPER_SIZES,
  QUARTER_FOLD_4_FORMAT,
  SADDLE_STITCH_FORMAT,
} from '@oruzine/formats';
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

describe('Imposition Engine - Saddle-Stitch Booklet (Duplex)', () => {
  const defaultOpts = {
    paper: 'letter' as const,
    margins: { top: 10, right: 10, bottom: 10, left: 10 },
    bleedMm: 3,
    rtl: false,
  };

  it('imposes 8-page booklet into 4 sides (2 physical sheets) with correct reader pairings', () => {
    const plan = impose(SADDLE_STITCH_FORMAT, 8, defaultOpts);

    expect(plan.sheets).toHaveLength(4); // 2 sheets x 2 sides (Front, Back)
    expect(plan.paddedPages).toBe(0);

    // Sheet 0 Front (Outer Cover): Left = 8, Right = 1
    const s0Front = plan.sheets[0];
    expect(s0Front.side).toBe('front');
    expect(s0Front.cells[0].page).toBe(8);
    expect(s0Front.cells[1].page).toBe(1);

    // Sheet 0 Back (Inside Covers): Left = 2, Right = 7
    const s0Back = plan.sheets[1];
    expect(s0Back.side).toBe('back');
    expect(s0Back.cells[0].page).toBe(2);
    expect(s0Back.cells[1].page).toBe(7);

    // Sheet 1 Front (Outer Center): Left = 6, Right = 3
    const s1Front = plan.sheets[2];
    expect(s1Front.side).toBe('front');
    expect(s1Front.cells[0].page).toBe(6);
    expect(s1Front.cells[1].page).toBe(3);

    // Sheet 1 Back (Centerfold): Left = 4, Right = 5
    const s1Back = plan.sheets[3];
    expect(s1Back.side).toBe('back');
    expect(s1Back.cells[0].page).toBe(4);
    expect(s1Back.cells[1].page).toBe(5);
  });

  it('verifies all front/back pairs sum to N + 1 for page counts 4, 8, 12, 16, 20, 40', () => {
    const pageCounts = [4, 8, 12, 16, 20, 40];

    for (const N of pageCounts) {
      const plan = impose(SADDLE_STITCH_FORMAT, N, defaultOpts);
      expect(plan.sheets).toHaveLength((N / 4) * 2);

      for (const sheet of plan.sheets) {
        const leftPage = sheet.cells[0].page as number;
        const rightPage = sheet.cells[1].page as number;
        expect(leftPage + rightPage).toBe(N + 1);
      }
    }
  });

  it('pads unaligned page counts to nearest multiple of 4', () => {
    // 7 pages should pad to 8
    const plan7 = impose(SADDLE_STITCH_FORMAT, 7, defaultOpts);
    expect(plan7.paddedPages).toBe(1);
    expect(plan7.sheets).toHaveLength(4);
    // Page 8 should be padded as null (blank)
    const page8Cell = plan7.sheets[0].cells.find((c) => c.col === 0);
    expect(page8Cell?.page).toBeNull();

    // 10 pages should pad to 12
    const plan10 = impose(SADDLE_STITCH_FORMAT, 10, defaultOpts);
    expect(plan10.paddedPages).toBe(2);
    expect(plan10.sheets).toHaveLength(6);
  });

  it('applies monotonic creep compensation outward from spine', () => {
    const creepMm = 2.0;
    // 16 pages = 4 sheets (s = 0, 1, 2, 3)
    const plan = impose(SADDLE_STITCH_FORMAT, 16, { ...defaultOpts, creepMm });

    // Outermost sheet s=0: creepOffset is 0
    const s0FrontLeft = plan.sheets[0].cells[0]; // margin left
    const s0FrontRight = plan.sheets[0].cells[1];
    expect(s0FrontLeft.x).toBe(defaultOpts.margins.left);

    // Innermost sheet s=3 (index 6 in plan.sheets): creepOffset should be exactly creepMm
    const s3FrontLeft = plan.sheets[6].cells[0];
    const s3FrontRight = plan.sheets[6].cells[1];
    expect(s3FrontLeft.x).toBeCloseTo(defaultOpts.margins.left - creepMm, 2);
    expect(s3FrontRight.x).toBeCloseTo(s0FrontRight.x + creepMm, 2);
  });

  it('swaps left and right cells when RTL is active in booklet', () => {
    const plan = impose(SADDLE_STITCH_FORMAT, 8, { ...defaultOpts, rtl: true });

    // Sheet 0 Front: Left = 1, Right = 8
    expect(plan.sheets[0].cells[0].page).toBe(1);
    expect(plan.sheets[0].cells[1].page).toBe(8);

    // Sheet 0 Back: Left = 7, Right = 2
    expect(plan.sheets[1].cells[0].page).toBe(7);
    expect(plan.sheets[1].cells[1].page).toBe(2);
  });
});

describe('Imposition Engine - 6-Page Accordion (Duplex)', () => {
  const defaultOpts = {
    paper: 'letter' as const,
    margins: { top: 5, right: 5, bottom: 5, left: 5 },
    bleedMm: 3,
    rtl: false,
  };

  it('imposes 6-page accordion with front and back 3-panel strips', () => {
    const plan = impose(ACCORDION_6_FORMAT, 6, defaultOpts);

    expect(plan.sheets).toHaveLength(2); // Front and Back
    expect(plan.sheets[0].cells).toHaveLength(3);
    expect(plan.sheets[1].cells).toHaveLength(3);

    // Front sheet: 1, 2, 3
    expect(plan.sheets[0].cells[0].page).toBe(1);
    expect(plan.sheets[0].cells[1].page).toBe(2);
    expect(plan.sheets[0].cells[2].page).toBe(3);

    // Back sheet: 6, 5, 4
    expect(plan.sheets[1].cells[0].page).toBe(6);
    expect(plan.sheets[1].cells[1].page).toBe(5);
    expect(plan.sheets[1].cells[2].page).toBe(4);
  });
});

describe('Imposition Engine - 4-Page Quarter Fold (Single-Sided)', () => {
  const defaultOpts = {
    paper: 'letter' as const,
    margins: { top: 5, right: 5, bottom: 5, left: 5 },
    bleedMm: 3,
    rtl: false,
  };

  it('imposes 4-page quarter fold into single sheet with inverted top row', () => {
    const plan = impose(QUARTER_FOLD_4_FORMAT, 4, defaultOpts);

    expect(plan.sheets).toHaveLength(1);
    expect(plan.sheets[0].cells).toHaveLength(4);

    // Top row (rotated 180°): Page 4 (left), Page 1 (right)
    const p4 = plan.sheets[0].cells.find((c) => c.col === 0 && c.row === 0);
    const p1 = plan.sheets[0].cells.find((c) => c.col === 1 && c.row === 0);
    expect(p4?.page).toBe(4);
    expect(p4?.rotation).toBe(180);
    expect(p1?.page).toBe(1);
    expect(p1?.rotation).toBe(180);

    // Bottom row (rotated 0°): Page 3 (left), Page 2 (right)
    const p3 = plan.sheets[0].cells.find((c) => c.col === 0 && c.row === 1);
    const p2 = plan.sheets[0].cells.find((c) => c.col === 1 && c.row === 1);
    expect(p3?.page).toBe(3);
    expect(p3?.rotation).toBe(0);
    expect(p2?.page).toBe(2);
    expect(p2?.rotation).toBe(0);
  });
});

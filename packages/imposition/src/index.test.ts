import { describe, it, expect } from 'vitest';
import type { PlacementPlan } from './index';

describe('Imposition Engine Smoke Test', () => {
  it('should export PlacementPlan type correctly', () => {
    const dummyPlan: PlacementPlan = {
      sheets: [
        {
          side: 'front',
          cells: [
            {
              page: 1,
              x: 0,
              y: 0,
              w: 105,
              h: 148.5,
              rotation: 0,
            },
          ],
        },
      ],
      paddedPages: 0,
    };

    expect(dummyPlan.sheets).toHaveLength(1);
    expect(dummyPlan.sheets[0].cells[0].page).toBe(1);
  });
});

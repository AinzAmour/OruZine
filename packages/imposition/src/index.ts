// @oruzine/imposition - Pure TypeScript imposition engine
export type Unit = 'mm';

export interface PlacementPlan {
  sheets: {
    side: 'front' | 'back';
    cells: {
      page: number | null;
      x: number;
      y: number;
      w: number;
      h: number;
      rotation: number;
    }[];
  }[];
  paddedPages: number;
}

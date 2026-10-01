// @oruzine/filters - Filter Registry & Types

export type FilterType = 'halftone' | 'dither' | 'xerox' | 'duotone' | 'risograph' | 'scanlines';

export interface FilterParamDef {
  key: string;
  label: string;
  type: 'number' | 'color' | 'select';
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
  default: unknown;
}

export interface FilterDefinition {
  type: FilterType;
  name: string;
  description: string;
  params: FilterParamDef[];
  defaultParams: Record<string, unknown>;
}

export interface FilterInstance {
  id: string;
  type: FilterType;
  enabled: boolean;
  params: Record<string, unknown>;
}

export const FILTER_REGISTRY: Record<FilterType, FilterDefinition> = {
  halftone: {
    type: 'halftone',
    name: 'Newspaper Halftone',
    description:
      'Authentic rotary press newspaper dot screen with customizable dot scale and angle.',
    params: [
      { key: 'dotSize', label: 'Dot Size', type: 'number', min: 2, max: 20, step: 1, default: 6 },
      {
        key: 'angle',
        label: 'Screen Angle',
        type: 'number',
        min: 0,
        max: 90,
        step: 5,
        default: 45,
      },
      {
        key: 'contrast',
        label: 'Contrast',
        type: 'number',
        min: 0.5,
        max: 2.5,
        step: 0.1,
        default: 1.2,
      },
    ],
    defaultParams: { dotSize: 6, angle: 45, contrast: 1.2 },
  },
  dither: {
    type: 'dither',
    name: 'Retro Dither',
    description:
      'Ordered 8x8 Bayer or Floyd-Steinberg error diffusion for classic mac/zine aesthetic.',
    params: [
      {
        key: 'algorithm',
        label: 'Algorithm',
        type: 'select',
        options: [
          { value: 'bayer8', label: 'Bayer 8x8 Ordered' },
          { value: 'floyd-steinberg', label: 'Floyd-Steinberg Error Diffusion' },
        ],
        default: 'bayer8',
      },
      { key: 'levels', label: 'Color Levels', type: 'number', min: 2, max: 6, step: 1, default: 2 },
    ],
    defaultParams: { algorithm: 'bayer8', levels: 2 },
  },
  xerox: {
    type: 'xerox',
    name: 'Xerox High-Contrast',
    description:
      'Dirty toner photocopy look with high-contrast thresholding and gritty toner scatter.',
    params: [
      {
        key: 'threshold',
        label: 'Threshold',
        type: 'number',
        min: 20,
        max: 240,
        step: 2,
        default: 128,
      },
      { key: 'noise', label: 'Toner Grit', type: 'number', min: 0, max: 100, step: 5, default: 25 },
      {
        key: 'dirtyEdges',
        label: 'Dirty Edges',
        type: 'number',
        min: 0,
        max: 10,
        step: 1,
        default: 3,
      },
    ],
    defaultParams: { threshold: 128, noise: 25, dirtyEdges: 3 },
  },
  duotone: {
    type: 'duotone',
    name: 'Duotone Spot Color',
    description: 'Maps dark and light tonal ranges to two vibrant risograph or screenprint inks.',
    params: [
      { key: 'darkColor', label: 'Ink Darks (Shadows)', type: 'color', default: '#1a102f' },
      { key: 'lightColor', label: 'Ink Lights (Highlights)', type: 'color', default: '#ff2d78' },
      {
        key: 'contrast',
        label: 'Contrast',
        type: 'number',
        min: 0.5,
        max: 2,
        step: 0.1,
        default: 1.1,
      },
    ],
    defaultParams: { darkColor: '#1a102f', lightColor: '#ff2d78', contrast: 1.1 },
  },
  risograph: {
    type: 'risograph',
    name: 'Riso Misregistration',
    description: 'Simulates physical drum registration misalignment with color-separation offset.',
    params: [
      {
        key: 'shiftX',
        label: 'Horizontal Offset (px)',
        type: 'number',
        min: -15,
        max: 15,
        step: 1,
        default: 4,
      },
      {
        key: 'shiftY',
        label: 'Vertical Offset (px)',
        type: 'number',
        min: -15,
        max: 15,
        step: 1,
        default: -2,
      },
      { key: 'drumColorA', label: 'Drum A Color', type: 'color', default: '#0055ff' },
      { key: 'drumColorB', label: 'Drum B Color', type: 'color', default: '#ff0066' },
    ],
    defaultParams: { shiftX: 4, shiftY: -2, drumColorA: '#0055ff', drumColorB: '#ff0066' },
  },
  scanlines: {
    type: 'scanlines',
    name: 'Copier Roller Streaks',
    description: 'Photocopier drum streaks and horizontal scanning line artifacts.',
    params: [
      {
        key: 'spacing',
        label: 'Line Spacing',
        type: 'number',
        min: 2,
        max: 16,
        step: 1,
        default: 4,
      },
      {
        key: 'intensity',
        label: 'Streak Opacity',
        type: 'number',
        min: 0.05,
        max: 0.6,
        step: 0.05,
        default: 0.2,
      },
    ],
    defaultParams: { spacing: 4, intensity: 0.2 },
  },
};

export const AVAILABLE_FILTERS: FilterType[] = [
  'halftone',
  'dither',
  'xerox',
  'duotone',
  'risograph',
  'scanlines',
];

export function createFilterInstance(type: FilterType): FilterInstance {
  const def = FILTER_REGISTRY[type];
  return {
    id: `filt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    enabled: true,
    params: { ...def.defaultParams },
  };
}

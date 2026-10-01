// @oruzine/filters - 5 Signature Print-Culture Looks Presets

import { createOverlayInstance, type OverlayInstance } from './overlays';
import { createFilterInstance, type FilterInstance } from './registry';

export interface LookDefinition {
  id: string;
  name: string;
  tagline: string;
  description: string;
  accentColor: string;
  paperColor: string;
  textColor: string;
  filters: FilterInstance[];
  overlays: OverlayInstance[];
}

export function createSignatureLooks(): LookDefinition[] {
  // 1. Xerox Punk: Gritty b&w threshold, toner scatter, copier glass scratches
  const xeroxPunk: LookDefinition = {
    id: 'xerox-punk',
    name: 'Xerox Punk',
    tagline: 'Fanzine DIY aesthetic with gritty toner noise & dirty edge bleed.',
    description:
      'Inspired by 1970s London & 80s DC punk zines made on stolen late-night office photocopiers.',
    accentColor: '#121212',
    paperColor: '#f4f3ec',
    textColor: '#121212',
    filters: [
      {
        ...createFilterInstance('xerox'),
        params: { threshold: 130, noise: 35, dirtyEdges: 4 },
      },
      {
        ...createFilterInstance('scanlines'),
        params: { spacing: 5, intensity: 0.2 },
      },
    ],
    overlays: [
      {
        ...createOverlayInstance('toner-dust'),
        opacity: 0.35,
      },
      {
        ...createOverlayInstance('fold-creases'),
        opacity: 0.3,
      },
    ],
  };

  // 2. Newsprint Noir: Coarse rotary press halftone screen, ink bleed, warm aged newsprint
  const newsprintNoir: LookDefinition = {
    id: 'newsprint-noir',
    name: 'Newsprint Noir',
    tagline: 'Rotary press halftone screen dots on fibrous newsprint paper.',
    description:
      'The tactile texture of investigative tabloids, underground comic strips, and old broadsheets.',
    accentColor: '#4a3b32',
    paperColor: '#f6f2e2',
    textColor: '#1c1917',
    filters: [
      {
        ...createFilterInstance('halftone'),
        params: { dotSize: 7, angle: 45, contrast: 1.3 },
      },
      {
        ...createFilterInstance('dither'),
        params: { algorithm: 'bayer8', levels: 3 },
      },
    ],
    overlays: [
      {
        ...createOverlayInstance('newsprint-grain'),
        opacity: 0.45,
      },
      {
        ...createOverlayInstance('toner-dust'),
        opacity: 0.2,
      },
    ],
  };

  // 3. VHS Basement: Chromatic misregistration, CRT raster scanlines, saturated tape noise
  const vhsBasement: LookDefinition = {
    id: 'vhs-basement',
    name: 'VHS Basement',
    tagline: 'Analogue magnetic tape glitch with vivid chromatic misregistration.',
    description:
      'Late-night public access television and tape-trading basement bootleg aesthetics.',
    accentColor: '#00e5ff',
    paperColor: '#141416',
    textColor: '#ffffff',
    filters: [
      {
        ...createFilterInstance('risograph'),
        params: {
          shiftX: 5,
          shiftY: -3,
          drumColorA: '#00e5ff',
          drumColorB: '#ff0055',
        },
      },
      {
        ...createFilterInstance('scanlines'),
        params: { spacing: 3, intensity: 0.35 },
      },
    ],
    overlays: [
      {
        ...createOverlayInstance('copier-streaks'),
        opacity: 0.25,
      },
      {
        ...createOverlayInstance('light-leak'),
        opacity: 0.3,
      },
    ],
  };

  // 4. Riso Pop: Fluoro Pink + Riso Blue duotone separation with paper texture
  const risoPop: LookDefinition = {
    id: 'riso-pop',
    name: 'Riso Pop',
    tagline: 'Vibrant 2-drum risograph spot ink printing with halftone screening.',
    description:
      'Distinctive soy-ink vibrancy celebrating physical micro-publishing and riso studios.',
    accentColor: '#ff2d78',
    paperColor: '#faf8f2',
    textColor: '#ff2d78',
    filters: [
      {
        ...createFilterInstance('duotone'),
        params: {
          darkColor: '#0033cc',
          lightColor: '#ff2d78',
          contrast: 1.25,
        },
      },
      {
        ...createFilterInstance('halftone'),
        params: { dotSize: 5, angle: 30, contrast: 1.1 },
      },
    ],
    overlays: [
      {
        ...createOverlayInstance('newsprint-grain'),
        opacity: 0.3,
      },
      {
        ...createOverlayInstance('fold-creases'),
        opacity: 0.25,
      },
    ],
  };

  // 5. Neon Night: High-contrast cyberpunk duotone with scanner flare
  const neonNight: LookDefinition = {
    id: 'neon-night',
    name: 'Neon Night',
    tagline: 'Dark mode cyber-zine with electric cyan ink and scanner light leaks.',
    description: 'Dystopian terminal typography and electric ink under scanner bed illumination.',
    accentColor: '#00ffcc',
    paperColor: '#0c0d12',
    textColor: '#00ffcc',
    filters: [
      {
        ...createFilterInstance('duotone'),
        params: {
          darkColor: '#0a0b10',
          lightColor: '#00ffcc',
          contrast: 1.35,
        },
      },
      {
        ...createFilterInstance('scanlines'),
        params: { spacing: 4, intensity: 0.2 },
      },
    ],
    overlays: [
      {
        ...createOverlayInstance('light-leak'),
        opacity: 0.35,
      },
    ],
  };

  return [xeroxPunk, newsprintNoir, vhsBasement, risoPop, neonNight];
}

export const SIGNATURE_LOOKS = createSignatureLooks();

export function getLookById(id: string): LookDefinition | undefined {
  return SIGNATURE_LOOKS.find((l) => l.id === id);
}

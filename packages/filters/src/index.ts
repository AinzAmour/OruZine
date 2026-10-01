// @oruzine/filters - Print-Culture Shaders, Filter Registry & Canvas Processing Pipeline

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

// -------------------------------------------------------------
// FILTER REGISTRY DEFINITIONS
// -------------------------------------------------------------

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

// -------------------------------------------------------------
// COLOR & PIXEL UTILITIES
// -------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    return [
      Number.parseInt(cleanHex[0] + cleanHex[0], 16),
      Number.parseInt(cleanHex[1] + cleanHex[1], 16),
      Number.parseInt(cleanHex[2] + cleanHex[2], 16),
    ];
  }
  return [
    Number.parseInt(cleanHex.substring(0, 2), 16) || 0,
    Number.parseInt(cleanHex.substring(2, 4), 16) || 0,
    Number.parseInt(cleanHex.substring(4, 6), 16) || 0,
  ];
}

function getLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// 8x8 Bayer Ordered Dither Matrix
const BAYER_8X8 = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
];

// -------------------------------------------------------------
// FILTER ALGORITHMS (ImageData -> ImageData)
// -------------------------------------------------------------

/**
 * 1. Newspaper Halftone Dot Screen
 */
export function applyHalftone(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  params: { dotSize?: number; angle?: number; contrast?: number } = {},
): void {
  const dotSize = params.dotSize ?? 6;
  const contrast = params.contrast ?? 1.2;

  const srcData = ctx.getImageData(0, 0, width, height);
  const src = srcData.data;

  // Clear canvas to white paper
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#121212';

  const step = Math.max(2, dotSize);
  const halfStep = step / 2;
  const maxRadius = step * 0.72;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      // Sample luminance in this cell
      let totalLum = 0;
      let count = 0;

      for (let sy = y; sy < Math.min(height, y + step); sy += 2) {
        for (let sx = x; sx < Math.min(width, x + step); sx += 2) {
          const idx = (sy * width + sx) * 4;
          if (src[idx + 3] > 20) {
            totalLum += getLuminance(src[idx], src[idx + 1], src[idx + 2]);
            count++;
          }
        }
      }

      if (count === 0) continue; // transparent area

      const avgLum = totalLum / count;
      // Invert: darker image = larger black dots
      let darkness = 1 - avgLum / 255;
      darkness = Math.min(1, Math.max(0, (darkness - 0.5) * contrast + 0.5));

      const dotRadius = darkness * maxRadius;
      if (dotRadius > 0.4) {
        ctx.beginPath();
        ctx.arc(x + halfStep, y + halfStep, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

/**
 * 2. Retro Dither (Bayer 8x8 or Floyd-Steinberg)
 */
export function applyDither(
  imageData: ImageData,
  params: { algorithm?: 'bayer8' | 'floyd-steinberg'; levels?: number } = {},
): ImageData {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const algorithm = params.algorithm ?? 'bayer8';
  const levels = Math.max(2, Math.min(6, params.levels ?? 2));
  const step = 255 / (levels - 1);

  if (algorithm === 'bayer8') {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        if (data[idx + 3] === 0) continue;

        const lum = getLuminance(data[idx], data[idx + 1], data[idx + 2]);
        const threshold = (BAYER_8X8[y % 8][x % 8] / 64) * 255;

        // Quantize based on Bayer matrix
        const val = Math.round(lum / step + (lum % step > threshold ? 1 : 0)) * step;
        const clamped = Math.min(255, Math.max(0, val));

        data[idx] = clamped;
        data[idx + 1] = clamped;
        data[idx + 2] = clamped;
      }
    }
  } else {
    // Floyd-Steinberg error diffusion
    // Work with float grayscale buffer
    const gray = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
      const idx = i * 4;
      gray[i] = data[idx + 3] === 0 ? 255 : getLuminance(data[idx], data[idx + 1], data[idx + 2]);
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        const oldVal = gray[i];
        const newVal = Math.round(oldVal / step) * step;
        gray[i] = newVal;
        const err = oldVal - newVal;

        if (x + 1 < width) gray[i + 1] += err * (7 / 16);
        if (y + 1 < height) {
          if (x - 1 >= 0) gray[(y + 1) * width + (x - 1)] += err * (3 / 16);
          gray[(y + 1) * width + x] += err * (5 / 16);
          if (x + 1 < width) gray[(y + 1) * width + (x + 1)] += err * (1 / 16);
        }
      }
    }

    for (let i = 0; i < width * height; i++) {
      const idx = i * 4;
      if (data[idx + 3] === 0) continue;
      const v = Math.min(255, Math.max(0, Math.round(gray[i])));
      data[idx] = v;
      data[idx + 1] = v;
      data[idx + 2] = v;
    }
  }

  return imageData;
}

/**
 * 3. Xerox High-Contrast with Toner Grit
 */
export function applyXerox(
  imageData: ImageData,
  params: { threshold?: number; noise?: number; dirtyEdges?: number } = {},
): ImageData {
  const data = imageData.data;
  const threshold = params.threshold ?? 128;
  const noiseLevel = params.noise ?? 25;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;

    const lum = getLuminance(data[i], data[i + 1], data[i + 2]);
    const noise = (Math.random() - 0.5) * noiseLevel * 2;
    const finalVal = lum + noise > threshold ? 255 : 18; // deep toner black vs crisp paper white

    data[i] = finalVal;
    data[i + 1] = finalVal;
    data[i + 2] = finalVal;
  }

  return imageData;
}

/**
 * 4. Duotone Spot Color
 */
export function applyDuotone(
  imageData: ImageData,
  params: { darkColor?: string; lightColor?: string; contrast?: number } = {},
): ImageData {
  const data = imageData.data;
  const [dr, dg, db] = hexToRgb(params.darkColor || '#1a102f');
  const [lr, lg, lb] = hexToRgb(params.lightColor || '#ff2d78');
  const contrast = params.contrast ?? 1.1;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;

    let lum = getLuminance(data[i], data[i + 1], data[i + 2]) / 255;
    lum = (lum - 0.5) * contrast + 0.5;
    const t = Math.min(1, Math.max(0, lum));

    // Linear interpolation between dark ink and light ink
    data[i] = Math.round(dr + (lr - dr) * t);
    data[i + 1] = Math.round(dg + (lg - dg) * t);
    data[i + 2] = Math.round(db + (lb - db) * t);
  }

  return imageData;
}

/**
 * 5. Risograph Misregistration Offset
 */
export function applyRisograph(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  params: { shiftX?: number; shiftY?: number; drumColorA?: string; drumColorB?: string } = {},
): void {
  const shiftX = params.shiftX ?? 4;
  const shiftY = params.shiftY ?? -2;
  const [ar, ag, ab] = hexToRgb(params.drumColorA || '#0055ff');
  const [br, bg, bb] = hexToRgb(params.drumColorB || '#ff0066');

  const srcData = ctx.getImageData(0, 0, width, height);
  const src = srcData.data;

  // Create two channel canvases
  const canvasA = document.createElement('canvas');
  canvasA.width = width;
  canvasA.height = height;
  const ctxA = canvasA.getContext('2d');
  if (!ctxA) return;
  const dataA = ctxA.createImageData(width, height);

  const canvasB = document.createElement('canvas');
  canvasB.width = width;
  canvasB.height = height;
  const ctxB = canvasB.getContext('2d');
  if (!ctxB) return;
  const dataB = ctxB.createImageData(width, height);

  for (let i = 0; i < src.length; i += 4) {
    const alpha = src[i + 3];
    if (alpha === 0) continue;

    const lum = getLuminance(src[i], src[i + 1], src[i + 2]);
    const inkDensity = 1 - lum / 255;

    // Drum A (e.g. Blue)
    dataA.data[i] = ar;
    dataA.data[i + 1] = ag;
    dataA.data[i + 2] = ab;
    dataA.data[i + 3] = Math.round(alpha * inkDensity * 0.85);

    // Drum B (e.g. Pink)
    dataB.data[i] = br;
    dataB.data[i + 1] = bg;
    dataB.data[i + 2] = bb;
    dataB.data[i + 3] = Math.round(alpha * inkDensity * 0.85);
  }

  ctxA.putImageData(dataA, 0, 0);
  ctxB.putImageData(dataB, 0, 0);

  // Clear base canvas
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Composite Drum A and Drum B with multiply blend mode
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(canvasA, 0, 0);
  ctx.drawImage(canvasB, shiftX, shiftY);
  ctx.globalCompositeOperation = 'source-over';
}

/**
 * 6. Copier Roller Streaks / Scanlines
 */
export function applyScanlines(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  params: { spacing?: number; intensity?: number } = {},
): void {
  const spacing = Math.max(2, params.spacing ?? 4);
  const intensity = params.intensity ?? 0.2;

  ctx.save();
  ctx.fillStyle = `rgba(0, 0, 0, ${intensity})`;

  for (let y = 0; y < height; y += spacing) {
    ctx.fillRect(0, y, width, 1);
  }

  // Add occasional thicker roller streak
  ctx.fillStyle = `rgba(0, 0, 0, ${intensity * 1.5})`;
  const streakY = (width * 37) % height;
  ctx.fillRect(0, streakY, width, 2);

  ctx.restore();
}

// -------------------------------------------------------------
// FILTER STACK EXECUTOR
// -------------------------------------------------------------

/**
 * Applies a filter stack to a 2D canvas context in sequential synchronous order.
 */
export function applyFilterStackToCanvasSync(
  canvas: HTMLCanvasElement,
  filters: FilterInstance[],
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  for (const filter of filters) {
    if (!filter.enabled) continue;

    switch (filter.type) {
      case 'halftone':
        applyHalftone(ctx, width, height, filter.params);
        break;

      case 'dither': {
        const imgData = ctx.getImageData(0, 0, width, height);
        applyDither(imgData, filter.params);
        ctx.putImageData(imgData, 0, 0);
        break;
      }

      case 'xerox': {
        const imgData = ctx.getImageData(0, 0, width, height);
        applyXerox(imgData, filter.params);
        ctx.putImageData(imgData, 0, 0);
        break;
      }

      case 'duotone': {
        const imgData = ctx.getImageData(0, 0, width, height);
        applyDuotone(imgData, filter.params);
        ctx.putImageData(imgData, 0, 0);
        break;
      }

      case 'risograph':
        applyRisograph(ctx, width, height, filter.params);
        break;

      case 'scanlines':
        applyScanlines(ctx, width, height, filter.params);
        break;
    }
  }
}

/**
 * Applies a filter stack to a 2D canvas context in sequential order.
 */
export async function applyFilterStackToCanvas(
  canvas: HTMLCanvasElement,
  filters: FilterInstance[],
): Promise<void> {
  applyFilterStackToCanvasSync(canvas, filters);
}

/**
 * Processes an image Data URL through a filter stack and returns the filtered Data URL.
 */
export async function processImageFilters(
  srcDataUrl: string,
  filters: FilterInstance[],
): Promise<string> {
  if (!filters || filters.length === 0 || !filters.some((f) => f.enabled)) {
    return srcDataUrl;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(srcDataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0);
      await applyFilterStackToCanvas(canvas, filters);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load image for filter processing'));
    img.src = srcDataUrl;
  });
}

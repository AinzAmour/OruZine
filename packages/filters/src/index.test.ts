import { describe, expect, it } from 'vitest';
import {
  AVAILABLE_FILTERS,
  applyDither,
  applyDuotone,
  applyXerox,
  createFilterInstance,
  FILTER_REGISTRY,
} from './index';

describe('Filter Registry and Filter Instances', () => {
  it('registers all 6 authentic print-culture filters', () => {
    expect(AVAILABLE_FILTERS).toHaveLength(6);
    expect(AVAILABLE_FILTERS).toContain('halftone');
    expect(AVAILABLE_FILTERS).toContain('dither');
    expect(AVAILABLE_FILTERS).toContain('xerox');
    expect(AVAILABLE_FILTERS).toContain('duotone');
    expect(AVAILABLE_FILTERS).toContain('risograph');
    expect(AVAILABLE_FILTERS).toContain('scanlines');
  });

  it('provides default parameters for each filter definition', () => {
    for (const type of AVAILABLE_FILTERS) {
      const def = FILTER_REGISTRY[type];
      expect(def).toBeDefined();
      expect(def.type).toBe(type);
      expect(def.name).toBeTruthy();
      expect(def.params.length).toBeGreaterThan(0);
      expect(def.defaultParams).toBeDefined();
    }
  });

  it('creates valid filter instances with unique IDs and defaults enabled', () => {
    const filt1 = createFilterInstance('halftone');
    const filt2 = createFilterInstance('halftone');

    expect(filt1.type).toBe('halftone');
    expect(filt1.enabled).toBe(true);
    expect(filt1.id).not.toBe(filt2.id);
    expect(filt1.params.dotSize).toBe(6);
  });
});

describe('Pixel Processing Algorithms (ImageData)', () => {
  // Helper to create mock ImageData
  function createMockImageData(width: number, height: number): ImageData {
    const data = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < data.length; i += 4) {
      // 50% gray gradient
      const val = ((i / 4) % width) * (255 / width);
      data[i] = val; // R
      data[i + 1] = val; // G
      data[i + 2] = val; // B
      data[i + 3] = 255; // A
    }
    return {
      width,
      height,
      data,
      colorSpace: 'srgb',
    } as ImageData;
  }

  it('applies Bayer 8x8 ordered dithering correctly', () => {
    const imgData = createMockImageData(16, 16);
    const result = applyDither(imgData, { algorithm: 'bayer8', levels: 2 });

    expect(result.data.length).toBe(16 * 16 * 4);
    // In 2-level dither, all active pixels must be quantized to 0 or 255
    for (let i = 0; i < result.data.length; i += 4) {
      const val = result.data[i];
      expect(val === 0 || val === 255).toBe(true);
      expect(result.data[i + 1]).toBe(val);
      expect(result.data[i + 2]).toBe(val);
    }
  });

  it('applies Xerox high-contrast thresholding', () => {
    const imgData = createMockImageData(10, 10);
    const result = applyXerox(imgData, { threshold: 128, noise: 0, dirtyEdges: 0 });

    for (let i = 0; i < result.data.length; i += 4) {
      const val = result.data[i];
      // Either deep toner black (18) or paper white (255)
      expect(val === 18 || val === 255).toBe(true);
    }
  });

  it('applies Duotone color transformation within target ink spectrum', () => {
    const imgData = createMockImageData(8, 8);
    const result = applyDuotone(imgData, {
      darkColor: '#000000',
      lightColor: '#ff00ff',
      contrast: 1,
    });

    for (let i = 0; i < result.data.length; i += 4) {
      // R and B should be >= 0 and G should be 0 because dark is #000000 and light is #ff00ff
      expect(result.data[i + 1]).toBe(0); // G channel must stay 0
      expect(result.data[i]).toBeGreaterThanOrEqual(0);
      expect(result.data[i + 2]).toBeGreaterThanOrEqual(0);
    }
  });
});

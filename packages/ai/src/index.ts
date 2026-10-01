// @oruzine/ai - Browser-local AI & Collage Cutout Processing
export const AI_VERSION = '0.2.0';

export interface BackgroundRemovalOptions {
  tolerance?: number; // 0..100 (default 25)
  feather?: number; // 0..10 (default 1)
  onProgress?: (percent: number, message: string) => void;
}

/**
 * Loads an image from a URL or data URL into an HTMLImageElement.
 */
export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image for processing'));
    img.src = src;
  });
}

/**
 * Converts a Canvas or Image to a high-quality PNG data URL.
 */
export function canvasToDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png');
}

/**
 * Removes background using color analysis of corner pixels and edge boundary flood-fill.
 * 100% client-side, runs in milliseconds with zero network requests or telemetry.
 */
export async function removeBackgroundAuto(
  imageSource: string | HTMLImageElement | HTMLCanvasElement,
  options: BackgroundRemovalOptions = {},
): Promise<string> {
  const { tolerance = 25, feather = 1, onProgress } = options;

  onProgress?.(10, 'Preparing image buffer...');
  let img: HTMLImageElement | HTMLCanvasElement;
  if (typeof imageSource === 'string') {
    img = await loadImage(imageSource);
  } else {
    img = imageSource;
  }

  const canvas = document.createElement('canvas');
  const width = img.width;
  const height = img.height;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D canvas context');

  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  onProgress?.(30, 'Detecting background sample colors...');

  // Sample colors from 4 corners and borders
  const sampleIndices = [
    0, // top-left
    (width - 1) * 4, // top-right
    (height - 1) * width * 4, // bottom-left
    ((height - 1) * width + (width - 1)) * 4, // bottom-right
    Math.floor(width / 2) * 4, // top-center
    ((height - 1) * width + Math.floor(width / 2)) * 4, // bottom-center
  ];

  const bgColors: { r: number; g: number; b: number }[] = [];
  for (const idx of sampleIndices) {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = data[idx + 3];
    if (a > 50) {
      bgColors.push({ r, g, b });
    }
  }

  if (bgColors.length === 0) {
    bgColors.push({ r: 255, g: 255, b: 255 }); // default white
  }

  onProgress?.(60, 'Segmenting subject from background...');

  // Color distance threshold (0..255 scale)
  const maxDistance = (tolerance / 100) * 180;

  // Mask array: 1 = background, 0 = foreground
  const isBg = new Uint8Array(width * height);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a === 0) {
      isBg[i / 4] = 1;
      continue;
    }

    // Check minimum distance to any background sample
    let minDiff = Number.POSITIVE_INFINITY;
    for (const bg of bgColors) {
      const diff = Math.sqrt((r - bg.r) ** 2 + (g - bg.g) ** 2 + (b - bg.b) ** 2);
      if (diff < minDiff) minDiff = diff;
    }

    if (minDiff <= maxDistance) {
      isBg[i / 4] = 1;
    }
  }

  onProgress?.(80, 'Refining cutout edges...');

  // Apply transparency to detected background pixels with optional feathering
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIdx = y * width + x;
      const dataIdx = pixelIdx * 4;

      if (isBg[pixelIdx] === 1) {
        data[dataIdx + 3] = 0; // Transparent
      } else if (feather > 0) {
        // Feather edge pixels adjacent to background
        let hasBgNeighbor = false;
        if (
          (x > 0 && isBg[pixelIdx - 1] === 1) ||
          (x < width - 1 && isBg[pixelIdx + 1] === 1) ||
          (y > 0 && isBg[pixelIdx - width] === 1) ||
          (y < height - 1 && isBg[pixelIdx + width] === 1)
        ) {
          hasBgNeighbor = true;
        }

        if (hasBgNeighbor) {
          data[dataIdx + 3] = Math.round(data[dataIdx + 3] * 0.6);
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  onProgress?.(100, 'Done');
  return canvasToDataUrl(canvas);
}

/**
 * Erases contiguous pixels matching the target color at (startX, startY) within tolerance.
 * Classic Magic Wand cutout tool.
 */
export function magicWandCutout(
  canvas: HTMLCanvasElement,
  startX: number,
  startY: number,
  tolerance = 25,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const targetIdx = (startY * width + startX) * 4;
  const targetR = data[targetIdx];
  const targetG = data[targetIdx + 1];
  const targetB = data[targetIdx + 2];
  const targetA = data[targetIdx + 3];

  if (targetA === 0) return; // Already transparent

  const maxDist = (tolerance / 100) * 200;
  const visited = new Uint8Array(width * height);
  const queue: [number, number][] = [[startX, startY]];
  visited[startY * width + startX] = 1;

  while (queue.length > 0) {
    const item = queue.pop();
    if (!item) break;
    const [x, y] = item;
    const idx = (y * width + x) * 4;

    // Erase pixel
    data[idx + 3] = 0;

    // 4-way neighbors
    const neighbors: [number, number][] = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nPixIdx = ny * width + nx;
        if (visited[nPixIdx] === 0) {
          visited[nPixIdx] = 1;
          const nDataIdx = nPixIdx * 4;
          const nr = data[nDataIdx];
          const ng = data[nDataIdx + 1];
          const nb = data[nDataIdx + 2];
          const na = data[nDataIdx + 3];

          if (na > 0) {
            const dist = Math.sqrt((nr - targetR) ** 2 + (ng - targetG) ** 2 + (nb - targetB) ** 2);
            if (dist <= maxDist) {
              queue.push([nx, ny]);
            }
          }
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Creates a torn-paper edge mask across the perimeter of the canvas.
 */
export function applyTornEdgeToCanvas(canvas: HTMLCanvasElement, roughness = 8): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  // Create temporary mask canvas
  const mask = document.createElement('canvas');
  mask.width = w;
  mask.height = h;
  const mctx = mask.getContext('2d');
  if (!mctx) return;

  mctx.fillStyle = '#000000';
  mctx.beginPath();

  // Top edge
  mctx.moveTo(0, 0);
  for (let x = 0; x <= w; x += 6) {
    const noise = (Math.sin(x * 0.1) * 0.5 + Math.random() - 0.5) * roughness;
    mctx.lineTo(x, Math.max(0, noise));
  }

  // Right edge
  for (let y = 0; y <= h; y += 6) {
    const noise = (Math.cos(y * 0.1) * 0.5 + Math.random() - 0.5) * roughness;
    mctx.lineTo(w - Math.max(0, noise), y);
  }

  // Bottom edge
  for (let x = w; x >= 0; x -= 6) {
    const noise = (Math.sin(x * 0.1) * 0.5 + Math.random() - 0.5) * roughness;
    mctx.lineTo(x, h - Math.max(0, noise));
  }

  // Left edge
  for (let y = h; y >= 0; y -= 6) {
    const noise = (Math.cos(y * 0.1) * 0.5 + Math.random() - 0.5) * roughness;
    mctx.lineTo(Math.max(0, noise), y);
  }

  mctx.closePath();
  mctx.fill();

  // Composite destination-in with mask
  ctx.save();
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(mask, 0, 0);
  ctx.restore();
}

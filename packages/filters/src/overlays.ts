// @oruzine/filters - Procedural Texture Overlays for Print Culture

export type OverlayType =
  | 'toner-dust'
  | 'copier-streaks'
  | 'fold-creases'
  | 'newsprint-grain'
  | 'light-leak';

export interface OverlayInstance {
  id: string;
  type: OverlayType;
  opacity: number;
  blendMode: 'multiply' | 'screen' | 'overlay';
}

export interface OverlayDefinition {
  type: OverlayType;
  name: string;
  description: string;
  defaultOpacity: number;
  defaultBlendMode: 'multiply' | 'screen' | 'overlay';
}

export const OVERLAY_REGISTRY: Record<OverlayType, OverlayDefinition> = {
  'toner-dust': {
    type: 'toner-dust',
    name: 'Toner Dust & Glass Grit',
    description: 'Speckles, toner dust, and micro-scratches from dirty photocopy glass.',
    defaultOpacity: 0.35,
    defaultBlendMode: 'multiply',
  },
  'copier-streaks': {
    type: 'copier-streaks',
    name: 'Copier Drum Streaks',
    description: 'Vertical roller drag lines from worn photocopy machine drums.',
    defaultOpacity: 0.3,
    defaultBlendMode: 'multiply',
  },
  'fold-creases': {
    type: 'fold-creases',
    name: 'Pocket Fold Creases',
    description: 'Realistic weathered spine crease and worn fold distress lines.',
    defaultOpacity: 0.4,
    defaultBlendMode: 'multiply',
  },
  'newsprint-grain': {
    type: 'newsprint-grain',
    name: 'Raw Newsprint Fiber',
    description: 'Fibrous organic paper grain and warm newsprint texture.',
    defaultOpacity: 0.4,
    defaultBlendMode: 'multiply',
  },
  'light-leak': {
    type: 'light-leak',
    name: 'Border Light Leak',
    description: 'Photographic scanner bed flare and corner edge exposure glow.',
    defaultOpacity: 0.3,
    defaultBlendMode: 'screen',
  },
};

export const AVAILABLE_OVERLAYS: OverlayType[] = [
  'toner-dust',
  'copier-streaks',
  'fold-creases',
  'newsprint-grain',
  'light-leak',
];

export function createOverlayInstance(type: OverlayType): OverlayInstance {
  const def = OVERLAY_REGISTRY[type];
  return {
    id: `ovl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    opacity: def.defaultOpacity,
    blendMode: def.defaultBlendMode,
  };
}

/**
 * Procedurally draws a texture overlay onto a 2D canvas context.
 */
export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  overlay: OverlayInstance,
): void {
  ctx.save();
  ctx.globalAlpha = overlay.opacity;
  ctx.globalCompositeOperation = overlay.blendMode;

  switch (overlay.type) {
    case 'toner-dust': {
      // Scatter random micro-dots and toner particles
      ctx.fillStyle = '#080808';
      const particleCount = Math.floor((width * height) / 800);
      for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const r = Math.random() < 0.9 ? 0.75 : Math.random() * 2 + 1;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'copier-streaks': {
      // Draw vertical roller scrape lines across the sheet
      ctx.fillStyle = 'rgba(20, 20, 20, 0.4)';
      const streakCount = Math.max(3, Math.floor(width / 70));
      for (let i = 0; i < streakCount; i++) {
        const x = Math.random() * width;
        const streakW = Math.random() * 2 + 0.5;
        ctx.fillRect(x, 0, streakW, height);
      }
      break;
    }

    case 'fold-creases': {
      // Draw horizontal and vertical distress fold lines
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.lineWidth = 1.5;

      // Center horizontal fold
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Quarter vertical folds
      for (let f = 1; f <= 3; f++) {
        ctx.beginPath();
        ctx.moveTo((width * f) / 4, 0);
        ctx.lineTo((width * f) / 4, height);
        ctx.stroke();
      }

      // Edge weathering
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, width - 4, height - 4);
      break;
    }

    case 'newsprint-grain': {
      // Warm fibrous mottled paper noise
      const imgData = ctx.createImageData(width, height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 50;
        data[i] = Math.max(0, Math.min(255, 240 + noise));
        data[i + 1] = Math.max(0, Math.min(255, 235 + noise));
        data[i + 2] = Math.max(0, Math.min(255, 215 + noise));
        data[i + 3] = Math.floor(Math.random() * 45 + 10);
      }
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tCtx = tempCanvas.getContext('2d');
      if (tCtx) {
        tCtx.putImageData(imgData, 0, 0);
        ctx.drawImage(tempCanvas, 0, 0);
      }
      break;
    }

    case 'light-leak': {
      // Radial glow gradient from top-left corner
      const gradient = ctx.createRadialGradient(
        0,
        0,
        width * 0.05,
        0,
        0,
        Math.max(width, height) * 0.8,
      );
      gradient.addColorStop(0, 'rgba(255, 230, 200, 0.9)');
      gradient.addColorStop(0.4, 'rgba(255, 120, 180, 0.4)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      break;
    }
  }

  ctx.restore();
}

/**
 * Applies multiple overlays sequentially to a canvas.
 */
export function applyOverlaysToCanvas(
  canvas: HTMLCanvasElement,
  overlays: OverlayInstance[],
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx || !overlays || overlays.length === 0) return;

  for (const ovl of overlays) {
    drawOverlay(ctx, canvas.width, canvas.height, ovl);
  }
}

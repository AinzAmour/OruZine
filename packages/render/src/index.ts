import { Application, Assets, Container, Graphics, Sprite, Text, TextStyle } from 'pixi.js';

export interface RenderObject {
  id: string;
  type: 'image' | 'text' | 'shape';
  x: number; // page-relative mm
  y: number; // page-relative mm
  w: number; // mm
  h: number; // mm
  rotation: number; // degrees
  opacity: number;
  locked?: boolean;
  hidden?: boolean;
  // Image props
  imageDataUrl?: string | null;
  imageFit?: 'cover' | 'contain';
  // Text props
  text?: string;
  fontSizePt?: number;
  color?: string;
  bold?: boolean;
  // Shape props
  shapeType?: 'rect' | 'circle' | 'line';
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

export interface RenderPage {
  pageNumber: number;
  widthMm: number;
  heightMm: number;
  backgroundColor: string;
  objects: RenderObject[];
}

export interface RenderOptions {
  dpi: number;
  showGuides?: boolean;
  preferredRenderer?: 'webgpu' | 'webgl';
}

interface NavigatorWithGPU {
  gpu?: {
    requestAdapter: () => Promise<unknown>;
  };
}

/**
 * Checks whether WebGPU is available on the current browser.
 */
export async function isWebGPUSupported(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('gpu' in navigator)) {
    return false;
  }
  try {
    const nav = navigator as unknown as NavigatorWithGPU;
    const adapter = await nav.gpu?.requestAdapter();
    return !!adapter;
  } catch {
    return false;
  }
}

/**
 * Creates a PixiJS Application instance with WebGPU primary and WebGL fallback.
 */
export async function createPixiRenderer(
  width: number,
  height: number,
  preference: 'webgpu' | 'webgl' = 'webgpu',
): Promise<Application> {
  const app = new Application();
  const hasWebGPU = await isWebGPUSupported();

  await app.init({
    width,
    height,
    backgroundAlpha: 0,
    preference: hasWebGPU && preference === 'webgpu' ? 'webgpu' : 'webgl',
  });

  return app;
}

/**
 * Pure Scene Builder: Converts a RenderPage document into a PixiJS Container hierarchy.
 * Both the interactive preview and high-res export pipeline share this identical scene tree.
 */
export async function buildPageContainer(
  page: RenderPage,
  scale: number, // pixels per mm (dpi / 25.4)
): Promise<Container> {
  const container = new Container();

  // 1. Page Background
  const bg = new Graphics();
  const pageWidthPx = page.widthMm * scale;
  const pageHeightPx = page.heightMm * scale;

  bg.rect(0, 0, pageWidthPx, pageHeightPx);
  bg.fill({ color: page.backgroundColor || '#ffffff' });
  container.addChild(bg);

  // 2. Render each visible object in layer order (bottom to top)
  for (const obj of page.objects) {
    if (obj.hidden) continue;

    const objContainer = new Container();
    objContainer.x = obj.x * scale;
    objContainer.y = obj.y * scale;
    objContainer.rotation = (obj.rotation * Math.PI) / 180;
    objContainer.alpha = obj.opacity ?? 1;

    if (obj.type === 'shape') {
      const g = new Graphics();
      const w = obj.w * scale;
      const h = obj.h * scale;

      const fill = obj.fillColor ? { color: obj.fillColor } : undefined;
      const stroke = obj.strokeColor
        ? { color: obj.strokeColor, width: (obj.strokeWidth ?? 2) * (scale / 3.77) }
        : undefined;

      if (obj.shapeType === 'circle') {
        g.ellipse(w / 2, h / 2, w / 2, h / 2);
      } else {
        g.rect(0, 0, w, h);
      }

      if (fill) g.fill(fill);
      if (stroke) g.stroke(stroke);

      objContainer.addChild(g);
    } else if (obj.type === 'text' && obj.text) {
      const fontSizePx = ((obj.fontSizePt ?? 12) / 72) * 25.4 * scale;

      const style = new TextStyle({
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: fontSizePx,
        fontWeight: obj.bold ? 'bold' : 'normal',
        fill: obj.color || '#121212',
        wordWrap: true,
        wordWrapWidth: obj.w * scale,
      });

      const pixiText = new Text({
        text: obj.text,
        style,
      });

      objContainer.addChild(pixiText);
    } else if (obj.type === 'image' && obj.imageDataUrl) {
      try {
        const texture = await Assets.load(obj.imageDataUrl);
        const sprite = new Sprite(texture);

        const targetW = obj.w * scale;
        const targetH = obj.h * scale;

        if (obj.imageFit === 'contain') {
          const ratio = Math.min(targetW / sprite.width, targetH / sprite.height);
          sprite.width *= ratio;
          sprite.height *= ratio;
          sprite.x = (targetW - sprite.width) / 2;
          sprite.y = (targetH - sprite.height) / 2;
        } else {
          // cover
          const ratio = Math.max(targetW / sprite.width, targetH / sprite.height);
          sprite.width *= ratio;
          sprite.height *= ratio;
          sprite.x = (targetW - sprite.width) / 2;
          sprite.y = (targetH - sprite.height) / 2;
        }

        objContainer.addChild(sprite);
      } catch (err) {
        console.warn('Failed to load image texture in PixiJS:', err);
      }
    }

    container.addChild(objContainer);
  }

  return container;
}

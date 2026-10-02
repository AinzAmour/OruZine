# OruZine v2 — Design Specification

**Date:** 2026-10-02  
**Status:** Approved  
**Scope:** 5 sub-projects extending the core zine editor

---

## 1. Rich Typography & Retro Text Styling Engine

### 1.1 Schema Extension — `TextObject`

Extend the existing `TextObject` in `documentStore.ts`:

```typescript
export interface TextObject extends BaseZineObject {
  type: 'text';
  text: string;
  fontSizePt: number;
  color: string;
  bold: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: TextAlign;
  fontFamily?: string;
  backgroundColor?: string;
  lineHeight?: number;
  letterSpacing?: number;

  // NEW: Warp & Curve
  warpType?: 'none' | 'arc-up' | 'arc-down' | 'wave' | 'badge-circle';
  warpAmount?: number;      // -100 to 100

  // NEW: Stroke / Outline
  strokeWidth?: number;     // 0 to 16
  strokeColor?: string;

  // NEW: Retro Shadow
  shadowStyle?: 'none' | 'drop' | 'retro-hard' | 'extruded-3d';
  shadowColor?: string;
  shadowOffset?: { x: number; y: number };

  // NEW: Badge Background
  badgeFill?: string;
  badgePadding?: number;
  badgeRadius?: number;
}
```

### 1.2 SVG Warped Text Renderer — `StyledTextRenderer`

A shared component used identically across:
- Editor canvas
- `MiniPagePreview` filmstrip thumbnails
- Imposed sheet cells
- 300 DPI PDF/PNG export engine (`packages/export`)

**Rendering approach:**
- Standard text → direct SVG `<text>` with stroke/shadow attributes
- Warped text → SVG `<path id="curve">` computed from warpType + warpAmount, then `<textPath href="#curve">`
- `retro-hard` and `extruded-3d` shadows → stacked offset `<text>` layers
- Badge → `<rect>` or `<ellipse>` behind text with `badgeFill` / `badgeRadius`

### 1.3 Font Manager — `useFontStore`

**Pre-installed retro fonts (Google Fonts):**
- `Special Elite` (Typewriter)
- `Black Ops One` (Punk Stencil)
- `VT323` (90s Pixel)
- `Bungee Shade` (Chiseled 3D)
- `Permanent Marker` (Hand-Drawn)
- `Syne Mono` (Brutalist)
- `Cinzel Decorative` (Gothic Serif)

**Custom font upload:**
- Accepts `.ttf`, `.otf`, `.woff2` drag-and-drop
- Registers via `new FontFace(family, arrayBuffer).load()` + `document.fonts.add()`
- Persists in IndexedDB (`idb-keyval`) for cross-session reuse
- Fonts active in document auto-embedded as base64 in `.oruzine` save file

### 1.4 Inspector Controls

New sections in the right-hand Inspector when a `TextObject` is selected:
- **Font Family Picker** — dropdown showing pre-installed + custom fonts, with "Upload Font" button
- **Text Warp** — preset buttons (None, Arc Up, Arc Down, Wave, Badge) + `warpAmount` slider (-100 to 100)
- **Stroke & Outline** — `strokeWidth` slider (0-16) + `strokeColor` swatch
- **Retro Shadow** — preset buttons (None, Drop, Retro Hard, Extruded 3D) + `shadowColor` swatch + offset x/y sliders
- **Badge Background** — `badgeFill` color swatch + `badgePadding` slider + `badgeRadius` slider

---

## 2. Zine Ephemera & Sticker Asset Library

### 2.1 Asset Categories

All stickers stored as inline SVG definitions in `packages/core/src/assets/stickers/`:

| Category | Items |
|----------|-------|
| **Tapes & Fasteners** | Kraft washi, checkered punk washi, frosted tape, floral masking, paperclips (metallic + colorful), brass staples, pushpins, safety pins |
| **Punk & DIY** | Barcode stickers, "EXPLICIT" label badges, Xerox burn margins, spray-paint stencils, ransom-note clippings |
| **Botanical & Vintage** | Pressed fern/flower vectors, cancellation postmarks, vintage postage stamps, antique wax seals |
| **Y2K & Cyber** | Chrome metallic stars, tribal barbed-wire, caution warning strips, 8-bit pixel icons |

### 2.2 `StickerType` Extension

Extend the existing `StickerType` union:

```typescript
export type StickerType =
  // Existing
  | 'tape-masking' | 'tape-duct' | 'tape-clear' | 'staple' | 'pushpin'
  | 'arrow' | 'star' | 'barcode' | 'halftone-dot'
  // NEW: Tapes & Fasteners
  | 'tape-washi-kraft' | 'tape-washi-checker' | 'tape-washi-floral' | 'tape-frosted'
  | 'paperclip-silver' | 'paperclip-gold' | 'paperclip-colorful'
  | 'staple-brass' | 'safety-pin'
  // NEW: Punk & DIY
  | 'barcode-label' | 'explicit-badge' | 'xerox-burn' | 'spray-stencil'
  | 'ransom-clipping'
  // NEW: Botanical & Vintage
  | 'pressed-fern' | 'pressed-flower' | 'postmark' | 'vintage-stamp' | 'wax-seal'
  // NEW: Y2K & Cyber
  | 'chrome-star' | 'tribal-wire' | 'caution-tape' | 'pixel-icon';
```

### 2.3 Tint Color Support

All sticker SVGs support `color` property customization — the SVG uses `currentColor` for primary fill, allowing users to tint paperclips, tape, stamps, etc. via the Inspector color swatch.

### 2.4 Sticker Drawer UI

Expand `TapeStickersDrawer` into a categorized, searchable grid:
- 4 category tabs: Tapes, Punk, Botanical, Y2K
- Click to add centered on current page
- Drag from drawer directly onto canvas

---

## 3. Advanced Imposition Formats

### 3.1 New Format Definitions in `@oruzine/formats`

Add 3 new `FormatDefinition` entries:

#### French Fold (4-Page / Secret Poster)
- `id: 'french-fold'`
- 4 pages on 1 sheet, single-sided print
- Folds in half vertically then horizontally
- Inner reverse = full-size poster page
- `pageCount: { fixed: 5 }` (4 booklet pages + 1 poster page)
- `layout: { type: 'table', sheets: [...] }`

#### 16-Page Quarter-Fold
- `id: 'quarter-fold-16'`
- 16 pages from a single sheet with slit cuts
- 4×4 duplex grid
- `pageCount: { fixed: 16 }`
- `layout: { type: 'table', sheets: [...] }`

#### Multi-Sheet Saddle-Stitched Booklet
- `id: 'saddle-stitch'`
- Dynamic page count: 8, 12, 16, 20, 24 pages
- Multiple nested sheets folded down spine, stapled
- `pageCount: { min: 8, max: 24, multipleOf: 4 }`
- `layout: { type: 'algorithm', id: 'saddle-stitch' }`

### 3.2 Saddle-Stitch Imposition Algorithm

In `packages/imposition/src/index.ts`, add algorithmic layout for `saddle-stitch`:

```
Sheet count = pageCount / 4
For each sheet s (0-indexed):
  Outer side: page (totalPages - 2*s) left, page (2*s + 1) right
  Inner side: page (2*s + 2) left, page (totalPages - 2*s - 1) right
```

### 3.3 Creep Compensation

For saddle-stitch booklets with ≥12 pages, apply incremental inner-margin offset:
- `creepPerSheet = 0.2mm` (configurable via `creepMm` in DocumentSnapshot)
- Each nested sheet shifts content inward by `sheetIndex × creepPerSheet`

### 3.4 Fold/Cut Instructions

Each new format includes `foldSteps[]` and visual `foldLines[]` / `cutLines[]` for the "How to Fold" overlay.

---

## 4. Mobile & Tablet Touch Gestures

### 4.1 Canvas Touch Engine

Add touch gesture handling to the editor canvas:

| Gesture | Action |
|---------|--------|
| 1-finger drag on object | Move object |
| 1-finger drag on empty canvas | Pan canvas |
| 2-finger pinch | Zoom canvas |
| 2-finger rotate | Rotate selected object |
| Double-tap | Select object / open text edit |
| Long press | Context menu (duplicate, delete, lock) |

### 4.2 Responsive Layout

- **Desktop (≥1024px):** Current 3-panel layout (filmstrip | canvas | inspector)
- **Tablet (768–1023px):** Collapsible inspector as right drawer overlay
- **Phone (<768px):** Full-screen canvas + bottom toolbar + swipeable bottom drawer sheets for inspector/filmstrip/stickers

### 4.3 Bottom Drawer Sheets

On mobile, all panels (Pages, Inspector, Stickers, Templates) become swipeable bottom sheets:
- Half-height by default
- Swipe up to full-height
- Swipe down to dismiss
- Only one drawer open at a time

---

## 5. AI Engine

### 5.1 Client-Side AI (Free, Offline, Zero API Key)

#### Background Removal — ORMBG (IS-Net)
- **Model:** `onnx-community/ormbg-ONNX` (42 MB INT8)
- **Runtime:** `@huggingface/transformers` v3 with WebGPU → WASM fallback
- **Speed:** ~250ms (WebGPU) / ~1.6s (WASM)
- **License:** Apache 2.0
- Replaces current color-distance algorithm in `@oruzine/ai`
- Runs in Web Worker to keep UI smooth

#### Image Upscaler — Tiered Real-ESRGAN
- **Tier 1 (any device):** `realesr-general-x4v3` (4.9 MB, SRVGGNetCompact) via `onnxruntime-web`
- **Tier 2 (mid-range):** `RealESRGAN_x4plus_anime_6B` (17.9 MB) — auto-enabled when WebGPU detected + ≥4GB VRAM
- **Instant:** `ESPCN` (100 KB) — mathematical upscale, always available
- Patch tiling (256×256 with 16px overlap) to prevent OOM
- Execution provider fallback: `['webgpu', 'wasm']`

#### Smart Auto-Crop — smartcrop.js + MediaPipe Boost
- **Base:** `smartcrop` (12 KB, MIT) — instant saliency-based composition
- **Boost:** `@mediapipe/tasks-vision` Face Detector (228 KB) + Object Detector (4.4 MB)
- Face boxes injected as boost regions (weight 3.0–5.0)
- Composition presets: Rule of Thirds, Centered Subject, Group Safe-Zone

#### Auto Color Palette — Pure JS K-Means
- Downscale to 64×64 canvas → extract pixel RGB → k-means (k=5)
- Generate complementary, analogous, triadic palettes
- <20ms, zero model download

#### Style Transfer — Hybrid Neural + Procedural Pipeline
**Stage 1 (AI, runs once ~35ms):**
- `White-Box Cartoonization` (5.5 MB) → flat tonal planes for riso/screen-print
- `AnimeGANv3 Comic` (8.6 MB) → cel-shaded for manga/comic
- `Anime2Sketch` (11 MB) → bold ink contours for woodcut/linocut
- `Magenta Arbitrary Style` (12 MB) → user-uploaded reference artwork
- `Fast Neural Style (Johnson)` (3.4 MB each) → preset painterly styles

**Stage 2 (Procedural, 60 FPS with sliders):**
- Color channel separation into spot ink drums
- Angled halftone dot screening
- Mechanical registration misalignment shift
- Print imperfections (toner bleed, dry drag, ink bite)
- Tactile overlays (paper fiber, fold creases, copier dust)

### 5.2 Cloud AI (Gemini Free Tier, Optional API Key)

**Single provider:** Google Gemini API via `@google/genai`

| Feature | Gemini Model | Free Tier |
|---------|-------------|-----------|
| AI Sticker Generator | Imagen 3 | 50 img/day |
| AI Image Outpainting | Imagen Edit | 50 img/day |
| AI Zine Content Writer | Gemini 2.0 Flash | 1,500 req/day |
| AI Layout Auto-Arranger | Gemini (JSON) | 1,500 req/day |
| AI Font Pairing Advisor | Gemini (text) | 1,500 req/day |

**Settings Panel:**
- API Key input in Settings → AI tab
- Key stored in `localStorage` (never transmitted except to Gemini API)
- Cloud features hidden until key is configured
- "Get Free API Key" link to aistudio.google.com

### 5.3 Model Loading Strategy

All AI models are **lazy-loaded on first use** and cached in browser `CacheStorage` / `IndexedDB`:
- No models downloaded on app startup
- Progress indicator during first-time model download
- Models persist across sessions — only downloaded once
- Total client-side AI bundle: ~99 MB (spread across features)

### 5.4 Web Worker Architecture

All inference runs in dedicated Web Workers to prevent UI jank:
- `ai-bgremoval.worker.ts` — background removal
- `ai-upscale.worker.ts` — image upscaling with tile stitching
- `ai-style.worker.ts` — style transfer Stage 1
- Main thread only handles: UI updates, progress callbacks, result compositing

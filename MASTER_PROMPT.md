# OruZine: Master Build Prompt v2

> **How to use:** Paste this entire document into Antigravity (or any AI coding tool) as the project brief. Work **one phase at a time** (Section 15). After each phase, stop → summarize what was built → list anything unfinished → wait for approval before starting the next.

---

## 1. Role & Goal

You are a senior front-end engineer building **OruZine**, a free, open-source, browser-based zine maker.

A user picks a zine format, fills its pages with collaged images, text, and drawings, styles them with print-culture filters and overlays, and downloads a **print-ready, correctly imposed** PDF/JPG that prints at home, folds, and becomes a real zine.

**Name meaning:** "Oru" means "fold" (Japanese) and "one" (Tamil).
**Tagline:** *"One sheet. One fold. One zine."*

**Reference product:** [dirtylittlezine.com](https://dirtylittlezine.com) — 8-page, single-sheet zine, panel-based, no sign-up, runs fully in the browser, 300 DPI JPG/PDF export, Letter/A4/A3, fold guide, works offline. OruZine matches its simplicity and privacy, then goes further with: multiple formats, a built-in image editor, collage tools, filters, overlays, AI-assisted features, and one-click "Looks".

> [!CAUTION]
> **Do not copy DLZ's code, copy, or branding.** Build original work only.

**Repository:** [github.com/AinzAmour/OruZine](https://github.com/AinzAmour/OruZine)

---

## 2. Non-Negotiable Principles

1. **Privacy-first:** Everything runs client-side. No uploads, no accounts, no analytics that identify people. Images never leave the device. AI features run locally in-browser (WebNN / ONNX Runtime Web / Transformers.js).
2. **Static site:** Deployable to Cloudflare Pages / GitHub Pages with zero backend.
3. **Works offline** after first load (PWA with proper caching strategy).
4. **Print correctness over visual flash.** If the imposition is wrong, the product is wrong. Imposition is tested heavily.
5. **WYSIWYG:** Preview and 300 DPI export use the **same render pipeline** at different resolutions.
6. **Beginner front door:** A first-time user should finish a zine in ~2 minutes. Advanced tools live behind a clean panel editor and never block the simple path.
7. **Formats, Looks, and overlays are data**, so contributors can add them without touching core code.
8. **Open source:** MIT for code, CC0/CC-BY/OFL for assets. Every asset recorded in `CREDITS.md`.
9. **Latest stable tech:** Always prefer the latest stable release of every dependency. No bleeding-edge prereleases; no abandoned packages.

---

## 3. Tech Stack

> [!IMPORTANT]
> Use exactly this stack unless a genuine blocker appears. If one does, explain the blocker and propose an alternative — do not silently swap.

| Layer | Choice | Version | Notes |
|---|---|---|---|
| **Language** | TypeScript (strict mode) | latest | |
| **UI Framework** | React | `19.3.x` | Use `ref` as prop, `useActionState`, `use()`, transitions; React Compiler compatible |
| **Build** | Vite | `8.3.x` | Rolldown-based unified bundling |
| **Rendering** | PixiJS | `8.21.x` | WebGPU primary, WebGL2 fallback; custom WGSL/GLSL shaders |
| **State** | Zustand + Immer | `5.x` / `11.x` | Patch-based undo/redo |
| **PDF Export** | `@cantoo/pdf-lib` | `2.11.x` | Actively maintained fork of pdf-lib; 100% API compatible, fixes memory leaks |
| **Storage** | Dexie.js (IndexedDB) | `4.4.x` | Autosave + image blobs; reactive live queries |
| **Project Files** | fflate (zip) | `0.8.x` | `.oruzine` = zip containing `document.json` + image blobs |
| **Styling** | Tailwind CSS + Radix UI | `4.3.x` / `3.3.x` | CSS-first `@theme` config (Oxide engine); Radix headless primitives |
| **Drag & Drop** | `@atlaskit/pragmatic-drag-and-drop` | `4.x` | Production-grade, performant; `@dnd-kit/react` rewrite is still pre-1.0 |
| **Icons** | Lucide React | `1.49.x` | |
| **PWA** | vite-plugin-pwa | `1.3.x` | Workbox service worker integration |
| **Workers** | Web Workers + OffscreenCanvas + `createImageBitmap` | — | Heavy rendering/filter jobs |
| **WASM** | Rust → wasm-pack (optional) | — | For heavy export-time processing: dithering, halftone, image resizing |
| **Browser AI** | `@huggingface/transformers` + ONNX Runtime Web | `4.3.x` / `1.30.x` | WebGPU-accelerated; models lazy-loaded, cached in IndexedDB |
| **Tests** | Vitest + Playwright | `5.x` / `1.63.x` | Unit + E2E + visual regression |
| **Lint/Format** | Biome | `2.5.x` | Rust-based unified linter + formatter |
| **i18n** | i18next + react-i18next | `26.x` / `17.x` | English only for now; architecture supports adding languages later |
| **Monorepo** | pnpm workspaces | `12.x` | |
| **CI** | GitHub Actions | — | Typecheck, lint, test, build, bundle-size check on every PR |

### 3.1 Font Strategy
- **Self-hosted only** — zero Google Fonts requests at runtime.
- Subsetted, OFL-licensed.
- Include fonts with good Tamil + Latin-extended coverage (Noto families) for future i18n.
- Lazy-loaded by category (display, body, handwriting, etc.).

### 3.2 WebGPU / WebGL Strategy
- **Primary:** WebGPU via PixiJS v8's native WebGPU backend. Write filter shaders in WGSL.
- **Fallback:** WebGL2 backend (PixiJS handles this automatically). Maintain GLSL equivalents for all custom shaders.
- **Detection:** On app start, probe for WebGPU support. If unavailable, fall back to WebGL2. If neither, show a clear unsupported-browser message with recommended browsers.
- **Browser support (WebGPU is Baseline as of 2026):** Chrome 113+, Edge 113+, Firefox 141+, Safari 26+. All major browsers support WebGPU by default on desktop and mobile.

---

## 4. Repository Structure

```
oruzine/
├─ apps/
│  └─ web/                     # React app — UI shell, editor, routing, pages
│     ├─ src/
│     │  ├─ components/        # UI components (editor, panels, dialogs)
│     │  ├─ features/          # Feature modules (format-picker, editor, export, preview)
│     │  ├─ hooks/             # Custom React hooks
│     │  ├─ stores/            # Zustand stores
│     │  ├─ workers/           # Web Worker entry points
│     │  ├─ ai/                # Browser AI integration (lazy-loaded)
│     │  ├─ styles/            # Global styles, Tailwind config, theme tokens
│     │  └─ i18n/              # Translation files
│     ├─ public/               # Static assets, PWA manifest
│     └─ e2e/                  # Playwright tests
├─ packages/
│  ├─ imposition/              # Pure TS: format + page count → PlacementPlan. NO DOM/canvas deps.
│  ├─ formats/                 # JSON format definitions + JSON Schema + validator
│  ├─ render/                  # Shared PixiJS scene builder (preview + export share this)
│  ├─ filters/                 # WGSL/GLSL shaders, filter registry, overlay registry, Looks
│  ├─ export/                  # Tiled renderer, PDF/JPG/PNG writers, fold-guide/crop-mark drawing
│  └─ ai/                      # Browser AI pipelines (bg removal, smart crop, etc.) — no UI deps
├─ assets/
│  ├─ fonts/                   # OFL-licensed, subsetted
│  ├─ textures/                # Paper textures, overlays (CC0/CC-BY)
│  ├─ stickers/                # Sticker assets
│  ├─ tape/                    # Tape strip assets
│  ├─ overlays/                # Overlay textures
│  ├─ models/                  # ONNX models for AI features (lazy-fetched, cached)
│  └─ CREDITS.md               # Source + license for EVERY asset
├─ docs/
│  ├─ ARCHITECTURE.md
│  ├─ CONTRIBUTING.md
│  ├─ ADDING_A_FORMAT.md
│  ├─ ADDING_A_LOOK.md
│  ├─ ADDING_AN_OVERLAY.md
│  └─ DECISIONS.md             # Decision log: resolved design choices with rationale
├─ LICENSE                     # MIT
├─ LICENSE-ASSETS.md           # Asset license summary
├─ README.md
├─ CODE_OF_CONDUCT.md
└─ .github/
   ├─ workflows/               # CI: typecheck, lint, test, build, bundle-size
   ├─ ISSUE_TEMPLATE/
   └─ PULL_REQUEST_TEMPLATE.md
```

---

## 5. Core Data Model

> All types must be **plain JSON-serializable**. Refine as needed but preserve serialization.

```ts
type Unit = 'mm';  // All physical sizes stored in millimeters

// ─── FORMAT DEFINITION ───────────────────────────────────────────────

interface FormatDefinition {
  id: string;                              // 'mini-8', 'saddle-stitch', ...
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'advanced';
  needs: ('scissors' | 'stapler' | 'ruler')[];
  paper: {
    sizes: ('letter' | 'a4' | 'a3' | 'tabloid')[];
    orientation: 'landscape' | 'portrait';
  };
  pageCount: {
    fixed?: number;
    min?: number;
    max?: number;
    multipleOf?: number;
  };
  sidedness: 'single' | 'duplex';
  duplexFlip?: 'long-edge' | 'short-edge';
  readingDirection: 'ltr' | 'rtl';
  layout:
    | { type: 'table'; sheets: SheetLayout[] }
    | { type: 'algorithm'; id: 'saddle-stitch' | 'accordion' | 'quarter-fold' };
  foldLines: Line[];                       // Sheet-relative 0..1 coords
  cutLines: Line[];
  creep?: { supported: boolean };
  foldSteps: FoldStep[];                   // Data for fold guide (text + diagram keyframes)
}

interface SheetLayout {
  side: 'front' | 'back';
  cols: number;
  rows: number;
  cells: {
    col: number;
    row: number;
    page: number;
    rotation: 0 | 90 | 180 | 270;
  }[];
}

// ─── PLACEMENT PLAN (imposition output) ──────────────────────────────

interface PlacementPlan {
  sheets: {
    side: 'front' | 'back';
    cells: {
      page: number | null;               // null = blank padding
      x: number; y: number;
      w: number; h: number;
      rotation: number;
    }[];
  }[];
  paddedPages: number;                    // Blanks added to reach valid count
}

// ─── ZINE DOCUMENT ───────────────────────────────────────────────────

interface ZineDocument {
  version: number;                        // Schema version for migrations
  formatId: string;
  paper: 'letter' | 'a4' | 'a3' | 'tabloid';
  pageCount: number;
  margins: { top: number; right: number; bottom: number; left: number };  // mm
  bleedMm: number;
  pages: Page[];
  look?: LookRef;                         // Zine-wide Look
  theme: {
    spotColor: string;                    // User-chosen accent color
    darkMode: boolean;                    // Editor preference (not exported)
  };
  meta: {
    title: string;
    author?: string;
    created: string;                      // ISO 8601
    updated: string;
    appVersion: string;                   // OruZine version that created this
  };
}

// ─── PAGE ────────────────────────────────────────────────────────────

interface Page {
  id: string;
  background: Fill;
  objects: ZObject[];
  pageFilters?: FilterInstance[];
  overlays?: OverlayInstance[];
}

// ─── OBJECTS ─────────────────────────────────────────────────────────

type ZObject = ImageObj | TextObj | ShapeObj | DrawingObj | StickerObj;

interface BaseObj {
  id: string;
  type: string;
  x: number; y: number; w: number; h: number;  // Page-relative, in mm
  rotation: number;
  opacity: number;
  blend: BlendMode;
  locked: boolean;
  hidden: boolean;
  mask?: MaskDef;                         // Shape / torn-edge / lasso polygon
  shadow?: ShadowDef;                     // Paper-edge shadow
  filters: FilterInstance[];              // Non-destructive filter stack
}

interface ImageObj extends BaseObj {
  type: 'image';
  blobId: string;                         // Reference to IndexedDB blob
  crop: CropRect;
  fit: 'cover' | 'contain' | 'free';
  flipX: boolean;
  flipY: boolean;
  altText?: string;                       // Accessibility — used in digital export
  aiMeta?: {                              // Populated by AI features
    hasSubject?: boolean;
    subjectBounds?: Rect;
    bgRemoved?: boolean;
    bgRemovedBlobId?: string;
  };
}

interface TextObj extends BaseObj {
  type: 'text';
  text: string;
  font: string;
  sizePt: number;
  color: string;
  align: 'left' | 'center' | 'right' | 'justify';
  lineHeight: number;
  letterSpacing: number;
  effects: TextEffect[];                  // Outline, shadow, stamp, highlighter, ransom, etc.
}

interface DrawingObj extends BaseObj {
  type: 'drawing';
  strokes: Stroke[];                      // Vector strokes with brush params
}

interface ShapeObj extends BaseObj {
  type: 'shape';
  shape: 'rect' | 'ellipse' | 'line' | 'arrow' | 'star' | 'polygon';
  fill: Fill;
  stroke: StrokeDef;
  wobble?: boolean;                       // Hand-drawn wobbly borders
}

interface StickerObj extends BaseObj {
  type: 'sticker';
  stickerId: string;                      // Reference to asset registry
  tint?: string;
}
```

### 5.1 Data Model Rules

1. **Non-destructive:** Originals are stored untouched. Transforms, masks, and filter stacks are parameters. Nothing is baked until export.
2. **Reader-order editing:** Pages are authored in reader order (1..N). Imposition happens only at preview-sheet and export time. The user never edits an upside-down panel.
3. **Blob storage:** Images stored as blobs in IndexedDB; document JSON references by `blobId`. On import, generate a downscaled working copy (max ~2500 px long edge) for editing; keep the original for export.
4. **Schema versioning:** `ZineDocument.version` enables forward migrations. Every version bump includes a migration function. Migrations are tested.
5. **AI metadata:** AI-generated data (subject bounds, background masks) is stored alongside the object but never replaces the original. The user can discard AI results at any time.

---

## 6. Imposition Engine (`packages/imposition`)

> [!IMPORTANT]
> This is the most critical module. Pure TypeScript, zero DOM dependencies, 100% unit-tested.

### 6.1 API

```ts
function impose(
  format: FormatDefinition,
  pageCount: number,
  opts: {
    paper: PaperSize;
    margins: Margins;
    bleedMm: number;
    creepMm?: number;
    rtl?: boolean;
  }
): PlacementPlan;
```

### 6.2 Format A — 8-Page Mini Zine (one sheet, one cut)

Landscape sheet, 4 columns × 2 rows, single-sided.

Page numbers in **reader order** when folded:

```
Top row    (each cell rotated 180°):   5   4   3   2
Bottom row (upright):                  6   7   8   1
```

- Page 1 = front cover, Page 8 = back cover.
- **Fold lines:** One horizontal (center), three vertical.
- **Cut line:** Along the horizontal center fold, **only across the two middle columns** (one panel deep each side of center).
- RTL option mirrors the column order.

> [!CAUTION]
> **Verify with a physical-fold checklist in test comments** and by printing the test sheet. If the table above produces a wrong reading order when folded, fix the table and document why. Do not guess.

### 6.3 Format B — Saddle-Stitch Booklet (duplex)

- Page count must be a multiple of 4. If not, **pad with blanks** to next multiple of 4 and report `paddedPages`. UI offers "blanks at the end" or "use as notes pages."
- Sheets = `N / 4`. Each sheet is one landscape sheet printed on both sides with two portrait pages per side.
- For sheet index `s` (0-based):
  - **Front:** left = `N - 2s`, right = `1 + 2s`
  - **Back:** left = `2 + 2s`, right = `N - 1 - 2s`
- Duplex: **flip on short edge** (landscape sheet, pages side by side). State this on the export screen and in the PDF's first-page instructions.
- **Creep compensation (optional):** For sheet `s` of `S` total, shift inner-margin content outward by `creepMm × s / (S-1)`. Outermost sheet shifts 0, innermost shifts most. Toggle; default on for 5+ sheets.
- RTL option swaps left/right and reverses sequence.

### 6.4 Tier 2 Formats (define as data; build after Tier 1 ships)

Quarter-fold (16 panels, no cut), accordion/leporello, tri-fold, Z-fold, gatefold. Each gets a table or algorithm entry, a fold guide, and tests.

### 6.5 Required Tests

| Test | Description |
|---|---|
| **Snapshot** | `PlacementPlan` for mini-8 on Letter and A4 |
| **Property (saddle-stitch)** | N = 4, 8, 12, 16, 20, 40: every page appears exactly once; front/back pairs sum to `N + 1`; each sheet has exactly 2 pages per side |
| **Padding** | N = 5, 6, 7, 9, 10 → correct pad to next multiple of 4 |
| **RTL** | Mirrors correctly for both formats |
| **Creep** | Offsets are monotonic; zero for outermost sheet |
| **Schema validation** | Format JSON validates against schema; invalid formats rejected with readable errors |

---

## 7. Screens & UX

### 7.0 Design Language

**Aesthetic:** Xerox / cut-and-paste punk.

- **Typography:** Monospace + typewriter display fonts.
- **Color:** Black and white + **TWO spot color themes** — Fluoro Pink (`#FF2D6B`) and Riso Blue (`#0078FF`). User toggles between them. The spot color is used for accents, active states, and highlights.
- **Dark mode:** System-preference auto-detect with manual toggle. The xerox aesthetic adapts: dark = inverted photocopy; light = classic white-paper feel.
- **Texture:** Subtle paper texture and tape accents on cards and modals.
- **Rule:** The **editor canvas stays clean and uncluttered**. Personality lives in the chrome (toolbars, panels, dialogs), not in the workspace.

### 7.1 Landing Page

- Hero with a live mini demo or animated fold-sequence.
- Primary "Make a zine" CTA.
- Short privacy promise: *"Runs in your browser. Nothing leaves your device."*
- Links: GitHub repo, "How to fold" guide, format gallery.
- No donation link for now.

### 7.2 Format Picker

Cards for each format showing:
- Tiny fold diagram (SVG animation)
- Page count
- Tools needed (scissors ✂️, stapler 📎)
- Difficulty tag (easy / medium / advanced)

**"8-page mini zine"** is highlighted as "Start here."

Selecting one opens a setup dialog:
- Paper size (Letter / A4 / A3)
- Page count (if variable)
- Margins preset (standard / narrow / none)
- Bleed toggle
- Reading direction (LTR / RTL)

### 7.3 Editor Layout

```
┌──────────────────────────────────────────────────────┐
│  Logo  │ Project Name │ Undo/Redo │ Looks │ Preview  │ Export │ Help │ ⚙ │
├────┬───┴──────────────────────────────────────┬──────┤
│    │                                          │      │
│ P  │                                          │  I   │
│ A  │          CANVAS (selected page)          │  N   │
│ G  │                                          │  S   │
│ E  │     zoom/pan, snap guides, bleed area    │  P   │
│ S  │                                          │  E   │
│    │                                          │  C   │
│    │                                          │  T   │
│    │                                          │  O   │
│    │                                          │  R   │
├────┴──────────────────────────────────────────┴──────┤
│  Select │ Image │ Text │ Shape │ Draw │ Sticker │ AI │
└──────────────────────────────────────────────────────┘
```

- **Left panel:** Page filmstrip (thumbnails in reader order; drag to reorder; duplicate / delete / swap).
- **Center:** Page canvas with zoom/pan, safe-margin guides, bleed guides, snapping.
- **Right panel:** Inspector — properties of selected object, filter stack, overlays, layers.
- **Top bar:** Project name, undo/redo, Looks dropdown, Preview, Export, Help (`?`), Settings.
- **Bottom toolbar:** Select, Image, Text, Shape, Draw, Sticker/Tape, Overlay, AI tools.
- **Sheet view toggle:** Shows the **imposed printer sheet** alongside the **reader spread view**. Both render live.

### 7.4 Preview

- Flip-through booklet view with page-turn animation.
- Flat printer-sheet view (what actually gets printed).
- "How to fold" guide for the chosen format (step-by-step with diagrams).

### 7.5 Export Screen

- **Formats:** PDF (print/imposed), PDF (reader order), JPG, PNG.
- **Resolution:** 150 / 300 / 600 DPI.
- **Options:**
  - Fold/cut guides (dashed, toggleable)
  - Crop marks
  - Bleed
  - B/W printer mode
  - Creep compensation (for booklets)
- **Includes:**
  - Duplex instructions and scaling note: *"Print at 100% / Actual Size, not Fit to Page."*
  - Printer test page option (grid + margin + fold-line check).

### 7.6 Dialogs

- **Start over:** Confirm with unsaved-work warning; offer to save first.
- **Unsupported browser:** Clear message with recommended browser links.
- **Low memory:** Warning with resolution-reduction suggestions.
- **Recover session:** Prompt on load if autosaved data exists.
- **AI model download:** Progress indicator when lazy-loading AI models.

### 7.7 Mobile / Responsive

- Panel editor in a bottom-sheet inspector.
- Simplified toolbar (collapsible categories).
- Touch gestures: pinch zoom, two-finger rotate, long-press for context menu.
- Export at safe resolution with a clear warning if the device can't handle the chosen size.
- AI features disabled on low-memory devices with an explanation.

---

## 8. Editor Features

### 8.1 Canvas & Objects

- Add multiple images, text, shapes, drawings, and stickers per page.
- **Transform:** Move, scale, rotate, flip; handle-based; multi-select; group/ungroup.
- **Layers panel:** Reorder, lock, hide, duplicate, rename.
- **Snapping:** Page edges, center, margins, other objects; smart guides.
- **Blend modes:** Normal, multiply, screen, overlay, soft-light, difference, darken, lighten.
- **Undo/redo:** Minimum 100 steps; persisted across refresh via IndexedDB.
- **Keyboard shortcuts** with a help overlay (`?` key).
- **Clipboard:** Copy/paste objects within and between pages; paste images from system clipboard.
- **File System Access API:** Native open/save for `.oruzine` files (with download fallback for unsupported browsers).
- **Web Share API:** "Share my zine" on supported platforms (mobile).

### 8.2 Image Editing (per image object)

- Pan / zoom / rotate / flip.
- **Fit modes:** Cover, contain, free crop.
- **Tone adjustments:**
  - Brightness, contrast, exposure
  - Highlights / shadows
  - Levels (black point, white point, gamma)
- **Color:** Grayscale, sepia, invert, hue/saturation.
- **Detail:** Sharpen, blur (Gaussian).
- Reset all adjustments per object.

### 8.3 Collage Tools

- **Masks:** Rectangle, circle, star, blob, speech bubble, **freehand lasso cutout**, **scissor-cut edge** (hand-cut wobble), **torn paper edge** (procedural, seeded for stability).
- **Paper-edge shadow:** Soft offset shadow so cutouts look stuck on.
- **Materials:** Tape strips (masking, washi, clear), staples, paper clips, pins, stamps; paper textures (crumpled, graph, newsprint, kraft, ledger).
- **Ransom-note text:** Each letter randomly styled (font, size, background chip, rotation); reshuffle button; seeded for reproducibility.
- **Auto-collage:** Drop 5–10 images → scattered arrangement; reshuffle button; seeded.
- **Spread collage:** Objects spanning two facing pages — v1 stretch goal; keep within single page for MVP and document why.

### 8.4 Text

- **Font library** (self-hosted, OFL): Typewriter, stencil, handwriting, bubble, blackletter, condensed poster, sans/serif basics. Include Noto families for Tamil coverage.
- **Free text boxes** from Phase 1 — positioned, sized, styled freely on the canvas.
- **Effects:** Outline, offset shadow, stamp, highlighter swipe, redaction bar, ransom mode.
- **Layout:** Rotated/slanted blocks; text on a path (v2).
- **Text-only page mode** with auto-fit sizing (poetry/essay/letter).

### 8.5 Drawing

- **Brushes:** Pen, marker, pencil, eraser with size/opacity.
- **Pressure support** via Pointer Events.
- **Vector strokes** stored in document (not rasterized until export).
- Smoothing / stabilizer.
- **Shapes:** Line, arrow, rectangle, ellipse, hand-drawn-wobble borders.
- Fill bucket and pattern fills (dots, stripes, checker).

### 8.6 Page Presets

Per-page layout presets:
- Full-bleed photo
- Photo + caption
- 2-up, 3-up, 4-up
- Filmstrip
- Text-only

**Cover builder:** Title, issue number, price tag, vol. badge.
**Back-cover helper:** Credits, social handle, QR code (generated client-side).

---

## 9. AI Features (`packages/ai`)

> [!NOTE]
> All AI runs **locally in the browser** — no server calls, no data leaves the device. Models are lazy-loaded on first use and cached in IndexedDB. Users can disable all AI features in settings.

### 9.1 Architecture

- Models run via **Transformers.js** (Hugging Face) or **ONNX Runtime Web** with WebGPU/WASM backends.
- Each AI feature is a self-contained pipeline in `packages/ai` with no UI dependencies.
- The UI layer (`apps/web/src/ai/`) handles model download progress, cancellation, and result preview.
- **Model budget:** Keep total model sizes reasonable. Prefer quantized/distilled models (INT8/INT4). Each model should be <50 MB ideally, <100 MB max.

### 9.2 AI Features (phased)

| Feature | Description | Model Type | Phase |
|---|---|---|---|
| **Background Removal** | One-click remove background from image; creates a mask the user can refine | Segmentation (e.g., RMBG-1.4, MODNet) | Phase 4 |
| **Smart Crop** | Detect subject / salient region and auto-position within frame | Saliency detection | Phase 4 |
| **Auto-Layout** | Given N images, suggest pleasing arrangements on a page | Rule-based + lightweight ML scoring | Phase 7 |
| **Subject Detection** | Highlight/outline subjects for easy selection and masking | Object detection (e.g., YOLO-nano) | Phase 7 |
| **Style Suggestions** | Given page content, suggest matching Looks/filters | Lightweight classifier | Phase 7 |

### 9.3 AI UX Rules

1. AI is **always optional** — every AI result has a manual alternative.
2. AI actions show a clear **"AI-assisted"** indicator.
3. Results are **previewed before applying** — the user confirms or discards.
4. AI processing shows a **progress bar** with cancel button.
5. First-time AI use shows a **consent dialog:** "This will download a ~X MB model to your device. It runs locally — nothing leaves your browser."
6. AI features are **gracefully hidden** on devices that can't support them (low memory, no WebGPU/WASM).

---

## 10. Filters, Overlays & Looks (`packages/filters`)

### 10.1 Architecture

Build a small set of **shader primitives** and compose presets from them:

**Primitives:** `threshold`, `halftone` (dot/line/Ben-Day, angle + size), `dither` (Floyd-Steinberg, Bayer, Atkinson), `colorMap` (duotone/tritone/gradient map), `posterize`, `channelOffset` (RGB split), `noise/grain`, `blurBloom`, `edgeDetect`, `displace` (glitch slices, wobble), `scanlines`, `vignette`, `pixelate`.

Each filter has:
- `id`, `name`, `pack`
- Typed `params` with ranges and defaults
- `fragment` shader (WGSL primary + GLSL fallback)
- `cost` hint: `cheap` | `heavy`

> [!TIP]
> Heavy filters (halftone, dither, pixel-sort) render at **preview resolution** while editing and at **full resolution** only on export (tiled via workers).

### 10.2 Filter Packs (ship ~12 great ones first; quality over quantity)

**Zine Essentials:**
- Threshold, Newspaper Halftone, Dither (3 modes), Grain, Photocopy/Xerox (high contrast + toner noise + edge darkening)

**Print & Pop:**
- Newsprint (yellowed + coarse halftone), Comic Ben-Day, Posterize, Duotone, Risograph (2-ink overprint with misregistration), Warhol Grid, Linocut

**Retro:**
- VHS (scanlines, color bleed, tracking glitch, date stamp), 70s Film (warm fade, lifted blacks, light leaks), Polaroid, CRT/8-bit palettes (Game Boy, CGA)

**Neon / Neo:**
- Neon Glow, Synthwave split-tone, RGB Split, Glitch, Gradient Map (holographic, sunset), Neo-brutalist (flat color, thick outline, hard offset shadow)

### 10.3 Overlays

A layer above content with: own opacity, blend mode, tint, scale, rotation, flip, randomize-position, optional erase-brush mask.

**Categories:**

| Category | Examples |
|---|---|
| **Paper/Surface** | Crumpled paper, fold creases, cardboard, kraft, newsprint, graph/ledger, concrete, brick, fabric |
| **Photocopy Artifacts** | Toner dust, copier streaks/banding, book-scan edge shadow, scanner borders, misregistration, staple/punch holes |
| **Film/Light** | Film grain, light leaks (orange/red/magenta), dust & scratches, lens flare, vignette, sprocket borders, contact-sheet frame |
| **Retro/Screen** | VHS noise, CRT scanlines/curvature, halftone dot pattern, pixel grid, orange date stamp |
| **Neon/Glow** | Neon streaks, bokeh, bloom, glitter, grid/wireframe, holographic foil |
| **Pop/Newspaper** | Ben-Day patterns, comic bursts, speed lines, fake newsprint columns, coffee stains, ink blots |
| **Damage/Handmade** | Tears, burnt edges, tape marks, glue stains, marker underlines, hand-drawn circles, rough stamps ("COPY", "VOID", "URGENT") |

**Overlay Rules:**
- **Procedural first** (grain, dust, scanlines, vignette, halftone, light leaks, Ben-Day): Generated in shaders; no asset files; resolution-independent.
- **Image-based only where needed** (paper scans, tears, stains): Compressed, lazy-loaded per category; large enough for 300 DPI on largest paper or tileable.
- Each overlay declares a **default blend mode** (multiply for paper/stains, screen for light leaks/glow, overlay/soft-light for grain).
- **Scope:** Per object, per page, or "apply to all pages."
- **Printer-friendly toggle:** Lightens heavy dark overlays; warns if strong overlays cross fold lines.

### 10.4 Looks

A **Look** = `{ id, name, filters[], overlays[], palette, fontSuggestions[] }` — defined as a single JSON file in a folder so contributors can add one without touching core code.

**Ship 5 to start:**

| Look | Vibe |
|---|---|
| **Xerox Punk** | High-contrast, toner noise, crumpled paper, aggressive |
| **Newsprint Noir** | Yellowed halftone, ink blots, noir shadows |
| **VHS Basement** | Scanlines, tracking glitch, CRT curve, date stamp |
| **Riso Pop** | 2-color overprint, misregistration, bright and playful |
| **Neon Night** | Dark background, neon glow, synthwave gradients |

Apply a Look to one page or the whole zine. The user can open it and tweak each component.

---

## 11. Rendering & Export Pipeline (`packages/render`, `packages/export`)

1. **One scene builder** takes `(ZineDocument, pageIndex, resolution)` → PixiJS scene. Preview and export both call it. **This is the WYSIWYG guarantee.**

2. **Preview:**
   - Screen-resolution render.
   - Cached filtered textures; only the active page renders at full quality.
   - Inactive pages use thumbnail-resolution cached renders.

3. **Export pipeline:**
   - Compute target pixel size from paper mm × DPI (e.g., Letter landscape @ 300 DPI = 3300 × 2550 px).
   - Render each **imposed sheet** by placing each page cell (with rotation) onto the sheet.
   - **Tile rendering** (1024–2048 px tiles) to stay under GPU texture limits and memory caps; stitch into final bitmap or stream tiles directly into the PDF.
   - If device can't handle chosen DPI → **fall back gracefully** (lower DPI) and inform the user with a clear message.
   - Run heavy filter passes in Web Workers + OffscreenCanvas.
   - Optional WASM path for export-time heavy processing (dithering, halftone).

4. **Output formats:**

| Output | Description |
|---|---|
| **Print PDF** | Imposed sheets, correct page size, 100% scale; optional fold/cut guides (dashed, toggleable) and crop marks; optional instructions page |
| **Reader PDF** | Pages in reading order for digital sharing |
| **JPG/PNG** | Per sheet, with DPI metadata embedded |
| **B/W printer mode** | Converts to grayscale/threshold; lightens overlays |
| **Printer test page** | Grid + margin + fold-line check |

5. **Fold guide:** Generated from the format's `foldSteps` data — step-by-step text + illustrated diagram per step (consistent SVG style), shown in-app and optionally included in PDF.

---

## 12. Persistence & Project Files

| Feature | Implementation |
|---|---|
| **Autosave** | IndexedDB via Dexie.js; save every ~3 seconds and on blur/visibility change |
| **Session recovery** | On load, detect autosaved data → prompt "Recover last session?" |
| **Project export/import** | `.oruzine` file = zip (fflate): `document.json` + image blobs + embedded asset manifest |
| **File System Access API** | Native save/open dialogs on supported browsers; download fallback otherwise |
| **Start over** | Requires confirmation; offers to save first |
| **Storage errors** | Handle quota exceeded gracefully with clear user message |
| **No localStorage** | Never use `localStorage` for images or large data |
| **Undo history** | Stored in memory (Zustand + Immer patches); survives refresh via IndexedDB |

---

## 13. Hosting & Deployment

### 13.1 Hosting Platform: Cloudflare Pages

| Aspect | Detail |
|---|---|
| **Platform** | Cloudflare Pages (free tier) |
| **Why** | Unlimited bandwidth, 500 builds/month, global CDN with edge caching, preview deploys per PR, custom domain support, superior cache control — all free |
| **Build command** | `pnpm build` (outputs to `apps/web/dist`) |
| **Deploy trigger** | Auto-deploy on push to `main`; preview deploys on every PR |
| **Custom domain** | Planned — configure when purchased. App works on `*.pages.dev` subdomain until then |

### 13.2 Asset Serving Strategy

```
assets/
├─ fonts/          → bundled, subsetted, precached by SW      (~500 KB total)
├─ textures/       → lazy-loaded per category, runtime-cached  (~2-5 MB total)
├─ stickers/       → lazy-loaded on first use, runtime-cached
├─ tape/           → lazy-loaded on first use, runtime-cached
├─ overlays/       → lazy-loaded per category, runtime-cached  (~3-8 MB total)
└─ models/         → lazy-fetched on first AI use, cached in IndexedDB (~50-100 MB each)
```

**Rules:**
- **Core app** (JS + CSS + critical fonts): Precached by the service worker. Must load offline after first visit.
- **Non-critical assets** (textures, overlays, stickers): Runtime-cached with `stale-while-revalidate`. Loaded on demand per category.
- **AI models**: Fetched on first use (user consents), stored in **IndexedDB** (not SW cache — too large). Survive browser restarts. Never precached.
- **Cache headers:** Immutable hashed filenames (`asset.[hash].js`) with `Cache-Control: public, max-age=31536000, immutable`. Non-hashed assets use `max-age=3600, stale-while-revalidate=86400`.
- **No external CDNs** — all assets served from the app's own origin.

### 13.3 AI Model Tiering (by Device Capability)

Since AI runs **locally on the user's device**, model quality is bounded by the device, not the hosting tier.

| Tier | Target Device | Model Size | Quality | Selection |
|---|---|---|---|---|
| **Full** | Desktop with WebGPU + 8 GB+ RAM | ~50-100 MB | Best quality, fastest | Default on capable devices |
| **Lite** | Laptop / tablet / mid-range phone | ~15-30 MB | Good quality, quantized (INT8) | Auto-selected on constrained devices |
| **Off** | Low-end phone / no WebGPU | — | AI features hidden | Graceful degradation |

**Detection:** Check `navigator.gpu`, estimate memory via `navigator.deviceMemory` + heuristics, auto-select tier. User can override in settings.

**Model hosting:** Same Cloudflare Pages deploy initially. If models exceed the 25 MB per-file limit, migrate to **Cloudflare R2** (free egress) or **Hugging Face Hub**. Decide during Phase 4.

### 13.4 CI/CD Pipeline

```
PR opened / push to PR branch:
  ├─ typecheck (tsc --noEmit)
  ├─ lint (biome check)
  ├─ unit tests (vitest)
  ├─ build (vite build)
  ├─ bundle-size check (fail if over budget)
  ├─ e2e tests (playwright)
  └─ Cloudflare Pages preview deploy → comment URL on PR

Push to main:
  ├─ same checks as above
  └─ Cloudflare Pages production deploy (auto)
```

**Branch strategy:** `main` = production (auto-deploys). Feature branches → PRs → preview deploys. No `develop` branch — keep it simple.

### 13.5 PWA Caching Strategy

| Resource | Strategy | Reason |
|---|---|---|
| App shell (HTML, JS, CSS) | **Precache** (Workbox) | Offline-first |
| Critical fonts (2-3 body/display) | **Precache** | Needed immediately; small |
| Non-critical fonts | **Runtime cache** (stale-while-revalidate) | Loaded when user picks them |
| Textures, overlays, stickers | **Runtime cache** (cache-first, 30-day expiry) | Large; loaded per category |
| AI models | **IndexedDB** (manual) | Too large for Cache API |
| User's zine data | **IndexedDB** (Dexie.js) | Autosave, blob storage |

**Offline behavior:** After first load, the entire editor works offline. Uncached assets show a placeholder. AI features show *"Offline — download models when online."* Export works fully offline.

### 13.6 Environment & Config

```env
VITE_SITE_URL=https://oruzine.pages.dev   # or custom domain later
VITE_APP_VERSION=$npm_package_version
# No secrets needed — fully static, no API keys, no backend
```

**Zero secrets.** The entire app is public static files.

---

## 14. Non-Functional Requirements

### Performance
- **Initial JS bundle:** < 250 KB gzip (before lazy chunks).
- Editor, filter packs, textures, fonts, and AI models load on demand.
- Lighthouse performance: 90+ on landing page.
- **Memory safety:** Downscale on import; release GPU textures for off-screen pages; cap simultaneous large bitmaps; test on a mid-range phone.

### Accessibility
- Full keyboard navigation for UI chrome.
- Visible focus indicators.
- WCAG AA contrast ratios.
- ARIA labels for dialogs, filmstrip, inspector panels.
- Alt-text field per image (used in digital export).
- `prefers-reduced-motion` respected (disable page-turn animations, fold animations).
- Touch targets: 44px minimum.

### Security & Privacy
- Strict Content Security Policy.
- No third-party scripts, no network calls except loading app assets and AI models (from own CDN or bundled).
- Sanitize any imported SVG.
- AI models served from the app's own origin (no third-party model CDNs).

### Browser Support
- Latest 2 versions of: Chrome, Edge, Firefox, Safari (including iOS Safari).
- WebGPU (Baseline 2026): Chrome 113+, Edge 113+, Firefox 141+, Safari 26+ — all enabled by default.
- Detect missing WebGPU → fall back to WebGL2. Missing WebGL2 → show clear unsupported message.

### Error Handling
- Every async operation (image decode, render, export, storage, AI inference) has user-readable failure states.
- Never silent failures — always surface what went wrong and what the user can do.

### i18n
- All UI strings externalized via i18next from day one.
- English only for now; architecture supports adding languages later without code changes.
- Layout must not break with longer translated strings.
- Support RTL reading direction in the imposition engine from the start.

---

## 15. Quality Gates

| Gate | Scope |
|---|---|
| **Unit tests** | Imposition, format validation, creep math, DPI/size calculations, document reducer, undo history, AI pipeline (mock inputs) |
| **Visual regression** | Playwright: known documents rendered through each format, compared against golden images; at least one filter and one overlay per test |
| **E2E smoke tests** | Create a mini-8 zine → add image + text → apply a Look → export PDF → assert page count, size, and cell order |
| **Shader tests** | Every shader has a visual test and documented parameter range |
| **Schema tests** | Document model validates; migration functions tested for every version bump |
| **Bundle-size check** | CI fails if bundle exceeds budget |
| **Deploy smoke test** | Preview deploy loads, renders landing page, editor opens without console errors |
| **CI pipeline** | GitHub Actions: typecheck → lint (Biome) → test (Vitest + Playwright) → build → bundle-size → Cloudflare Pages deploy. Blocks merge on any failure. |

---

## 16. Delivery Phases

> [!IMPORTANT]
> **Stop after each phase.** Summarize what was built, list anything unfinished or stubbed, report known bugs, and wait for approval before starting the next phase.

### Phase 0 — Foundation
Monorepo scaffold, tooling, CI, license files, README, CONTRIBUTING, base React 19 app with routing, design tokens with dual spot-color themes (Fluoro Pink + Riso Blue), dark/light mode with system-preference detection, PWA shell with offline caching, **Cloudflare Pages deployment pipeline** with preview deploys on PRs.

**✅ Done when:** `pnpm dev`, `pnpm test`, `pnpm build` all pass; CI is green; app shell deploys to Cloudflare Pages; dark mode and spot-color toggle work; preview deploy URL appears on a test PR.

### Phase 1 — Imposition + DLZ-Parity MVP
`packages/imposition` and `packages/formats` with **mini-8** format (Letter/A4/A3). Landing page, format picker, setup dialog. 8-panel editor where each page supports **free text boxes + one image (cover/contain)**. Drag-to-reorder pages. Printer-sheet preview, fold guide, JPG/PDF export at 300 DPI, autosave, start-over, File System Access API save.

**✅ Done when:** An 8-page zine prints on a home printer, folds, cuts once, and reads pages 1→8 correctly.

### Phase 2 — Canvas Core
Pages become multi-object canvases: PixiJS scene (WebGPU primary), transform handles, layers panel, text objects with font picker, snapping, undo/redo (persisted), keyboard shortcuts, clipboard support.

**✅ Done when:** User can place multiple images + text + shapes on a page, reorder layers, undo/redo 100+ steps, and export correctly.

### Phase 3 — Booklets
Saddle-stitch format with padding, creep compensation, duplex instructions, printer test page, reader-order PDF export, half-letter/A5 variant.

**✅ Done when:** A 12-page booklet prints duplex, folds, staples, and reads correctly with creep compensation.

### Phase 4 — Collage + AI Basics
Multi-image per page. Opacity + blend modes. Shape/lasso/scissor/torn masks. Paper-edge shadows. Tape/staples/stickers. Paper textures. Ransom-note text. Drawing tools. **AI background removal** and **smart crop** (models lazy-loaded, consent dialog).

**✅ Done when:** User can build a multi-layer collage with masks, materials, and AI-assisted background removal.

### Phase 5 — Filters
Shader primitives (WGSL + GLSL). First ~12 filter presets. Filter stack UI with live thumbnails. Apply-to-all. Worker offloading for heavy passes.

**✅ Done when:** All 12 filters render correctly at preview and export resolution; worker offloading works.

### Phase 6 — Overlays + Looks
Procedural overlays first, then image-based. Erase-brush masking. Printer-friendly mode. 5 Looks (Xerox Punk, Newsprint Noir, VHS Basement, Riso Pop, Neon Night). Looks as JSON — contributor-friendly.

**✅ Done when:** Looks can be applied/tweaked; overlays work at all scopes; printer-friendly toggle lightens heavy overlays.

### Phase 7 — Polish & Growth
Tier 2 formats with fold diagrams. Cover builder + back-cover helper. Auto-collage. Templates gallery (starter zines). Project file import/export (`.oruzine`). Bleed + crop marks. Flip-book reader. Mobile polish. **AI auto-layout** and **style suggestions**. Accessibility audit. Performance pass.

**✅ Done when:** All features work on mobile; accessibility audit passes WCAG AA; Lighthouse 90+; templates gallery populated.

---

## 17. Decision Log

Track resolved design decisions here. Update as decisions are made.

| # | Decision | Choice | Rationale | Date |
|---|---|---|---|---|
| 1 | Spot color | Dual: Fluoro Pink + Riso Blue (user toggles) | Both are iconic zine colors; giving users a choice adds personality | 2026-10-01 |
| 2 | Donation link | None for now | Personal project; can add later | 2026-10-01 |
| 3 | GitHub repo | github.com/AinzAmour/OruZine | Personal project repo | 2026-10-01 |
| 4 | Phase 1 text | Free text boxes from the start | More useful; worth the slightly extra effort | 2026-10-01 |
| 5 | Languages | English only (architecture supports i18n) | Solo project; add Tamil/Spanish later if needed | 2026-10-01 |
| 6 | Dark mode | System-preference auto-detect + manual toggle | Modern standard; xerox aesthetic works in both | 2026-10-01 |
| 7 | AI features | Include (local/browser-only) | Privacy-preserving; adds real value for collage/masking | 2026-10-01 |
| 8 | Renderer | WebGPU primary, WebGL2 fallback | WebGPU has broad support in 2026; better perf for shaders | 2026-10-01 |
| 9 | Prompt target | Optimized for Antigravity/Gemini | Primary development tool | 2026-10-01 |
| 10 | Hosting | Cloudflare Pages (free tier) | Unlimited bandwidth, global CDN, preview deploys, superior caching — all free | 2026-10-01 |
| 11 | CI/CD | Auto-deploy main + preview deploys per PR | Fast feedback loop; simple branch strategy for personal project | 2026-10-01 |
| 12 | AI model hosting | Same origin initially; R2 or HF Hub later if needed | Keep it simple; decide in Phase 4 based on model sizes | 2026-10-01 |
| 13 | Custom domain | Planned — buy later, use `*.pages.dev` for now | No rush; architecture supports swap | 2026-10-01 |
| 14 | AI model tiering | Auto-detect device capability (Full/Lite/Off) | Best UX — powerful devices get better models automatically | 2026-10-01 |
| 15 | PDF library | `@cantoo/pdf-lib` (maintained fork) | Original pdf-lib unmaintained since 2021; cantoo fork fixes memory leaks | 2026-10-01 |
| 16 | Drag & drop | `@atlaskit/pragmatic-drag-and-drop` | Production-grade, performant; dnd-kit rewrite still pre-1.0 | 2026-10-01 |

---

## 18. Rules of Engagement

1. **Plan before coding** each phase: Write a short plan (files, modules, risks), then implement.
2. **Small, reviewable commits.** Conventional Commit messages (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
3. **Never silently change** the data model, stack, or phase scope. If something must change, explain why and ask first.
4. **Write tests alongside code**, especially for imposition and export.
5. **No placeholder assets with unknown licenses.** Use original, CC0, or OFL assets and log each in `CREDITS.md`.
6. **Keep core packages UI-free.** `imposition`, `formats`, `filters` metadata, and `ai` pipelines must run in Node (no DOM/browser deps).
7. **Ask** when requirements are ambiguous instead of guessing — especially about print geometry.
8. **Report honestly** at the end of each phase: what works, what's stubbed, known bugs, what couldn't be tested.
9. Prefer **simple and robust** over clever. Tune a few filters well rather than shipping many mediocre ones.
10. **AI features are additive** — the app must be fully functional with AI disabled or unavailable.
11. **Use the skill system:** Read and follow relevant skills (brainstorming, writing-plans, test-driven-development, verification-before-completion) before each phase.

---

## 19. Open Items (to resolve during development)

1. Exact ONNX model choices for background removal and smart crop — benchmark size vs. quality during Phase 4.
2. WASM vs. pure-JS for export-time heavy processing — profile during Phase 5 and decide.
3. Template gallery curation — what starter zines to include in Phase 7.
4. Whether to support actual Riso color separation (spot-color layer output) as a future feature.
5. PWA cache size limits — test on mobile Safari and adjust eviction strategy.
6. Cloudflare Pages 25 MB per-file limit — if AI models exceed this, migrate to R2 or Hugging Face Hub.
7. Custom domain name — purchase and configure when ready.

---

**Begin with Phase 0. Output your plan first, then wait for confirmation before writing code.**

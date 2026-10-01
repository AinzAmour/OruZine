# OruZine System Architecture

```
oruzine/
├─ apps/
│  └─ web/                 # React 19 app (UI, editor shell, routing, PWA)
├─ packages/
│  ├─ imposition/          # Pure TS: format + page count -> placement plan (Zero DOM deps)
│  ├─ formats/             # JSON format definitions + JSON schema + validator
│  ├─ render/              # Shared PixiJS scene builder (preview + export share this)
│  ├─ filters/             # WGSL/GLSL shaders, filter registry, overlay registry, Looks
│  ├─ export/              # Tiled renderer, PDF/JPG/PNG writers, fold/cut lines
│  └─ ai/                  # Browser AI pipelines (Transformers.js / ONNX Runtime Web)
├─ assets/                 # Raw assets (fonts, textures, stickers, tape, overlays)
└─ docs/                   # Guides, architecture, and decision documentation
```

## Core Guarantees
1. **Zero Server Dependency:** OruZine runs completely client-side in the user's browser.
2. **WYSIWYG Imposition Pipeline:** Previewing the imposed printer sheet and exporting the 300 DPI PDF use the exact same render logic (`packages/render`).
3. **Reader Order Authoring:** Users always edit pages sequentially in reader order (Page 1..N). Imposition is computed on-the-fly by `packages/imposition`.
4. **Non-Destructive Editing:** All transformations, filters, and masks are stored as parameters. Originals remain in IndexedDB untouched.

# OruZine 📖✂️

> *"One sheet. One fold. One zine."*

**OruZine** is a free, open-source, browser-based zine maker. Pick a zine format, fill pages with collaged images, text, and drawings, style them with print-culture filters and overlays, and download a **print-ready, correctly imposed** PDF or JPG ready to print at home and fold.

---

## Features
- **100% Client-Side & Private:** No accounts, no uploads, no tracking. Your artwork never leaves your computer.
- **True Print Imposition:** Correct panel orientation and ordering for 8-page mini-zines, saddle-stitch booklets, and accordion folds.
- **Xerox & Print Culture Aesthetics:** Dual spot-color styling (Fluoro Pink & Riso Blue), customizable halftone shaders, dithering, photocopy noise, and paper textures.
- **Offline Capable (PWA):** Works anywhere once loaded.
- **In-Browser Local AI (Optional):** WebGPU/WASM-powered background removal and smart-cropping running fully in your browser with zero external API calls.

## Quickstart

```bash
# Clone the repo
git clone https://github.com/AinzAmour/OruZine.git
cd OruZine

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

## Tech Stack
- **Framework:** React 19 + TypeScript
- **Bundler:** Vite 8 (Rolldown engine)
- **Styling:** Tailwind CSS v4 + Radix UI Primitives
- **Graphics & Rendering:** PixiJS v8 (WebGPU primary with WebGL2 fallback)
- **State Management:** Zustand + Immer
- **PDF Generation:** `@cantoo/pdf-lib`
- **Client Storage:** Dexie.js (IndexedDB)
- **Testing & Tooling:** Vitest, Playwright, Biome

## License
- **Code:** [MIT License](./LICENSE)
- **Assets:** [OFL / CC0 / CC-BY](./LICENSE-ASSETS.md)

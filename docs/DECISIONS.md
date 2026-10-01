# OruZine Decision Log

This log tracks architectural and design decisions, their rationale, and dates.

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

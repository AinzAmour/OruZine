# Contributing to OruZine

Thank you for your interest in contributing to OruZine!

## Principles
1. **Privacy-first:** Everything runs client-side. No trackers, no telemetry, no image uploads.
2. **Print correctness over visual flash:** If the print imposition is wrong, the zine is broken.
3. **Data-driven architecture:** Formats, Looks, overlays, and templates are defined as data files (JSON/WGSL) so anyone can contribute without rewriting core code.
4. **Clean, tested code:** Core logic (imposition, export, render math) must be pure TypeScript with 100% test coverage.

## Development Workflow

### Prerequisites
- Node.js >= 20
- pnpm >= 9

### Setup
```bash
# Clone the repository
git clone https://github.com/AinzAmour/OruZine.git
cd OruZine

# Install dependencies
pnpm install

# Start the dev server
pnpm dev

# Run unit tests
pnpm test

# Run linter and typecheck
pnpm lint
pnpm typecheck
```

### Commit Guidelines
We use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation changes
- `test:` Adding or updating tests
- `chore:` Tooling, dependency updates, maintenance

### Adding Assets
Every asset (font, texture, sticker, overlay) added to `assets/` must be registered in [`assets/CREDITS.md`](./assets/CREDITS.md) with its source URL and license.

# osdlabel

**osdlabel** is a powerful DZI image annotation library built with **SolidJS**, **Fabric.js v7**, **OpenSeaDragon**, and **TypeScript**.

It provides seamless synchronization of annotations in image-space coordinates via Fabric.js over deeply zoomable images natively rendered by OpenSeaDragon.

## 📦 Project Structure

This project uses a pnpm workspace monorepo orchestrated with **Turborepo** for optimal caching and fast execution.

- `packages/osdlabel/` — The publishable `osdlabel` core library. Contains framework-agnostic core logic, reactive SolidJS state management, hooks, components, and tools.
- `apps/dev/` — The local development app (`@osdlabel/dev`). Useful for visual testing and building out E2E Playwright test suites.
- `apps/docs/` — The documentation site (`@osdlabel/docs`), built using Astro and Starlight. Deployed to GitHub Pages.

## 🛠 Tech Stack

- **[SolidJS](https://www.solidjs.com/)**: Fine-grained reactivity and UI components.
- **[Fabric.js v7](http://fabricjs.com/)**: Fast HTML5 Canvas overlay handling vector graphics and interactions.
- **[OpenSeaDragon](https://openseadragon.github.io/)**: High-performance viewer for massive, high-resolution DZI (Deep Zoom Images).
- **TypeScript**: Strict typing for safe refactoring and robust APIs.
- **Vite**: Ultra-fast module bundler used for the dev app and library build.
- **Vitest & Playwright**: Comprehensive unit testing and End-to-End browser testing.
- **Turborepo**: High-performance monorepo build system.

## 🚀 Getting Started

Ensure you have [Node.js](https://nodejs.org/) (v20+ recommended) and `pnpm` v10 installed.

### Installation

```bash
pnpm install
```

### Development Scripts

Run these from the workspace root. Turborepo handles fanning out tasks to the relevant workspace packages:

- **Start Development Server**
  Spins up the dev app (`apps/dev`) using Vite with HMR hooked into the library source.
  ```bash
  pnpm dev
  ```

- **Build Library**
  Compiles the `osdlabel` library via TypeScript and Vite into `packages/osdlabel/dist/`.
  ```bash
  pnpm build
  ```

- **Typecheck**
  Checks TypeScript types across all packages (automatically builds `osdlabel` first).
  ```bash
  pnpm typecheck
  ```

- **Linting & Formatting**
  Run ESLint and Prettier across the workspace.
  ```bash
  pnpm lint
  pnpm format
  ```

### Documentation Scripts

The documentation site is managed in `apps/docs` using Astro.

- **Start Docs Dev Server**
  ```bash
  pnpm docs:dev
  ```

- **Build Docs**
  Builds the static documentation site for production.
  ```bash
  pnpm docs:build
  ```

## 🧪 Testing

We ensure robustness using Vitest for unit tests (`packages/osdlabel/tests/unit`) and Playwright for E2E tests (`apps/dev/tests/e2e`).

- **Run Unit Tests (Vitest)**
  ```bash
  pnpm test
  ```

- **Run E2E Tests (Playwright)**
  ```bash
  pnpm test:e2e
  ```

- **Run All Tests**
  ```bash
  pnpm test:all
  ```

## 🤝 Core Guidelines

If you are contributing, refer to the [CLAUDE.md](./CLAUDE.md) file for critical rules. Some highlights:
- **TypeScript**: Never use `any`. Utilize `unknown` with type guards.
- **SolidJS**: Components render once. Use `createEffect` for imperative sync. Mutate state through named actions.
- **Coordinate Systems**: Geometry is stored in image-space pixels. OpenSeaDragon operates in its own viewport space. Fabric uses screen-space CSS pixels offset by the viewport transform matrix. Do not transform coordinates on shapes manually; update the `viewportTransform`.
- **Fabric.js v7**: Named exports only (e.g. `import { Canvas, Rect } from 'fabric'`).

## 📄 License

See [LICENSE](./LICENSE).

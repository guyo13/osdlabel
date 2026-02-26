# Task 01 — Project Scaffolding & Type Definitions

**Depends on:** Nothing (first task)
**Spec sections:** §2, §3, §4

## Objective

Set up the project from scratch with all tooling configured and working, then define the complete type system that all subsequent tasks build on.

## Steps

### 1. Initialize the project

```bash
pnpm init
```

Set `"type": "module"` in `package.json`. Set the package name to `@guyo13/osdlabel`.

### 2. Install dependencies (exact versions)

```bash
pnpm add solid-js@1.9.11 fabric@7.1.0 openseadragon@5.0.1
pnpm add -D typescript@5.7.3 vite@6.1.0 vitest@3.0.5 vite-plugin-solid@2.11.0 @playwright/test@1.50.1 eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin
pnpm add -D @types/openseadragon
```

### 3. Configure TypeScript

Create `tsconfig.json` exactly as specified in §3.1 of the spec. Then create `tsconfig.build.json`:

```jsonc
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "dist", "tests", "dev", "**/*.test.ts"],
}
```

### 4. Configure Vite

Create `vite.config.ts` for the dev server:

```typescript
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solidPlugin()],
  root: './dev',
  build: { target: 'esnext' },
});
```

### 5. Configure Vitest

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solidPlugin()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/unit/**/*.test.ts'],
  },
});
```

### 6. Configure Playwright

Create `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  webServer: {
    command: 'pnpm dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:5173',
  },
});
```

### 7. Add package.json scripts

```jsonc
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -p tsconfig.build.json",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "lint": "eslint src/ tests/",
    "format": "prettier --write \"src/**/*.{ts,tsx}\" \"tests/**/*.ts\"",
  },
}
```

### 8. Create directory structure

Create all directories listed in §3 of the spec. Create empty `index.ts` barrel files where needed.

### 9. Define all types

Create `src/core/types.ts` with the complete type system from §4 and §6 of the spec. This includes:

- Branded ID types: `AnnotationId`, `ImageId`, `AnnotationContextId`
- `Point` interface
- `AnnotationType` union
- `Geometry` discriminated union (rectangle, circle, line, point, path)
- `AnnotationStyle` interface
- `Annotation` interface
- `AnnotationDocument` and `ImageAnnotations` for serialization
- `ToolConstraint` and `AnnotationContext` interfaces
- `ImageSource` interface
- `AnnotationState` and `UIState` interfaces
- `ConstraintStatus` type (derived state showing which tools are enabled/disabled)
- `KeyboardShortcutMap` type

Also create helper functions for creating branded IDs:

```typescript
export function createAnnotationId(value: string): AnnotationId {
  return value as AnnotationId;
}
// ... similar for ImageId, AnnotationContextId
```

### 10. Create `src/core/constants.ts`

Define default values:

- `DEFAULT_ANNOTATION_STYLE`: default stroke, fill, opacity
- `DEFAULT_GRID_CONFIG`: `{ columns: 1, rows: 1 }`
- `MAX_GRID_SIZE`: `{ columns: 4, rows: 4 }`
- `DEFAULT_KEYBOARD_SHORTCUTS`: the shortcut map from §10

### 11. Create `src/index.ts`

Export all public types and (placeholder) components.

### 12. Create minimal dev app

Create `dev/index.html` and `dev/App.tsx` with a minimal SolidJS app that renders "Image Annotator — Dev" on screen. This verifies the full toolchain works.

### 13. Write initial type tests

Create `tests/unit/core/types.test.ts` that verifies:

- Branded types are not assignable from raw strings (compile-time check, use `@ts-expect-error`)
- Geometry discriminated union narrows correctly
- Helper functions produce correctly branded values

## NOT in scope for this task

- Any rendering, canvas, or OSD code
- State management
- Components beyond the placeholder dev app

## Verification

1. `pnpm typecheck` passes with zero errors
2. `pnpm test` passes (type tests)
3. `pnpm dev` starts the Vite dev server and the browser shows "Image Annotator — Dev"
4. `pnpm build` produces `.js` and `.d.ts` files in `dist/`
5. All directories from §3 exist

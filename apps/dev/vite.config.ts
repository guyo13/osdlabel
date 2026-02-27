import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [solidPlugin()],
  build: { target: 'esnext' },
  resolve: {
    alias: {
      // During development, resolve the library from its TypeScript source
      // so Vite's HMR picks up changes immediately without a tsc rebuild.
      '@guyo13/osdlabel': resolve(__dirname, '../../packages/osdlabel/src/index.ts'),
    },
  },
});

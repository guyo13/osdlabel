import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5173;

export default defineConfig({
  server: { port: PORT },
  plugins: [solidPlugin()],
  build: { target: 'esnext' },
  resolve: {
    alias: {
      // During development, resolve the library from its TypeScript source
      // so Vite's HMR picks up changes immediately without a tsc rebuild.
      osdlabel: resolve(__dirname, '../../packages/osdlabel/src/index.ts'),
    },
  },
});

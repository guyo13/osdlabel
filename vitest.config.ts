import { defineConfig } from 'vitest/config';
import solidPlugin from 'vite-plugin-solid';
export default defineConfig({
  plugins: [solidPlugin()],
  resolve: {
    conditions: ['development', 'browser'],
  },
  test: {
    server: {
      deps: {
        inline: [/solid-js/],
      },
    },
    environment: 'jsdom',
    globals: true,
    include: ['tests/unit/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
  },
});

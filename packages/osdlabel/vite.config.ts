import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { resolve } from 'path';

export default defineConfig({
  plugins: [solidPlugin()],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'components/index': resolve(__dirname, 'src/components/index.ts'),
        'core/index': resolve(__dirname, 'src/core/index.ts'),
        'hooks/index': resolve(__dirname, 'src/hooks/index.ts'),
        'overlay/index': resolve(__dirname, 'src/overlay/index.ts'),
        'state/index': resolve(__dirname, 'src/state/index.ts'),
        'utils/index': resolve(__dirname, 'src/utils/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['solid-js', 'solid-js/web', 'solid-js/store', 'fabric', 'openseadragon'],
      output: {
        preserveModules: true,
        dir: 'dist',
        entryFileNames: '[name].js',
      },
    },
  },
});

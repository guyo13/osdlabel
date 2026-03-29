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
        'hooks/index': resolve(__dirname, 'src/hooks/index.ts'),
        'state/index': resolve(__dirname, 'src/state/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'solid-js',
        'solid-js/web',
        'solid-js/store',
        'fabric',
        'openseadragon',
        '@osdlabel/annotation',
        '@osdlabel/fabric-osd',
        /^@osdlabel\/annotation\//,
        /^@osdlabel\/fabric-osd\//,
      ],
      output: {
        preserveModules: true,
        dir: 'dist',
        entryFileNames: '[name].js',
      },
    },
  },
});

import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import solidJs from '@astrojs/solid-js';

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: 'OSDLabel',
      social: {
        github: 'https://github.com/guyo13/osdlabel',
      },
      sidebar: [
        {
          label: 'Guide',
          autogenerate: { directory: 'guide' },
        },
        {
          label: 'API',
          autogenerate: { directory: 'api' },
        },
        {
          label: 'Demo',
          autogenerate: { directory: 'demo' },
        },
      ],
      customCss: [
        // Path to your custom CSS file
        './src/styles/custom.css',
      ],
    }),
    solidJs(),
  ],
  vite: {
    resolve: {
      alias: {
        // Alias to import from src easily
        '@src': '../src',
      },
    },
    server: {
      fs: {
        // Allow serving files from one level up to the project root
        allow: ['..'],
      },
    },
  },
});

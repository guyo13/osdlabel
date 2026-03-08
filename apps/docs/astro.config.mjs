import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import solidJs from '@astrojs/solid-js';

export default defineConfig({
  site: 'https://guyo13.github.io',
  base: '/osdlabel',
  legacy: { collections: true },
  integrations: [
    starlight({
      title: 'osdlabel',
      description:
        'Web-based image annotation library with rich controls, customization, and serialization',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/guyo13/osdlabel',
        },
      ],
      editLink: {
        baseUrl: 'https://github.com/guyo13/osdlabel/edit/main/apps/docs/',
      },
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Installation', slug: 'getting-started/installation' },
            { label: 'Quick Start', slug: 'getting-started/quick-start' },
            { label: 'Core Concepts', slug: 'getting-started/concepts' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Basic Annotation', slug: 'guides/basic-annotation' },
            { label: 'Multi-Image Grid', slug: 'guides/multi-image-grid' },
            { label: 'Annotation Contexts', slug: 'guides/annotation-contexts' },
            { label: 'Serialization', slug: 'guides/serialization' },
            { label: 'Keyboard Shortcuts', slug: 'guides/keyboard-shortcuts' },
            { label: 'Coordinate Systems', slug: 'guides/coordinate-systems' },
          ],
        },
        {
          label: 'API Reference',
          items: [
            { label: 'Overview', slug: 'api/overview' },
            { label: 'Types', slug: 'api/types' },
            { label: 'Components', slug: 'api/components' },
            { label: 'State Management', slug: 'api/state' },
            { label: 'Overlay', slug: 'api/overlay' },
            { label: 'Serialization', slug: 'api/serialization' },
            { label: 'Hooks', slug: 'api/hooks' },
            { label: 'Constants', slug: 'api/constants' },
          ],
        },
        {
          label: 'Examples',
          items: [
            { label: 'Minimal Viewer', slug: 'examples/minimal-viewer' },
            { label: 'Multiple Annotation Contexts', slug: 'examples/multiple-contexts' },
            { label: 'Custom Toolbar', slug: 'examples/custom-toolbar' },
          ],
        },
      ],
    }),
    sitemap(),
    solidJs(),
  ],
  vite: {
    ssr: {
      noExternal: ['osdlabel'],
    },
    optimizeDeps: {
      include: ['osdlabel'],
    },
  },
});

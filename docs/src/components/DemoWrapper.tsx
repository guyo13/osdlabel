import { Component, createSignal } from 'solid-js';
import { Annotator } from '@src/index.ts';
import type { AnnotationContext, ImageSource } from '@src/core/types.ts';

const IMAGES: ImageSource[] = [
  {
    id: 'highsmith' as any,
    dziUrl: 'https://openseadragon.github.io/example-images/highsmith/highsmith.dzi',
    label: 'Highsmith',
  },
  {
    id: 'duomo' as any,
    dziUrl: 'https://openseadragon.github.io/example-images/duomo/duomo.dzi',
    label: 'Duomo',
  },
  {
    id: 'local-test' as any,
    dziUrl: './sample-data/test-image.jpg', // This will be copied to public
    label: 'Local Image',
  },
];

const CONTEXTS: AnnotationContext[] = [
  {
    id: 'ctx-demo' as any,
    label: 'Demo Context',
    tools: [
      { type: 'rectangle' },
      { type: 'circle' },
      { type: 'line' },
      { type: 'point' },
      { type: 'path' },
    ],
  },
  {
    id: 'ctx-limited' as any,
    label: 'Limited Context',
    tools: [
      { type: 'rectangle', maxCount: 2 },
      { type: 'circle', maxCount: 1 },
    ],
  },
];

const DemoWrapper: Component = () => {
  return (
    <div style={{
      width: '100%',
      height: '600px',
      border: '1px solid #ccc',
      'border-radius': '8px',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <Annotator
        images={IMAGES}
        contexts={CONTEXTS}
        activeContextId={CONTEXTS[0]!.id}
        maxGridSize={{ columns: 2, rows: 2 }}
        showFilmstrip={true}
        filmstripPosition="left"
        onAnnotationsChange={(anns) => console.log('Annotations changed:', anns.length)}
      />
    </div>
  );
};

export default DemoWrapper;

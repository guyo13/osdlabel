import { Annotator } from 'osdlabel/components';
import { createImageId, createAnnotationContextId } from '@osdlabel/annotation';
import type { ImageSource, AnnotationContext } from '@osdlabel/annotation';

const images: ImageSource[] = [
  {
    id: createImageId('sample-1'),
    dziUrl: 'https://openseadragon.github.io/example-images/highsmith/highsmith.dzi',
    label: 'Sample Image',
  },
];

const contexts: AnnotationContext[] = [
  {
    id: createAnnotationContextId('general'),
    label: 'General',
    tools: [
      { type: 'rectangle' },
      { type: 'circle' },
      { type: 'line' },
      { type: 'point' },
      { type: 'path' },
    ],
  },
];

export default function QuickStartDemo() {
  return (
    <div
      class="osdlabel-container"
      style={{
        height: '420px',
        width: '100%',
        border: '1px solid #333',
        'border-radius': '6px',
        overflow: 'hidden',
        margin: '1.5rem 0',
      }}
    >
      <Annotator
        images={images}
        contexts={contexts}
        onAnnotationsChange={(annotations) => {
          console.log('Annotations:', annotations.length);
        }}
      />
    </div>
  );
}

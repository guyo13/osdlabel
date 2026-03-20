import { Annotator } from 'osdlabel/components';
import { createImageId, createAnnotationContextId } from '@osdlabel/annotation';
import type { ImageSource } from '@osdlabel/annotation';
import type { AnnotationContext } from '@osdlabel/annotation-context';

const images: ImageSource[] = [
  {
    id: createImageId('sample-1'),
    dziUrl: 'https://openseadragon.github.io/example-images/highsmith/highsmith.dzi',
    label: 'Sample 1',
  },
  {
    id: createImageId('sample-2'),
    dziUrl: 'https://openseadragon.github.io/example-images/duomo/duomo.dzi',
    label: 'Sample 2',
  },
];

const contexts: AnnotationContext[] = [
  {
    id: createAnnotationContextId('fracture'),
    label: 'Fracture',
    imageIds: [createImageId('sample-1')], // Only for Sample 1
    tools: [
      { type: 'line', maxCount: 3, countScope: 'per-image' },
      { type: 'rectangle', maxCount: 2 },
    ],
  },
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

export default function ContextsDemo() {
  return (
    <div
      class="osdlabel-container"
      style={{
        height: '420px',
        width: '100%',
        border: '1px solid #333',
        'border-radius': '6px',
        overflow: 'hidden',
        margin: '1rem 0',
      }}
    >
      <Annotator images={images} contexts={contexts} />
    </div>
  );
}

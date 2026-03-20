import { Annotator } from 'osdlabel/components';
import { createImageId, createAnnotationContextId } from '@osdlabel/annotation';
import type { ImageSource } from '@osdlabel/annotation';
import type { AnnotationContext } from '@osdlabel/annotation-context';

const images: ImageSource[] = [
  {
    id: createImageId('demo'),
    dziUrl: 'https://openseadragon.github.io/example-images/highsmith/highsmith.dzi',
    label: 'Demo Image',
  },
];

const contexts: AnnotationContext[] = [
  {
    id: createAnnotationContextId('default'),
    label: 'Default',
    tools: [
      { type: 'rectangle' },
      { type: 'circle' },
      { type: 'line' },
      { type: 'point' },
      { type: 'path' },
    ],
  },
];

export default function MinimalViewerDemo() {
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

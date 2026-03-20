import { Annotator } from 'osdlabel/components';
import { createImageId, createAnnotationContextId } from '@osdlabel/annotation';
import type { ImageSource, AnnotationContext } from '@osdlabel/annotation';

const images: ImageSource[] = [
  {
    id: createImageId('sample-1'),
    dziUrl: 'https://openseadragon.github.io/example-images/highsmith/highsmith.dzi',
    label: 'Highsmith',
  },
  {
    id: createImageId('sample-2'),
    dziUrl: 'https://openseadragon.github.io/example-images/duomo/duomo.dzi',
    label: 'Duomo',
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

export default function AnnotatorWithGridControlsDemo() {
  return (
    <div
      class="osdlabel-container"
      style={{
        height: '500px',
        width: '100%',
        border: '1px solid #333',
        'border-radius': '6px',
        overflow: 'hidden',
        margin: '1rem 0',
      }}
    >
      <Annotator
        images={images}
        contexts={contexts}
        showFilmstrip={true}
        showGridControls={true}
        filmstripPosition="left"
        maxGridSize={{ columns: 4, rows: 4 }}
      />
    </div>
  );
}

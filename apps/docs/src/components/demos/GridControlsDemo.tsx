import { AnnotatorProvider as Provider, useAnnotator as useAnn } from 'osdlabel/state';
import {
  GridView as Grid,
  GridControls as Controls,
  StatusBar as Status,
} from 'osdlabel/components';
import { createImageId, createAnnotationContextId } from '@osdlabel/annotation';
import type { ImageSource, AnnotationContext } from '@osdlabel/annotation';
import { onMount } from 'solid-js';

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
    tools: [{ type: 'rectangle' }],
  },
];

function GridControlsDemoContent() {
  const { uiState, actions, activeImageId } = useAnn();

  onMount(() => {
    actions.setContexts(contexts);
    actions.setActiveContext(contexts[0]!.id);
    actions.assignImageToCell(0, images[0]!.id);
    actions.assignImageToCell(1, images[1]!.id);
  });

  return (
    <div
      class="osdlabel-container"
      style={{
        height: '500px',
        display: 'flex',
        'flex-direction': 'column',
        border: '1px solid #333',
        'border-radius': '6px',
        overflow: 'hidden',
        margin: '1rem 0',
      }}
    >
      <div
        style={{
          padding: '8px',
          background: '#1a1a2e',
          display: 'flex',
          'align-items': 'center',
          gap: '12px',
        }}
      >
        <span style={{ color: '#fff', 'font-size': '14px', 'font-weight': 'bold' }}>
          Custom Layout
        </span>
        <Controls maxColumns={4} maxRows={4} />
        <span style={{ color: '#aaa', 'font-size': '12px' }}>Click the grid icon to resize</span>
      </div>
      <div style={{ flex: '1', 'min-height': '0' }}>
        <Grid
          columns={uiState.gridColumns}
          rows={uiState.gridRows}
          maxColumns={4}
          maxRows={4}
          images={images}
        />
      </div>
      <Status imageId={activeImageId()} />
    </div>
  );
}

export default function GridControlsDemo() {
  return (
    <Provider>
      <GridControlsDemoContent />
    </Provider>
  );
}

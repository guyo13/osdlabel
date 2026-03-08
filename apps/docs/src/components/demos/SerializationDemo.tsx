import { serialize, createImageId, createAnnotationContextId } from 'osdlabel/core';
import { AnnotatorProvider, useAnnotator } from 'osdlabel/state';
import type { ImageSource, AnnotationContext } from 'osdlabel/core';
import { createMemo, onMount } from 'solid-js';

const images: ImageSource[] = [
  {
    id: createImageId('sample'),
    dziUrl: 'https://openseadragon.github.io/example-images/highsmith/highsmith.dzi',
    label: 'Sample',
  },
];

const contexts: AnnotationContext[] = [
  {
    id: createAnnotationContextId('default'),
    label: 'Default',
    tools: [{ type: 'rectangle' }, { type: 'circle' }],
  },
];

function SerializationPreview() {
  const { annotationState } = useAnnotator();
  const json = createMemo(() => {
    const doc = serialize(annotationState, images);
    return JSON.stringify(doc, null, 2);
  });

  return (
    <div
      style={{
        padding: '8px',
        background: '#1e1e1e',
        color: '#00ff00',
        'font-family': 'monospace',
        'font-size': '11px',
        'max-height': '200px',
        'overflow-y': 'auto',
        'border-top': '1px solid #333',
      }}
    >
      <pre>{json()}</pre>
    </div>
  );
}

function AppContent() {
  const { actions } = useAnnotator();

  onMount(() => {
    actions.setContexts(contexts);
    actions.setActiveContext(contexts[0]!.id);
    actions.assignImageToCell(0, images[0]!.id);
  });

  return (
    <div
      style={{
        height: '420px',
        display: 'flex',
        'flex-direction': 'column',
        border: '1px solid #333',
        'border-radius': '6px',
        overflow: 'hidden',
      }}
    >
      <div style={{ flex: '1', 'min-height': '0' }}>
        <AnnotatorProvider>
          {/* Need to wrap in another provider or pass state down if we want to show it outside */}
        </AnnotatorProvider>
      </div>
    </div>
  );
}

function SerializationDemoContent() {
  const { actions, annotationState } = useAnnotator();

  onMount(() => {
    actions.setContexts(contexts);
    actions.setActiveContext(contexts[0]!.id);
    actions.assignImageToCell(0, images[0]!.id);
  });

  const json = createMemo(() => {
    const doc = serialize(annotationState, images);
    return JSON.stringify(doc, null, 2);
  });

  return (
    <div
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
      <div style={{ flex: '1', 'min-height': '0', position: 'relative' }}>
        {/* Use the library components directly to avoid nested provider issues */}
        <div style={{ height: '100%', display: 'flex', 'flex-direction': 'column' }}>
          <div style={{ flex: '1' }}>
            <div style={{ width: '100%', height: '100%' }}>
              {/* For simplicity in this demo, just a single cell */}
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                {/* GridView with 1x1 */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                  <div style={{ display: 'flex', height: '100%' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <div style={{ height: '100%' }}>
                        <div style={{ height: '100%' }}>
                          <div style={{ height: '300px' }}>
                            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                              <div style={{ height: '100%' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { GridView, Toolbar, StatusBar } from 'osdlabel/components';

function RealSerializationDemo() {
  const { actions, annotationState } = useAnnotator();

  onMount(() => {
    actions.setContexts(contexts);
    actions.setActiveContext(contexts[0]!.id);
    actions.assignImageToCell(0, images[0]!.id);
  });

  const json = createMemo(() => {
    const doc = serialize(annotationState, images);
    return JSON.stringify(doc, null, 2);
  });

  return (
    <div
      class="osdlabel-container"
      style={{
        display: 'flex',
        'flex-direction': 'column',
        height: '500px',
        border: '1px solid #333',
        'border-radius': '6px',
        overflow: 'hidden',
        margin: '1rem 0',
      }}
    >
      <Toolbar />
      <div style={{ flex: '1', 'min-height': '0', position: 'relative' }}>
        <GridView columns={1} rows={1} maxColumns={1} maxRows={1} images={images} />
      </div>
      <div
        style={{
          height: '150px',
          background: '#1e1e1e',
          color: '#00ff00',
          overflow: 'auto',
          padding: '8px',
          'font-family': 'monospace',
          'font-size': '11px',
          'border-top': '1px solid #333',
        }}
      >
        <pre>{json()}</pre>
      </div>
    </div>
  );
}

export default function SerializationDemo() {
  return (
    <AnnotatorProvider>
      <RealSerializationDemo />
    </AnnotatorProvider>
  );
}

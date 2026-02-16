import { createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import ViewerCell from '../src/components/ViewerCell.js';
import Toolbar from '../src/components/Toolbar.js';
import StatusBar from '../src/components/StatusBar.js';
import {
  createImageId,
  createAnnotationContextId,
  createAnnotationId,
  AnnotationContextId,
  AnnotationContext,
  AnnotationId,
  ImageId,
  Annotation,
} from '../src/core/types.js';
import { AnnotatorProvider, useAnnotator } from '../src/state/annotator-context.js';
import { serialize, deserialize } from '../src/core/annotations/serialization.js';

const IMAGE_ID = createImageId('highsmith');

const IMAGE_SOURCE = {
  id: IMAGE_ID,
  dziUrl: 'https://openseadragon.github.io/example-images/highsmith/highsmith.dzi',
  label: 'Highsmith — Library of Congress',
};

const CONTEXTS: AnnotationContext[] = [
  {
    id: 'ctx-1' as AnnotationContextId,
    label: 'Fracture',
    tools: [
      { type: 'line', maxCount: 3 },
      { type: 'rectangle', maxCount: 2 },
    ],
  },
  {
    id: 'ctx-2' as AnnotationContextId,
    label: 'Pneumothorax',
    tools: [
      { type: 'path', maxCount: 1 },
      { type: 'circle', maxCount: 2 },
    ],
  },
  {
    id: 'ctx-3' as AnnotationContextId,
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

/** Sample annotations for the "Load Sample Data" button */
function createSampleAnnotations(): Record<ImageId, Record<AnnotationId, Annotation>> {
  const now = new Date().toISOString();
  const style = { strokeColor: '#ff0000', strokeWidth: 2, fillColor: '#ff0000', fillOpacity: 0.1, opacity: 1 };
  return {
    [IMAGE_ID]: {
      [createAnnotationId('sample-rect')]: {
        id: createAnnotationId('sample-rect'),
        imageId: IMAGE_ID,
        contextId: 'ctx-3' as AnnotationContextId,
        geometry: { type: 'rectangle', origin: { x: 500, y: 500 }, width: 300, height: 200, rotation: 0 },
        style,
        createdAt: now,
        updatedAt: now,
      },
      [createAnnotationId('sample-circle')]: {
        id: createAnnotationId('sample-circle'),
        imageId: IMAGE_ID,
        contextId: 'ctx-3' as AnnotationContextId,
        geometry: { type: 'circle', center: { x: 1200, y: 800 }, radius: 150 },
        style: { ...style, strokeColor: '#00ff00', fillColor: '#00ff00' },
        createdAt: now,
        updatedAt: now,
      },
      [createAnnotationId('sample-line')]: {
        id: createAnnotationId('sample-line'),
        imageId: IMAGE_ID,
        contextId: 'ctx-3' as AnnotationContextId,
        geometry: { type: 'line', start: { x: 200, y: 200 }, end: { x: 800, y: 600 } },
        style: { ...style, strokeColor: '#0000ff' },
        createdAt: now,
        updatedAt: now,
      },
    },
  };
}

function AppContent() {
  const { annotationState, actions } = useAnnotator();
  const [copyLabel, setCopyLabel] = createSignal('Copy JSON');
  const [activeCtxIdx, setActiveCtxIdx] = createSignal(0);
  const [exportedJson, setExportedJson] = createSignal('');

  const copyAnnotationsToClipboard = () => {
    const json = JSON.stringify(annotationState.byImage, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      setCopyLabel('Copied!');
      setTimeout(() => setCopyLabel('Copy JSON'), 1500);
    }).catch(() => {
      setCopyLabel('Failed');
      setTimeout(() => setCopyLabel('Copy JSON'), 1500);
    });
  };

  const handleExportJson = () => {
    const doc = serialize(annotationState, [IMAGE_SOURCE]);
    const json = JSON.stringify(doc, null, 2);
    setExportedJson(json);
  };

  const handleImportJson = () => {
    const json = exportedJson();
    if (!json.trim()) return;
    try {
      const parsed: unknown = JSON.parse(json);
      const byImage = deserialize(parsed);
      // Load into store via actions
      for (const [imageId, annMap] of Object.entries(byImage)) {
        for (const ann of Object.values(annMap)) {
          actions.addAnnotation({
            id: ann.id,
            imageId: ann.imageId,
            contextId: ann.contextId,
            geometry: ann.geometry,
            style: ann.style,
            label: ann.label,
            metadata: ann.metadata,
          });
        }
      }
    } catch (err) {
      alert(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Initialize contexts (runs once since SolidJS components execute once)
  actions.setContexts(CONTEXTS);
  actions.setActiveContext(CONTEXTS[0]!.id);

  const handleContextChange = (e: Event) => {
    const select = e.target as HTMLSelectElement;
    const idx = parseInt(select.value, 10);
    setActiveCtxIdx(idx);
    actions.setActiveContext(CONTEXTS[idx]!.id);
    actions.setActiveTool(null);
  };

  const buttonStyle = {
    padding: '4px 12px',
    border: '1px solid #555',
    'border-radius': '4px',
    cursor: 'pointer',
    background: '#2a2a3e',
    color: '#fff',
    'font-size': '12px',
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', 'flex-direction': 'column' }}>
      {/* Top bar: context selector + toolbar + action buttons */}
      <div style={{
        padding: '8px 12px',
        background: '#1a1a2e',
        color: '#fff',
        display: 'flex',
        gap: '12px',
        'align-items': 'center',
        'font-family': 'system-ui, sans-serif',
        'font-size': '14px',
        'flex-shrink': '0',
      }}>
        <select
          value={activeCtxIdx()}
          onChange={handleContextChange}
          style={{
            padding: '4px 8px',
            'border-radius': '4px',
            border: '1px solid #555',
            background: '#2a2a3e',
            color: '#fff',
            'font-size': '13px',
          }}
        >
          {CONTEXTS.map((ctx, i) => (
            <option value={i}>{ctx.label}</option>
          ))}
        </select>

        <Toolbar />

        <div style={{ 'margin-left': 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={copyAnnotationsToClipboard} style={buttonStyle}>
            {copyLabel()}
          </button>
          <button onClick={handleExportJson} style={buttonStyle}>
            Export JSON
          </button>
          <button onClick={handleImportJson} style={buttonStyle}>
            Import JSON
          </button>
        </div>
      </div>

      {/* Viewer */}
      <div style={{ flex: '1', 'min-height': '0', position: 'relative' }}>
        <ViewerCell
          imageSource={IMAGE_SOURCE}
          isActive={true}
          onActivate={() => {}}
        />
      </div>

      {/* Status bar */}
      <StatusBar imageId={IMAGE_ID} />

      {/* JSON export panel */}
      {exportedJson() && (
        <div style={{
          position: 'fixed',
          bottom: '40px',
          right: '10px',
          width: '400px',
          'max-height': '300px',
          background: '#1a1a2e',
          border: '1px solid #555',
          'border-radius': '8px',
          padding: '8px',
          overflow: 'auto',
          'z-index': '1000',
        }}>
          <div style={{ display: 'flex', 'justify-content': 'space-between', 'margin-bottom': '4px' }}>
            <span style={{ color: '#fff', 'font-size': '12px', 'font-weight': 'bold' }}>Exported JSON</span>
            <button
              onClick={() => setExportedJson('')}
              style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', 'font-size': '14px' }}
            >
              X
            </button>
          </div>
          <textarea
            value={exportedJson()}
            onInput={(e) => setExportedJson(e.currentTarget.value)}
            style={{
              width: '100%',
              height: '240px',
              background: '#111',
              color: '#0f0',
              border: 'none',
              'border-radius': '4px',
              padding: '6px',
              'font-family': 'monospace',
              'font-size': '11px',
              resize: 'none',
            }}
          />
        </div>
      )}
    </div>
  );
}

function App() {
  const [initialAnns, setInitialAnns] = createSignal<Record<ImageId, Record<AnnotationId, Annotation>> | undefined>(undefined);
  const [appKey, setAppKey] = createSignal(0);

  const handleLoadSample = () => {
    setInitialAnns(createSampleAnnotations());
    setAppKey(k => k + 1); // Force remount of AnnotatorProvider
  };

  return (
    <div>
      {/* Floating load button */}
      <button
        onClick={handleLoadSample}
        style={{
          position: 'fixed',
          top: '50px',
          right: '10px',
          'z-index': '2000',
          padding: '6px 14px',
          border: '1px solid #555',
          'border-radius': '4px',
          cursor: 'pointer',
          background: '#2a6e2a',
          color: '#fff',
          'font-size': '12px',
        }}
      >
        Load Sample Data
      </button>
      {/* Use key to force remount when loading initial annotations */}
      {(() => {
        const k = appKey();
        return (
          <AnnotatorProvider
            initialAnnotations={initialAnns()}
            onAnnotationsChange={(anns) => console.log('Annotations changed:', anns.length, 'total')}
            onConstraintChange={(status) => console.log('Constraint status changed:', status)}
          >
            <AppContent />
          </AnnotatorProvider>
        );
      })()}
    </div>
  );
}

const root = document.getElementById('app');
if (root) {
  render(() => <App />, root);
}

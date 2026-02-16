import { createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import ViewerCell from '../src/components/ViewerCell.js';
import Toolbar from '../src/components/Toolbar.js';
import StatusBar from '../src/components/StatusBar.js';
import { createImageId, createAnnotationContextId, AnnotationContextId, AnnotationContext } from '../src/core/types.js';
import { AnnotatorProvider, useAnnotator } from '../src/state/annotator-context.js';

const IMAGE_ID = createImageId('highsmith');

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

function AppContent() {
  const { annotationState, actions } = useAnnotator();
  const [copyLabel, setCopyLabel] = createSignal('Copy JSON');
  const [activeCtxIdx, setActiveCtxIdx] = createSignal(0);

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

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', 'flex-direction': 'column' }}>
      {/* Top bar: context selector + toolbar + copy button */}
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

        <button
          onClick={copyAnnotationsToClipboard}
          style={{
            'margin-left': 'auto',
            padding: '4px 12px',
            border: '1px solid #555',
            'border-radius': '4px',
            cursor: 'pointer',
            background: '#2a2a3e',
            color: '#fff',
            'font-size': '12px',
          }}
        >
          {copyLabel()}
        </button>
      </div>

      {/* Viewer */}
      <div style={{ flex: '1', 'min-height': '0' }}>
        <ViewerCell
          imageSource={{
            id: IMAGE_ID,
            dziUrl: 'https://openseadragon.github.io/example-images/highsmith/highsmith.dzi',
            label: 'Highsmith — Library of Congress',
          }}
          isActive={true}
          onActivate={() => {}}
        />
      </div>

      {/* Status bar */}
      <StatusBar imageId={IMAGE_ID} />
    </div>
  );
}

function App() {
  return (
    <AnnotatorProvider>
      <AppContent />
    </AnnotatorProvider>
  );
}

const root = document.getElementById('app');
if (root) {
  render(() => <App />, root);
}

import { createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import ViewerCell from '../src/components/ViewerCell.js';
import { createImageId, createAnnotationContextId, AnnotationType } from '../src/core/types.js';
import { AnnotatorProvider, useAnnotator } from '../src/state/annotator-context.js';

const CONTEXT_ID = createAnnotationContextId('default');
const IMAGE_ID = createImageId('highsmith');

function AppContent() {
  const { uiState, annotationState, actions } = useAnnotator();
  const [copyLabel, setCopyLabel] = createSignal('Copy JSON');

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

  // Initialize context (runs once since SolidJS components execute once)
  actions.setContexts([{
    id: CONTEXT_ID,
    label: 'Default Context',
    tools: [
        { type: 'rectangle' },
        { type: 'circle' },
        { type: 'line' },
        { type: 'point' },
        { type: 'path' },
    ]
  }]);
  actions.setActiveContext(CONTEXT_ID);

  const tools: (AnnotationType | 'select' | null)[] = [
      null, 'select', 'rectangle', 'circle', 'line', 'point', 'path'
  ];

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', 'flex-direction': 'column' }}>
      <div style={{
        padding: '8px 12px',
        background: '#1a1a2e',
        color: '#fff',
        display: 'flex',
        gap: '8px',
        'align-items': 'center',
        'font-family': 'system-ui, sans-serif',
        'font-size': '14px',
        'flex-shrink': '0',
      }}>
        {tools.map(tool => (
            <button
                onClick={() => actions.setActiveTool(tool)}
                style={{
                    padding: '4px 12px',
                    border: 'none',
                    'border-radius': '4px',
                    cursor: 'pointer',
                    background: uiState.activeTool === tool ? '#2196F3' : '#333',
                    color: '#fff',
                    'font-weight': uiState.activeTool === tool ? 'bold' : 'normal',
                }}
            >
                {tool ? tool.charAt(0).toUpperCase() + tool.slice(1) : 'Navigate'}
            </button>
        ))}
        <span style={{ 'margin-left': '16px', opacity: '0.7', 'font-size': '12px', color: '#fff' }}>
          Count: {Object.keys(annotationState.byImage[IMAGE_ID] || {}).length}
        </span>
        <button
            onClick={copyAnnotationsToClipboard}
            style={{
                'margin-left': '8px',
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
        <span style={{ 'margin-left': 'auto', opacity: '0.5', 'font-size': '12px', color: '#fff' }}>
          {uiState.activeTool === 'select' ? 'Del/Backspace to delete' :
           uiState.activeTool === 'path' ? 'Enter/DblClick to finish, C to close polygon, click near start to close' :
           uiState.activeTool ? 'Drag to draw' : 'Drag to pan'}
        </span>
      </div>
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

import { render } from 'solid-js/web';
import { createSignal } from 'solid-js';
import { Rect, Circle, Line, Polyline } from 'fabric';
import ViewerCell from '../src/components/ViewerCell.js';
import { createImageId } from '../src/core/types.js';
import type { FabricOverlay } from '../src/overlay/fabric-overlay.js';
import type { OverlayMode } from '../src/overlay/fabric-overlay.js';

function addSampleAnnotations(overlay: FabricOverlay): void {
  const canvas = overlay.canvas;

  // Rectangles
  canvas.add(new Rect({
    left: 500, top: 400, width: 600, height: 400,
    fill: 'rgba(255, 0, 0, 0.2)', stroke: '#ff0000', strokeWidth: 3,
    selectable: true, evented: true,
  }));
  canvas.add(new Rect({
    left: 2000, top: 1500, width: 1200, height: 800,
    fill: 'rgba(0, 100, 255, 0.15)', stroke: '#0064ff', strokeWidth: 3,
    selectable: true, evented: true,
  }));
  canvas.add(new Rect({
    left: 4000, top: 500, width: 300, height: 200,
    fill: 'rgba(255, 165, 0, 0.2)', stroke: '#ffa500', strokeWidth: 2,
    selectable: true, evented: true,
  }));

  // Circles
  canvas.add(new Circle({
    left: 1500, top: 800, radius: 200,
    fill: 'rgba(0, 200, 0, 0.15)', stroke: '#00c800', strokeWidth: 3,
    selectable: true, evented: true,
  }));
  canvas.add(new Circle({
    left: 3500, top: 2000, radius: 150,
    fill: 'rgba(200, 0, 200, 0.15)', stroke: '#c800c8', strokeWidth: 2,
    selectable: true, evented: true,
  }));

  // Lines
  canvas.add(new Line([1000, 300, 2500, 1200], {
    stroke: '#ff4444', strokeWidth: 3, selectable: true, evented: true,
  }));
  canvas.add(new Line([3000, 600, 4500, 2500], {
    stroke: '#4444ff', strokeWidth: 2, selectable: true, evented: true,
  }));

  // Polyline
  canvas.add(new Polyline(
    [{ x: 200, y: 1500 }, { x: 600, y: 1200 }, { x: 1000, y: 1600 },
     { x: 1400, y: 1300 }, { x: 1800, y: 1700 }],
    { fill: 'transparent', stroke: '#00cccc', strokeWidth: 3,
      selectable: true, evented: true },
  ));

  // Point markers
  for (const pt of [
    { x: 600, y: 600 }, { x: 1800, y: 400 }, { x: 3200, y: 1000 },
    { x: 4200, y: 1800 }, { x: 2500, y: 2500 },
  ]) {
    canvas.add(new Circle({
      left: pt.x - 15, top: pt.y - 15, radius: 15,
      fill: 'rgba(255, 100, 0, 0.6)', stroke: '#ff6400', strokeWidth: 2,
      selectable: true, evented: true,
    }));
  }

  canvas.renderAll();

  // Debug: log mouse events on the Fabric canvas
  canvas.on('mouse:down', (e) => {
    console.log('[Fabric] mouse:down — target:', e.target ? `object (${e.target.type})` : 'empty canvas');
  });
  canvas.on('mouse:up', () => {
    console.log('[Fabric] mouse:up');
  });
  canvas.on('mouse:move', () => {
    // Uncomment for verbose move logging:
    // console.log('[Fabric] mouse:move');
  });
  canvas.on('selection:created', (e) => {
    console.log('[Fabric] selection:created —', e.selected?.length, 'objects');
  });
  canvas.on('selection:cleared', () => {
    console.log('[Fabric] selection:cleared');
  });
}

function App() {
  const [mode, setMode] = createSignal<OverlayMode>('navigation');

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
        <span style={{ 'margin-right': '8px', opacity: '0.7' }}>Mode:</span>
        <button
          onClick={() => setMode('navigation')}
          style={{
            padding: '4px 12px',
            border: 'none',
            'border-radius': '4px',
            cursor: 'pointer',
            background: mode() === 'navigation' ? '#2196F3' : '#333',
            color: '#fff',
          }}
        >
          Navigation
        </button>
        <button
          onClick={() => setMode('annotation')}
          style={{
            padding: '4px 12px',
            border: 'none',
            'border-radius': '4px',
            cursor: 'pointer',
            background: mode() === 'annotation' ? '#f44336' : '#333',
            color: '#fff',
          }}
        >
          Annotation
        </button>
        <span style={{ 'margin-left': '16px', opacity: '0.5', 'font-size': '12px' }}>
          Current: {mode()} {mode() === 'annotation' ? '(Ctrl/Option+drag to pan and Ctrl/Option+scroll to zoom)' : ''}
        </span>
      </div>
      <div style={{ flex: '1', 'min-height': '0' }}>
        <ViewerCell
          imageSource={{
            id: createImageId('highsmith'),
            dziUrl: 'https://openseadragon.github.io/example-images/highsmith/highsmith.dzi',
            label: 'Highsmith — Library of Congress',
          }}
          isActive={true}
          mode={mode()}
          onActivate={() => {}}
          onOverlayReady={addSampleAnnotations}
        />
      </div>
    </div>
  );
}

const root = document.getElementById('app');
if (root) {
  render(() => <App />, root);
}
